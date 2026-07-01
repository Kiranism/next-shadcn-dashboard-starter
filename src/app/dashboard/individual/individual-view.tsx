'use client';

import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActivitiesSection } from '@/features/activities/components/activities-section';
import { ActivityFormCard } from '@/features/activities/components/activity-form-card';
import { ActivityCalendarCard } from '@/features/activities/components/activity-calendar-card';
import { RoutineCard } from '@/features/routine/components/routine-card';

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TABS = ['atividade', 'calendario', 'rotina'] as const;
type TabValue = (typeof TABS)[number];

export function IndividualView() {
  const isMobile = useIsMobile();

  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsString.withDefault(todayISODate())
  );
  const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(TABS).withDefault('atividade'));

  // Mobile: centered tab menu so each card gets the full small screen.
  if (isMobile) {
    return (
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className='gap-6'>
        <TabsList className='mx-auto flex'>
          <TabsTrigger value='atividade'>Nova Atividade</TabsTrigger>
          <TabsTrigger value='calendario'>Calendário</TabsTrigger>
          <TabsTrigger value='rotina'>Rotina</TabsTrigger>
        </TabsList>

        <TabsContent value='atividade'>
          <ActivityFormCard selectedDate={selectedDate} />
        </TabsContent>
        <TabsContent value='calendario'>
          <ActivityCalendarCard selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </TabsContent>
        <TabsContent value='rotina'>
          <RoutineCard />
        </TabsContent>
      </Tabs>
    );
  }

  // Desktop / large screens: everything stacked, navigate by scrolling.
  return (
    <div className='space-y-6'>
      <ActivitiesSection />
      <RoutineCard />
    </div>
  );
}
