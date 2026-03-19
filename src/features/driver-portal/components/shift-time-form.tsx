'use client';

/**
 * Shift time entry form — manual Zeiterfassung for drivers.
 *
 * Replaces tap-to-track. Drivers enter date, start time, optional break(s),
 * and end time. Supports multiple breaks; "Weitere Pause" to add more.
 * Live "Bezahlte Zeit" display. Duplicate-day overwrite confirm.
 */

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconTrash
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

type BreakSlot = { start: string; end: string };

function formatPaidDuration(
  startTime: string,
  endTime: string,
  breaks: BreakSlot[]
): string {
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);
  if (endMin < startMin) endMin += 24 * 60;

  let totalMin = endMin - startMin;
  for (const br of breaks) {
    if (br.start && br.end) {
      const brStart = parseTimeToMinutes(br.start);
      let brEnd = parseTimeToMinutes(br.end);
      if (brEnd < brStart) brEnd += 24 * 60;
      totalMin -= Math.max(0, brEnd - brStart);
    }
  }

  if (totalMin < 0) return '–';
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) {
    return `${hours} h ${minutes > 0 ? `${minutes} min` : ''}`.trim();
  }
  return `${minutes} min`;
}

const breakSchema = z.object({
  start: z.string(),
  end: z.string()
});

const formSchema = z
  .object({
    date: z.string().min(1, 'Datum ist erforderlich'),
    startTime: z.string().min(1, 'Beginn ist erforderlich'),
    endTime: z.string().min(1, 'Ende ist erforderlich'),
    hasBreak: z.boolean(),
    breaks: z.array(breakSchema)
  })
  .refine(
    (data) => {
      if (!data.hasBreak) return true;
      const filled = data.breaks.filter((b) => b.start && b.end);
      return filled.length >= 1;
    },
    {
      message: 'Mindestens eine Pause mit von und bis angeben.',
      path: ['breaks']
    }
  )
  .refine(
    (data) => {
      const start = parseTimeToMinutes(data.startTime);
      let end = parseTimeToMinutes(data.endTime);
      if (end < start) end += 24 * 60;
      return end > start;
    },
    { message: 'Ende muss nach Beginn liegen.', path: ['endTime'] }
  )
  .refine(
    (data) => {
      if (!data.hasBreak) return true;
      const start = parseTimeToMinutes(data.startTime);
      const end = parseTimeToMinutes(data.endTime);
      for (const br of data.breaks) {
        if (!br.start || !br.end) continue;
        const brStart = parseTimeToMinutes(br.start);
        const brEnd = parseTimeToMinutes(br.end);
        if (brStart >= brEnd || brStart < start || brEnd > end) return false;
      }
      return true;
    },
    {
      message: 'Jede Pause muss innerhalb der Schicht liegen (von vor bis).',
      path: ['breaks']
    }
  );

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  date: getTodayDate(),
  startTime: '08:00',
  endTime: '17:00',
  hasBreak: false,
  breaks: [{ start: '', end: '' }]
};

export interface ShiftTimeFormProps {
  onShiftSaved?: () => void;
}

