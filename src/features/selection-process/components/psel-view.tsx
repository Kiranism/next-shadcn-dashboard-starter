'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessesTab } from './processes-tab';
import { ApplicationsTab } from './applications-tab';
import { CandidatesTab } from './candidates-tab';

export function PselView() {
  return (
    <Tabs defaultValue='processes' className='space-y-4'>
      <div className='overflow-x-auto'>
        <TabsList className='h-auto flex-wrap gap-1 p-1'>
          <TabsTrigger value='processes'>Processos</TabsTrigger>
          <TabsTrigger value='applications'>Candidaturas</TabsTrigger>
          <TabsTrigger value='candidates'>Candidatos</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value='processes'>
        <ProcessesTab />
      </TabsContent>

      <TabsContent value='applications'>
        <ApplicationsTab />
      </TabsContent>

      <TabsContent value='candidates'>
        <CandidatesTab />
      </TabsContent>
    </Tabs>
  );
}
