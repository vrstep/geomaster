import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resolvers } from '../../resolvers/index.js';
import { Quiz } from '../../models/Quiz.js';
import { User } from '../../models/User.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Integration Test: Full Game Flow', () => {
  it('Flow: Create User -> Create Quiz -> Create Room', async () => {
    // 1. Create User
    const user = await User.create({
      username: 'hostUser',
      email: 'host@test.com',
      passwordHash: 'hashed'
    });

    // 2. Fix Mongoose Type Error: Use a plain object or cast to any for the creation
    await Quiz.create({
      title: 'World Capitals',
      type: 'CAPITALS',
      questions: [{ 
        questionText: 'Paris?', 
        options: ['Yes', 'No'], 
        correctAnswer: 'Yes' 
      }],
      createdBy: user._id as mongoose.Types.ObjectId // Ensure casting
    });

    const context = { 
        user: { 
            userId: (user._id as mongoose.Types.ObjectId).toString(), 
            username: user.username 
        } 
    };

    // 3. Create Room
    const room = await resolvers.Mutation.createRoom(
      null, 
      { config: { type: 'CAPITALS', mode: 'MULTI', isHostPlaying: true } }, 
      context
    );

    expect(room.code).toBeDefined();
    expect(room.players.length).toBe(1);
    expect(room.players[0].username).toBe('hostUser');
  });
});