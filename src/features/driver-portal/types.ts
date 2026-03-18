/**
 * Driver portal types — shift and shift_events.
 *
 * Used by driver-portal (shift tracker at /driver/shift).
 * DB schema alignment: event_type and status stored as strings;
 * we standardize allowed values in code.
 */

import type { Database } from '@/types/database.types';

/** Standardized shift_events.event_type values. Use these when writing to shift_events. */
export const SHIFT_EVENT_TYPES = {
  SHIFT_START: 'shift_start',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
  SHIFT_END: 'shift_end'
} as const;

export type ShiftEventType =
  (typeof SHIFT_EVENT_TYPES)[keyof typeof SHIFT_EVENT_TYPES];

/** Standardized shifts.status values. Use these when writing to shifts. */
export const SHIFT_STATUSES = {
  ACTIVE: 'active',
  ON_BREAK: 'on_break',
  ENDED: 'ended'
} as const;

export type ShiftStatus = (typeof SHIFT_STATUSES)[keyof typeof SHIFT_STATUSES];

/** Break reason stored in shift_events.metadata. For break_start events. */
export const BREAK_REASONS = {
  MITTAGSPAUSE: 'Mittagspause',
  KURZPAUSE: 'Kurzpause',
  TANKEN: 'Tanken',
  SONSTIGE: 'Sonstige'
} as const;

export type BreakReason = (typeof BREAK_REASONS)[keyof typeof BREAK_REASONS];

/** Shift row from DB. */
export type Shift = Database['public']['Tables']['shifts']['Row'];

/** Shift event row from DB. */
export type ShiftEvent = Database['public']['Tables']['shift_events']['Row'];
