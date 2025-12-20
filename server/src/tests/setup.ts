import { jest } from '@jest/globals';

jest.unstable_mockModule('graphql-subscriptions', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    // Use a type cast to any to allow the mock to return undefined
    publish: jest.fn<any>().mockResolvedValue(undefined),
    asyncIterableIterator: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: async () => ({ done: true, value: undefined })
      })
    }),
  })),
}));