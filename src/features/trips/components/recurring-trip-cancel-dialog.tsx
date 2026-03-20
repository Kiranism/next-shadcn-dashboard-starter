'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import type { Trip } from '@/features/trips/api/trips.service';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export interface RecurringTripCancelDialogProps {
  trip: Trip | null;
  hasPair: boolean;
  isOpen: boolean;
  isLoading: boolean;
  title?: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onConfirmSingle: (reason: string) => void;
  onConfirmWithPair?: (reason: string) => void;
  onConfirmSeries?: (reason: string) => void;
  singleLabel?: string;
  pairLabel?: string;
  seriesLabel?: string;
}

export function RecurringTripCancelDialog({
  trip,
  hasPair,
  isOpen,
  isLoading,
  title = 'Fahrt stornieren?',
  description = 'Möchten Sie diese Fahrt wirklich stornieren?',
  onOpenChange,
  onConfirmSingle,
  onConfirmWithPair,
  onConfirmSeries,
  singleLabel = 'Nur diese Fahrt stornieren (Aussetzen)',
  pairLabel = 'Diese Fahrt & Rückfahrt stornieren',
  seriesLabel = 'Gesamte Serie beenden'
}: RecurringTripCancelDialogProps) {
  const isRecurring = !!trip?.rule_id;
  const hasMultipleOptions = isRecurring || hasPair;
  const [reason, setReason] = useState('');

  if (!trip) return null;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setReason('');
        }
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {isRecurring && (
              <div className='bg-muted/50 mt-4 rounded-md border border-amber-200/30 p-3 text-amber-600 dark:text-amber-400'>
                <span className='mb-1 flex items-center gap-2 font-bold'>
                  Wiederkehrende Fahrt
                </span>
                Diese Fahrt ist Teil einer Serie. Möchten Sie nur diese Fahrt
                für dieses Datum stornieren, Hin- und Rückfahrt stornieren oder
                die gesamte Serie für alle zukünftigen Fahrten beenden?
              </div>
            )}
            {!isRecurring && hasPair && (
              <div className='bg-muted/50 mt-4 rounded-md border border-blue-200/30 p-3 text-blue-600 dark:text-blue-400'>
                <span className='mb-1 flex items-center gap-2 font-bold'>
                  Verknüpfte Rückfahrt vorhanden
                </span>
                Diese Fahrt hat eine verknüpfte Rückfahrt. Möchten Sie nur diese
                Fahrt stornieren oder auch die Rückfahrt?
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='mt-4 space-y-2'>
          <label className='text-muted-foreground text-xs font-medium'>
            Stornogrund (optional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='z. B. Kunde krank gemeldet, Schule ausgefallen, Doppelbuchung korrigiert …'
          />
        </div>
        <AlertDialogFooter
          className={hasMultipleOptions ? 'flex-col gap-2 sm:flex-col' : ''}
        >
          <AlertDialogCancel disabled={isLoading}>Abbrechen</AlertDialogCancel>
          {hasMultipleOptions ? (
            <>
              <AlertDialogAction
                disabled={isLoading}
                onClick={() => onConfirmSingle(reason)}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-full'
              >
                {singleLabel}
              </AlertDialogAction>
              {hasPair && onConfirmWithPair && (
                <AlertDialogAction
                  disabled={isLoading}
                  onClick={() => onConfirmWithPair(reason)}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-full'
                >
                  {pairLabel}
                </AlertDialogAction>
              )}
              {onConfirmSeries && (
                <AlertDialogAction
                  disabled={isLoading}
                  onClick={() => onConfirmSeries(reason)}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-full'
                >
                  {seriesLabel}
                </AlertDialogAction>
              )}
            </>
          ) : (
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => onConfirmSingle(reason)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Fahrt stornieren
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
