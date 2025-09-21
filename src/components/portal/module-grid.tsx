'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Video, Play, Brain, Target, Search, 
  Users, Dumbbell, Heart, GraduationCap, Briefcase, 
  TrendingUp, ArrowRight, Activity 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AMTModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  status: 'active' | 'beta' | 'coming-soon';
  color: string;
  stats?: {
    label: string;
    value: string;
  };
}

export function ModuleGrid() {
  const modules: AMTModule[] = [
    {
      id: 'executive-suite',
      title: 'Executive Suite',
      description: 'Power BI dashboards and strategic analytics for leadership',
      icon: <BarChart className="h-6 w-6" />,
      route: '/portal/modules/executive-suite',
      status: 'beta',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      stats: { label: 'Reports', value: '47' },
    },
    {
      id: 'dynamic-fabricator',
      title: 'Dynamic Fabricator',
      description: 'Video-to-data conversion with advanced computer vision',
      icon: <Video className="h-6 w-6" />,
      route: '/portal/modules/dynamic-fabricator',
      status: 'coming-soon',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      stats: { label: 'Videos', value: '1.2K' },
    },
    {
      id: 'game-changer',
      title: 'Game Changer',
      description: 'Professional video editing with Triangle Defense overlays',
      icon: <Play className="h-6 w-6" />,
      route: '/portal/modules/game-changer',
      status: 'coming-soon',
      color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      stats: { label: 'Edits', value: '342' },
    },
    {
      id: 'mel',
      title: 'M.E.L. AI',
      description: 'Master coaching intelligence with Claude Sonnet 4',
      icon: <Brain className="h-6 w-6" />,
      route: '/portal/modules/mel',
      status: 'active',
      color: 'bg-amt-accent/10 text-amt-accent border-amt-accent/20',
      stats: { label: 'Insights', value: '2.3K' },
    },
    {
      id: 'q3',
      title: 'Q3 Quarterback',
      description: 'Advanced QB analytics and decision modeling',
      icon: <TrendingUp className="h-6 w-6" />,
      route: '/portal/modules/q3',
      status: 'coming-soon',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      stats: { label: 'Decisions', value: '567' },
    },
    {
      id: 'dynamic-predictor',
      title: 'Dynamic Predictor',
      description: 'A* algorithm game outcome and strategic modeling',
      icon: <Target className="h-6 w-6" />,
      route: '/portal/modules/dynamic-predictor',
      status: 'coming-soon',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      stats: { label: 'Predictions', value: '94%' },
    },
    {
      id: 'power-playbooks',
      title: 'Power Playbooks',
      description: 'Interactive digital playbooks with yard-based animation',
      icon: <Play className="h-6 w-6" />,
      route: '/portal/modules/power-playbooks',
      status: 'active',
      color: 'bg-amt-red/10 text-amt-red border-amt-red/20',
      stats: { label: 'Plays', value: '847' },
    },
    {
      id: 'pro-scout',
      title: 'Pro Scout',
      description: 'Professional scouting and opponent analysis platform',
      icon: <Search className="h-6 w-6" />,
      route: '/portal/modules/pro-scout',
      status: 'coming-soon',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      stats: { label: 'Reports', value: '156' },
    },
    {
      id: 'recruit',
      title: 'Recruit',
      description: 'College recruiting CRM and talent evaluation system',
      icon: <Users className="h-6 w-6" />,
      route: '/portal/modules/recruit',
      status: 'coming-soon',
      color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      stats: { label: 'Prospects', value: '432' },
    },
    {
      id: 'strength',
      title: 'Strength',
      description: 'Performance tracking and injury prevention analytics',
      icon: <Dumbbell className="h-6 w-6" />,
      route: '/portal/modules/strength',
      status: 'coming-soon',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      stats: { label: 'Workouts', value: '2.1K' },
    },
    {
      id: 'medicine',
      title: 'Medicine',
      description: 'Sports medicine and player health monitoring system',
      icon: <Heart className="h-6 w-6" />,
      route: '/portal/modules/medicine',
      status: 'coming-soon',
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      stats: { label: 'Checkups', value: '89' },
    },
    {
      id: 'academics',
      title: 'Academics',
      description: 'Student-athlete academic tracking and eligibility',
      icon: <GraduationCap className="h-6 w-6" />,
      route: '/portal/modules/academics',
      status: 'coming-soon',
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      stats: { label: 'Students', value: '124' },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {modules.map((module) => (
        <Link 
          key={module.id} 
          href={module.status === 'active' ? module.route : '#'}
          className={cn(
            "group relative",
            module.status === 'coming-soon' && "pointer-events-none"
          )}
        >
          <Card className={cn(
            "h-full transition-all duration-300",
            "hover:shadow-lg hover:scale-[1.02]",
            module.status === 'active' && "cursor-pointer border-amt-accent/20",
            module.status === 'coming-soon' && "opacity-60"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  module.color
                )}>
                  {module.icon}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={module.status} />
                  {module.stats && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{module.stats.label}</p>
                      <p className="text-sm font-semibold">{module.stats.value}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <CardTitle className="mt-4 flex items-center justify-between">
                <span>{module.title}</span>
                {module.status === 'active' && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </CardTitle>
              
              <CardDescription className="line-clamp-2">
                {module.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {module.status === 'active' && (
                <div className="flex items-center gap-2 text-sm text-amt-accent">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Online</span>
                </div>
              )}
            </CardContent>

            {module.status === 'active' && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amt-red/0 via-amt-accent/0 to-amt-red/0 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" 
                   style={{ padding: '1px' }}>
                <div className="h-full w-full rounded-lg bg-card" />
              </div>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'beta' | 'coming-soon' }) {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    beta: {
      label: 'Beta',
      className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
    'coming-soon': {
      label: 'Coming Soon',
      className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}
