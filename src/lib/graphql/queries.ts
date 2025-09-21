import { gql } from '@apollo/client';

// Triangle Defense Formation Queries
export const GET_FORMATIONS = gql`
  query GetFormations($filter: FormationFilter) {
    formations(filter: $filter) {
      id
      name
      type
      classification
      moDirection
      gender
      color
      playCount
      successRate
      avgYardsGained
      commonDefenses
      triangleRelationships {
        type
        positions
        coverage
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_FORMATION_BY_ID = gql`
  query GetFormationById($id: ID!) {
    formation(id: $id) {
      id
      name
      type
      classification
      description
      moDirection
      gender
      color
      playCount
      successRate
      avgYardsGained
      commonDefenses
      triangleRelationships {
        type
        positions
        coverage
        rusher
        success
      }
      plays {
        id
        name
        description
        animationData
      }
      analytics {
        downAndDistance
        fieldZone
        personnelGrouping
        playActionRate
        successByDefense
      }
      createdAt
      updatedAt
    }
  }
`;

// Power Playbooks Queries
export const GET_PLAYS = gql`
  query GetPlays($filter: PlayFilter) {
    plays(filter: $filter) {
      id
      name
      description
      formation {
        id
        name
        classification
      }
      routes {
        playerId
        route
        yardBased
        timing
      }
      animationData
      tags
      createdBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PLAYBOOK = gql`
  query GetPlaybook($id: ID!) {
    playbook(id: $id) {
      id
      name
      description
      plays {
        id
        name
        formation {
          classification
        }
        tags
      }
      collaborators {
        id
        name
        role
      }
      createdAt
      updatedAt
    }
  }
`;

// M.E.L. AI Analysis Queries
export const GET_MEL_INSIGHTS = gql`
  query GetMELInsights($formationId: ID, $context: String) {
    melInsights(formationId: $formationId, context: $context) {
      id
      type
      title
      content
      confidence
      recommendations
      triangleDefenseAnalysis {
        optimalTriangles
        rushPatterns
        coverageSchemes
      }
      createdAt
    }
  }
`;

export const GET_FORMATION_ANALYSIS = gql`
  query GetFormationAnalysis($formationId: ID!) {
    formationAnalysis(formationId: $formationId) {
      formationId
      formationName
      classification
      totalPlays
      successRate
      avgYardsGained
      tendencies {
        downAndDistance
        fieldPosition
        personnelGrouping
        playType
      }
      defensiveCounters {
        coverage
        frontAlignment
        blitzPackage
        successRate
      }
      triangleDefenseRecommendation {
        primaryTriangle
        secondaryTriangle
        rushPattern
        coverage
        adjustments
      }
      melInsights
    }
  }
`;

// Mutations
export const CREATE_PLAY = gql`
  mutation CreatePlay($input: CreatePlayInput!) {
    createPlay(input: $input) {
      id
      name
      description
      formation {
        id
        classification
      }
      routes {
        playerId
        route
        yardBased
      }
      animationData
      createdAt
    }
  }
`;

export const UPDATE_PLAY = gql`
  mutation UpdatePlay($id: ID!, $input: UpdatePlayInput!) {
    updatePlay(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const ANALYZE_FORMATION = gql`
  mutation AnalyzeFormation($formationId: ID!) {
    analyzeFormation(formationId: $formationId) {
      id
      analysis
      recommendations
      confidence
      triangleDefenseStrategy
    }
  }
`;

// Subscriptions for real-time updates
export const FORMATION_UPDATED = gql`
  subscription OnFormationUpdated($formationId: ID!) {
    formationUpdated(formationId: $formationId) {
      id
      playCount
      successRate
      updatedAt
    }
  }
`;

export const PLAYBOOK_COLLABORATION = gql`
  subscription OnPlaybookUpdated($playbookId: ID!) {
    playbookUpdated(playbookId: $playbookId) {
      id
      plays {
        id
        name
      }
      collaborators {
        id
        name
        action
      }
      updatedAt
    }
  }
`;

// Type definitions for TypeScript
export interface Formation {
  id: string;
  name: string;
  type: string;
  classification: 'LARRY' | 'LINDA' | 'RICKY' | 'RITA' | 'MALE_MID' | 'FEMALE_MID';
  moDirection: 'left' | 'right' | 'middle';
  gender: 'male' | 'female';
  color: string;
  playCount: number;
  successRate: number;
  avgYardsGained: number;
  commonDefenses: string[];
  triangleRelationships: TriangleRelationship[];
  createdAt: string;
  updatedAt: string;
}

export interface TriangleRelationship {
  type: 'EDGE' | 'BRACKET' | 'SEAL' | 'FUNNEL' | 'WALL' | 'SWARM' | 'TRAP';
  positions: string[];
  coverage: string;
  rusher?: string;
  success?: number;
}

export interface Play {
  id: string;
  name: string;
  description: string;
  formation: {
    id: string;
    name: string;
    classification: string;
  };
  routes: Route[];
  animationData: string;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  playerId: string;
  route: string;
  yardBased: boolean;
  timing: number;
}
