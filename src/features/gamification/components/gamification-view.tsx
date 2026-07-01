'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { RankingTab } from './ranking-tab';
import { TasksTab } from './tasks-tab';
import { MySubmissionsTab } from './my-submissions-tab';
import { PendingSubmissionsTab } from './pending-submissions-tab';
import { CyclesTab } from './cycles-tab';
import { HousesTab } from './houses-tab';

export function GamificationView() {
  const { rank } = useUserProfile();
  const isAdmin = rank >= 3;

  return (
    <Tabs defaultValue='ranking' className='space-y-4'>
      <div className='overflow-x-auto'>
        <TabsList className='h-auto flex-wrap gap-1 p-1'>
          <TabsTrigger value='ranking'>Ranking</TabsTrigger>
          <TabsTrigger value='tasks'>Tarefas</TabsTrigger>
          <TabsTrigger value='my-submissions'>Minhas Submissões</TabsTrigger>
          {isAdmin && <TabsTrigger value='pending'>Pendentes</TabsTrigger>}
          {isAdmin && <TabsTrigger value='cycles'>Ciclos</TabsTrigger>}
          {isAdmin && <TabsTrigger value='houses'>Casas</TabsTrigger>}
        </TabsList>
      </div>

      <TabsContent value='ranking'>
        <RankingTab />
      </TabsContent>

      <TabsContent value='tasks'>
        <TasksTab />
      </TabsContent>

      <TabsContent value='my-submissions'>
        <MySubmissionsTab />
      </TabsContent>

      {isAdmin && (
        <TabsContent value='pending'>
          <PendingSubmissionsTab />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value='cycles'>
          <CyclesTab />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value='houses'>
          <HousesTab />
        </TabsContent>
      )}
    </Tabs>
  );
}
