'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Form,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ClientAutoSuggest } from '@/components/ui/client-auto-suggest';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { tripsService } from '@/features/trips/api/trips.service';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import { format } from 'date-fns';
import {
  MapPin,
  Navigation,
  User,
  CalendarClock,
  CreditCard,
  Car,
  Accessibility,
  StickyNote,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ReturnMode = 'none' | 'time_tbd' | 'exact';

const tripFormSchema = z
  .object({
    payer_id: z.string().min(1, 'Kostenträger ist erforderlich'),
    billing_type_id: z.string().optional(),
    client_first_name: z.string().optional(),
    client_last_name: z.string().optional(),
    client_phone: z.string().optional(),
    scheduled_at: z.date({ error: 'Datum und Uhrzeit sind erforderlich' }),
    return_mode: z.enum(['none', 'time_tbd', 'exact']).default('none'),
    return_date: z.date().optional(),
    return_time: z
      .union([
        z.literal(''),
        z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Bitte ein gültiges Zeitformat verwenden (HH:MM)'
          )
      ])
      .optional(),
    pickup_address: z.string().min(1, 'Abholadresse ist erforderlich'),
    dropoff_address: z.string().min(1, 'Zieladresse ist erforderlich'),
    driver_id: z.string().optional(),
    is_wheelchair: z.boolean(),
    notes: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.return_mode === 'exact') {
      if (!data.return_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Datum auswählen.',
          path: ['return_date']
        });
      }
      if (!data.return_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Uhrzeit auswählen.',
          path: ['return_time']
        });
      }
    }
  });

type TripFormValues = z.infer<typeof tripFormSchema>;

interface CreateTripFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onClientSelect?: (client: ClientOption | null) => void;
}

