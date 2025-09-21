import { NextRequest, NextResponse } from 'next/server';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://graphql.analyzemyteam.com/graphql';

// Create Apollo Client for server-side requests
const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    fetch: fetch,
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});

export async function POST(request: NextRequest) {
  try {
    const { query, variables, operationName } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'GraphQL query is required' },
        { status: 400 }
      );
    }

    // Execute GraphQL query
    const result = await apolloClient.query({
      query: gql`${query}`,
      variables,
      context: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    return NextResponse.json({
      data: result.data,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('GraphQL error:', error);
    
    return NextResponse.json(
      { 
        error: 'GraphQL request failed',
        message: error.message,
        details: error.graphQLErrors || [],
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  try {
    const healthQuery = gql`
      query HealthCheck {
        __typename
      }
    `;

    await apolloClient.query({
      query: healthQuery,
    });

    return NextResponse.json({
      status: 'healthy',
      endpoint: GRAPHQL_ENDPOINT,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        endpoint: GRAPHQL_ENDPOINT,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
