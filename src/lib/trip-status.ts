/**
 * trip-status.ts — centralised trip status color and label utilities.
 *
 * Rule (docs/color-system.md): ALL status color logic lives here.
 * Components must never define their own status color classes.
 *
 * Usage:
 *   import { tripStatusBadge, tripStatusRow, tripStatusLabels, type TripStatus }
 *     from '@/lib/trip-status';
 *
 * To add a new status: extend TripStatus, tripStatusBadge, tripStatusRow,
 * and tripStatusLabels — every component that imports these gets the new
 * color automatically.
 */

import { cva } from 'class-variance-authority';

/**
 * All possible trip status values.
 *
 * Kept in sync with the DB `trips.status` column.
 *   assigned   – dispatcher has assigned a driver (admin flow)
 *   scheduled  – trip is planned but not yet active (driver portal flow)
 *   in_progress – driver has tapped "Tour starten"; trip is underway
 *   driving    – alias for in_progress (legacy; kept for backward compat)
 *   completed  – driver has tapped "Tour beenden"
 *   cancelled  – driver or admin has cancelled; reason stored in notes
 *   pending    – created, no driver yet (admin kanban "Offen")
 *   open       – alias for pending (legacy; kept for backward compat)
 */
export type TripStatus =
  | 'completed'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'driving'
  | 'cancelled'
  | 'pending'
  | 'open';

/**
 * Badge / chip classes for status indicators.
 * Used in status badges, detail sheet chips, and row alert pills.
 *
 * Semantic colors (green=done, red=error, amber=warning, blue=info) are
 * intentionally hardcoded — they carry universal meaning across all themes.
 * Dark variants are defined once here so no component needs to repeat them.
 *
 * "pending" and "open" map to muted theme tokens since they are neutral states.
 */
export const tripStatusBadge = cva('border font-medium', {
  variants: {
    status: {
      completed:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
      assigned:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      scheduled:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      in_progress:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      driving:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      cancelled:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
      pending: 'bg-muted text-muted-foreground border-border',
      open: 'bg-muted text-muted-foreground border-border'
    }
  },
  defaultVariants: { status: 'pending' }
});

/**
 * Row-level left-border + background tint for table/list rows.
 * Used in trips table and any list that highlights rows by status.
 */
export const tripStatusRow = cva('', {
  variants: {
    status: {
      completed: 'border-l-green-500 bg-green-50/30 dark:bg-green-950/10',
      assigned: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
      scheduled: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
      in_progress: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
      driving: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
      cancelled: 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10',
      pending: '',
      open: ''
    }
  },
  defaultVariants: { status: 'pending' }
});

export const tripStatusLabels: Record<TripStatus, string> = {
  completed: 'Erledigt',
  assigned: 'Zugewiesen',
  scheduled: 'Geplant',
  in_progress: 'Unterwegs',
  driving: 'Unterwegs',
  cancelled: 'Storniert',
  pending: 'Offen',
  open: 'Offen'
};
