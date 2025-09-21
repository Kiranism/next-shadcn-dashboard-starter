// AMT Staff Members - 25 Championship Professionals
export const STAFF_MEMBERS = {
  // Tier 1: Founder Authority
  denauld_brown: {
    id: 'denauld-brown',
    fullName: 'Denauld Brown',
    nickname: 'The Architect',
    email: 'denauld@analyzemyteam.com',
    role: 'Founder & CEO',
    tier: 1,
    specialization: 'Triangle Defense Architecture',
    avatar: 'DB',
    bio: 'Visionary founder of AnalyzeMyTeam and creator of the Triangle Defense methodology',
  },

  // Tier 2: AI Core
  mel_ai: {
    id: 'mel-ai',
    fullName: 'M.E.L.',
    nickname: 'Master Intelligence Engine',
    email: 'mel@analyzemyteam.com',
    role: 'AI Core Intelligence',
    tier: 2,
    specialization: 'Artificial Intelligence & Pattern Recognition',
    avatar: 'AI',
    bio: 'Claude Sonnet 4-powered coaching intelligence system',
  },

  // Tier 3: Executive Command
  courtney_sellars: {
    id: 'courtney-sellars',
    fullName: 'Courtney Sellars',
    nickname: 'The Shield',
    email: 'courtney@analyzemyteam.com',
    role: 'CEO & Chief Legal Officer',
    tier: 3,
    specialization: 'Legal Strategy & Operations',
    avatar: 'CS',
    bio: 'Executive leadership and legal strategy oversight',
  },

  alexandra_martinez: {
    id: 'alexandra-martinez',
    fullName: 'Alexandra Martinez',
    nickname: 'The Coordinator',
    email: 'alexandra@analyzemyteam.com',
    role: 'Chief Administrative Officer',
    tier: 3,
    specialization: 'Portfolio Coordination & Operations',
    avatar: 'AM',
    bio: 'Master portfolio coordinator managing 12 specialized companies',
  },

  // Tier 4: Strategic Leadership
  tony_rivera: {
    id: 'tony-rivera',
    fullName: 'Tony Rivera',
    nickname: 'The Triangle Specialist',
    email: 'tony@analyzemyteam.com',
    role: 'Defensive Analyst',
    tier: 4,
    specialization: 'Triangle Defense Formations',
    avatar: 'TR',
    bio: 'Expert in Triangle Defense formations and coverage schemes',
  },

  derek_thompson: {
    id: 'derek-thompson',
    fullName: 'Derek Thompson',
    nickname: 'The Pressure Specialist',
    email: 'derek@analyzemyteam.com',
    role: 'Pass Rush Analyst',
    tier: 4,
    specialization: 'Pass Rush Analytics',
    avatar: 'DT',
    bio: 'Specialist in pressure generation and edge rush optimization',
  },

  // Tier 5: Advisory Council
  dr_marcus_johnson: {
    id: 'dr-marcus-johnson',
    fullName: 'Dr. Marcus Johnson',
    nickname: 'The Mind',
    email: 'marcus.johnson@analyzemyteam.com',
    role: 'Sports Psychology Director',
    tier: 5,
    specialization: 'Mental Performance',
    avatar: 'MJ',
    bio: 'Sports psychologist focused on mental preparation and performance optimization',
  },

  amanda_thompson: {
    id: 'amanda-thompson',
    fullName: 'Coach Amanda Thompson',
    nickname: 'The Mentor',
    email: 'amanda@analyzemyteam.com',
    role: 'Director of Coach Development',
    tier: 5,
    specialization: 'Coaching Excellence',
    avatar: 'AT',
    bio: 'Dedicated to coach development and training excellence',
  },

  roberto_gutierrez: {
    id: 'roberto-gutierrez',
    fullName: 'Roberto Gutierrez',
    nickname: 'The Scout',
    email: 'roberto@analyzemyteam.com',
    role: 'Director of Player Personnel',
    tier: 5,
    specialization: 'Talent Evaluation',
    avatar: 'RG',
    bio: 'Expert scout with comprehensive talent evaluation expertise',
  },

  // Tier 6: Innovation Division
  sam_williams: {
    id: 'sam-williams',
    fullName: 'Sam Williams',
    nickname: 'The Teacher',
    email: 'sam@analyzemyteam.com',
    role: 'Offensive Analyst',
    tier: 6,
    specialization: 'Educational Innovation',
    avatar: 'SW',
    bio: 'Offensive analyst focused on teaching methodologies',
  },

  alex_chen: {
    id: 'alex-chen',
    fullName: 'Alex Chen',
    nickname: 'The Optimizer',
    email: 'alex@analyzemyteam.com',
    role: 'Special Teams Analyst',
    tier: 6,
    specialization: 'Statistical Analysis',
    avatar: 'AC',
    bio: 'Data-driven special teams optimization expert',
  },

  marcus_lewis: {
    id: 'marcus-lewis',
    fullName: 'Marcus Lewis',
    nickname: 'The Analytics Chief',
    email: 'marcus.lewis@analyzemyteam.com',
    role: 'Head Analytics Coordinator',
    tier: 6,
    specialization: 'Analytics Coordination',
    avatar: 'ML',
    bio: 'Coordinates analytics across all football operations',
  },

  // Tier 7: Football Operations
  michael_rodriguez: {
    id: 'michael-rodriguez',
    fullName: 'Michael Rodriguez',
    nickname: 'The Wall',
    email: 'michael@analyzemyteam.com',
    role: 'Defensive Coordinator',
    tier: 7,
    specialization: 'Field Operations',
    avatar: 'MR',
    bio: '15 years of defensive coordination and Triangle Defense implementation',
  },
} as const;

// Helper function to get staff by tier
export function getStaffByTier(tier: number) {
  return Object.values(STAFF_MEMBERS).filter(member => member.tier === tier);
}

// Helper function to get staff by ID
export function getStaffById(id: string) {
  return Object.values(STAFF_MEMBERS).find(member => member.id === id);
}

// Helper function to get all staff as array
export function getAllStaff() {
  return Object.values(STAFF_MEMBERS);
}

// Export staff member IDs for type safety
export type StaffMemberId = keyof typeof STAFF_MEMBERS;
