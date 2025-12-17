import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { SetContextLink } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = new SetContextLink((prevContext) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// 3. WebSocket Link (Subscriptions)
// Only create in browser environment to avoid SSR errors
const wsLink = typeof window !== 'undefined' 
  ? new GraphQLWsLink(createClient({
      url: 'ws://localhost:4000/graphql',
    })) 
  : null;

// 4. Split Link (Route traffic)
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