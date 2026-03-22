'use client';

/**
 * Cupertino-style wheel picker in a Radix Dialog bottom sheet (above Vaul drawer).
 * Use `mode="date"` and `mode="time"` separately — do not combine in one sheet for trip forms.
 * Theme tokens only — see docs/color-system.md.
 */
import * as React from 'react';
import Picker, { type PickerValue } from 'react-mobile-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { de } from 'date-fns/locale';
import { format } from 'date-fns';

const MONTH_KEYS = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez'
] as const;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export type MobileDateTimeSheetMode = 'date' | 'time';

export interface MobileDateDraftState {
  year: string;
  month: string;
  day: string;
}

export interface MobileTimeDraftState {
  hour: string;
  minute: string;
}

function dateToDateDraft(d: Date): MobileDateDraftState {
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth()),
    day: String(d.getDate())
  };
}

function dateToTimeDraft(d: Date): MobileTimeDraftState {
  return {
    hour: String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0')
  };
}

function dateDraftToDate(s: MobileDateDraftState): Date {
  const y = parseInt(s.year, 10);
  const m = parseInt(s.month, 10);
  const day = Math.min(parseInt(s.day, 10), daysInMonth(y, m));
  return new Date(y, m, day, 0, 0, 0, 0);
}

export interface MobileDateTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full instant used to seed wheels and to merge the *other* part (time when mode=date, date when mode=time). */
  value: Date | undefined;
  onConfirm: (date: Date) => void;
  title: string;
  mode: MobileDateTimeSheetMode;
}

