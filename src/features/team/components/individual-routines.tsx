'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { SECTOR_LABEL, ROLE_LABEL } from '@/constants/user-options';
import { cn } from '@/lib/utils';
import {
  DAYS,
  DAY_LABELS,
  DAY_SHORT,
  HOURS,
  slotLabel,
  slotKey,
  type SlotKey,
  type TeamMember
} from '../lib/availability';

interface IndividualRoutinesProps {
  members: TeamMember[];
  isLoading: boolean;
}

export function IndividualRoutines({ members, isLoading }: IndividualRoutinesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Rotina Individual</CardTitle>
          <CardDescription>Disponibilidade semanal de cada membro</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Rotina Individual</CardTitle>
        <CardDescription>Disponibilidade semanal de cada membro</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center'>
            <Icons.user className='mb-2 size-8 opacity-40' />
            <p className='text-sm font-medium'>Nenhum membro encontrado</p>
            <p className='mt-0.5 text-xs'>Ajuste os filtros para ver as rotinas individuais.</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {members.map((member) => (
              <MemberRoutineCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Member card ─────────────────────────────────────────────────────────────

function MemberRoutineCard({ member }: { member: TeamMember }) {
  const slots = member.slots;
  const totalHours = slots.size;
  const hasSchedule = totalHours > 0;

  return (
    <Collapsible>
      <div className='overflow-hidden rounded-lg border'>
        <CollapsibleTrigger asChild>
          <button
            disabled={!hasSchedule}
            className='hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-3 text-left transition-colors disabled:cursor-default disabled:hover:bg-transparent'
          >
            <Avatar name={member.name} />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{member.name}</p>
              <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
                <Badge variant='secondary' className='px-1.5 py-0 text-[11px] font-normal'>
                  {ROLE_LABEL[member.role] ?? member.role}
                </Badge>
                {member.sector && (
                  <span className='text-muted-foreground text-[11px]'>
                    {SECTOR_LABEL[member.sector] ?? member.sector}
                  </span>
                )}
              </div>
            </div>

            <Badge
              variant='outline'
              className={cn(
                'shrink-0 tabular-nums',
                hasSchedule
                  ? 'border-emerald-700/50 bg-emerald-900/30 text-emerald-400'
                  : 'text-muted-foreground'
              )}
            >
              {totalHours}h/sem
            </Badge>

            {hasSchedule && (
              <Icons.chevronDown className='text-muted-foreground size-4 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180' />
            )}
          </button>
        </CollapsibleTrigger>

        {hasSchedule && (
          <CollapsibleContent>
            <div className='border-t px-4 py-3'>
              <ReadOnlyRoutineGrid slots={slots} />
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

// ─── Read-only routine grid ──────────────────────────────────────────────────

function ReadOnlyRoutineGrid({ slots }: { slots: Set<SlotKey> }) {
  return (
    <div className='-mx-1 overflow-x-auto px-1'>
      <div style={{ minWidth: 640 }}>
        {/* Hour header */}
        <div className='mb-1 flex'>
          <div className='w-12 shrink-0 sm:w-16' />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className='text-muted-foreground flex-1 text-center text-[10px] tabular-nums'
            >
              {slotLabel(hour)}
            </div>
          ))}
        </div>

        {DAYS.map((day) => (
          <div key={day} className='mb-1 flex items-center gap-px'>
            <div className='text-muted-foreground w-12 shrink-0 pr-2 text-xs font-medium sm:w-16'>
              {DAY_SHORT[day]}
            </div>
            <div className='flex flex-1 gap-px'>
              {HOURS.map((hour) => {
                const active = slots.has(slotKey(day, hour));
                return (
                  <div
                    key={hour}
                    title={`${DAY_LABELS[day]} ${slotLabel(hour)} — ${active ? 'disponível' : 'indisponível'}`}
                    className={cn(
                      'h-6 flex-1 rounded-sm border sm:h-7',
                      active
                        ? 'border-emerald-600/50 bg-emerald-700'
                        : 'border-border/50 bg-muted/30'
                    )}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
    >
      {initials(name)}
    </span>
  );
}
