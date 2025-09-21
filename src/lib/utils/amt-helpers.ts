import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format large numbers (e.g., 1.2K, 3.4M)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

// Format time ago
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

// Get Triangle Defense color by classification
export function getFormationColor(classification: string): string {
  const colors: Record<string, string> = {
    LARRY: '#4ECDC4',
    LINDA: '#FF6B6B',
    RICKY: '#FFD93D',
    RITA: '#9B59B6',
    MALE_MID: '#3498DB',
    FEMALE_MID: '#E74C3C',
  };
  return colors[classification] || '#4e5064';
}

// Get module status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    beta: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'coming-soon': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[status] || colors['coming-soon'];
}

// Calculate success rate color
export function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-500';
  if (rate >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get tier color
export function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: 'text-amt-red',
    2: 'text-amt-accent',
    3: 'text-blue-500',
    4: 'text-purple-500',
    5: 'text-green-500',
    6: 'text-orange-500',
    7: 'text-cyan-500',
  };
  return colors[tier] || 'text-gray-500';
}

// Calculate formation distribution
export function calculateFormationDistribution(formations: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    LARRY: 0,
    LINDA: 0,
    RICKY: 0,
    RITA: 0,
    MALE_MID: 0,
    FEMALE_MID: 0,
  };

  formations.forEach((formation) => {
    if (distribution[formation.classification] !== undefined) {
      distribution[formation.classification]++;
    }
  });

  return distribution;
}

// Generate random ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if user has admin access
export function isAdminUser(email: string): boolean {
  const adminEmails = [
    'denauld@analyzemyteam.com',
    'courtney@analyzemyteam.com',
    'mel@analyzemyteam.com',
    'alexandra@analyzemyteam.com',
  ];
  return adminEmails.includes(email);
}

// Get module route
export function getModuleRoute(moduleId: string): string {
  return `/portal/modules/${moduleId}`;
}

// Format play count
export function formatPlayCount(count: number): string {
  if (count === 0) return 'No plays';
  if (count === 1) return '1 play';
  return `${formatNumber(count)} plays`;
}

// Calculate Triangle Defense efficiency
export function calculateTriangleEfficiency(successRate: number, playCount: number): string {
  if (playCount < 10) return 'Insufficient data';
  if (successRate >= 85) return 'Elite';
  if (successRate >= 70) return 'Excellent';
  if (successRate >= 55) return 'Good';
  if (successRate >= 40) return 'Average';
  return 'Below average';
}

// Get triangle type description
export function getTriangleTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    EDGE: 'Edge Triangle - Outside pressure with contain',
    BRACKET: 'Bracket Triangle - Double coverage with safety help',
    SEAL: 'Seal Triangle - Gap integrity with run support',
    FUNNEL: 'Funnel Triangle - Force ball inside to help',
    WALL: 'Wall Triangle - Strong side run support',
    SWARM: 'Swarm Triangle - Multiple defenders to ball',
    TRAP: 'Trap Triangle - Delayed pressure scheme',
  };
  return descriptions[type] || type;
}
