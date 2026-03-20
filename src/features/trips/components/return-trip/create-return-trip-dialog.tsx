'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Trip } from '@/features/trips/api/trips.service';
import { findPairedTrip } from '@/features/trips/api/recurring-exceptions.actions';
import { canCreateLinkedReturn } from '@/features/trips/lib/can-create-linked-return';
import { createLinkedReturnForOutbound } from '@/features/trips/lib/create-linked-return';

export interface CreateReturnTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trip currently open in the detail sheet (Hinfahrt). */
  anchorTrip: Trip;
  /**
   * All legs in the same `group_id`, when applicable; otherwise just the anchor.
   * Used to offer “whole group” vs “this passenger only”.
   */
  groupTrips: Trip[];
  drivers: { id: string; name: string }[];
  onSuccess?: () => void;
}

type Scope = 'single' | 'group';

/** Default return pickup a few hours after the outbound — dispatcher can adjust. */
function defaultReturnDateTime(outbound: Trip): Date {
  if (!outbound.scheduled_at) {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  }
  const base = new Date(outbound.scheduled_at);
  const d = new Date(base);
  d.setHours(d.getHours() + 4);
  return d;
}

export function CreateReturnTripDialog({
  open,
  onOpenChange,
  anchorTrip,
  groupTrips,
  drivers,
  onSuccess
}: CreateReturnTripDialogProps) {
  const [scope, setScope] = React.useState<Scope>('single');
  const [scheduledAt, setScheduledAt] = React.useState<Date | undefined>(() =>
    defaultReturnDateTime(anchorTrip)
  );
  const [driverId, setDriverId] = React.useState<string>('__none__');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasMultiplePassengers = groupTrips.length > 1;

  React.useEffect(() => {
    if (!open) return;
    setScheduledAt(defaultReturnDateTime(anchorTrip));
    setDriverId('__none__');
    setScope('single');
  }, [open, anchorTrip.id, anchorTrip.scheduled_at]);

  const targetsForScope: Trip[] = React.useMemo(() => {
    if (!hasMultiplePassengers) return [anchorTrip];
    return scope === 'group' ? groupTrips : [anchorTrip];
  }, [anchorTrip, groupTrips, hasMultiplePassengers, scope]);

  const handleSubmit = async () => {
    if (!scheduledAt) {
      toast.error('Bitte Datum und Uhrzeit für die Rückfahrt wählen.');
      return;
    }

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    let companyId: string | null = null;
    if (user?.id) {
      const { data: profile } = await supabase
        .from('accounts')
        .select('company_id')
        .eq('id', user.id)
        .single();
      companyId = profile?.company_id ?? null;
    }

    const resolvedDriverId = driverId === '__none__' ? null : driverId;

    setIsSubmitting(true);
    try {
      const withPairs = await Promise.all(
        targetsForScope.map(async (t) => ({
          outbound: t,
          paired: await findPairedTrip(t as Trip)
        }))
      );

      const eligible = withPairs.filter(
        (row) => canCreateLinkedReturn(row.outbound as Trip, !!row.paired).ok
      );

      if (eligible.length === 0) {
        toast.error(
          'Keine geeignete Hinfahrt gefunden (z. B. bereits verknüpft oder storniert).'
        );
        return;
      }

      if (eligible.length < withPairs.length) {
        toast.message(
          `${eligible.length} von ${withPairs.length} Fahrten erhalten eine Rückfahrt (übrige übersprungen).`
        );
      }

      for (const row of eligible) {
        await createLinkedReturnForOutbound(row.outbound as Trip, {
          scheduledAt,
          driverId: resolvedDriverId,
          companyId,
          createdBy: user?.id ?? null
        });
      }

      toast.success(
        eligible.length === 1
          ? 'Rückfahrt wurde angelegt und verknüpft.'
          : `${eligible.length} Rückfahrten wurden angelegt und verknüpft.`
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Fehler: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Rückfahrt anlegen</DialogTitle>
          <DialogDescription>
            Route und Kostenträger werden von der Hinfahrt übernommen. Neu
            festzulegen sind Termin und optional der Fahrer.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          {hasMultiplePassengers && (
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>Geltungsbereich</Label>
              <RadioGroup
                value={scope}
                onValueChange={(v) => setScope(v as Scope)}
                className='grid gap-3'
              >
                <div className='flex items-start gap-3 rounded-lg border p-3'>
                  <RadioGroupItem value='single' id='scope-single' />
                  <label
                    htmlFor='scope-single'
                    className='grid cursor-pointer gap-0.5 text-sm leading-snug'
                  >
                    <span className='font-medium'>
                      Nur diese Fahrt ({anchorTrip.client_name || 'Fahrgast'})
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      Eine Rückfahrt nur für die aktuell geöffnete Person.
                    </span>
                  </label>
                </div>
                <div className='flex items-start gap-3 rounded-lg border p-3'>
                  <RadioGroupItem value='group' id='scope-group' />
                  <label
                    htmlFor='scope-group'
                    className='grid cursor-pointer gap-0.5 text-sm leading-snug'
                  >
                    <span className='font-medium'>
                      Gesamte Gruppe ({groupTrips.length} Fahrten)
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      Für jede Hinfahrt in der Gruppe wird eine eigene Rückfahrt
                      mit gleichem Termin und Fahrer erstellt (ohne gemeinsame
                      group_id).
                    </span>
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          <DateTimePicker
            label='Rückfahrt — Datum & Uhrzeit'
            value={scheduledAt}
            onChange={setScheduledAt}
            disabled={isSubmitting}
          />

          <div className='space-y-2'>
            <Label htmlFor='return-driver'>Fahrer (optional)</Label>
            <Select
              value={driverId}
              onValueChange={setDriverId}
              disabled={isSubmitting}
            >
              <SelectTrigger id='return-driver' className='w-full'>
                <SelectValue placeholder='Fahrer wählen' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__none__'>Nicht zugewiesen</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type='button'
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting || !scheduledAt}
          >
            {isSubmitting ? 'Wird gespeichert…' : 'Rückfahrt erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
