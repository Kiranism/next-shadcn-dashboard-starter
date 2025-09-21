// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: AMTRole;
  tier: number;
  avatar?: string;
  permissions: string[];
}

export type AMTRole = 'founder' | 'executive' | 'ai_core' | 'strategic' | 'advisory' | 'innovation' | 'football';

export interface TokenPayload extends User {
  iat?: number;
  exp?: number;
}

// Module Types
export type ModuleStatus = 'active' | 'beta' | 'coming-soon';

export interface Module {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
  tier: number;
  route: string;
  icon?: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
  };
}

// Formation Types
export type FormationClassification = 'LARRY' | 'LINDA' | 'RICKY' | 'RITA' | 'MALE_MID' | 'FEMALE_MID';
export type MODirection = 'left' | 'right' | 'middle';
export type Gender = 'male' | 'female';

export interface Formation {
  id: string;
  name: string;
  type: string;
  classification: FormationClassification;
  moDirection: MODirection;
  gender: Gender;
  color: string;
  playCount: number;
  successRate: number;
  avgYardsGained: number;
  commonDefenses: string[];
  triangleRelationships: TriangleRelationship[];
  createdAt: string;
  updatedAt: string;
}

// Triangle Defense Types
export type TriangleType = 'EDGE' | 'BRACKET' | 'SEAL' | 'FUNNEL' | 'WALL' | 'SWARM' | 'TRAP';
export type DefensePosition = 'METRO' | 'APEX' | 'MIKE' | 'MAC' | 'STAR' | 'SOLO';

export interface TriangleRelationship {
  type: TriangleType;
  positions: DefensePosition[];
  coverage: string;
  rusher?: string;
  success?: number;
}

export interface TriangleDefenseConfig {
  type: TriangleType;
  positions: DefensePosition[];
  coverage: string;
  rushPattern: string;
  adjustments: string[];
}

// Play and Playbook Types
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

// M.E.L. AI Types
export interface MELInsight {
  id: string;
  type: 'formation' | 'play' | 'strategy' | 'performance';
  title: string;
  content: string;
  confidence: number;
  recommendations: string[];
  triangleDefenseAnalysis?: TriangleDefenseAnalysis;
  createdAt: string;
}

export interface TriangleDefenseAnalysis {
  optimalTriangles: TriangleType[];
  rushPatterns: string[];
  coverageSchemes: string[];
  adjustments: string[];
}

export interface FormationAnalysis {
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
  defensiveCounters: {
    coverage: string;
    frontAlignment: string;
    blitzPackage: string;
    successRate: number;
  }[];
  triangleDefenseRecommendation: TriangleDefenseConfig;
  melInsights: string[];
}

// Staff Types
export interface StaffMember {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  role: string;
  tier: number;
  specialization: string;
  avatar: string;
  bio: string;
}

// Dashboard Types
export interface DashboardStats {
  activeModules: number;
  teamMembers: number;
  formationsAnalyzed: number;
  melInsights: number;
  teamGPA?: number;
  revenueGrowth?: number;
}

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  module: string;
  icon: React.ReactNode;
  time: string;
  color: string;
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormationFilter {
  classification?: FormationClassification[];
  moDirection?: MODirection[];
  gender?: Gender[];
  minSuccessRate?: number;
  search?: string;
}

export interface PlayFilter {
  formationId?: string;
  classification?: FormationClassification[];
  tags?: string[];
  createdBy?: string;
  search?: string;
}

// Analytics Types
export interface PerformanceMetrics {
  playCount: number;
  successRate: number;
  avgYardsGained: number;
  efficiencyRating: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ModuleAnalytics {
  moduleId: string;
  moduleName: string;
  status: ModuleStatus;
  metrics: PerformanceMetrics;
  usage: {
    dailyActiveUsers: number;
    totalSessions: number;
    avgSessionDuration: number;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  preferences: {
    defaultView: string;
    autoSave: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
}

// Export all types
export type {
  User,
  Module,
  Formation,
  Play,
  Playbook,
  MELInsight,
  StaffMember,
  DashboardStats,
  ActivityItem,
  APIResponse,
  PaginatedResponse,
};
