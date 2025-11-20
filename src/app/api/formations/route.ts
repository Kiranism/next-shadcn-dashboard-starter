import { NextRequest, NextResponse } from 'next/server';
import { apolloClient } from '@/lib/graphql/apollo-client';
import { GET_FORMATIONS } from '@/lib/graphql/queries';
import { TriangleDefenseUtils } from '@/lib/triangle-defense/utils';
import type { Formation, FormationFilter } from '@/types';

/**
 * Triangle Defense Formations API
 * GET /api/formations - Retrieve and analyze formations
 * POST /api/formations - Analyze a specific formation
 */

// Mock formation data for development
const mockFormations: Formation[] = [
  {
    id: '1',
    name: '11 Personnel Trips Left',
    type: 'Spread',
    classification: 'LARRY',
    moDirection: 'left',
    gender: 'male',
    color: '#4ECDC4',
    playCount: 342,
    successRate: 67.8,
    avgYardsGained: 5.4,
    commonDefenses: ['Cover 3', 'Cover 4', 'Quarters'],
    triangleRelationships: [
      {
        type: 'EDGE',
        positions: ['MAC', 'APEX', 'STAR'],
        coverage: 'Cover 3',
        success: 72.3,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '12 Personnel Tight Slot',
    type: 'Pro',
    classification: 'LINDA',
    moDirection: 'left',
    gender: 'female',
    color: '#FF6B6B',
    playCount: 187,
    successRate: 58.2,
    avgYardsGained: 4.1,
    commonDefenses: ['Cover 2', 'Cover 6', 'Man coverage'],
    triangleRelationships: [
      {
        type: 'BRACKET',
        positions: ['APEX', 'STAR', 'SOLO'],
        coverage: 'Cover 2',
        success: 65.4,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '11 Personnel Trips Right',
    type: 'Spread',
    classification: 'RICKY',
    moDirection: 'right',
    gender: 'male',
    color: '#FFD93D',
    playCount: 289,
    successRate: 71.2,
    avgYardsGained: 6.2,
    commonDefenses: ['Cover 3', 'Cover 1 Robber', 'Quarters'],
    triangleRelationships: [
      {
        type: 'EDGE',
        positions: ['MAC', 'APEX', 'STAR'],
        coverage: 'Cover 3',
        success: 76.8,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: '21 Personnel I-Form',
    type: 'I-Form',
    classification: 'RITA',
    moDirection: 'right',
    gender: 'female',
    color: '#9B59B6',
    playCount: 156,
    successRate: 52.4,
    avgYardsGained: 3.8,
    commonDefenses: ['Cover 2', 'Tampa 2', 'Cloud coverage'],
    triangleRelationships: [
      {
        type: 'SEAL',
        positions: ['METRO', 'MIKE', 'MAC'],
        coverage: 'Cover 2',
        success: 61.2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET - Retrieve formations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query parameters
    const filter: FormationFilter = {
      classification: searchParams.get('classification')?.split(',') as any,
      moDirection: searchParams.get('moDirection')?.split(',') as any,
      gender: searchParams.get('gender')?.split(',') as any,
      minSuccessRate: searchParams.get('minSuccessRate')
        ? parseFloat(searchParams.get('minSuccessRate')!)
        : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Try to fetch from GraphQL, fallback to mock data
    let formations: Formation[] = mockFormations;

    try {
      const { data } = await apolloClient.query({
        query: GET_FORMATIONS,
        variables: { filter },
      });
      if (data?.formations) {
        formations = data.formations;
      }
    } catch (graphqlError) {
      console.warn('GraphQL unavailable, using mock data:', graphqlError);
    }

    // Apply filters
    let filteredFormations = formations;

    if (filter.classification?.length) {
      filteredFormations = filteredFormations.filter((f) =>
        filter.classification!.includes(f.classification)
      );
    }

    if (filter.moDirection?.length) {
      filteredFormations = filteredFormations.filter((f) =>
        filter.moDirection!.includes(f.moDirection)
      );
    }

    if (filter.gender?.length) {
      filteredFormations = filteredFormations.filter((f) =>
        filter.gender!.includes(f.gender)
      );
    }

    if (filter.minSuccessRate) {
      filteredFormations = filteredFormations.filter(
        (f) => f.successRate >= filter.minSuccessRate!
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredFormations = filteredFormations.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.type.toLowerCase().includes(searchLower) ||
          f.classification.toLowerCase().includes(searchLower)
      );
    }

    // Calculate aggregate analytics
    const analytics = TriangleDefenseUtils.analyzeFormationTendencies(filteredFormations);

    return NextResponse.json({
      success: true,
      data: filteredFormations,
      analytics,
      count: filteredFormations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Formations API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve formations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Analyze a specific formation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formationId, situation, defensiveCoverage } = body;

    if (!formationId) {
      return NextResponse.json(
        { success: false, error: 'formationId is required' },
        { status: 400 }
      );
    }

    // Find the formation
    const formation = mockFormations.find((f) => f.id === formationId);

    if (!formation) {
      return NextResponse.json(
        { success: false, error: 'Formation not found' },
        { status: 404 }
      );
    }

    // Generate Triangle Defense analysis
    const optimalTriangle = TriangleDefenseUtils.getOptimalTriangle(
      formation.classification
    );
    const positions = TriangleDefenseUtils.getTrianglePositions(optimalTriangle);
    const coverageSchemes = TriangleDefenseUtils.getCoverageScheme(formation.classification);
    const rushPatterns = TriangleDefenseUtils.getRushPattern(optimalTriangle);

    // Calculate success probability if defensive coverage provided
    const successProbability = defensiveCoverage
      ? TriangleDefenseUtils.calculateSuccessProbability(formation, defensiveCoverage)
      : formation.successRate;

    // Generate play call if situation provided
    const playCall = situation
      ? TriangleDefenseUtils.generatePlayCall(formation, situation)
      : null;

    // Calculate efficiency rating
    const efficiency = TriangleDefenseUtils.calculateEfficiencyRating(formation);

    return NextResponse.json({
      success: true,
      data: {
        formation,
        analysis: {
          optimalTriangle,
          positions,
          coverageSchemes,
          rushPatterns,
          successProbability,
          playCall,
          efficiency,
        },
        recommendations: [
          `Deploy ${optimalTriangle} triangle with ${positions.join('-')} alignment`,
          `Recommended coverage: ${coverageSchemes[0]}`,
          `Primary rush pattern: ${rushPatterns[0]}`,
          `Expected success rate: ${successProbability.toFixed(1)}%`,
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Formation Analysis Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze formation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
