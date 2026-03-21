'use client';

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
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { useTripFormSections } from '../trip-form-sections-context';

export function CreateTripScheduleSection() {
  const {
    form,
    isSubmitting,
    watchedReturnMode,
    isReturnModeLocked,
    hasInitializedReturnDateRef
  } = useTripFormSections();

  return (
    <div className='px-6 py-4'>
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
                        <SelectTrigger className='h-9'>
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

              {watchedReturnMode === 'exact' && (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
