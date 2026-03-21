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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Car, Accessibility, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTripFormSections } from '../trip-form-sections-context';

export function CreateTripExtrasSection() {
  const { form, drivers, billingBehavior, watchedIsWheelchair } =
    useTripFormSections();

  const requirePassenger = billingBehavior.requirePassenger;

  return (
    <div className='px-6 py-4'>
      <div className='mb-3 flex items-center gap-2'>
        <Car className='text-muted-foreground h-4 w-4' />
        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Fahrer & Extras
        </span>
      </div>
      <div className='flex flex-col gap-3'>
        <FormField
          control={form.control as any}
          name='driver_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs'>Fahrer (optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Nicht zugewiesen' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='__none__'>Nicht zugewiesen</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />

        {!requirePassenger && (
          <FormField
            control={form.control as any}
            name='is_wheelchair'
            render={({ field }) => (
              <FormItem>
                <div
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                    watchedIsWheelchair
                      ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'
                      : 'hover:bg-muted/40'
                  )}
                  onClick={() => field.onChange(!field.value)}
                >
                  <div className='flex items-center gap-3'>
                    <Accessibility
                      className={cn(
                        'h-4 w-4 transition-colors',
                        watchedIsWheelchair
                          ? 'text-rose-600'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div>
                      <FormLabel className='cursor-pointer text-sm font-medium'>
                        Rollstuhl
                      </FormLabel>
                      <p className='text-muted-foreground text-[11px]'>
                        Fahrt erfordert Rollstuhlbeförderung
                      </p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </div>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control as any}
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-1.5 text-xs'>
                <StickyNote className='h-3.5 w-3.5' />
                Notizen
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder='Besondere Hinweise...'
                  className='h-20 resize-none text-sm'
                />
              </FormControl>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
