'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Target, TrendingUp } from 'lucide-react';
import type { Formation, TriangleType, DefensePosition } from '@/types';

interface FormationVizProps {
  formation: Formation;
  highlightedTriangle?: TriangleType;
  className?: string;
}

const POSITION_COORDINATES: Record<DefensePosition, { x: number; y: number }> = {
  METRO: { x: 50, y: 15 }, // Deep middle
  APEX: { x: 30, y: 40 }, // Left apex
  MIKE: { x: 50, y: 50 }, // Middle linebacker
  MAC: { x: 70, y: 40 }, // Right apex
  STAR: { x: 20, y: 65 }, // Strong safety
  SOLO: { x: 80, y: 65 }, // Free safety
};

const TRIANGLE_COLORS: Record<TriangleType, string> = {
  EDGE: '#4ECDC4',
  BRACKET: '#FF6B6B',
  SEAL: '#FFD93D',
  FUNNEL: '#9B59B6',
  WALL: '#3498DB',
  SWARM: '#E74C3C',
  TRAP: '#2ECC71',
};

export function FormationViz({ formation, highlightedTriangle, className }: FormationVizProps) {
  const renderTriangleLines = (triangleType: TriangleType, positions: DefensePosition[]) => {
    if (positions.length !== 3) return null;

    const [pos1, pos2, pos3] = positions.map((p) => POSITION_COORDINATES[p]);
    const color = TRIANGLE_COLORS[triangleType];
    const isHighlighted = highlightedTriangle === triangleType;

    return (
      <g key={triangleType} opacity={isHighlighted ? 1 : 0.3}>
        {/* Triangle edges */}
        <line
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          stroke={color}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeDasharray={isHighlighted ? '0' : '4 2'}
        />
        <line
          x1={pos2.x}
          y1={pos2.y}
          x2={pos3.x}
          y2={pos3.y}
          stroke={color}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeDasharray={isHighlighted ? '0' : '4 2'}
        />
        <line
          x1={pos3.x}
          y1={pos3.y}
          x2={pos1.x}
          y2={pos1.y}
          stroke={color}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeDasharray={isHighlighted ? '0' : '4 2'}
        />

        {/* Triangle fill */}
        <polygon
          points={`${pos1.x},${pos1.y} ${pos2.x},${pos2.y} ${pos3.x},${pos3.y}`}
          fill={color}
          opacity={isHighlighted ? 0.2 : 0.05}
        />
      </g>
    );
  };

  const renderDefensePosition = (position: DefensePosition, isActive: boolean) => {
    const coord = POSITION_COORDINATES[position];

    return (
      <g key={position}>
        {/* Position circle */}
        <circle
          cx={coord.x}
          cy={coord.y}
          r={isActive ? 4 : 3}
          fill={isActive ? formation.color : '#6b7280'}
          stroke="white"
          strokeWidth={isActive ? 2 : 1}
        />

        {/* Position label */}
        <text
          x={coord.x}
          y={coord.y - 8}
          fontSize="6"
          fontWeight={isActive ? 'bold' : 'normal'}
          fill="currentColor"
          textAnchor="middle"
        >
          {position}
        </text>
      </g>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amt-red" />
              Triangle Defense Visualization
            </CardTitle>
            <CardDescription>{formation.name}</CardDescription>
          </div>
          <Badge style={{ backgroundColor: formation.color, color: 'white' }}>
            {formation.classification}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field Visualization */}
        <div className="relative w-full aspect-[3/2] bg-gradient-to-b from-green-900/20 to-green-800/20 rounded-lg border-2 border-green-700/30 overflow-hidden">
          {/* Field lines */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Yard lines */}
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="white"
                strokeWidth="0.2"
                opacity="0.3"
              />
            ))}

            {/* Line of scrimmage */}
            <line
              x1="0"
              y1="75"
              x2="100"
              y2="75"
              stroke="#FFD93D"
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />

            {/* Draw triangles */}
            {formation.triangleRelationships.map((rel) =>
              renderTriangleLines(rel.type, rel.positions)
            )}

            {/* Draw defensive positions */}
            {Object.keys(POSITION_COORDINATES).map((pos) => {
              const position = pos as DefensePosition;
              const isActive = formation.triangleRelationships.some((rel) =>
                rel.positions.includes(position)
              );
              return renderDefensePosition(position, isActive);
            })}

            {/* Formation indicator */}
            <g>
              <text
                x="50"
                y="90"
                fontSize="8"
                fontWeight="bold"
                fill="currentColor"
                textAnchor="middle"
              >
                {formation.classification} Formation
              </text>
              <text
                x="50"
                y="96"
                fontSize="5"
                fill="currentColor"
                opacity="0.7"
                textAnchor="middle"
              >
                MO {formation.moDirection.toUpperCase()} • {formation.gender.toUpperCase()}
              </text>
            </g>
          </svg>
        </div>

        {/* Triangle Relationships */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-amt-accent" />
            Active Triangles
          </h4>
          <div className="grid gap-2">
            {formation.triangleRelationships.map((rel) => (
              <div
                key={rel.type}
                className="p-3 rounded-lg bg-muted/50 border border-border"
                style={{
                  borderLeftColor: TRIANGLE_COLORS[rel.type],
                  borderLeftWidth: '3px',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rel.type} Triangle</p>
                    <p className="text-xs text-muted-foreground">
                      {rel.positions.join(' → ')} | {rel.coverage}
                    </p>
                  </div>
                  {rel.success && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-semibold text-green-500">
                        {rel.success.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formation Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: formation.color }}>
              {formation.playCount}
            </p>
            <p className="text-xs text-muted-foreground">Total Plays</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{formation.successRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amt-accent">{formation.avgYardsGained}</p>
            <p className="text-xs text-muted-foreground">Avg Yards</p>
          </div>
        </div>

        {/* Common Defenses */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recommended Coverages</h4>
          <div className="flex flex-wrap gap-2">
            {formation.commonDefenses.map((defense) => (
              <Badge key={defense} variant="outline" className="text-xs">
                {defense}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
