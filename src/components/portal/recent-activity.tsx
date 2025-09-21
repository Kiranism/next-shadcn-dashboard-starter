'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain, Play, Search, FileText, Users } from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      user: {
        name: 'Denauld Brown',
        avatar: 'DB',
      },
      action: 'analyzed formation',
      target: 'Larry - MO Left + Male',
      module: 'M.E.L. AI',
      icon: Brain,
      time: '5 minutes ago',
      color: 'text-amt-accent',
    },
    {
      id: 2,
      user: {
        name: 'M.E.L.',
        avatar: 'AI',
      },
      action: 'generated report',
      target: 'Triangle Defense Analysis - Week 12',
      module: 'M.E.L. AI',
      icon: FileText,
      time: '12 minutes ago',
      color: 'text-amt-accent',
    },
    {
      id: 3,
      user: {
        name: 'Courtney Sellars',
        avatar: 'CS',
      },
      action: 'created playbook',
      target: '3rd Down Package - Rita Formation',
      module: 'Power Playbooks',
      icon: Play,
      time: '1 hour ago',
      color: 'text-amt-red',
    },
    {
      id: 4,
      user: {
        name: 'Alexandra Martinez',
        avatar: 'AM',
      },
      action: 'reviewed scouting report',
      target: 'Opponent Analysis - Conference Game',
      module: 'Pro Scout',
      icon: Search,
      time: '2 hours ago',
      color: 'text-indigo-500',
    },
    {
      id: 5,
      user: {
        name: 'Denauld Brown',
        avatar: 'DB',
      },
      action: 'updated team roster',
      target: 'Added 3 new prospects',
      module: 'Recruit',
      icon: Users,
      time: '3 hours ago',
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <Card key={activity.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-amt-accent text-amt-black font-bold">
                    {activity.user.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activity.user.name}</span>
                    <span className="text-muted-foreground">{activity.action}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.target}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">{activity.module}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
