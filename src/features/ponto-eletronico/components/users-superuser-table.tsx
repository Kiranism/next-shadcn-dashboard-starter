'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useSession } from '@/components/providers/session-provider';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import {
  teamWeekQueryOptions,
  usersQueryOptions,
  settingsQueryOptions,
  userSummaryQueryOptions
} from '../api/queries';
import { UserWeeklySummaryPanel } from './user-weekly-summary-panel';
import type { UserResponse } from '../api/types';

const ROLE_LABEL: Record<string, string> = {
  consultor: 'Consultor',
  gerente: 'Gerente',
  diretor: 'Diretor',
  assessor: 'Assessor',
  presidente: 'Presidente'
};

type SortKey = 'name' | 'currentWeek' | 'previousWeek';
type SortDir = 'asc' | 'desc';

function minutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}.${Math.round((m / 60) * 10)}h`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatWeekLabel(weekStart: string, weekEnd: string) {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(weekEnd + 'T00:00:00');
  const startStr = start.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
  const endStr = end.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
  return `${startStr} – ${endStr}`;
}

interface MemberRow {
  user_id: string;
  name: string;
  role: string;
  sector: string | null;
  currentMinutes: number;
  currentMet: boolean;
  previousMinutes: number;
  previousMet: boolean;
}

function ActiveDot({ userId, token }: { userId: string; token: string | null }) {
  const { data: summary } = useQuery({
    ...userSummaryQueryOptions(token, userId),
    refetchInterval: 60_000
  });
  if (summary?.current_session?.status !== 'open') return null;
  return (
    <span className='flex items-center gap-1 text-xs font-medium text-green-500'>
      <span className='size-1.5 animate-pulse rounded-full bg-green-500' />
      Trabalhando
    </span>
  );
}

export function UsersSuperuserTable() {
  const { rank } = useUserProfile();
  const { session } = useSession();
  const token = session?.access_token ?? null;
  const isSuperuser = rank >= 3;

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { data: users = [], isLoading: usersLoading } = useQuery(
    usersQueryOptions(token, isSuperuser)
  );
  const { data: currentWeekData, isLoading: currentLoading } = useQuery(
    teamWeekQueryOptions(token, 0, isSuperuser)
  );
  const { data: previousWeekData, isLoading: previousLoading } = useQuery(
    teamWeekQueryOptions(token, 1, isSuperuser)
  );
  const { data: settings } = useQuery(settingsQueryOptions(token));

  const isLoading = usersLoading || currentLoading || previousLoading;

  const minMinutes = (settings?.min_week_hours ?? 0) * 60;

  const members: MemberRow[] = useMemo(() => {
    if (!users.length) return [];
    const currentMap = new Map((currentWeekData?.members ?? []).map((m) => [m.user_id, m]));
    const previousMap = new Map((previousWeekData?.members ?? []).map((m) => [m.user_id, m]));
    return users.map((u) => {
      const cur = currentMap.get(u.id);
      const prev = previousMap.get(u.id);
      return {
        user_id: u.id,
        name: u.name,
        role: u.role,
        sector: u.sector,
        currentMinutes: cur?.total_minutes ?? 0,
        currentMet: cur?.min_hours_met ?? false,
        previousMinutes: prev?.total_minutes ?? 0,
        previousMet: prev?.min_hours_met ?? false
      };
    });
  }, [users, currentWeekData, previousWeekData]);

  const sectors = useMemo(() => {
    const s = new Set(members.map((m) => m.sector).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [members]);

  const filtered = useMemo(() => {
    let result = members;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.role.toLowerCase().includes(term) ||
          (m.sector?.toLowerCase().includes(term) ?? false)
      );
    }
    if (sectorFilter) {
      result = result.filter((m) => m.sector === sectorFilter);
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'pt-BR');
      else if (sortKey === 'currentWeek') cmp = a.currentMinutes - b.currentMinutes;
      else if (sortKey === 'previousWeek') cmp = a.previousMinutes - b.previousMinutes;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [members, search, sectorFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icons.chevronsDown className='ml-1 size-3 opacity-30' />;
    return sortDir === 'asc' ? (
      <Icons.chevronUp className='ml-1 size-3' />
    ) : (
      <Icons.chevronDown className='ml-1 size-3' />
    );
  }

  const metCount = filtered.filter((m) => m.currentMet).length;

  if (!isSuperuser) return null;

  const currentLabel = currentWeekData
    ? formatWeekLabel(currentWeekData.week_start, currentWeekData.week_end)
    : 'Semana Atual';
  const previousLabel = previousWeekData
    ? formatWeekLabel(previousWeekData.week_start, previousWeekData.week_end)
    : 'Semana Passada';

  return (
    <>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-base font-semibold'>Equipe</CardTitle>
              {!isLoading && (
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {metCount} de {filtered.length} atingiram a meta esta semana
                </p>
              )}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative'>
                <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2' />
                <Input
                  placeholder='Buscar membro...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='h-8 w-48 pl-8 text-sm'
                />
              </div>
              {sectors.length > 0 && (
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className='border-input bg-background text-foreground h-8 rounded-md border px-2 text-sm focus:outline-none'
                >
                  <option value=''>Todos os setores</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {isLoading ? (
            <div className='space-y-3 p-6'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='size-9 rounded-full' />
                  <div className='flex-1 space-y-1.5'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-16' />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className='text-muted-foreground px-6 py-8 text-center text-sm'>
              Nenhum membro encontrado.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className='hidden md:block'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-muted-foreground px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider'>
                        <button
                          className='flex items-center hover:opacity-100'
                          onClick={() => toggleSort('name')}
                        >
                          Membro <SortIcon col='name' />
                        </button>
                      </th>
                      <th className='text-muted-foreground px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider'>
                        <button
                          className='ml-auto flex items-center hover:opacity-100'
                          onClick={() => toggleSort('previousWeek')}
                        >
                          <SortIcon col='previousWeek' />
                          {previousLabel}
                        </button>
                      </th>
                      <th className='text-muted-foreground px-4 py-2.5 pr-6 text-right text-xs font-medium uppercase tracking-wider'>
                        <button
                          className='ml-auto flex items-center hover:opacity-100'
                          onClick={() => toggleSort('currentWeek')}
                        >
                          <SortIcon col='currentWeek' />
                          {currentLabel}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-border divide-y'>
                    {filtered.map((member) => {
                      const curPct =
                        minMinutes > 0
                          ? Math.min(100, Math.round((member.currentMinutes / minMinutes) * 100))
                          : 0;
                      return (
                        <tr
                          key={member.user_id}
                          className='hover:bg-muted/30 cursor-pointer transition-colors'
                          onClick={() => {
                            const u = users.find((u) => u.id === member.user_id);
                            if (u) setSelectedUser(u);
                          }}
                        >
                          <td className='px-6 py-3.5'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                                {getInitials(member.name)}
                              </div>
                              <div className='min-w-0'>
                                <p className='truncate font-medium'>{member.name}</p>
                                <p className='text-muted-foreground truncate text-xs'>
                                  {ROLE_LABEL[member.role] ?? member.role}
                                  {member.sector && <> · {member.sector}</>}
                                </p>
                                <ActiveDot userId={member.user_id} token={token} />
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-3.5 text-right'>
                            <div className='flex items-center justify-end gap-1.5'>
                              {member.previousMet && (
                                <Icons.check className='size-3.5 text-green-500' />
                              )}
                              <span
                                className={`tabular-nums text-sm ${member.previousMet ? 'text-green-500' : 'text-muted-foreground'}`}
                              >
                                {minutesToHours(member.previousMinutes)}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-3.5 pr-6'>
                            <div className='flex flex-col items-end gap-1'>
                              <div className='flex items-center gap-1.5'>
                                {member.currentMet && (
                                  <Icons.check className='size-3.5 text-green-500' />
                                )}
                                <span
                                  className={`tabular-nums text-sm font-medium ${member.currentMet ? 'text-green-500' : ''}`}
                                >
                                  {minutesToHours(member.currentMinutes)}
                                </span>
                              </div>
                              {minMinutes > 0 && (
                                <div className='bg-muted h-1 w-24 overflow-hidden rounded-full'>
                                  <div
                                    className={`h-1 rounded-full transition-all duration-500 ${member.currentMet ? 'bg-green-500' : 'bg-primary/60'}`}
                                    style={{ width: `${curPct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className='divide-border divide-y md:hidden'>
                {filtered.map((member) => {
                  const curPct =
                    minMinutes > 0
                      ? Math.min(100, Math.round((member.currentMinutes / minMinutes) * 100))
                      : 0;
                  return (
                    <button
                      key={member.user_id}
                      className='hover:bg-muted/30 w-full px-4 py-3.5 text-left transition-colors'
                      onClick={() => {
                        const u = users.find((u) => u.id === member.user_id);
                        if (u) setSelectedUser(u);
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                          {getInitials(member.name)}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <p className='truncate font-medium'>{member.name}</p>
                            <div className='flex items-center gap-1 shrink-0'>
                              {member.currentMet && (
                                <Icons.check className='size-3.5 text-green-500' />
                              )}
                              <span
                                className={`tabular-nums text-sm font-medium ${member.currentMet ? 'text-green-500' : ''}`}
                              >
                                {minutesToHours(member.currentMinutes)}
                              </span>
                            </div>
                          </div>
                          <div className='mt-1 flex items-center justify-between gap-2'>
                            <p className='text-muted-foreground text-xs'>
                              {ROLE_LABEL[member.role] ?? member.role}
                              {member.sector && <> · {member.sector}</>}
                            </p>
                            <ActiveDot userId={member.user_id} token={token} />
                            <span className='text-muted-foreground text-xs'>
                              Ant: {minutesToHours(member.previousMinutes)}
                              {member.previousMet && ' ✓'}
                            </span>
                          </div>
                          {minMinutes > 0 && (
                            <div className='bg-muted mt-2 h-1 w-full overflow-hidden rounded-full'>
                              <div
                                className={`h-1 rounded-full transition-all duration-500 ${member.currentMet ? 'bg-green-500' : 'bg-primary/60'}`}
                                style={{ width: `${curPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserWeeklySummaryPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
