'use client';

import * as React from 'react';
import { useFormState } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ChevronDownIcon, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTripFormSections } from '../trip-form-sections-context';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';
import { MobileDateTimeSheet } from '../mobile-datetime-sheet';
import { cn } from '@/lib/utils';

function MobileReturnExactPicker({ disabled }: { disabled?: boolean }) {
  const { form } = useTripFormSections();
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);
  const returnDate = form.watch('return_date');
  const returnTime = form.watch('return_time');
  const { errors } = useFormState({
    control: form.control,
    name: ['return_date', 'return_time']
  });
  const errDate = errors.return_date;
  const errTime = errors.return_time;

  const combined = React.useMemo(() => {
    const base = returnDate ?? new Date();
    const t = (returnTime || '12:00').split(':');
    const h = parseInt(t[0] || '12', 10);
    const m = parseInt(t[1] || '0', 10);
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      m,
      0,
      0
    );
  }, [returnDate, returnTime]);

  const dateLabel = returnDate
    ? format(returnDate, 'dd. MMMM yyyy', { locale: de })
    : 'Datum wählen';

  const timeLabel =
    returnTime && returnTime.length > 0
      ? returnTime
      : returnDate
        ? 'Uhrzeit wählen'
        : '—';

  return (
    <div className='flex w-full flex-row items-end gap-2'>
      <FormItem className='min-w-0 flex-1'>
        <FormLabel className='text-xs'>Datum</FormLabel>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          onClick={() => setDateOpen(true)}
          className={cn(
            'h-10 min-h-10 w-full touch-manipulation justify-between text-left text-base font-normal',
            !returnDate && 'text-muted-foreground'
          )}
        >
          <span className='min-w-0 truncate'>{dateLabel}</span>
          <ChevronDownIcon className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
        <MobileDateTimeSheet
          open={dateOpen}
          onOpenChange={setDateOpen}
          value={combined}
          title='Rückfahrt — Datum'
          mode='date'
          onConfirm={(d) => {
            form.setValue(
              'return_date',
              new Date(d.getFullYear(), d.getMonth(), d.getDate()),
              { shouldValidate: true, shouldDirty: true }
            );
          }}
        />
        {errDate?.message ? (
          <p className='text-destructive text-xs'>{String(errDate.message)}</p>
        ) : null}
      </FormItem>
      <FormItem className='w-[8.25rem] shrink-0 sm:w-[9.5rem]'>
        <FormLabel className='text-xs'>Uhrzeit</FormLabel>
        <Button
          type='button'
          variant='outline'
          disabled={disabled || !returnDate}
          onClick={() => setTimeOpen(true)}
          className={cn(
            'h-10 min-h-10 w-full touch-manipulation justify-between text-left font-mono text-base font-normal',
            (!returnDate || !returnTime) && 'text-muted-foreground'
          )}
        >
          <span className='min-w-0 truncate'>{timeLabel}</span>
          <ChevronDownIcon className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
        <MobileDateTimeSheet
          open={timeOpen}
          onOpenChange={setTimeOpen}
          value={combined}
          title='Rückfahrt — Uhrzeit'
          mode='time'
          onConfirm={(d) => {
            form.setValue('return_time', format(d, 'HH:mm'), {
              shouldValidate: true,
              shouldDirty: true
            });
          }}
        />
        {errTime?.message ? (
          <p className='text-destructive text-xs'>{String(errTime.message)}</p>
        ) : null}
      </FormItem>
    </div>
  );
}

export function CreateTripScheduleSection() {
  const {
    form,
    isSubmitting,
    watchedReturnMode,
    isReturnModeLocked,
    hasInitializedReturnDateRef
  } = useTripFormSections();
  const narrow = useIsNarrowScreen(768);

  return (
    <div data-create-trip-section='schedule' className='px-6 py-4'>
      <div className='mb-3 flex items-center gap-2'>
        <CalendarClock className='text-muted-foreground h-4 w-4' />
        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Zeit & Route
        </span>
      </div>
      <div className='flex flex-col gap-3'>
        <FormField
          control={form.control as any}
          name='scheduled_at'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs'>Abfahrtszeit *</FormLabel>
              <FormControl>
                <DateTimePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />

        {isReturnModeLocked ? (
          watchedReturnMode !== 'none' && (
            <div className='bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-3'>
              <Navigation className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
              <span className='text-muted-foreground text-xs'>
                {watchedReturnMode === 'time_tbd'
                  ? 'Rückfahrt mit Zeitabsprache wird automatisch erstellt.'
                  : 'Rückfahrt mit genauer Zeit wird automatisch erstellt.'}
              </span>
              <Badge
                variant='secondary'
                className='ml-auto text-[9px] font-normal'
              >
                Gesperrt
              </Badge>
            </div>
          )
        ) : (
          <div className='rounded-lg border p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <Navigation className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                Rückfahrt
              </span>
            </div>
            <div className='flex flex-col gap-3'>
              <FormField
                control={form.control as any}
                name='return_mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Rückfahrt</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v !== 'exact')
                          hasInitializedReturnDateRef.current = false;
                      }}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className='h-9 text-base md:text-sm'>
                          <SelectValue placeholder='Wählen...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>Keine Rückfahrt</SelectItem>
                        <SelectItem value='time_tbd'>
                          Rückfahrt mit Zeitabsprache
                        </SelectItem>
                        <SelectItem value='exact'>
                          Rückfahrt mit genauer Zeit
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              {watchedReturnMode === 'exact' &&
                (narrow ? (
                  <MobileReturnExactPicker disabled={isSubmitting} />
                ) : (
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <FormField
                      control={form.control as any}
                      name='return_date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Datum</FormLabel>
                          <FormControl>
                            <Input
                              type='date'
                              value={
                                field.value
                                  ? format(field.value, 'yyyy-MM-dd')
                                  : ''
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(
                                  v ? new Date(`${v}T00:00:00`) : undefined
                                );
                              }}
                              className='h-9'
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name='return_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Uhrzeit</FormLabel>
                          <FormControl>
                            <Input
                              type='time'
                              value={field.value || ''}
                              onChange={field.onChange}
                              className='h-9'
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
