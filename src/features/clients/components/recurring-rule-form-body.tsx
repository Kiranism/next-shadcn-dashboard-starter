'use client';

/**
 * RecurringRuleFormBody
 *
 * The complete form content for creating or editing a recurring trip rule.
 * This component is intentionally "headless" with respect to its outer shell —
 * it knows nothing about whether it lives inside a Sheet overlay or a Panel column.
 *
 * Both RecurringRuleSheet (overlay) and RecurringRulePanel (column) render this
 * component as their form body. The visual result is identical in both contexts:
 * same fields, same layout, same validation messages.
 *
 * Structure (top to bottom):
 *   1. Wochentage (Mon–Sun checkboxes, 2-column grid)
 *   2. Gültig ab / Gültig bis (date range, side-by-side)
 *   3. Hinfahrt Details (time + pickup address + dropoff address)
 *   4. Rückfahrt toggle + conditional return time input
 *   5. Regel Aktiv toggle (edit mode only)
 *
 * Props:
 *   form         — react-hook-form instance (UseFormReturn<RuleFormValues>)
 *                  Both parent components own their own form state and pass it in.
 *   isSubmitting — disables fields while the save is in progress
 *   onCancel     — called by the Abbrechen button; parents handle close logic
 *   showIsActive — when true, shows the "Regel Aktiv" toggle (edit mode only)
 *
 * The footer (Abbrechen + Speichern buttons) is included here so the form body
 * is fully self-contained. The parent wraps it in either SheetContent or a
 * Panel shell — both are flex-col containers with an overflow-y-auto scroll area.
 *
 * NOTE: The scrollable wrapper (the div with overflow-y-auto) is intentionally
 * NOT part of this component. The parent shell (Sheet or Panel) owns the scroll
 * container so it can control padding and height independently.
 */

import * as React from 'react';
import { format } from 'date-fns';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Schema (shared between Sheet and Panel) ─────────────────────────────────

export const DAYS_OF_WEEK = [
  { id: 'MO', label: 'Montag' },
  { id: 'TU', label: 'Dienstag' },
  { id: 'WE', label: 'Mittwoch' },
  { id: 'TH', label: 'Donnerstag' },
  { id: 'FR', label: 'Freitag' },
  { id: 'SA', label: 'Samstag' },
  { id: 'SU', label: 'Sonntag' }
] as const;

export const ruleFormSchema = z
  .object({
    days: z.array(z.string()).refine((value) => value.length > 0, {
      message: 'Sie müssen mindestens einen Wochentag auswählen.'
    }),
    pickup_time: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Bitte ein gültiges Zeitformat verwenden (HH:MM)'
      ),
    pickup_address: z.string().min(1, 'Abholadresse ist erforderlich'),
    dropoff_address: z.string().min(1, 'Zieladresse ist erforderlich'),
    return_trip: z.boolean(),
    return_time: z.string().optional(),
    start_date: z.string().min(1, 'Startdatum ist erforderlich'),
    end_date: z.string().optional(),
    is_active: z.boolean()
  })
  .superRefine((data, ctx) => {
    if (data.return_trip && !data.return_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Rückfahrtzeit ist erforderlich, wenn Rückfahrt aktiviert ist.',
        path: ['return_time']
      });
    }
  });

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

// ─── Default values helper ───────────────────────────────────────────────────

export function getRuleFormDefaults(
  initialData?: {
    rrule_string: string;
    pickup_time: string;
    pickup_address: string;
    dropoff_address: string;
    return_trip: boolean;
    return_time?: string | null;
    start_date: string;
    end_date?: string | null;
    is_active: boolean;
  } | null
): RuleFormValues {
  if (!initialData) {
    return {
      days: ['MO', 'TU', 'WE', 'TH', 'FR'],
      pickup_time: '08:00',
      pickup_address: '',
      dropoff_address: '',
      return_trip: true,
      return_time: '15:00',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      is_active: true
    };
  }

  const match = initialData.rrule_string.match(/BYDAY=([^;]+)/);
  const days = match ? match[1].split(',') : ['MO', 'TU', 'WE', 'TH', 'FR'];

  return {
    days,
    pickup_time: initialData.pickup_time.substring(0, 5),
    pickup_address: initialData.pickup_address,
    dropoff_address: initialData.dropoff_address,
    return_trip: initialData.return_trip ?? true,
    return_time: initialData.return_time?.substring(0, 5) ?? '15:00',
    start_date: initialData.start_date,
    end_date: initialData.end_date ?? '',
    is_active: initialData.is_active ?? true
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface RecurringRuleFormBodyProps {
  form: UseFormReturn<RuleFormValues>;
  /** Show the "Regel Aktiv" toggle — only relevant when editing an existing rule */
  showIsActive?: boolean;
}

export function RecurringRuleFormBody({
  form,
  showIsActive = false
}: RecurringRuleFormBodyProps) {
  const watchedReturnTrip = form.watch('return_trip');

  return (
    <FormProvider {...form}>
      <div className='space-y-6 py-6'>
        {/* ── Wochentage ──────────────────────────────────────── */}
        <FormField
          control={form.control}
          name='days'
          render={() => (
            <FormItem>
              <FormLabel>Wochentage</FormLabel>
              <div className='mt-2 grid grid-cols-2 gap-2'>
                {DAYS_OF_WEEK.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name='days'
                    render={({ field }) => (
                      <FormItem
                        key={day.id}
                        className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3 shadow-sm'
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) =>
                              checked
                                ? field.onChange([...field.value, day.id])
                                : field.onChange(
                                    field.value?.filter((v) => v !== day.id)
                                  )
                            }
                          />
                        </FormControl>
                        <FormLabel className='cursor-pointer font-normal'>
                          {day.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Gültig ab / bis ─────────────────────────────────── */}
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='start_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gültig ab</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='end_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gültig bis (Optional)</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Hinfahrt Details ────────────────────────────────── */}
        <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
          <h4 className='text-sm font-medium'>Hinfahrt Details</h4>
          <FormField
            control={form.control}
            name='pickup_time'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abholzeit</FormLabel>
                <FormControl>
                  <Input type='time' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='pickup_address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abholadresse</FormLabel>
                <FormControl>
                  <Input placeholder='Musterstraße 1, 12345 Stadt' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='dropoff_address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zieladresse</FormLabel>
                <FormControl>
                  <Input placeholder='Klinikweg 5, 12345 Stadt' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Rückfahrt ────────────────────────────────────────── */}
        <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
          <FormField
            control={form.control}
            name='return_trip'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg p-2'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    Zugehörige Rückfahrt
                  </FormLabel>
                  <p className='text-muted-foreground text-sm'>
                    Automatisch eine zweite Fahrt in umgekehrter Richtung
                    anlegen.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {watchedReturnTrip && (
            <FormField
              control={form.control}
              name='return_time'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rückfahrt Abholzeit</FormLabel>
                  <FormControl>
                    <Input type='time' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ── Regel Aktiv (edit mode only) ─────────────────────── */}
        {showIsActive && (
          <FormField
            control={form.control}
            name='is_active'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base text-rose-500'>
                    Regel Aktiv
                  </FormLabel>
                  <p className='text-muted-foreground text-sm'>
                    Deaktivieren Sie diese Regel, um die Fahrten vorübergehend
                    auszusetzen ohne sie zu löschen.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </FormProvider>
  );
}
