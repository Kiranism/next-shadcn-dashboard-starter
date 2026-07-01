'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { ROLE_LABEL, SECTOR_LABEL } from '@/constants/user-options';
import type { RoutineDay, RoutineSummary } from '@/repositories';
import { cn } from '@/lib/utils';
import {
  DAYS,
  DAY_LABELS,
  DAY_SHORT,
  HOURS,
  AVAILABILITY_BUCKETS,
  availabilityBucket,
  countAvailable,
  slotKey,
  slotLabel,
  type SlotKey,
  type TeamMember
} from '../lib/availability';

interface SelectedSlot {
  day: RoutineDay;
  hour: number;
}

interface TeamAvailabilityHeatmapProps {
  summary: RoutineSummary | undefined;
  members: TeamMember[];
  isLoading: boolean;
}

interface BestSlot {
  day: RoutineDay;
  hour: number;
  count: number;
}

export function TeamAvailabilityHeatmap({
  summary,
  members,
  isLoading
}: TeamAvailabilityHeatmapProps) {
  const [selected, setSelected] = useState<SelectedSlot | null>(null);

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  // Members available at the slot the user clicked (within the active filters).
  const selectedMembers = useMemo(() => {
    if (!selected) return [];
    const key = slotKey(selected.day, selected.hour);
    return members.filter((m) => m.slots.has(key));
  }, [selected, members]);

  const withSchedule = useMemo(() => members.filter((m) => m.slots.size > 0), [members]);

  const withoutSchedule = useMemo(() => members.filter((m) => m.slots.size === 0), [members]);

  const total = withSchedule.length;

  // Per-slot counts + best slots in one pass.
  const { counts, best } = useMemo(() => {
    const counts = new Map<SlotKey, number>();
    let max = 0;
    for (const day of DAYS) {
      for (const hour of HOURS) {
        const c = countAvailable(summary, day, hour, memberIds);
        counts.set(`${day}-${hour}`, c);
        if (c > max) max = c;
      }
    }
    const best: BestSlot[] = [];
    if (max > 0) {
      for (const day of DAYS) {
        for (const hour of HOURS) {
          if (counts.get(`${day}-${hour}`) === max) best.push({ day, hour, count: max });
        }
      }
    }
    return { counts, best: best.slice(0, 6) };
  }, [summary, memberIds]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Disponibilidade da Equipe</CardTitle>
          <CardDescription>Carregando disponibilidade…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-72 w-full' />
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Disponibilidade da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title='Nenhum membro encontrado'
            description='Ajuste os filtros para visualizar a disponibilidade do time.'
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Disponibilidade da Equipe</CardTitle>
        <CardDescription>
          {total} {total === 1 ? 'membro' : 'membros'} com horário configurado
          {members.length !== total && ` · ${members.length} no total`}
        </CardDescription>

        {/* Legend */}
        <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5'>
          {AVAILABILITY_BUCKETS.map((b) => (
            <div key={b.key} className='flex items-center gap-1.5'>
              <span className={cn('size-3 rounded-sm', b.swatch)} />
              <span className='text-muted-foreground text-xs'>{b.label}</span>
            </div>
          ))}
          {total > 0 && (
            <span className='text-muted-foreground/70 ml-auto hidden text-xs sm:inline'>
              Clique em um horário para ver os membros
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {total === 0 ? (
          <EmptyState
            title='Nenhum horário configurado'
            description='Os membros selecionados ainda não configuraram a rotina semanal.'
          />
        ) : (
          <HeatmapGrid counts={counts} total={total} onSelectSlot={setSelected} />
        )}

        {withoutSchedule.length > 0 && <NoScheduleAlert members={withoutSchedule} />}

        {best.length > 0 && (
          <div className='rounded-lg border bg-muted/30 px-4 py-3'>
            <p className='text-sm font-medium'>
              Melhores horários{' '}
              <span className='text-muted-foreground font-normal'>
                ({best[0].count}/{total} membros)
              </span>
            </p>
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {best.map((s) => (
                <Badge
                  key={`${s.day}-${s.hour}`}
                  variant='outline'
                  className='font-normal tabular-nums'
                >
                  {DAY_SHORT[s.day]} {slotLabel(s.hour)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <SlotMembersDialog
        slot={selected}
        members={selectedMembers}
        total={total}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}

// ─── Slot members dialog ─────────────────────────────────────────────────────

function SlotMembersDialog({
  slot,
  members,
  total,
  onClose
}: {
  slot: SelectedSlot | null;
  members: TeamMember[];
  total: number;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-md'>
        {slot && (
          <>
            <DialogHeader>
              <DialogTitle className='capitalize'>
                {DAY_LABELS[slot.day]} · {slotLabel(slot.hour)}
              </DialogTitle>
              <DialogDescription>
                {members.length} de {total}{' '}
                {total === 1 ? 'membro disponível' : 'membros disponíveis'}
              </DialogDescription>
            </DialogHeader>

            <div className='-mr-2 max-h-[60vh] space-y-1.5 overflow-y-auto pr-2'>
              {members.map((m) => (
                <div
                  key={m.id}
                  className='hover:bg-muted/50 flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors'
                >
                  <MemberAvatar name={m.name} />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{m.name}</p>
                    {m.sector && (
                      <p className='text-muted-foreground truncate text-xs'>
                        {SECTOR_LABEL[m.sector] ?? m.sector}
                      </p>
                    )}
                  </div>
                  <Badge variant='secondary' className='shrink-0 font-normal'>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
    >
      {memberInitials(name)}
    </span>
  );
}

// ─── Heatmap grid ────────────────────────────────────────────────────────────

function HeatmapGrid({
  counts,
  total,
  onSelectSlot
}: {
  counts: Map<SlotKey, number>;
  total: number;
  onSelectSlot: (slot: SelectedSlot) => void;
}) {
  return (
    <div className='-mx-1 overflow-x-auto px-1'>
      <div style={{ minWidth: 720 }}>
        {/* Hour header */}
        <div className='mb-1 flex'>
          <div className='w-16 shrink-0 sm:w-20' />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className='text-muted-foreground flex-1 text-center text-[10px] tabular-nums sm:text-[11px]'
            >
              {slotLabel(hour)}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {DAYS.map((day) => (
          <div key={day} className='mb-1 flex items-center gap-px'>
            <div className='w-16 shrink-0 pr-2 text-xs font-medium sm:w-20 sm:text-sm'>
              <span className='hidden sm:inline'>{DAY_LABELS[day]}</span>
              <span className='sm:hidden'>{DAY_SHORT[day]}</span>
            </div>
            <div className='flex flex-1 gap-px'>
              {HOURS.map((hour) => {
                const count = counts.get(`${day}-${hour}`) ?? 0;
                const bucket = availabilityBucket(count, total);
                const label = `${DAY_LABELS[day]} ${slotLabel(hour)} — ${count} de ${total} disponíveis`;
                const baseClass =
                  'flex h-8 flex-1 items-center justify-center rounded border text-[11px] font-medium tabular-nums sm:h-9';

                if (count === 0) {
                  return <div key={hour} title={label} className={cn(baseClass, bucket.cell)} />;
                }

                return (
                  <button
                    key={hour}
                    type='button'
                    title={label}
                    aria-label={`Ver membros disponíveis — ${label}`}
                    onClick={() => onSelectSlot({ day, hour })}
                    className={cn(
                      baseClass,
                      bucket.cell,
                      'focus-visible:ring-ring cursor-pointer transition-transform hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none active:scale-95'
                    )}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── No-schedule alert ───────────────────────────────────────────────────────

function NoScheduleAlert({ members }: { members: TeamMember[] }) {
  return (
    <div className='rounded-lg border border-amber-600/40 bg-amber-950/30 px-4 py-3'>
      <p className='flex items-center gap-1.5 text-sm font-medium text-amber-500'>
        <Icons.warning className='size-4 shrink-0' />
        Sem horário configurado ({members.length})
      </p>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {members.map((m) => (
          <Badge
            key={m.id}
            variant='outline'
            className='border-amber-700/40 font-normal text-amber-200/90'
          >
            {m.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ─── Shared empty state ──────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center'>
      <Icons.teams className='mb-2 size-8 opacity-40' />
      <p className='text-sm font-medium'>{title}</p>
      <p className='mt-0.5 text-xs'>{description}</p>
    </div>
  );
}
