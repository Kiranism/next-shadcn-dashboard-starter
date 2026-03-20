'use client';

/**
 * DriverTripCard — shared trip card for Startseite and Touren pages.
 *
 * Status-driven actions:
 *   assigned / scheduled → "Tour starten" + "Stornieren"
 *   in_progress          → "Tour beenden" + "Stornieren"
 *   completed / cancelled → read-only
 *
 * Colors: uses tripStatusBadge / tripStatusRow from @/lib/trip-status per color-system.md
 * Shift link: startTrip() writes shift_id to the trip row when an active shift exists.
 * Cancel: appends timestamped reason to notes field + sets status → cancelled.
 * Complete: sets status → completed.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  cancelTrip,
  completeTrip,
  startTrip
} from '@/features/driver-portal/api/driver-trips.service';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import {
  TRIP_STATUSES,
  type DriverTrip
} from '@/features/driver-portal/types/trips.types';
import {
  tripStatusBadge,
  tripStatusLabels,
  tripStatusRow,
  type TripStatus
} from '@/lib/trip-status';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  IconAccessible,
  IconArrowDown,
  IconCheck,
  IconMapPin,
  IconPlayerPlay,
  IconX
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function resolveActiveShiftId(driverId: string): Promise<string | null> {
  try {
    const shift = await shiftsService.getActiveShift(driverId);
    return shift?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DriverTripCardProps {
  trip: DriverTrip;
  onStatusChange?: (tripId: string, newStatus: string) => void;
  showNotes?: boolean;
  /**
   * Whether the driver has an active shift.
   * When false, "Tour starten" is disabled — a trip cannot be started
   * without a running shift because the trip needs a shift_id to link to.
   * Defaults to true to stay non-breaking for usages without shift context.
   */
  shiftActive?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DriverTripCard({
  trip,
  onStatusChange,
  showNotes = false,
  shiftActive = true
}: DriverTripCardProps) {
  const [currentStatus, setCurrentStatus] = useState(trip.status);
  const [currentNotes, setCurrentNotes] = useState(
    trip.note ?? trip.notes ?? null
  );

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canStart =
    currentStatus === TRIP_STATUSES.SCHEDULED || currentStatus === 'assigned';
  const canComplete = currentStatus === TRIP_STATUSES.IN_PROGRESS;
  const canCancel =
    currentStatus === TRIP_STATUSES.SCHEDULED ||
    currentStatus === 'assigned' ||
    currentStatus === TRIP_STATUSES.IN_PROGRESS;

  const tripStatusTyped = currentStatus as TripStatus;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleConfirmStart = async () => {
    setIsSubmitting(true);
    setCurrentStatus(TRIP_STATUSES.IN_PROGRESS);
    setStartDialogOpen(false);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const shiftId = user ? await resolveActiveShiftId(user.id) : null;
      await startTrip(trip.id, shiftId);
      toast.success('Tour gestartet.');
      onStatusChange?.(trip.id, TRIP_STATUSES.IN_PROGRESS);
    } catch {
      setCurrentStatus(trip.status);
      toast.error('Fehler beim Starten der Tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmComplete = async () => {
    setIsSubmitting(true);
    const prevStatus = currentStatus;
    setCurrentStatus('completed');
    setCompleteDialogOpen(false);
    try {
      await completeTrip(trip.id);
      toast.success('Tour abgeschlossen.');
      onStatusChange?.(trip.id, 'completed');
    } catch {
      setCurrentStatus(prevStatus);
      toast.error('Fehler beim Abschließen der Tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Bitte einen Stornierungsgrund angeben.');
      return;
    }
    setIsSubmitting(true);
    const prevStatus = currentStatus;
    setCurrentStatus(TRIP_STATUSES.CANCELLED);
    setCancelDialogOpen(false);
    try {
      await cancelTrip(trip.id, cancelReason.trim(), currentNotes);
      const ts = new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentNotes(
        (prev) =>
          `${prev ? prev + '\n' : ''}[Storniert ${ts}]: ${cancelReason.trim()}`
      );
      setCancelReason('');
      toast.success('Tour storniert.');
      onStatusChange?.(trip.id, TRIP_STATUSES.CANCELLED);
    } catch {
      setCurrentStatus(prevStatus);
      toast.error('Fehler beim Stornieren der Tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* ── Trip card ─────────────────────────────────────────────────────── */}
      <article
        className={cn(
          'bg-card relative flex overflow-hidden rounded-xl border-l-4 shadow-sm transition-shadow hover:shadow-md',
          tripStatusRow({ status: tripStatusTyped })
        )}
      >
        <div className='flex flex-1 flex-col gap-3 p-4'>
          {/* Time + passenger name + status badge */}
          <div className='flex items-start justify-between gap-2'>
            {/* Left: time · wheelchair icon · greeting + name */}
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <div className='flex items-center gap-2'>
                <span className='text-foreground shrink-0 font-mono text-lg font-bold tabular-nums'>
                  {formatTime(trip.scheduled_at)}
                </span>
                {trip.is_wheelchair && (
                  <IconAccessible
                    className='text-muted-foreground h-4 w-4 shrink-0'
                    aria-label='Rollstuhlfahrer'
                  />
                )}
                {trip.client_name && (
                  <span
                    className='text-foreground min-w-0 leading-tight font-medium'
                    style={{
                      fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {[trip.greeting_style, trip.client_name]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant='outline'
              className={cn(
                'shrink-0 text-xs font-medium',
                tripStatusBadge({ status: tripStatusTyped })
              )}
            >
              {tripStatusLabels[tripStatusTyped] ?? currentStatus}
            </Badge>
          </div>

          {/* Route */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-start gap-2'>
              <IconMapPin className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
              <div className='flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5'>
                <span className='text-muted-foreground line-clamp-2 text-xs leading-snug'>
                  {trip.pickup_address ?? '—'}
                </span>
                {trip.pickup_station && (
                  <span className='bg-muted text-muted-foreground shrink-0 rounded px-1 py-0 text-[10px] leading-4 font-medium'>
                    {trip.pickup_station}
                  </span>
                )}
              </div>
            </div>
            <div className='pl-1'>
              <IconArrowDown className='text-muted-foreground h-3 w-3' />
            </div>
            <div className='flex items-start gap-2'>
              <IconMapPin className='text-primary mt-0.5 h-3.5 w-3.5 shrink-0' />
              <div className='flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5'>
                <span className='text-muted-foreground line-clamp-2 text-xs leading-snug'>
                  {trip.dropoff_address ?? '—'}
                </span>
                {trip.dropoff_station && (
                  <span className='bg-muted text-muted-foreground shrink-0 rounded px-1 py-0 text-[10px] leading-4 font-medium'>
                    {trip.dropoff_station}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {(showNotes || currentStatus === TRIP_STATUSES.CANCELLED) &&
            currentNotes && (
              <p className='text-muted-foreground border-border border-t pt-2 text-xs italic'>
                {currentNotes}
              </p>
            )}

          {/* Actions */}
          {(canStart || canComplete || canCancel) && (
            <div className='flex gap-2 pt-1'>
              {canStart && (
                <div
                  className='flex-1'
                  title={
                    !shiftActive ? 'Bitte zuerst Schicht starten' : undefined
                  }
                >
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={() => setStartDialogOpen(true)}
                    disabled={isSubmitting || !shiftActive}
                  >
                    <IconPlayerPlay className='mr-2 h-4 w-4' />
                    {shiftActive ? 'Tour starten' : 'Schicht starten ↑'}
                  </Button>
                </div>
              )}
              {canComplete && (
                <Button
                  size='sm'
                  className='flex-1 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                  onClick={() => setCompleteDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  <IconCheck className='mr-2 h-4 w-4' />
                  Tour beenden
                </Button>
              )}
              {canCancel && (
                <Button
                  size='sm'
                  variant='outline'
                  className='text-destructive hover:text-destructive border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30'
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  <IconX className='mr-1 h-4 w-4' />
                  Stornieren
                </Button>
              )}
            </div>
          )}
        </div>
      </article>

      {/* ── Tour starten dialog ────────────────────────────────────────────── */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tour starten?</DialogTitle>
            <DialogDescription>
              {trip.client_name
                ? `Fahrt für ${trip.client_name} wird als „Unterwegs" markiert und mit deiner aktuellen Schicht verknüpft.`
                : 'Diese Fahrt wird als „Unterwegs" markiert und mit deiner aktuellen Schicht verknüpft.'}
            </DialogDescription>
          </DialogHeader>
          <div className='bg-muted/40 mt-1 rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>
              Route
            </p>
            <p className='text-foreground mt-1 text-sm'>
              {trip.pickup_address ?? '—'}
            </p>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              → {trip.dropoff_address ?? '—'}
            </p>
          </div>
          <DialogFooter className='mt-2 flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setStartDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => void handleConfirmStart()}
              disabled={isSubmitting}
            >
              <IconPlayerPlay className='mr-2 h-4 w-4' />
              {isSubmitting ? 'Wird gestartet…' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tour beenden dialog ────────────────────────────────────────────── */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tour abschließen?</DialogTitle>
            <DialogDescription>
              {trip.client_name
                ? `Fahrt für ${trip.client_name} wird als „Erledigt" markiert.`
                : 'Diese Fahrt wird als „Erledigt" markiert.'}
            </DialogDescription>
          </DialogHeader>
          <div className='bg-muted/40 mt-1 rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>
              Route
            </p>
            <p className='text-foreground mt-1 text-sm'>
              {trip.pickup_address ?? '—'}
            </p>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              → {trip.dropoff_address ?? '—'}
            </p>
          </div>
          <DialogFooter className='mt-2 flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setCompleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              className='bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
              onClick={() => void handleConfirmComplete()}
              disabled={isSubmitting}
            >
              <IconCheck className='mr-2 h-4 w-4' />
              {isSubmitting ? 'Wird abgeschlossen…' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tour stornieren dialog ─────────────────────────────────────────── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tour stornieren</DialogTitle>
            <DialogDescription>
              Bitte gib einen Grund an. Dieser wird automatisch zu den Notizen
              der Fahrt hinzugefügt und ist für den Disponenten sichtbar.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-2'>
            <Label htmlFor={`cancel-reason-${trip.id}`}>
              Stornierungsgrund
            </Label>
            <Textarea
              id={`cancel-reason-${trip.id}`}
              placeholder='z.B. Fahrgast nicht erreichbar, Fahrzeugproblem…'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className='resize-none'
              autoFocus
            />
          </div>
          <DialogFooter className='mt-2 flex gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
              disabled={isSubmitting}
            >
              Zurück
            </Button>
            <Button
              variant='destructive'
              onClick={() => void handleConfirmCancel()}
              disabled={isSubmitting || !cancelReason.trim()}
            >
              <IconX className='mr-2 h-4 w-4' />
              {isSubmitting ? 'Wird storniert…' : 'Tour stornieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
