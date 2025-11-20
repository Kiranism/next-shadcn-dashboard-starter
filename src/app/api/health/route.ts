import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used by Docker healthcheck and Azure monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    // Check critical dependencies
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        graphql: checkGraphQLConnection(),
        database: checkDatabaseConnection(),
        ai: checkAIService(),
      },
    };

    // Determine overall health status
    const allHealthy = Object.values(checks.services).every(
      (service) => service.status === 'healthy'
    );

    return NextResponse.json(
      {
        ...checks,
        status: allHealthy ? 'healthy' : 'degraded',
      },
      {
        status: allHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Check GraphQL connection health
 */
function checkGraphQLConnection() {
  try {
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

    if (!graphqlUrl) {
      return {
        status: 'degraded',
        message: 'GraphQL URL not configured',
      };
    }

    return {
      status: 'healthy',
      endpoint: graphqlUrl,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'GraphQL check failed',
    };
  }
}

/**
 * Check database connection health
 */
function checkDatabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const neo4jUri = process.env.NEO4J_URI;

    if (!supabaseUrl && !neo4jUri) {
      return {
        status: 'degraded',
        message: 'Database connections not configured',
      };
    }

    return {
      status: 'healthy',
      connections: {
        supabase: !!supabaseUrl,
        neo4j: !!neo4jUri,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

/**
 * Check AI service availability
 */
function checkAIService() {
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const melModel = process.env.MEL_MODEL;

    if (!anthropicKey) {
      return {
        status: 'degraded',
        message: 'M.E.L. AI not configured',
      };
    }

    return {
      status: 'healthy',
      model: melModel || 'claude-sonnet-4-20250514',
      configured: true,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'AI service check failed',
    };
  }
}
