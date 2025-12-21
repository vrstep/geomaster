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
        currentAnswer: null,
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
          currentAnswer: null,
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

      const playerCount = room.players.length;
      
      if (room.config.isHostPlaying && playerCount < 2) {
        throw new GraphQLError('Need at least 2 players to start (including host)');
      }
      
      if (!room.config.isHostPlaying && playerCount < 2) {
        throw new GraphQLError('Need at least 2 players to start in Projector Mode');
      }

      room.status = 'PLAYING';
      room.roundStartTime = new Date();
      await room.save();

      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      return room;
    },

    leaveRoom: async (_: any, { code }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const room = await Room.findOne({ code });
      if (!room) throw new GraphQLError('Room not found');

      const playerIndex = room.players.findIndex(p => p.userId.toString() === context.user.userId);
      if (playerIndex === -1) {
        throw new GraphQLError('You are not in this room');
      }

      const isHost = room.hostId.toString() === context.user.userId;

      room.players.splice(playerIndex, 1);

      if (isHost) {
        if (room.players.length === 0) {
          if (room.status === 'WAITING') {
            await Room.deleteOne({ code });
            pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: null });
            return true;
          }
          room.status = 'FINISHED';
        } else {
          room.hostId = room.players[0].userId;
        }
      }

      if (room.status === 'PLAYING' && room.players.length < 2) {
        room.status = 'FINISHED';
      }

      room.markModified('players');
      await room.save();
      
      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });
      return true;
    },
    
    submitAnswer: async (_: any, { code, answerIndex }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const room = await Room.findOne({ code }); 
      if (!room) throw new GraphQLError('Room not found');

      const playerIndex = room.players.findIndex(p => p.userId.toString() === context.user.userId);
      if (playerIndex === -1) {
        throw new GraphQLError('You are not part of this room');
      }

      const player = room.players[playerIndex];

      if (player.hasAnsweredCurrent) {
        throw new GraphQLError('Already answered');
      }
      
      if (room.status !== 'PLAYING') {
        throw new GraphQLError('Game is not active');
      }

      const currentQ: any = room.questions[room.currentQuestionIndex];
      const isCorrect = answerIndex >= 0 && currentQ.options[answerIndex] === currentQ.correctAnswer;
      
      room.players[playerIndex].currentAnswer = answerIndex;
      
      if (isCorrect) {
        const startTime = room.roundStartTime ? new Date(room.roundStartTime).getTime() : Date.now();
        const timeTaken = (Date.now() - startTime) / 1000;
        const speedBonus = Math.max(0, Math.floor((15 - timeTaken) * 10));
        
        room.players[playerIndex].score += (100 + speedBonus);
        room.players[playerIndex].streak += 1;
      } else {
        room.players[playerIndex].streak = 0;
      }
      
      room.players[playerIndex].hasAnsweredCurrent = true;

      room.markModified('players');
      await room.save();
      
      pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: room });

      const allAnswered = room.players.every(p => p.hasAnsweredCurrent);
      
      if (allAnswered) {
        setTimeout(async () => {
          const updatedRoom = await Room.findOne({ code });
          if (!updatedRoom) return;
          
          if (updatedRoom.currentQuestionIndex < updatedRoom.questions.length - 1) {
            updatedRoom.currentQuestionIndex += 1;
            updatedRoom.roundStartTime = new Date();
            updatedRoom.players.forEach((p, idx) => {
              updatedRoom.players[idx].hasAnsweredCurrent = false;
              updatedRoom.players[idx].currentAnswer = null;
            });
          } else {
            updatedRoom.status = 'FINISHED';
          }
          
          updatedRoom.markModified('players');
          await updatedRoom.save();
          pubsub.publish(`ROOM_UPDATED_${code}`, { roomUpdated: updatedRoom });
        }, 1500);
      }
      
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