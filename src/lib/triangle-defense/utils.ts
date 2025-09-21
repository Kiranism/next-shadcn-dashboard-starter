import { Formation, TriangleType, DefensePosition, FormationClassification } from '@/types';

// Triangle Defense Formation Classification
export function classifyFormation(moDirection: 'left' | 'right' | 'middle', gender: 'male' | 'female'): FormationClassification {
  if (moDirection === 'left' && gender === 'male') return 'LARRY';
  if (moDirection === 'left' && gender === 'female') return 'LINDA';
  if (moDirection === 'right' && gender === 'male') return 'RICKY';
  if (moDirection === 'right' && gender === 'female') return 'RITA';
  if (moDirection === 'middle' && gender === 'male') return 'MALE_MID';
  if (moDirection === 'middle' && gender === 'female') return 'FEMALE_MID';
  return 'LARRY'; // Default
}

// Get optimal triangle type based on formation
export function getOptimalTriangle(classification: FormationClassification): TriangleType {
  const triangleMap: Record<FormationClassification, TriangleType> = {
    LARRY: 'EDGE',
    LINDA: 'BRACKET',
    RICKY: 'EDGE',
    RITA: 'SEAL',
    MALE_MID: 'FUNNEL',
    FEMALE_MID: 'WALL',
  };
  return triangleMap[classification] || 'EDGE';
}

// Get defensive positions for triangle type
export function getTrianglePositions(triangleType: TriangleType): DefensePosition[] {
  const positionMap: Record<TriangleType, DefensePosition[]> = {
    EDGE: ['MAC', 'APEX', 'STAR'],
    BRACKET: ['APEX', 'STAR', 'SOLO'],
    SEAL: ['METRO', 'MIKE', 'MAC'],
    FUNNEL: ['MIKE', 'APEX', 'STAR'],
    WALL: ['METRO', 'MIKE', 'APEX'],
    SWARM: ['METRO', 'MIKE', 'MAC'],
    TRAP: ['MAC', 'APEX', 'MIKE'],
  };
  return positionMap[triangleType] || ['MAC', 'APEX', 'STAR'];
}

// Calculate formation success probability
export function calculateSuccessProbability(
  formation: Formation,
  defensiveCoverage: string
): number {
  const baseSuccess = formation.successRate;
  
  // Adjust based on coverage type
  const coverageAdjustments: Record<string, number> = {
    'Cover 1': -5,
    'Cover 2': 0,
    'Cover 3': 5,
    'Cover 4': -3,
    'Cover 6': 8,
    'Man': -10,
    'Zone': 5,
  };
  
  const adjustment = coverageAdjustments[defensiveCoverage] || 0;
  return Math.max(0, Math.min(100, baseSuccess + adjustment));
}

// Get rush pattern recommendation
export function getRushPattern(triangleType: TriangleType): string[] {
  const rushPatterns: Record<TriangleType, string[]> = {
    EDGE: ['Speed rush outside', 'Contain rush', 'Edge pressure'],
    BRACKET: ['Double A-gap', 'Inside pressure', 'Delayed blitz'],
    SEAL: ['Gap integrity', 'Run support', 'Contain edge'],
    FUNNEL: ['Force inside', 'Funnel to help', 'Backside pursuit'],
    WALL: ['Wall off strong side', 'Force bounce', 'Spill technique'],
    SWARM: ['Multi-point pressure', 'Swarm to ball', 'Gap exchange'],
    TRAP: ['Delayed pressure', 'Trap coverage', 'Disguise blitz'],
  };
  return rushPatterns[triangleType] || ['Standard rush'];
}

// Get coverage scheme recommendation
export function getCoverageScheme(classification: FormationClassification): string[] {
  const coverageMap: Record<FormationClassification, string[]> = {
    LARRY: ['Cover 3', 'Cover 4', 'Quarters'],
    LINDA: ['Cover 2', 'Cover 6', 'Man coverage'],
    RICKY: ['Cover 3', 'Cover 1 Robber', 'Quarters'],
    RITA: ['Cover 2', 'Tampa 2', 'Cloud coverage'],
    MALE_MID: ['Cover 4', 'Split safety', 'Match quarters'],
    FEMALE_MID: ['Cover 2', 'Cover 3 Cloud', 'Pattern match'],
  };
  return coverageMap[classification] || ['Cover 3'];
}