export function CreateTripForm({
  onSuccess,
  onCancel,
  onClientSelect
}: CreateTripFormProps) {
  const [selectedClient, setSelectedClient] =
    React.useState<ClientOption | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const hasInitializedReturnDateRef = React.useRef(false);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema) as any,
    defaultValues: {
      payer_id: '',
      billing_type_id: '',
      client_first_name: '',
      client_last_name: '',
      client_phone: '',
      return_mode: 'none',
      return_date: undefined,
      return_time: '',
      pickup_address: '',
      dropoff_address: '',
      driver_id: '__none__',
      is_wheelchair: false,
      notes: ''
    }
  });

  const watchedPayerId = form.watch('payer_id');
  const watchedBillingTypeId = form.watch('billing_type_id');
  const watchedIsWheelchair = form.watch('is_wheelchair');
  const watchedReturnMode = form.watch('return_mode') as ReturnMode;
  const watchedScheduledAt = form.watch('scheduled_at');

  const {
    payers,
    billingTypes,
    drivers,
    isLoading,
    searchClientsByFirstName,
    searchClientsByLastName
  } = useTripFormData(watchedPayerId || null);

  // Reset billing type and client fields when payer changes
  React.useEffect(() => {
    form.setValue('billing_type_id', '');
    form.setValue('client_first_name', '');
    form.setValue('client_last_name', '');
    setSelectedClient(null);
  }, [watchedPayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBillingType = billingTypes.find(
    (bt) => bt.id === watchedBillingTypeId
  );

  // Apply behavior profile defaults and constraints
  React.useEffect(() => {
    if (selectedBillingType?.behavior_profile) {
      const b = selectedBillingType.behavior_profile as any;
      const defaultPickup = b.defaultPickup ?? b.default_pickup;
      const defaultDropoff = b.defaultDropoff ?? b.default_dropoff;

      if (defaultPickup) {
        form.setValue('pickup_address', defaultPickup);
      }
      if (defaultDropoff) {
        form.setValue('dropoff_address', defaultDropoff);
      }
    }
  }, [selectedBillingType, form]); // eslint-disable-line react-hooks/exhaustive-deps

  // When Rückfahrt with exact time is selected, default the return date to the Hinfahrt date (once).
  React.useEffect(() => {
    if (
      watchedReturnMode !== 'exact' ||
      !watchedScheduledAt ||
      hasInitializedReturnDateRef.current
    ) {
      return;
    }

    form.setValue(
      'return_date',
      new Date(
        watchedScheduledAt.getFullYear(),
        watchedScheduledAt.getMonth(),
        watchedScheduledAt.getDate()
      ),
      { shouldValidate: true }
    );
    hasInitializedReturnDateRef.current = true;
  }, [
    watchedReturnMode,
    watchedScheduledAt,
    form,
    hasInitializedReturnDateRef
  ]);

  const behavior = (selectedBillingType?.behavior_profile || {}) as any;
  const isPickupLocked = behavior.lockPickup ?? behavior.lock_pickup;
  const isDropoffLocked = behavior.lockDropoff ?? behavior.lock_dropoff;
  const isPickupPassengerVisible =
    behavior.showPickupPassenger ?? behavior.show_pickup_passenger ?? true;
  const isDropoffPassengerVisible =
    behavior.showDropoffPassenger ?? behavior.show_dropoff_passenger ?? true;

  const handleSubmit = async (values: TripFormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createSupabaseClient();
      const tripGroupId = crypto.randomUUID();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      // Fetch company_id from the users table — required by RLS policy
      let companyId: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id ?? null;
      }

      const shouldCreateReturn =
        values.return_mode === 'time_tbd' || values.return_mode === 'exact';

      const hinTrip = await tripsService.createTrip({
        payer_id: values.payer_id,
        billing_type_id: values.billing_type_id || null,
        client_id: selectedClient?.id || null,
        client_name:
          [values.client_first_name, values.client_last_name]
            .filter(Boolean)
            .join(' ') || null,
        client_phone: values.client_phone || null,
        scheduled_at: values.scheduled_at.toISOString(),
        pickup_address: values.pickup_address,
        dropoff_address: values.dropoff_address,
        driver_id:
          values.driver_id && values.driver_id !== '__none__'
            ? values.driver_id
            : null,
        is_wheelchair: values.is_wheelchair,
        notes: values.notes || null,
        status: 'pending',
        company_id: companyId,
        created_by: user?.id || null,
        stop_updates: [],
        group_id: tripGroupId
      });

      if (shouldCreateReturn) {
        const returnScheduledAt =
          values.return_mode === 'time_tbd'
            ? null
            : (() => {
                const date = values.return_date || values.scheduled_at;
                const [hh, mm] = (values.return_time || '00:00').split(':');
                const scheduled = new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  parseInt(hh || '0', 10),
                  parseInt(mm || '0', 10),
                  0,
                  0
                );
                return scheduled.toISOString();
              })();

        await tripsService.createTrip({
          payer_id: values.payer_id,
          billing_type_id: values.billing_type_id || null,
          client_id: selectedClient?.id || null,
          client_name:
            [values.client_first_name, values.client_last_name]
              .filter(Boolean)
              .join(' ') || null,
          client_phone: values.client_phone || null,
          scheduled_at: returnScheduledAt,
          pickup_address: values.dropoff_address,
          dropoff_address: values.pickup_address,
          driver_id: null,
          is_wheelchair: values.is_wheelchair,
          notes: values.notes || null,
          status: 'pending',
          company_id: companyId,
          created_by: user?.id || null,
          stop_updates: [],
          group_id: tripGroupId,
          linked_trip_id: hinTrip.id
        });

        // Also update the Hin-Trip with the Return-Trip reference for full pairing
        // (Optional, depends on if your DB schema supports late-updating linked_trip_id)
      }

      toast.success(
        shouldCreateReturn
          ? 'Hin- und Rückfahrt erfolgreich erstellt!'
          : 'Fahrt erfolgreich erstellt!'
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClientSectionVisible = !!watchedPayerId;

  return (
    <Form
      form={form as any}
      onSubmit={form.handleSubmit(handleSubmit as any)}
      className='flex flex-col gap-0'
    >
      {/* ── Kostenträger & Abrechnung ── */}
      <div className='px-6 pt-2 pb-4'>
        <div className='mb-3 flex items-center gap-2'>
          <CreditCard className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            Kostenträger
          </span>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <FormField
            control={form.control as any}
            name='payer_id'
            render={({ field }) => (
              <FormItem
                className={cn(
                  watchedPayerId &&
                    billingTypes.length === 0 &&
                    'col-span-2 sm:col-span-1'
                )}
              >
                <FormLabel className='text-xs'>Kostenträger *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className='h-9'>
                      <SelectValue placeholder='Wählen...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {payers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
          {(!watchedPayerId || billingTypes.length > 0) && (
            <FormField
              control={form.control as any}
              name='billing_type_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Abrechnungsart *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchedPayerId}
                  >
                    <FormControl>
                      <SelectTrigger className='h-9'>
                        <SelectValue
                          placeholder={
                            !watchedPayerId
                              ? 'Kostenträger wählen'
                              : 'Wählen...'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billingTypes.map((bt) => (
                        <SelectItem key={bt.id} value={bt.id}>
                          <span className='flex items-center gap-2'>
                            <span
                              className='inline-block h-2 w-2 rounded-full'
                              style={{ backgroundColor: bt.color }}
                            />
                            {bt.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Billing type color chip */}
        {selectedBillingType && (
          <div
            className='mt-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium'
            style={{
              backgroundColor: `color-mix(in srgb, ${selectedBillingType.color}, white 85%)`,
              borderLeft: `3px solid ${selectedBillingType.color}`,
              color: selectedBillingType.color
            }}
          >
            <span
              className='inline-block h-1.5 w-1.5 rounded-full'
              style={{ backgroundColor: selectedBillingType.color }}
            />
            {selectedBillingType.name}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Fahrgast ── */}
      {(isPickupPassengerVisible || isDropoffPassengerVisible) && (
        <div
          className={cn(
            'px-6 py-4 transition-all duration-300',
            !isClientSectionVisible && 'pointer-events-none opacity-40'
          )}
        >
          <div className='mb-3 flex items-center gap-2'>
            <User className='text-muted-foreground h-4 w-4' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Fahrgast
            </span>
            {!isClientSectionVisible && (
              <Badge
                variant='outline'
                className='ml-auto text-[10px] font-normal'
              >
                Kostenträger wählen
              </Badge>
            )}
          </div>
          <div className='grid grid-cols-2 gap-3'>
            {isPickupPassengerVisible && (
              <FormField
                control={form.control as any}
                name='client_first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Vorname</FormLabel>
                    <FormControl>
                      <ClientAutoSuggest
                        value={field.value || ''}
                        onNameChange={(name) => field.onChange(name)}
                        onSelect={(client) => {
                          setSelectedClient(client);
                          onClientSelect?.(client);
                          if (client) {
                            form.setValue(
                              'client_first_name',
                              client.first_name || ''
                            );
                            form.setValue(
                              'client_last_name',
                              client.last_name || ''
                            );
                            form.setValue('client_phone', client.phone || '');
                            if (!isPickupLocked) {
                              form.setValue(
                                'pickup_address',
                                `${client.street} ${client.street_number}, ${client.zip_code} ${client.city}`
                              );
                            }
                          }
                        }}
                        searchClients={searchClientsByFirstName}
                        disabled={!isClientSectionVisible}
                        placeholder='Vorname suchen...'
                        getDisplayValue={(c) =>
                          c.first_name || c.company_name || ''
                        }
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            )}
            {isDropoffPassengerVisible && (
              <FormField
                control={form.control as any}
                name='client_last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Nachname</FormLabel>
                    <FormControl>
                      <ClientAutoSuggest
                        value={field.value || ''}
                        onNameChange={(name) => field.onChange(name)}
                        onSelect={(client) => {
                          setSelectedClient(client);
                          onClientSelect?.(client);
                          if (client) {
                            form.setValue(
                              'client_first_name',
                              client.first_name || ''
                            );
                            form.setValue(
                              'client_last_name',
                              client.last_name || ''
                            );
                            form.setValue('client_phone', client.phone || '');
                            if (!isPickupLocked) {
                              form.setValue(
                                'pickup_address',
                                `${client.street} ${client.street_number}, ${client.zip_code} ${client.city}`
                              );
                            }
                          }
                        }}
                        searchClients={searchClientsByLastName}
                        disabled={!isClientSectionVisible}
                        placeholder='Nachname suchen...'
                        getDisplayValue={(c) =>
                          c.last_name || c.company_name || ''
                        }
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control as any}
              name='client_phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Telefon</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='+49 ...'
                      className='h-9'
                      disabled={!isClientSectionVisible}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* ── Zeit & Route ── */}
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
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          {/* ── Rückfahrt ── */}
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
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className='w-full'
                    >
                      <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='none' className='text-xs'>
                          Keine
                        </TabsTrigger>
                        <TabsTrigger value='time_tbd' className='text-xs'>
                          Rückfahrt mit Zeitabsprache
                        </TabsTrigger>
                        <TabsTrigger value='exact' className='text-xs'>
                          Rückfahrt mit genauer Zeit
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              {watchedReturnMode === 'exact' && (
                <div className='grid grid-cols-2 gap-3'>
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

          <FormField
            control={form.control as any}
            name='pickup_address'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>Abholadresse *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <MapPin className='pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500' />
                    <Input
                      {...field}
                      placeholder='Straße, PLZ Ort'
                      className='h-9 pl-9'
                      disabled={isPickupLocked}
                    />
                  </div>
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name='dropoff_address'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>Zieladresse *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Navigation className='pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-rose-500' />
                    <Input
                      {...field}
                      placeholder='Straße, PLZ Ort'
                      className='h-9 pl-9'
                      disabled={isDropoffLocked}
                    />
                  </div>
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* ── Fahrer & Extras ── */}
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
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

      {/* ── Footer ── */}
      <div className='bg-muted/30 flex items-center justify-end gap-2 border-t px-6 py-4'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Abbrechen
        </Button>
        <Button
          type='submit'
          size='sm'
          disabled={isSubmitting}
          className='gap-1.5'
        >
          {isSubmitting ? (
            <>
              <span className='border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
              Erstellt...
            </>
          ) : (
            <>
              Fahrt erstellen
              <ChevronRight className='h-3.5 w-3.5' />
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}