export function ShiftTimeForm({ onShiftSaved }: ShiftTimeFormProps = {}) {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [existingShiftId, setExistingShiftId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'breaks'
  });

  const watchedStart = form.watch('startTime');
  const watchedEnd = form.watch('endTime');
  const watchedBreaks = form.watch('breaks');
  const watchedHasBreak = form.watch('hasBreak');

  const paidDisplay = formatPaidDuration(
    watchedStart,
    watchedEnd,
    watchedHasBreak ? (watchedBreaks ?? []) : []
  );

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('accounts')
        .select('id, company_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDriverId(profile.id);
        setCompanyId(profile.company_id);
      }
    };
    init();
  }, []);

  const submitWithOverwrite = async (
    values: FormValues,
    overwrite: boolean
  ) => {
    if (!driverId || !companyId) {
      toast.error('Nicht angemeldet.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (overwrite && existingShiftId) {
        await shiftsService.deleteShift(existingShiftId);
      }

      const breaksToSave =
        values.hasBreak && values.breaks?.length
          ? values.breaks.filter((b) => b.start && b.end)
          : [];

      await shiftsService.createManualShift({
        driverId,
        companyId,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        breaks: breaksToSave.length > 0 ? breaksToSave : undefined
      });

      toast.success('Schicht gespeichert.');
      form.reset(defaultValues);
      setShowOverwriteDialog(false);
      setExistingShiftId(null);
      setFormOpen(false);
      onShiftSaved?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Fehler beim Speichern der Schicht.';
      toast.error(msg);
      console.error('Shift save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!driverId || !companyId) {
      toast.error('Bitte melden Sie sich an.');
      return;
    }

    const existing = await shiftsService.getShiftForDriverByDate(
      driverId,
      values.date
    );

    if (existing) {
      setExistingShiftId(existing.id);
      setShowOverwriteDialog(true);
      return;
    }

    await submitWithOverwrite(values, false);
  });

  const handleOverwriteConfirm = () => {
    const values = form.getValues();
    submitWithOverwrite(values, true);
  };

  if (!driverId || !companyId) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <p className='text-muted-foreground'>
            Bitte melden Sie sich an, um Ihre Arbeitszeit zu erfassen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Form form={form} onSubmit={handleSubmit}>
        <Collapsible open={formOpen} onOpenChange={setFormOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <button
                type='button'
                className='flex w-full items-center justify-between px-6 py-4 text-left'
              >
                <div>
                  <h2 className='text-lg font-medium'>Zeiterfassung</h2>
                  <p className='text-muted-foreground text-sm'>
                    Neue Schicht erfassen
                  </p>
                </div>
                {formOpen ? (
                  <IconChevronUp className='h-5 w-5 shrink-0' />
                ) : (
                  <IconChevronDown className='h-5 w-5 shrink-0' />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className='space-y-6 border-t pt-6'>
                {/* Paid hours — prominent display */}
                <div className='bg-muted/50 flex flex-col items-center justify-center rounded-lg border py-4'>
                  <p className='text-muted-foreground text-sm'>Bezahlte Zeit</p>
                  <p
                    className={cn(
                      'font-mono text-2xl font-semibold tabular-nums',
                      paidDisplay === '–' && 'text-destructive'
                    )}
                  >
                    {paidDisplay}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name='date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          className='h-11 text-base'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='startTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beginn</FormLabel>
                      <FormControl>
                        <Input
                          type='time'
                          {...field}
                          className='h-11 text-base'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='hasBreak'>Pause eingeben</Label>
                    <p className='text-muted-foreground text-sm'>
                      Mittagspause oder Kurzpause abziehen
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name='hasBreak'
                    render={({ field }) => (
                      <FormControl>
                        <Switch
                          id='hasBreak'
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (
                              checked &&
                              form.getValues('breaks').length === 0
                            ) {
                              append({ start: '', end: '' });
                            }
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {watchedHasBreak && (
                  <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-muted-foreground text-sm'>
                        Pausen abziehen (Mittag, Kurzpause, Tanken…)
                      </p>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => append({ start: '', end: '' })}
                        className='shrink-0'
                      >
                        <IconPlus className='mr-1 h-4 w-4' />
                        Weitere Pause
                      </Button>
                    </div>
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className='bg-background flex flex-col gap-3 rounded-md border p-3'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-muted-foreground text-sm'>
                            {fields.length > 1 ? `Pause ${index + 1}` : 'Pause'}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => remove(index)}
                              aria-label='Pause entfernen'
                              className='text-muted-foreground hover:text-destructive h-8 w-8'
                            >
                              <IconTrash className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                          <FormField
                            control={form.control}
                            name={`breaks.${index}.start`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Von</FormLabel>
                                <FormControl>
                                  <Input
                                    type='time'
                                    {...f}
                                    value={f.value ?? ''}
                                    className='h-11 text-base'
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`breaks.${index}.end`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Bis</FormLabel>
                                <FormControl>
                                  <Input
                                    type='time'
                                    {...f}
                                    value={f.value ?? ''}
                                    className='h-11 text-base'
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    {form.formState.errors.breaks && (
                      <p className='text-destructive text-sm'>
                        {form.formState.errors.breaks.message}
                      </p>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='endTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ende</FormLabel>
                      <FormControl>
                        <Input
                          type='time'
                          {...field}
                          className='h-11 text-base'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type='submit'
                  className='w-full'
                  size='lg'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Wird gespeichert…' : 'Schicht speichern'}
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </Form>

      <AlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schicht überschreiben?</AlertDialogTitle>
            <AlertDialogDescription>
              Für diesen Tag existiert bereits eine Schicht. Soll sie
              überschrieben werden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Abbrechen
            </AlertDialogCancel>
            <Button
              onClick={() => void handleOverwriteConfirm()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird gespeichert…' : 'Überschreiben'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
