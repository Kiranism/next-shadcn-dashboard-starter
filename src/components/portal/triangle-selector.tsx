'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Check } from 'lucide-react';
import type { TriangleType, FormationClassification } from '@/types';
import { TriangleDefenseUtils } from '@/lib/triangle-defense/utils';

interface TriangleSelectorProps {
  formationClassification?: FormationClassification;
  onSelect?: (triangle: TriangleType) => void;
  className?: string;
}

const TRIANGLE_INFO: Record<
  TriangleType,
  {
    name: string;
    color: string;
    description: string;
    positions: string[];
    usage: string;
  }
> = {
  EDGE: {
    name: 'EDGE Triangle',
    color: '#4ECDC4',
    description: 'Speed rush outside with edge pressure and contain',
    positions: ['MAC', 'APEX', 'STAR'],
    usage: 'Optimal for LARRY/RICKY formations',
  },
  BRACKET: {
    name: 'BRACKET Triangle',
    color: '#FF6B6B',
    description: 'Double A-gap pressure with inside containment',
    positions: ['APEX', 'STAR', 'SOLO'],
    usage: 'Effective against LINDA formations',
  },
  SEAL: {
    name: 'SEAL Triangle',
    color: '#FFD93D',
    description: 'Gap integrity with run support and edge contain',
    positions: ['METRO', 'MIKE', 'MAC'],
    usage: 'Best for RITA formations and run defense',
  },
  FUNNEL: {
    name: 'FUNNEL Triangle',
    color: '#9B59B6',
    description: 'Force inside with funnel to help and backside pursuit',
    positions: ['MIKE', 'APEX', 'STAR'],
    usage: 'Ideal for MALE_MID formations',
  },
  WALL: {
    name: 'WALL Triangle',
    color: '#3498DB',
    description: 'Wall off strong side with force bounce and spill',
    positions: ['METRO', 'MIKE', 'APEX'],
    usage: 'Recommended for FEMALE_MID formations',
  },
  SWARM: {
    name: 'SWARM Triangle',
    color: '#E74C3C',
    description: 'Multi-point pressure with gap exchange',
    positions: ['METRO', 'MIKE', 'MAC'],
    usage: 'Aggressive pressure package',
  },
  TRAP: {
    name: 'TRAP Triangle',
    color: '#2ECC71',
    description: 'Delayed pressure with disguised blitz',
    positions: ['MAC', 'APEX', 'MIKE'],
    usage: 'Deceptive defensive strategy',
  },
};

export function TriangleSelector({
  formationClassification,
  onSelect,
  className,
}: TriangleSelectorProps) {
  const [selectedTriangle, setSelectedTriangle] = useState<TriangleType | null>(null);

  // Get optimal triangle for the formation
  const optimalTriangle = formationClassification
    ? TriangleDefenseUtils.getOptimalTriangle(formationClassification)
    : null;

  const handleSelect = (triangle: TriangleType) => {
    setSelectedTriangle(triangle);
    onSelect?.(triangle);
  };

  const triangleTypes: TriangleType[] = [
    'EDGE',
    'BRACKET',
    'SEAL',
    'FUNNEL',
    'WALL',
    'SWARM',
    'TRAP',
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amt-red" />
              Triangle Defense Selector
            </CardTitle>
            <CardDescription>
              {formationClassification
                ? `Select triangle strategy for ${formationClassification} formation`
                : 'Choose your Triangle Defense configuration'}
            </CardDescription>
          </div>
          {optimalTriangle && (
            <Badge className="bg-amt-accent/10 text-amt-accent border-amt-accent/20">
              Recommended: {optimalTriangle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {triangleTypes.map((triangle) => {
            const info = TRIANGLE_INFO[triangle];
            const isOptimal = triangle === optimalTriangle;
            const isSelected = triangle === selectedTriangle;

            return (
              <Button
                key={triangle}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleSelect(triangle)}
                className={`h-auto p-4 justify-start relative ${
                  isSelected
                    ? 'bg-amt-red hover:bg-amt-red/90'
                    : isOptimal
                      ? 'border-2 border-amt-accent'
                      : ''
                }`}
              >
                <div className="flex flex-col items-start gap-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="font-semibold text-sm">{info.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                    {isOptimal && !isSelected && (
                      <Badge variant="outline" className="text-xs">
                        Optimal
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-left opacity-80">{info.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {info.positions.map((pos) => (
                      <Badge
                        key={pos}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : undefined,
                        }}
                      >
                        {pos}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs italic opacity-70 text-left">{info.usage}</p>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Selected Triangle Details */}
        {selectedTriangle && (
          <div className="mt-6 p-4 rounded-lg bg-muted">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {TRIANGLE_INFO[selectedTriangle].name} Configuration
            </h4>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Defensive Alignment:</p>
                <div className="flex gap-2">
                  {TRIANGLE_INFO[selectedTriangle].positions.map((pos, idx) => (
                    <span key={pos}>
                      <span className="font-medium">{pos}</span>
                      {idx < TRIANGLE_INFO[selectedTriangle].positions.length - 1 && (
                        <span className="mx-1 text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Rush Patterns:</p>
                <div className="flex flex-wrap gap-1">
                  {TriangleDefenseUtils.getRushPattern(selectedTriangle).map((pattern) => (
                    <Badge key={pattern} variant="outline" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>

              {formationClassification && (
                <div>
                  <p className="text-muted-foreground mb-1">Recommended Coverages:</p>
                  <div className="flex flex-wrap gap-1">
                    {TriangleDefenseUtils.getCoverageScheme(formationClassification).map(
                      (coverage) => (
                        <Badge key={coverage} variant="secondary" className="text-xs">
                          {coverage}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
