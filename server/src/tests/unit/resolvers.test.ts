import { jest, describe, it, expect, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { resolvers } from '../../resolvers/index.js';
import { User } from '../../models/User.js';
import { Quiz } from '../../models/Quiz.js';
import { Room } from '../../models/Room.js';

describe('Unit Tests: Resolvers', () => {
  const mockUserId = new mongoose.Types.ObjectId().toHexString();
  const mockContext = { user: { userId: mockUserId, username: 'tester' } };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- QUERY TESTS ---

  // 1. Me Query (Auth)
  it('Query.me returns user if authenticated', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: mockUserId, username: 'tester' } as any);
    const result: any = await resolvers.Query.me(null, {}, mockContext);
    expect(result?.username).toBe('tester');
  });

  // 2. Me Query (Unauth)
  it('Query.me returns null if not authenticated', async () => {
    const result = await resolvers.Query.me(null, {}, {});
    expect(result).toBeNull();
  });

  // 3. Get Room
  it('Query.getRoom finds room by code', async () => {
    jest.spyOn(Room, 'findOne').mockResolvedValue({ code: '123456' } as any);
    const result: any = await resolvers.Query.getRoom(null, { code: '123456' });
    expect(result?.code).toBe('123456');
  });

  // --- MUTATION TESTS ---

  // 4. Register
  it('Mutation.register creates a new user', async () => {
    const userData = { username: 'new', email: 'n@n.com', password: '123' };
    jest.spyOn(User, 'create').mockResolvedValue({ _id: mockUserId, ...userData } as any);
    const result = await resolvers.Mutation.register(null, userData);
    expect(result.user.username).toBe('new');
    expect(result.token).toBeDefined();
  });

  // 5. Login Success
  it('Mutation.login returns token on valid credentials', async () => {
    const mockUser = { email: 'a@a.com', passwordHash: 'pw', username: 'u', _id: mockUserId };
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
    const result = await resolvers.Mutation.login(null, { email: 'a@a.com', password: 'pw' });
    expect(result.token).toBeDefined();
  });

  // 6. Login Failure (NEW)
  it('Mutation.login throws error on invalid credentials', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    await expect(resolvers.Mutation.login(null, { email: 'bad@test.com', password: 'X' }))
      .rejects.toThrow('Invalid credentials');
  });

  // 7. Create Room Success
  it('Mutation.createRoom creates a room with valid input', async () => {
    jest.spyOn(Quiz, 'findOne').mockResolvedValue({ questions: [] } as any);
    jest.spyOn(Room.prototype, 'save').mockResolvedValue({} as any);
    const config = { type: 'CAPITALS', mode: 'MULTI', isHostPlaying: true };
    const result: any = await resolvers.Mutation.createRoom(null, { config }, mockContext);
    expect(result.hostId.toString()).toBe(mockUserId);
  });

  // 8. Create Room Unauth (NEW)
  it('Mutation.createRoom throws Unauthorized if no user context', async () => {
    await expect(resolvers.Mutation.createRoom(null, { config: {} }, {}))
      .rejects.toThrow('Unauthorized');
  });

  // 9. Toggle Ready (NEW)
  it('Mutation.toggleReady toggles the player status', async () => {
    const mockRoom = {
      code: '111222',
      players: [{ userId: new mongoose.Types.ObjectId(mockUserId), isReady: false }],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true)
    };
    jest.spyOn(Room, 'findOne').mockResolvedValue(mockRoom as any);

    const result: any = await resolvers.Mutation.toggleReady(null, { code: '111222' }, mockContext);
    expect(result.players[0].isReady).toBe(true);
  });

  // 10. Start Game - Host Check
  it('Mutation.startGame fails if user is not host', async () => {
    jest.spyOn(Room, 'findOne').mockResolvedValue({ 
      hostId: new mongoose.Types.ObjectId(), // Different ID from context
      players: []
    } as any);
    await expect(resolvers.Mutation.startGame(null, { code: '123' }, mockContext))
      .rejects.toThrow('Only host can start');
  });
});