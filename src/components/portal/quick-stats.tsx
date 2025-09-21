'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Target, TrendingUp } from 'lucide-react';

export function QuickStats() {
  const stats = [
    {
      title: 'Active Modules',
      value: '2',
      description: 'Power Playbooks, M.E.L. AI',
      icon: Activity,
      change: '+2 this quarter',
      changeType: 'positive' as const,
    },
    {
      title: 'Team Members',
      value: '25',
      description: 'Championship professionals',
      icon: Users,
      change: 'All tiers active',
      changeType: 'neutral' as const,
    },
    {
      title: 'Triangle Defense',
      value: '847',
      description: 'Formations analyzed',
      icon: Target,
      change: '+127 this week',
      changeType: 'positive' as const,
    },
    {
      title: 'M.E.L. Insights',
      value: '2.3K',
      description: 'AI coaching recommendations',
      icon: TrendingUp,
      change: '+340 this month',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'positive' 
                  ? 'text-green-500' 
                  : 'text-muted-foreground'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
