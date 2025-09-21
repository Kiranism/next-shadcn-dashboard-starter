// AMT Platform Configuration
export const AMT_CONFIG = {
  platform: {
    name: 'AnalyzeMyTeam Platform',
    shortName: 'AMT Portal',
    version: '1.0.0',
    founder: 'Denauld Brown',
  },
  
  branding: {
    colors: {
      primary: '#e2021a',
      accent: '#d4db69',
      dark: '#1b151a',
      blueGray: '#4e5064',
      gray: '#818284',
    },
    logo: '/assets/amt-logo.svg',
  },

  modules: {
    executiveSuite: {
      id: 'executive-suite',
      name: 'Executive Suite',
      status: 'beta',
      tier: 3,
      route: '/portal/modules/executive-suite',
    },
    dynamicFabricator: {
      id: 'dynamic-fabricator',
      name: 'Dynamic Fabricator',
      status: 'coming-soon',
      tier: 6,
      route: '/portal/modules/dynamic-fabricator',
    },
    gameChanger: {
      id: 'game-changer',
      name: 'Game Changer',
      status: 'coming-soon',
      tier: 6,
      route: '/portal/modules/game-changer',
    },
    mel: {
      id: 'mel',
      name: 'M.E.L. AI',
      status: 'active',
      tier: 2,
      route: '/portal/modules/mel',
    },
    q3: {
      id: 'q3',
      name: 'Q3 Quarterback',
      status: 'coming-soon',
      tier: 5,
      route: '/portal/modules/q3',
    },
    dynamicPredictor: {
      id: 'dynamic-predictor',
      name: 'Dynamic Predictor',
      status: 'coming-soon',
      tier: 6,
      route: '/portal/modules/dynamic-predictor',
    },
    powerPlaybooks: {
      id: 'power-playbooks',
      name: 'Power Playbooks',
      status: 'active',
      tier: 7,
      route: '/portal/modules/power-playbooks',
    },
    proScout: {
      id: 'pro-scout',
      name: 'Pro Scout',
      status: 'coming-soon',
      tier: 5,
      route: '/portal/modules/pro-scout',
    },
    recruit: {
      id: 'recruit',
      name: 'Recruit',
      status: 'coming-soon',
      tier: 5,
      route: '/portal/modules/recruit',
    },
    strength: {
      id: 'strength',
      name: 'Strength',
      status: 'coming-soon',
      tier: 7,
      route: '/portal/modules/strength',
    },
    medicine: {
      id: 'medicine',
      name: 'Medicine',
      status: 'coming-soon',
      tier: 7,
      route: '/portal/modules/medicine',
    },
    academics: {
      id: 'academics',
      name: 'Academics',
      status: 'coming-soon',
      tier: 7,
      route: '/portal/modules/academics',
    },
  },
} as const;

// Triangle Defense Configuration
export const TRIANGLE_DEFENSE = {
  formations: {
    LARRY: {
      name: 'LARRY',
      description: 'MO Left + Male',
      color: '#4ECDC4',
      moDirection: 'left',
      gender: 'male',
    },
    LINDA: {
      name: 'LINDA',
      description: 'MO Left + Female',
      color: '#FF6B6B',
      moDirection: 'left',
      gender: 'female',
    },
    RICKY: {
      name: 'RICKY',
      description: 'MO Right + Male',
      color: '#FFD93D',
      moDirection: 'right',
      gender: 'male',
    },
    RITA: {
      name: 'RITA',
      description: 'MO Right + Female',
      color: '#9B59B6',
      moDirection: 'right',
      gender: 'female',
    },
    MALE_MID: {
      name: 'MALE_MID',
      description: 'MO Middle + Male',
      color: '#3498DB',
      moDirection: 'middle',
      gender: 'male',
    },
    FEMALE_MID: {
      name: 'FEMALE_MID',
      description: 'MO Middle + Female',
      color: '#E74C3C',
      moDirection: 'middle',
      gender: 'female',
    },
  },
  
  triangleTypes: {
    EDGE: 'Edge Triangle',
    BRACKET: 'Bracket Triangle',
    SEAL: 'Seal Triangle',
    FUNNEL: 'Funnel Triangle',
    WALL: 'Wall Triangle',
    SWARM: 'Swarm Triangle',
    TRAP: 'Trap Triangle',
  },
  
  positions: {
    METRO: 'Metro (Inside Linebacker)',
    APEX: 'Apex (Edge/OLB)',
    MIKE: 'Mike (Middle Linebacker)',
    MAC: 'Mac (Edge Rusher)',
    STAR: 'Star (Nickel/Slot)',
    SOLO: 'Solo (Free Safety)',
  },
} as const;

// Staff Tier Hierarchy
export const STAFF_TIERS = {
  TIER_1: {
    tier: 1,
    name: 'Founder Authority',
    description: 'Ultimate decision-making authority',
    members: ['Denauld Brown'],
  },
  TIER_2: {
    tier: 2,
    name: 'AI Core',
    description: 'Artificial intelligence coordination',
    members: ['M.E.L.'],
  },
  TIER_3: {
    tier: 3,
    name: 'Executive Command',
    description: 'C-Suite executive leadership',
    members: ['Courtney Sellars', 'Alexandra Martinez'],
  },
  TIER_4: {
    tier: 4,
    name: 'Strategic Leadership',
    description: 'Strategic direction and oversight',
    members: [],
  },
  TIER_5: {
    tier: 5,
    name: 'Advisory Council',
    description: 'Expert advisory and consultation',
    members: [],
  },
  TIER_6: {
    tier: 6,
    name: 'Innovation Division',
    description: 'Technology and innovation development',
    members: [],
  },
  TIER_7: {
    tier: 7,
    name: 'Football Operations',
    description: 'On-field coaching and analytics',
    members: [],
  },
} as const;

// API Configuration
export const API_CONFIG = {
  graphql: {
    endpoint: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://graphql.analyzemyteam.com/graphql',
    wsEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'wss://graphql.analyzemyteam.com/graphql',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.MEL_MODEL || 'claude-sonnet-4-20250514',
  },
  analytics: {
    hive: process.env.HIVE_ANALYTICS_URL || 'https://hive.analyzemyteam.com',
    supabase: process.env.SUPABASE_URL || 'https://supabase.analyzemyteam.com',
    neo4j: process.env.NEO4J_URL || 'bolt://neo4j.analyzemyteam.com:7687',
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableMELAI: true,
  enablePowerPlaybooks: true,
  enableExecutiveSuite: true,
  enableAdminPanel: true,
  enableRealtimeCollaboration: false,
  enableVideoProcessing: false,
  enablePredictiveAnalytics: false,
} as const;

// Export types
export type ModuleStatus = 'active' | 'beta' | 'coming-soon';
export type FormationClassification = 'LARRY' | 'LINDA' | 'RICKY' | 'RITA' | 'MALE_MID' | 'FEMALE_MID';
export type TriangleType = 'EDGE' | 'BRACKET' | 'SEAL' | 'FUNNEL' | 'WALL' | 'SWARM' | 'TRAP';
export type DefensePosition = 'METRO' | 'APEX' | 'MIKE' | 'MAC' | 'STAR' | 'SOLO';