export function MobileDateTimeSheet({
  open,
  onOpenChange,
  value,
  onConfirm,
  title,
  mode
}: MobileDateTimeSheetProps) {
  const base = value ?? new Date();

  const [dateDraft, setDateDraft] = React.useState<MobileDateDraftState>(() =>
    dateToDateDraft(base)
  );

  const [timeDraft, setTimeDraft] = React.useState<MobileTimeDraftState>(() =>
    dateToTimeDraft(base)
  );

  React.useEffect(() => {
    if (!open) return;
    const b = value ?? new Date();
    if (mode === 'date') {
      setDateDraft(dateToDateDraft(b));
    } else {
      setTimeDraft(dateToTimeDraft(b));
    }
  }, [open, value, mode]);

  const y = parseInt(dateDraft.year, 10);
  const m = parseInt(dateDraft.month, 10);
  const maxDay = daysInMonth(y, m);
  const yearStart = new Date().getFullYear() - 1;
  const yearEnd = new Date().getFullYear() + 3;
  const years = React.useMemo(
    () =>
      Array.from({ length: yearEnd - yearStart + 1 }, (_, i) =>
        String(yearStart + i)
      ),
    [yearEnd, yearStart]
  );

  const days = React.useMemo(
    () => Array.from({ length: maxDay }, (_, i) => String(i + 1)),
    [maxDay]
  );

  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    []
  );

  const minutes = React.useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
    []
  );

  const handleDatePickerChange = React.useCallback(
    (next: PickerValue, key: string) => {
      setDateDraft((prev) => {
        let nextState: MobileDateDraftState = {
          year: String(next.year ?? prev.year),
          month: String(next.month ?? prev.month),
          day: String(next.day ?? prev.day)
        };
        if (key === 'year' || key === 'month') {
          const ny = parseInt(nextState.year, 10);
          const nm = parseInt(nextState.month, 10);
          const cap = daysInMonth(ny, nm);
          if (parseInt(nextState.day, 10) > cap) {
            nextState = { ...nextState, day: String(cap) };
          }
        }
        return nextState;
      });
    },
    []
  );

  const handleTimePickerChange = React.useCallback((next: PickerValue) => {
    setTimeDraft((prev) => ({
      hour: String(next.hour ?? prev.hour),
      minute: String(next.minute ?? prev.minute)
    }));
  }, []);

  const handleConfirm = () => {
    const ref = value ?? new Date();
    if (mode === 'date') {
      const picked = dateDraftToDate(dateDraft);
      onConfirm(
        new Date(
          picked.getFullYear(),
          picked.getMonth(),
          picked.getDate(),
          ref.getHours(),
          ref.getMinutes(),
          0,
          0
        )
      );
    } else {
      const h = parseInt(timeDraft.hour, 10);
      const min = parseInt(timeDraft.minute, 10);
      onConfirm(
        new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), h, min, 0, 0)
      );
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const summary =
    mode === 'date'
      ? format(dateDraftToDate(dateDraft), 'EEEE, d. MMMM yyyy', { locale: de })
      : `${timeDraft.hour}:${timeDraft.minute}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          'bg-background fixed right-0 bottom-0 left-0 max-h-[min(85dvh,560px)] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-xl border-t p-0 shadow-lg sm:max-w-lg',
          'top-auto z-[60] overflow-hidden',
          '[&>button.absolute]:hidden'
        )}
      >
        <DialogHeader className='border-border shrink-0 space-y-0 border-b px-4 py-3 text-left'>
          <DialogTitle className='text-base font-semibold'>{title}</DialogTitle>
          <DialogDescription className='sr-only'>
            {mode === 'date'
              ? 'Datum mit den Rollen wählen, Fertig bestätigt.'
              : 'Uhrzeit mit den Rollen wählen, Fertig bestätigt.'}
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted/20 relative flex min-h-[220px] justify-center'>
          <div
            className='border-border bg-muted/40 pointer-events-none absolute top-1/2 right-4 left-4 z-10 h-10 -translate-y-1/2 rounded-md border'
            aria-hidden
          />
          {mode === 'date' ? (
            <Picker
              wheelMode='natural'
              height={216}
              itemHeight={44}
              value={dateDraft as unknown as PickerValue}
              onChange={handleDatePickerChange}
              className='text-foreground w-full max-w-md touch-manipulation'
            >
              <Picker.Column name='day' aria-labelledby='create-trip-d-day'>
                {days.map((d) => (
                  <Picker.Item key={d} value={d}>
                    {({ selected }) => (
                      <span
                        className={cn(
                          'flex h-11 items-center justify-center text-base',
                          selected
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {d}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name='month' aria-labelledby='create-trip-d-month'>
                {MONTH_KEYS.map((label, idx) => (
                  <Picker.Item key={label} value={String(idx)}>
                    {({ selected }) => (
                      <span
                        className={cn(
                          'flex h-11 items-center justify-center text-base',
                          selected
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {label}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name='year' aria-labelledby='create-trip-d-year'>
                {years.map((year) => (
                  <Picker.Item key={year} value={year}>
                    {({ selected }) => (
                      <span
                        className={cn(
                          'flex h-11 items-center justify-center text-base',
                          selected
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {year}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          ) : (
            <Picker
              wheelMode='natural'
              height={216}
              itemHeight={44}
              value={timeDraft as unknown as PickerValue}
              onChange={handleTimePickerChange}
              className='text-foreground w-full max-w-md touch-manipulation'
            >
              <Picker.Column name='hour' aria-labelledby='create-trip-t-hour'>
                {hours.map((h) => (
                  <Picker.Item key={h} value={h}>
                    {({ selected }) => (
                      <span
                        className={cn(
                          'flex h-11 items-center justify-center font-mono text-base',
                          selected
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {h}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column
                name='minute'
                aria-labelledby='create-trip-t-minute'
              >
                {minutes.map((min) => (
                  <Picker.Item key={min} value={min}>
                    {({ selected }) => (
                      <span
                        className={cn(
                          'flex h-11 items-center justify-center font-mono text-base',
                          selected
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {min}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          )}
        </div>

        <div className='sr-only'>
          {mode === 'date' ? (
            <>
              <span id='create-trip-d-day'>Tag</span>
              <span id='create-trip-d-month'>Monat</span>
              <span id='create-trip-d-year'>Jahr</span>
            </>
          ) : (
            <>
              <span id='create-trip-t-hour'>Stunde</span>
              <span id='create-trip-t-minute'>Minute</span>
            </>
          )}
        </div>

        <p className='text-muted-foreground px-4 pb-2 text-center text-xs'>
          {summary}
        </p>

        <div className='border-border flex gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
          <Button
            type='button'
            variant='outline'
            className='min-h-11 flex-1 touch-manipulation'
            onClick={handleCancel}
          >
            Abbrechen
          </Button>
          <Button
            type='button'
            className='min-h-11 flex-1 touch-manipulation'
            onClick={handleConfirm}
          >
            Fertig
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
