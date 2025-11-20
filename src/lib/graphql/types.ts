/**
 * GraphQL TypeScript Type Definitions
 * Auto-generated types for AMT GraphQL Federation
 */

// ============================================
// Scalar Types
// ============================================
export type DateTime = string;
export type JSON = Record<string, any>;

// ============================================
// Formation Types
// ============================================
export type FormationClassification = 'LARRY' | 'LINDA' | 'RICKY' | 'RITA' | 'MALE_MID' | 'FEMALE_MID';
export type MODirection = 'left' | 'right' | 'middle';
export type Gender = 'male' | 'female';
export type TriangleType = 'EDGE' | 'BRACKET' | 'SEAL' | 'FUNNEL' | 'WALL' | 'SWARM' | 'TRAP';
export type DefensePosition = 'METRO' | 'APEX' | 'MIKE' | 'MAC' | 'STAR' | 'SOLO';

export interface Formation {
  id: string;
  name: string;
  type: string;
  classification: FormationClassification;
  description?: string;
  moDirection: MODirection;
  gender: Gender;
  color: string;
  playCount: number;
  successRate: number;
  avgYardsGained: number;
  commonDefenses: string[];
  triangleRelationships: TriangleRelationship[];
  plays?: Play[];
  analytics?: FormationAnalytics;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface TriangleRelationship {
  type: TriangleType;
  positions: DefensePosition[];
  coverage: string;
  rusher?: string;
  success?: number;
}

export interface FormationAnalytics {
  downAndDistance: Record<string, number>;
  fieldZone: Record<string, number>;
  personnelGrouping: Record<string, number>;
  playActionRate: number;
  successByDefense: Record<string, number>;
}

export interface FormationFilter {
  classification?: FormationClassification[];
  moDirection?: MODirection[];
  gender?: Gender[];
  minSuccessRate?: number;
  maxSuccessRate?: number;
  search?: string;
}

// ============================================
// Play & Playbook Types
// ============================================
export interface Play {
  id: string;
  name: string;
  description: string;
  formation: {
    id: string;
    name: string;
    classification: FormationClassification;
  };
  routes: Route[];
  animationData: string;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Route {
  playerId: string;
  route: string;
  yardBased: boolean;
  timing: number;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  plays: Play[];
  collaborators: User[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface PlayFilter {
  formationId?: string;
  classification?: FormationClassification[];
  tags?: string[];
  createdBy?: string;
  search?: string;
}

// ============================================
// M.E.L. AI Types
// ============================================
export interface MELInsight {
  id: string;
  type: 'formation' | 'play' | 'strategy' | 'performance';
  title: string;
  content: string;
  confidence: number;
  recommendations: string[];
  triangleDefenseAnalysis?: TriangleDefenseAnalysis;
  createdAt: DateTime;
}

export interface TriangleDefenseAnalysis {
  optimalTriangles: TriangleType[];
  rushPatterns: string[];
  coverageSchemes: string[];
  adjustments?: string[];
}

export interface FormationAnalysisData {
  formationId: string;
  formationName: string;
  classification: FormationClassification;
  totalPlays: number;
  successRate: number;
  avgYardsGained: number;
  tendencies: {
    downAndDistance: Record<string, number>;
    fieldPosition: Record<string, number>;
    personnelGrouping: Record<string, number>;
    playType: Record<string, number>;
  };
  defensiveCounters: DefensiveCounter[];
  triangleDefenseRecommendation: TriangleDefenseConfig;
  melInsights: string[];
}

export interface DefensiveCounter {
  coverage: string;
  frontAlignment: string;
  blitzPackage: string;
  successRate: number;
}

export interface TriangleDefenseConfig {
  primaryTriangle?: TriangleType;
  secondaryTriangle?: TriangleType;
  type?: TriangleType;
  positions?: DefensePosition[];
  coverage: string;
  rushPattern: string;
  adjustments: string[];
}

// ============================================
// User & Authentication Types
// ============================================
export type AMTRole = 'founder' | 'executive' | 'ai_core' | 'strategic' | 'advisory' | 'innovation' | 'football';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AMTRole;
  tier: number;
  avatar?: string;
  permissions: string[];
}

// ============================================
// Query Response Types
// ============================================
export interface GetFormationsResponse {
  formations: Formation[];
}

export interface GetFormationByIdResponse {
  formation: Formation;
}

export interface GetPlaysResponse {
  plays: Play[];
}

export interface GetPlaybookResponse {
  playbook: Playbook;
}

export interface GetMELInsightsResponse {
  melInsights: MELInsight[];
}

export interface GetFormationAnalysisResponse {
  formationAnalysis: FormationAnalysisData;
}

// ============================================
// Mutation Input Types
// ============================================
export interface CreatePlayInput {
  name: string;
  description: string;
  formationId: string;
  routes: RouteInput[];
  animationData: string;
  tags: string[];
}

export interface UpdatePlayInput {
  name?: string;
  description?: string;
  routes?: RouteInput[];
  animationData?: string;
  tags?: string[];
}

export interface RouteInput {
  playerId: string;
  route: string;
  yardBased: boolean;
  timing: number;
}

export interface AnalyzeFormationInput {
  formationId: string;
  context?: string;
  situation?: GameSituation;
}

export interface GameSituation {
  down: number;
  distance: number;
  fieldPosition: string;
  quarter?: number;
  timeRemaining?: string;
  score?: {
    home: number;
    away: number;
  };
}

// ============================================
// Mutation Response Types
// ============================================
export interface CreatePlayResponse {
  createPlay: Play;
}

export interface UpdatePlayResponse {
  updatePlay: Play;
}

export interface AnalyzeFormationResponse {
  analyzeFormation: {
    id: string;
    analysis: string;
    recommendations: string[];
    confidence: number;
    triangleDefenseStrategy: TriangleDefenseConfig;
  };
}

// ============================================
// Subscription Types
// ============================================
export interface FormationUpdatedSubscription {
  formationUpdated: {
    id: string;
    playCount: number;
    successRate: number;
    updatedAt: DateTime;
  };
}

export interface PlaybookCollaborationSubscription {
  playbookUpdated: {
    id: string;
    plays: Array<{
      id: string;
      name: string;
    }>;
    collaborators: Array<{
      id: string;
      name: string;
      action: string;
    }>;
    updatedAt: DateTime;
  };
}

// ============================================
// Utility Types
// ============================================
export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================
// API Response Wrapper
// ============================================
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  timestamp?: DateTime;
}

// ============================================
// Triangle Defense Color Map
// ============================================
export const FORMATION_COLORS: Record<FormationClassification, string> = {
  LARRY: '#4ECDC4',    // MO Left + Male
  LINDA: '#FF6B6B',    // MO Left + Female
  RICKY: '#FFD93D',    // MO Right + Male
  RITA: '#9B59B6',     // MO Right + Female
  MALE_MID: '#3498DB', // MO Middle + Male
  FEMALE_MID: '#E74C3C', // MO Middle + Female
};

// ============================================
// Type Guards
// ============================================
export function isFormation(obj: any): obj is Formation {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.classification === 'string' &&
    Array.isArray(obj.triangleRelationships)
  );
}

export function isPlay(obj: any): obj is Play {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.formation &&
    Array.isArray(obj.routes)
  );
}

export function isMELInsight(obj: any): obj is MELInsight {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.confidence === 'number'
  );
}
