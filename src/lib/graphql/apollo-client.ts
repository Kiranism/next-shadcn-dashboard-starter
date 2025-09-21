import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://graphql.analyzemyteam.com/graphql',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// WebSocket link for subscriptions (real-time updates)
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'wss://graphql.analyzemyteam.com/graphql',
      })
    )
  : null;

// Split links based on operation type
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
      httpLink
    )
  : httpLink;

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          formations: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          plays: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Helper function to get authenticated client
export function getAuthenticatedClient(token?: string) {
  const authLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://graphql.analyzemyteam.com/graphql',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  return new ApolloClient({
    link: authLink,
    cache: new InMemoryCache(),
  });
}

// GraphQL Federation endpoints
export const GRAPHQL_ENDPOINTS = {
  HIVE_ANALYTICS: process.env.HIVE_ANALYTICS_URL || 'https://hive.analyzemyteam.com/graphql',
  SUPABASE_OPS: process.env.SUPABASE_URL || 'https://supabase.analyzemyteam.com/graphql',
  NEO4J_GRAPH: process.env.NEO4J_URL || 'bolt://neo4j.analyzemyteam.com:7687',
};
