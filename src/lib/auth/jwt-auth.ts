import jwt from 'jsonwebtoken';

// AMT Role-Based Access Control (RBAC)
export const AMT_ROLES = {
  FOUNDER: 'founder',
  EXECUTIVE: 'executive',
  AI_CORE: 'ai_core',
  STRATEGIC: 'strategic',
  ADVISORY: 'advisory',
  INNOVATION: 'innovation',
  FOOTBALL: 'football',
} as const;

export type AMTRole = (typeof AMT_ROLES)[keyof typeof AMT_ROLES];

// AMT Admin Users - Only 4 users have admin panel access
export const AMT_ADMIN_USERS = [
  'denauld@analyzemyteam.com',
  'courtney@analyzemyteam.com',
  'mel@analyzemyteam.com',
  'alexandra@analyzemyteam.com',
] as const;

export interface User {
  id: string;
  email: string;
  name: string;
  role: AMTRole;
  tier: number;
  avatar?: string;
  permissions: string[];
}

export interface TokenPayload extends User {
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return null;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Return user object without JWT metadata
    const { iat, exp, ...user } = decoded;
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: User): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(user, secret, {
    expiresIn,
  });
}

/**
 * Check if user has admin panel access
 */
export function isAdmin(email: string): boolean {
  return AMT_ADMIN_USERS.includes(email as any);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, permission: string): boolean {
  // Founder has all permissions
  if (user.role === AMT_ROLES.FOUNDER) {
    return true;
  }

  // Check if user has the specific permission
  return user.permissions.includes(permission) || user.permissions.includes('all');
}

/**
 * Get user role tier level
 */
export function getRoleTier(role: AMTRole): number {
  const tierMap: Record<AMTRole, number> = {
    [AMT_ROLES.FOUNDER]: 1,
    [AMT_ROLES.AI_CORE]: 2,
    [AMT_ROLES.EXECUTIVE]: 3,
    [AMT_ROLES.STRATEGIC]: 4,
    [AMT_ROLES.ADVISORY]: 5,
    [AMT_ROLES.INNOVATION]: 6,
    [AMT_ROLES.FOOTBALL]: 7,
  };

  return tierMap[role] || 99;
}

/**
 * Mock user database - Replace with actual database in production
 */
export const MOCK_USERS: User[] = [
  {
    id: 'denauld-brown',
    email: 'denauld@analyzemyteam.com',
    name: 'Denauld Brown',
    role: AMT_ROLES.FOUNDER,
    tier: 1,
    avatar: 'DB',
    permissions: ['all'],
  },
  {
    id: 'courtney-sellars',
    email: 'courtney@analyzemyteam.com',
    name: 'Courtney Sellars',
    role: AMT_ROLES.EXECUTIVE,
    tier: 3,
    avatar: 'CS',
    permissions: ['legal', 'operations', 'admin'],
  },
  {
    id: 'mel-ai',
    email: 'mel@analyzemyteam.com',
    name: 'M.E.L.',
    role: AMT_ROLES.AI_CORE,
    tier: 2,
    avatar: 'AI',
    permissions: ['intelligence', 'analysis', 'coordination'],
  },
  {
    id: 'alexandra-martinez',
    email: 'alexandra@analyzemyteam.com',
    name: 'Alexandra Martinez',
    role: AMT_ROLES.EXECUTIVE,
    tier: 3,
    avatar: 'AM',
    permissions: ['operations', 'admin', 'coordination'],
  },
];

/**
 * Authenticate user - Mock implementation
 * Replace with actual authentication logic in production
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  // Mock authentication - In production, verify against database
  const user = MOCK_USERS.find((u) => u.email === email);
  
  if (user && password === 'demo') {
    return user;
  }
  
  return null;
}