// Analyze formation tendencies
export function analyzeFormationTendencies(formations: Formation[]) {
  const stats = {
    totalFormations: formations.length,
    avgSuccessRate: 0,
    avgYardsGained: 0,
    mostCommon: '' as FormationClassification,
    distribution: {} as Record<FormationClassification, number>,
  };

  if (formations.length === 0) return stats;

  // Calculate averages
  const totalSuccess = formations.reduce((sum, f) => sum + f.successRate, 0);
  const totalYards = formations.reduce((sum, f) => sum + f.avgYardsGained, 0);
  
  stats.avgSuccessRate = totalSuccess / formations.length;
  stats.avgYardsGained = totalYards / formations.length;

  // Calculate distribution
  const distribution: Record<string, number> = {};
  formations.forEach((f) => {
    distribution[f.classification] = (distribution[f.classification] || 0) + 1;
  });

  stats.distribution = distribution as Record<FormationClassification, number>;

  // Find most common
  let maxCount = 0;
  Object.entries(distribution).forEach(([classification, count]) => {
    if (count > maxCount) {
      maxCount = count;
      stats.mostCommon = classification as FormationClassification;
    }
  });

  return stats;
}

// Generate Triangle Defense play call
export function generatePlayCall(
  formation: Formation,
  situation: {
    down: number;
    distance: number;
    fieldPosition: string;
  }
): string {
  const triangleType = getOptimalTriangle(formation.classification);
  const positions = getTrianglePositions(triangleType);
  const coverage = getCoverageScheme(formation.classification)[0];
  
  let playCall = `${triangleType} Triangle`;
  
  // Add situation-specific adjustments
  if (situation.distance > 10) {
    playCall += ' - Pass Rush';
  } else if (situation.distance <= 3) {
    playCall += ' - Run Stuff';
  }
  
  playCall += ` | ${coverage}`;
  playCall += ` | ${positions.join('-')}`;
  
  return playCall;
}

// Validate formation data
export function validateFormation(formation: Partial<Formation>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!formation.name || formation.name.trim().length === 0) {
    errors.push('Formation name is required');
  }

  if (!formation.classification) {
    errors.push('Formation classification is required');
  }

  if (!formation.moDirection) {
    errors.push('MO direction is required');
  }

  if (!formation.gender) {
    errors.push('Gender classification is required');
  }

  if (formation.successRate !== undefined && (formation.successRate < 0 || formation.successRate > 100)) {
    errors.push('Success rate must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Calculate Triangle Defense efficiency rating
export function calculateEfficiencyRating(formation: Formation): {
  rating: number;
  grade: 'Elite' | 'Excellent' | 'Good' | 'Average' | 'Below Average';
  factors: {
    successRate: number;
    playVolume: number;
    yardsEfficiency: number;
  };
} {
  const successWeight = 0.5;
  const volumeWeight = 0.3;
  const yardsWeight = 0.2;

  // Normalize metrics
  const successScore = formation.successRate;
  const volumeScore = Math.min(100, (formation.playCount / 100) * 100);
  const yardsScore = Math.max(0, 100 - (formation.avgYardsGained * 10));

  const rating = 
    (successScore * successWeight) +
    (volumeScore * volumeWeight) +
    (yardsScore * yardsWeight);

  let grade: 'Elite' | 'Excellent' | 'Good' | 'Average' | 'Below Average';
  if (rating >= 85) grade = 'Elite';
  else if (rating >= 70) grade = 'Excellent';
  else if (rating >= 55) grade = 'Good';
  else if (rating >= 40) grade = 'Average';
  else grade = 'Below Average';

  return {
    rating: Math.round(rating),
    grade,
    factors: {
      successRate: successScore,
      playVolume: volumeScore,
      yardsEfficiency: yardsScore,
    },
  };
}

// Export all Triangle Defense utilities
export const TriangleDefenseUtils = {
  classifyFormation,
  getOptimalTriangle,
  getTrianglePositions,
  calculateSuccessProbability,
  getRushPattern,
  getCoverageScheme,
  analyzeFormationTendencies,
  generatePlayCall,
  validateFormation,
  calculateEfficiencyRating,
};
