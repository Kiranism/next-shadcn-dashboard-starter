'use client';

import { useMemo } from 'react';
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { RoutineRepository } from '@/repositories';
import { toUserMessage } from '@/lib/api-client';
import { buildTeamMembers } from '../lib/availability';
import { TeamFilters, type TeamFilterValues } from './team-filters';
import { TeamAvailabilityHeatmap } from './team-availability-heatmap';
import { IndividualRoutines } from './individual-routines';
import { TeamActivities } from './team-activities';

const TABS = ['disponibilidade', 'rotinas', 'atividades'] as const;
type TabValue = (typeof TABS)[number];

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function TeamView() {
  const { data: summary, isLoading, error } = RoutineRepository.useRoutineSummary();

  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
  const [sector, setSector] = useQueryState('sector', parseAsString.withDefault('all'));
  const [role, setRole] = useQueryState('role', parseAsString.withDefault('all'));
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TABS).withDefault('disponibilidade')
  );

  // The summary is the single source of truth for the subordinate set.
  const members = useMemo(() => buildTeamMembers(summary), [summary]);

  // Distinct sectors / roles among subordinates power the filter dropdowns.
  const sectors = useMemo(
    () => [...new Set(members.map((m) => m.sector).filter((s): s is string => !!s))].toSorted(),
    [members]
  );
  const roles = useMemo(() => [...new Set(members.map((m) => m.role))], [members]);

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    return members.filter((m) => {
      if (sector !== 'all' && m.sector !== sector) return false;
      if (role !== 'all' && m.role !== role) return false;
      if (needle && !normalize(m.name).includes(needle)) return false;
      return true;
    });
  }, [members, q, sector, role]);

  const values: TeamFilterValues = { q, sector, role };
  function handleFilterChange(patch: Partial<TeamFilterValues>) {
    if (patch.q !== undefined) void setQ(patch.q || null);
    if (patch.sector !== undefined) void setSector(patch.sector === 'all' ? null : patch.sector);
    if (patch.role !== undefined) void setRole(patch.role === 'all' ? null : patch.role);
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <Icons.alertCircle className='size-4' />
        <AlertTitle>Não foi possível carregar o time</AlertTitle>
        <AlertDescription>{toUserMessage(error as Error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      <TeamFilters
        values={values}
        onChange={handleFilterChange}
        sectors={sectors}
        roles={roles}
        resultCount={filtered.length}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className='gap-4'>
        <TabsList className='mx-auto flex'>
          <TabsTrigger value='disponibilidade'>Disponibilidade</TabsTrigger>
          <TabsTrigger value='rotinas'>Rotinas</TabsTrigger>
          <TabsTrigger value='atividades'>Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value='disponibilidade'>
          <TeamAvailabilityHeatmap summary={summary} members={filtered} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value='rotinas'>
          <IndividualRoutines members={filtered} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value='atividades'>
          <TeamActivities members={filtered} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
