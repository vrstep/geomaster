import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context'; // Note: Ensure correct import

// 1. Define the Base URL dynamically
// If NEXT_PUBLIC_SERVER_URL is set (in Vercel), use it. Otherwise use localhost.
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

const httpLink = new HttpLink({
  // Append /graphql to the base URL
  uri: `${BASE_URL}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// 2. WebSocket Link (Smart Replacement)
const wsLink = typeof window !== 'undefined' 
  ? new GraphQLWsLink(createClient({
      // Automatically swap 'http' -> 'ws' or 'https' -> 'wss'
      url: `${BASE_URL.replace('http', 'ws')}/graphql`,
    })) 
  : null;

// 3. Split Link (Route traffic)
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});