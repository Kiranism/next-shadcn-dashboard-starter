import type { RoutineDay, RoutineSummary, RoutineSummaryMember } from '@/repositories';
import { getRank } from '@/types/user-profile';

// ─── Week / slot geometry ───────────────────────────────────────────────────

export const DAYS: RoutineDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<RoutineDay, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo'
};

export const DAY_SHORT: Record<RoutineDay, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom'
};

export const SLOT_COUNT = 14;
export const SLOT_START_HOUR = 8;

/** Start hours of every slot: 8, 9, …, 21. */
export const HOURS = Array.from({ length: SLOT_COUNT }, (_, i) => SLOT_START_HOUR + i);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** `"08-09"` style label for the slot starting at `hour`. */
export function slotLabel(hour: number): string {
  return `${pad(hour)}-${pad(hour + 1)}`;
}

// ─── Heatmap colour buckets ─────────────────────────────────────────────────

export interface AvailabilityBucket {
  key: string;
  label: string;
  /** Cell background/border/text for the heatmap. */
  cell: string;
  /** Solid swatch for the legend. */
  swatch: string;
}

// Ordered from most to least available — matches the legend layout.
export const AVAILABILITY_BUCKETS: AvailabilityBucket[] = [
  {
    key: 'top',
    label: '75%+',
    cell: 'border-emerald-500/50 bg-emerald-600 text-emerald-50',
    swatch: 'bg-emerald-600'
  },
  {
    key: 'high',
    label: '50%+',
    cell: 'border-emerald-700/50 bg-emerald-800/70 text-emerald-100',
    swatch: 'bg-emerald-800'
  },
  {
    key: 'mid',
    label: '25%+',
    cell: 'border-amber-700/40 bg-amber-800/50 text-amber-100',
    swatch: 'bg-amber-700'
  },
  {
    key: 'low',
    label: '<25%',
    cell: 'border-red-900/40 bg-red-950/70 text-red-200/90',
    swatch: 'bg-red-950'
  },
  {
    key: 'none',
    label: '0',
    cell: 'border-border/60 bg-muted/30 text-muted-foreground/40',
    swatch: 'bg-muted'
  }
];

/**
 * Maps a count / total ratio to its colour bucket. Returns the `none` bucket
 * when nobody is available.
 */
export function availabilityBucket(count: number, total: number): AvailabilityBucket {
  if (count <= 0 || total <= 0) return AVAILABILITY_BUCKETS[4];
  const ratio = count / total;
  if (ratio >= 0.75) return AVAILABILITY_BUCKETS[0];
  if (ratio >= 0.5) return AVAILABILITY_BUCKETS[1];
  if (ratio >= 0.25) return AVAILABILITY_BUCKETS[2];
  return AVAILABILITY_BUCKETS[3];
}

// ─── Summary → member list ──────────────────────────────────────────────────

export type SlotKey = `${RoutineDay}-${number}`;

export function slotKey(day: RoutineDay, hour: number): SlotKey {
  return `${day}-${hour}`;
}

export interface TeamMember extends RoutineSummaryMember {
  rank: number;
  /** Configured availability slots — empty when the member never set a routine. */
  slots: Set<SlotKey>;
}

/**
 * Builds the full subordinate list straight from the routine summary, which is
 * the API's own source of truth: `availability` carries every member with a
 * configured routine (and lets us reconstruct their weekly slots without an
 * extra request each), while `unconfigured` carries those without one. This
 * avoids re-deriving the subordinate set on the frontend.
 */
export function buildTeamMembers(summary: RoutineSummary | undefined): TeamMember[] {
  const byId = new Map<string, TeamMember>();
  if (!summary) return [];

  for (const day of DAYS) {
    const daySlots = summary.availability?.[day];
    if (!daySlots) continue;
    for (const [hourStr, members] of Object.entries(daySlots)) {
      const key = slotKey(day, Number(hourStr));
      for (const member of members) {
        let entry = byId.get(member.id);
        if (!entry) {
          entry = { ...member, rank: getRank(member.role), slots: new Set<SlotKey>() };
          byId.set(member.id, entry);
        }
        entry.slots.add(key);
      }
    }
  }

  for (const member of summary.unconfigured ?? []) {
    if (!byId.has(member.id)) {
      byId.set(member.id, { ...member, rank: getRank(member.role), slots: new Set<SlotKey>() });
    }
  }

  return [...byId.values()].toSorted(
    (a, b) => b.rank - a.rank || a.name.localeCompare(b.name, 'pt-BR')
  );
}

/** Number of subordinates from `memberIds` available at a given slot. */
export function countAvailable(
  summary: RoutineSummary | undefined,
  day: RoutineDay,
  hour: number,
  memberIds: Set<string>
): number {
  const members = summary?.availability?.[day]?.[String(hour)];
  if (!members) return 0;
  let count = 0;
  for (const member of members) {
    if (memberIds.has(member.id)) count += 1;
  }
  return count;
}
