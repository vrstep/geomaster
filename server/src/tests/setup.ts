import { jest } from '@jest/globals';

jest.unstable_mockModule('graphql-subscriptions', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    publish: jest.fn<any>().mockResolvedValue(undefined),
    asyncIterableIterator: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: async () => ({ done: true, value: undefined })
      })
    }),
  })),
}));