import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  recurringRulesService,
  RecurringRule
} from '@/features/trips/api/recurring-rules.service';
import { Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'MO', label: 'Montag' },
  { id: 'TU', label: 'Dienstag' },
  { id: 'WE', label: 'Mittwoch' },
  { id: 'TH', label: 'Donnerstag' },
  { id: 'FR', label: 'Freitag' },
  { id: 'SA', label: 'Samstag' },
  { id: 'SU', label: 'Sonntag' }
] as const;

const ruleFormSchema = z
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

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface RecurringRuleSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialData?: RecurringRule;
  onSuccess: () => void;
}

export function RecurringRuleSheet({
  isOpen,
  onOpenChange,
  clientId,
  initialData,
  onSuccess
}: RecurringRuleSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Convert initial RRule string to array of days for the form
  const getInitialDays = () => {
    if (!initialData) return ['MO', 'TU', 'WE', 'TH', 'FR']; // Default to Mon-Fri
    const match = initialData.rrule_string.match(/BYDAY=([^;]+)/);
    return match ? match[1].split(',') : [];
  };

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      days: getInitialDays(),
      pickup_time: initialData?.pickup_time.substring(0, 5) || '08:00',
      pickup_address: initialData?.pickup_address || '',
      dropoff_address: initialData?.dropoff_address || '',
      return_trip: initialData?.return_trip ?? true,
      return_time: initialData?.return_time?.substring(0, 5) || '15:00',
      start_date: initialData?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: initialData?.end_date || '',
      is_active: initialData?.is_active ?? true
    }
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        days: getInitialDays(),
        pickup_time: initialData?.pickup_time.substring(0, 5) || '08:00',
        pickup_address: initialData?.pickup_address || '',
        dropoff_address: initialData?.dropoff_address || '',
        return_trip: initialData?.return_trip ?? true,
        return_time: initialData?.return_time?.substring(0, 5) || '15:00',
        start_date: initialData?.start_date || format(new Date(), 'yyyy-MM-dd'),
        end_date: initialData?.end_date || '',
        is_active: initialData?.is_active ?? true
      });
    }
  }, [isOpen, initialData, form]);

  const watchedReturnTrip = form.watch('return_trip');

  const onSubmit = async (values: RuleFormValues) => {
    try {
      setIsSubmitting(true);

      const rruleString = `FREQ=WEEKLY;BYDAY=${values.days.join(',')}`;

      const ruleData = {
        client_id: clientId,
        rrule_string: rruleString,
        pickup_time: `${values.pickup_time}:00`,
        pickup_address: values.pickup_address,
        dropoff_address: values.dropoff_address,
        return_trip: values.return_trip,
        return_time:
          values.return_trip && values.return_time
            ? `${values.return_time}:00`
            : null,
        start_date: values.start_date,
        end_date: values.end_date || null,
        is_active: values.is_active
      };

      if (initialData) {
        await recurringRulesService.updateRule(initialData.id, ruleData);
        toast.success('Regel erfolgreich aktualisiert');
      } else {
        await recurringRulesService.createRule(ruleData);
        toast.success('Regel erfolgreich erstellt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col p-0 sm:max-w-md'>
        <SheetHeader className='border-b px-6 py-4'>
          <SheetTitle>
            {initialData ? 'Regel bearbeiten' : 'Neue wiederkehrende Fahrt'}
          </SheetTitle>
          <SheetDescription>
            Konfigurieren Sie die Wochentage und Zeiten für diese Regelfahrt.
          </SheetDescription>
        </SheetHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-1 flex-col overflow-hidden'
        >
          <div className='min-h-0 flex-1 overflow-y-auto px-6'>
            <div className='space-y-6 py-6 pb-20'>
              {/* Wochentage Auswahl */}
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
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.id}
                                className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3 shadow-sm'
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            day.id
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== day.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className='cursor-pointer font-normal'>
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <Input
                          placeholder='Musterstraße 1, 12345 Stadt'
                          {...field}
                        />
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
                        <Input
                          placeholder='Klinikweg 5, 12345 Stadt'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        <SheetDescription>
                          Automatisch eine zweite Fahrt in umgekehrter Richtung
                          anlegen.
                        </SheetDescription>
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

              {initialData && (
                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-base text-rose-500'>
                          Regel Aktiv
                        </FormLabel>
                        <SheetDescription>
                          Deaktivieren Sie diese Regel, um die Fahrten
                          vorübergehend auszusetzen ohne sie zu löschen.
                        </SheetDescription>
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
          </div>

          <SheetFooter className='mt-auto border-t p-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {initialData ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </SheetFooter>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
