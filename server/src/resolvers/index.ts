import { PubSub } from 'graphql-subscriptions';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Quiz } from '../models/Quiz.js'; 
import { signToken } from '../utils/auth.js';
import { GraphQLError } from 'graphql';

const pubsub = new PubSub();
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) return null;
      return await User.findById(context.user.userId);
    },
    getLeaderboard: async () => {
      return await User.find().sort({ 'stats.totalScore': -1 }).limit(20);
    },
    getRoom: async (_: any, { code }: any) => {
      return await Room.findOne({ code });
    }
  },

  Mutation: {
    register: async (_: any, { username, email, password }: any) => {
      const user = await User.create({ username, email, passwordHash: password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (_: any, { email, password }: any) => {
      const user = await User.findOne({ email });
      if (!user || user.passwordHash !== password) {
        throw new GraphQLError('Invalid credentials');
      }
      const token = signToken(user);
      return { token, user };
    },

    createRoom: async (_: any, { config }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const quiz = await Quiz.findOne({ type: config.type });
      if (!quiz) throw new GraphQLError('No quiz found for this type');

      const initialPlayers = config.isHostPlaying ? [{
        userId: context.user.userId,
        username: context.user.username,
        score: 0,
        isReady: false,
        streak: 0,
        hasAnsweredCurrent: false,
        avatar: context.user.avatar || 'default_avatar.png'
      }] : [];

      const newRoom = new Room({
        code: generateCode(),
        hostId: context.user.userId,
        config,
        questions: quiz.questions.slice(0, 10),
        players: initialPlayers
      });
      await newRoom.save();
      return newRoom;
    },

    joinRoom: async (_: any, { code }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const room = await Room.findOne({ code });
      if (!room) throw new GraphQLError('Room not found');
      if (room.status !== 'WAITING') throw new GraphQLError('Game already started');

      const userIdStr = context.user.userId.toString();
      const isAlreadyJoined = room.players.some(p => p.userId.toString() === userIdStr);

      if (!isAlreadyJoined) {
        room.players.push({
          userId: context.user.userId,
          username: context.user.username,
          score: 0,
          isReady: false,
          hasAnsweredCurrent: false,
          streak: 0,
          avatar: "default_avatar.png"
        });
        await room.save();
        pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      }
      return room;
    },

    toggleReady: async (_: any, { code }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const room = await Room.findOne({ code });
      if (!room) throw new GraphQLError('Room not found');

      const player = room.players.find(p => p.userId.toString() === context.user.userId);
      if (!player) throw new GraphQLError('You are not in this room');

      player.isReady = !player.isReady; // Toggle status
      
      // Mongoose doesn't always detect deep array changes automatically
      room.markModified('players'); 
      await room.save();
      
      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      return room;
    },

    startGame: async (_: any, { code }: any, context: any) => {
      const room = await Room.findOne({ code });
      if (!room) throw new GraphQLError('Room not found');
      if (room.hostId.toString() !== context.user.userId.toString()) throw new GraphQLError('Only host can start');

      room.status = 'PLAYING';
      room.roundStartTime = new Date();
      await room.save();

      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      return room;
    },
    
    submitAnswer: async (_: any, { code, answerIndex }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const room = await Room.findOne({ code }); 
      if (!room) throw new GraphQLError('Room not found');

      // Find the player INDEX instead of the object reference
      const playerIndex = room.players.findIndex(p => p.userId.toString() === context.user.userId);
      if (playerIndex === -1) {
        throw new GraphQLError('You are not part of this room');
      }

      // Access player using the index for proper Mongoose reactivity
      const player = room.players[playerIndex];

      if (player.hasAnsweredCurrent) {
        throw new GraphQLError('Already answered');
      }
      
      if (room.status !== 'PLAYING') {
        throw new GraphQLError('Game is not active');
      }

      const currentQ: any = room.questions[room.currentQuestionIndex];
      const isCorrect = currentQ.options[answerIndex] === currentQ.correctAnswer;
      
      if (isCorrect) {
        const startTime = room.roundStartTime ? new Date(room.roundStartTime).getTime() : Date.now();
        const timeTaken = (Date.now() - startTime) / 1000;
        const speedBonus = Math.max(0, Math.floor((15 - timeTaken) * 10));
        
        // Update using array index to ensure Mongoose tracks changes
        room.players[playerIndex].score += (100 + speedBonus);
        room.players[playerIndex].streak += 1;
      } else {
        room.players[playerIndex].streak = 0;
      }
      
      room.players[playerIndex].hasAnsweredCurrent = true;

      const allAnswered = room.players.every(p => p.hasAnsweredCurrent);
      if (allAnswered) {
        if (room.currentQuestionIndex < room.questions.length - 1) {
          room.currentQuestionIndex += 1;
          room.roundStartTime = new Date();
          // Reset hasAnsweredCurrent for all players
          room.players.forEach((p, idx) => {
            room.players[idx].hasAnsweredCurrent = false;
          });
        } else {
          room.status = 'FINISHED';
        }
      }

      // Mark the players array as modified to ensure Mongoose saves it
      room.markModified('players');
      await room.save();
      
      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      return room;
    }
  },

  Subscription: {
    roomUpdated: {
      subscribe: (_: any, { code }: any) => pubsub.asyncIterableIterator([`ROOM_UPDATED_${code}`]),
    },
  },
  
  Room: {
    host: async (parent: any) => {
      return await User.findById(parent.hostId);
    }
  }
};