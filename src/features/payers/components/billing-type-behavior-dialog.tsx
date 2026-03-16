'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useBillingTypes } from '../hooks/use-billing-types';
import type { BillingType, BillingTypeBehavior } from '../types/payer.types';
import {
  AddressAutocomplete,
  type AddressResult
} from '@/features/trips/components/address-autocomplete';

const formSchema = z.object({
  returnPolicy: z.enum(['none', 'time_tbd', 'exact']),
  lockReturnMode: z.boolean(),
  lockPickup: z.boolean(),
  lockDropoff: z.boolean(),
  prefillDropoffFromPickup: z.boolean(),
  requirePassenger: z.boolean(),
  defaultPickup: z.string().optional().nullable(),
  defaultPickupStreet: z.string().optional().nullable(),
  defaultPickupStreetNumber: z.string().optional().nullable(),
  defaultPickupZip: z.string().optional().nullable(),
  defaultPickupCity: z.string().optional().nullable(),
  defaultDropoff: z.string().optional().nullable(),
  defaultDropoffStreet: z.string().optional().nullable(),
  defaultDropoffStreetNumber: z.string().optional().nullable(),
  defaultDropoffZip: z.string().optional().nullable(),
  defaultDropoffCity: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

/** Normalises legacy DB values to the current type-safe values. */
function normaliseBehavior(b: any): FormValues {
  let returnPolicy: 'none' | 'time_tbd' | 'exact' = 'none';
  const raw = b.returnPolicy ?? b.return_policy ?? 'none';
  if (raw === 'create_placeholder') returnPolicy = 'time_tbd';
  else if (raw === 'time_tbd') returnPolicy = 'time_tbd';
  else if (raw === 'exact') returnPolicy = 'exact';
  else returnPolicy = 'none';

  // Legacy: if either passenger flag was false, requirePassenger = false
  const legacyPassenger =
    b.showPickupPassenger ?? b.show_pickup_passenger ?? true;
  const legacyDropoffPassenger =
    b.showDropoffPassenger ?? b.show_dropoff_passenger ?? true;
  const requirePassenger =
    b.requirePassenger !== undefined
      ? !!b.requirePassenger
      : legacyPassenger && legacyDropoffPassenger;

  return {
    returnPolicy,
    lockReturnMode: !!(b.lockReturnMode ?? b.lock_return_mode ?? false),
    lockPickup: !!(b.lockPickup ?? b.lock_pickup ?? false),
    lockDropoff: !!(b.lockDropoff ?? b.lock_dropoff ?? false),
    prefillDropoffFromPickup: !!(
      b.prefillDropoffFromPickup ??
      b.prefill_dropoff_from_pickup ??
      false
    ),
    requirePassenger,
    defaultPickup: b.defaultPickup ?? b.default_pickup ?? '',
    defaultPickupStreet: b.defaultPickupStreet ?? b.default_pickup_street ?? '',
    defaultPickupStreetNumber:
      b.defaultPickupStreetNumber ?? b.default_pickup_street_number ?? '',
    defaultPickupZip: b.defaultPickupZip ?? b.default_pickup_zip ?? '',
    defaultPickupCity: b.defaultPickupCity ?? b.default_pickup_city ?? '',
    defaultDropoff: b.defaultDropoff ?? b.default_dropoff ?? '',
    defaultDropoffStreet:
      b.defaultDropoffStreet ?? b.default_dropoff_street ?? '',
    defaultDropoffStreetNumber:
      b.defaultDropoffStreetNumber ?? b.default_dropoff_street_number ?? '',
    defaultDropoffZip: b.defaultDropoffZip ?? b.default_dropoff_zip ?? '',
    defaultDropoffCity: b.defaultDropoffCity ?? b.default_dropoff_city ?? ''
  };
}

interface BillingTypeBehaviorDialogProps {
  payerId: string;
  billingType: BillingType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingTypeBehaviorDialog({
  payerId,
  billingType,
  open,
  onOpenChange
}: BillingTypeBehaviorDialogProps) {
  const { updateBehavior, isUpdatingBehavior } = useBillingTypes(payerId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      returnPolicy: 'none',
      lockReturnMode: false,
      lockPickup: false,
      lockDropoff: false,
      prefillDropoffFromPickup: false,
      requirePassenger: true,
      defaultPickup: '',
      defaultPickupStreet: '',
      defaultPickupStreetNumber: '',
      defaultPickupZip: '',
      defaultPickupCity: '',
      defaultDropoff: '',
      defaultDropoffStreet: '',
      defaultDropoffStreetNumber: '',
      defaultDropoffZip: '',
      defaultDropoffCity: ''
    }
  });

  const watchedReturnPolicy = form.watch('returnPolicy');

  useEffect(() => {
    if (billingType?.behavior_profile) {
      form.reset(normaliseBehavior(billingType.behavior_profile));
    }
  }, [billingType, form]);

  async function onSubmit(data: FormValues) {
    if (!billingType) return;
    try {
      const processedData: BillingTypeBehavior = {
        ...data,
        defaultPickup: data.defaultPickup?.trim() || null,
        defaultPickupStreet: data.defaultPickupStreet?.trim() || null,
        defaultPickupStreetNumber:
          data.defaultPickupStreetNumber?.trim() || null,
        defaultPickupZip: data.defaultPickupZip?.trim() || null,
        defaultPickupCity: data.defaultPickupCity?.trim() || null,
        defaultDropoff: data.defaultDropoff?.trim() || null,
        defaultDropoffStreet: data.defaultDropoffStreet?.trim() || null,
        defaultDropoffStreetNumber:
          data.defaultDropoffStreetNumber?.trim() || null,
        defaultDropoffZip: data.defaultDropoffZip?.trim() || null,
        defaultDropoffCity: data.defaultDropoffCity?.trim() || null
      };
      await updateBehavior({ id: billingType.id, behavior: processedData });
      toast.success('Verhalten aktualisiert');
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Verhaltens');
    }
  }

  if (!billingType) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isUpdatingBehavior && onOpenChange(val)}
    >
      <DialogContent className='flex max-h-[90vh] flex-col p-0 sm:max-w-2xl'>
        <DialogHeader className='px-6 pt-6 pb-2'>
          <DialogTitle>Verhalten: {billingType.name}</DialogTitle>
        </DialogHeader>

        <Form
          {...form}
          form={form as any}
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-1 flex-col overflow-hidden text-left'
        >
          <div className='min-h-0 flex-1 overflow-y-auto px-6'>
            <div className='space-y-6 pt-2 pb-6'>
              {/* ── Rückfahrt-Strategie ── */}
              <FormField
                control={form.control}
                name='returnPolicy'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rückfahrt-Strategie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Wähle eine Strategie' />
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
                    <FormDescription>
                      Dieser Modus wird beim Erstellen einer Fahrt automatisch
                      vorausgewählt.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedReturnPolicy !== 'none' && (
                <FormField
                  control={form.control}
                  name='lockReturnMode'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Rückfahrtmodus sperren</FormLabel>
                        <FormDescription>
                          Dispatcher kann den Rückfahrtmodus im Formular nicht
                          ändern.
                        </FormDescription>
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

              {/* ── Abholung ── */}
              <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h4 className='mb-3 text-sm leading-none font-medium'>
                  Abholung
                </h4>
                <FormField
                  control={form.control}
                  name='lockPickup'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Abholadresse sperren</FormLabel>
                        <FormDescription>
                          Adresse ist im Trip-Formular nicht editierbar.
                        </FormDescription>
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
                <FormField
                  control={form.control}
                  name='defaultPickup'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard-Abholadresse</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={(result: AddressResult | string) => {
                            if (typeof result === 'string') {
                              field.onChange(result);
                            } else {
                              // Use the full formatted address, but prefer structured pieces when available
                              const streetPart = [
                                result.street,
                                result.street_number
                              ]
                                .filter(Boolean)
                                .join(' ');
                              const cityPart = [result.zip_code, result.city]
                                .filter(Boolean)
                                .join(' ');
                              const full =
                                result.address ||
                                [streetPart, cityPart]
                                  .filter(Boolean)
                                  .join(', ');
                              field.onChange(full);
                              form.setValue(
                                'defaultPickupStreet',
                                result.street || ''
                              );
                              form.setValue(
                                'defaultPickupStreetNumber',
                                result.street_number || ''
                              );
                              form.setValue(
                                'defaultPickupZip',
                                result.zip_code || ''
                              );
                              form.setValue(
                                'defaultPickupCity',
                                result.city || ''
                              );
                            }
                          }}
                          placeholder='Optional'
                          className='h-8 text-[11px]'
                        />
                      </FormControl>
                      <div className='mt-2 grid grid-cols-4 gap-2'>
                        <FormField
                          control={form.control}
                          name='defaultPickupStreet'
                          render={({ field: f }) => (
                            <FormItem className='col-span-2'>
                              <FormLabel className='text-[11px]'>
                                Straße
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='defaultPickupStreetNumber'
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className='text-[11px]'>Nr.</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='defaultPickupZip'
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className='text-[11px]'>PLZ</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='mt-2 grid grid-cols-4 gap-2'>
                        <FormField
                          control={form.control}
                          name='defaultPickupCity'
                          render={({ field: f }) => (
                            <FormItem className='col-span-4'>
                              <FormLabel className='text-[11px]'>
                                Stadt
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormDescription className='mt-2'>
                        Vorgabe für Abholadresse im Fahrtenformular (z. B.
                        Heim).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Ziel ── */}
              <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h4 className='mb-3 text-sm leading-none font-medium'>Ziel</h4>
                <FormField
                  control={form.control}
                  name='prefillDropoffFromPickup'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>
                          Zieladresse aus Abholadresse übernehmen
                        </FormLabel>
                        <FormDescription>
                          Kopiert die Abholadresse ins Ziel (z. B. für Konsil).
                        </FormDescription>
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
                <FormField
                  control={form.control}
                  name='lockDropoff'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Zieladresse sperren</FormLabel>
                        <FormDescription>
                          Adresse ist im Trip-Formular nicht editierbar.
                        </FormDescription>
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
                <FormField
                  control={form.control}
                  name='defaultDropoff'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard-Zieladresse</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={(result: AddressResult | string) => {
                            if (typeof result === 'string') {
                              field.onChange(result);
                            } else {
                              const streetPart = [
                                result.street,
                                result.street_number
                              ]
                                .filter(Boolean)
                                .join(' ');
                              const cityPart = [result.zip_code, result.city]
                                .filter(Boolean)
                                .join(' ');
                              const full =
                                result.address ||
                                [streetPart, cityPart]
                                  .filter(Boolean)
                                  .join(', ');
                              field.onChange(full);
                              form.setValue(
                                'defaultDropoffStreet',
                                result.street || ''
                              );
                              form.setValue(
                                'defaultDropoffStreetNumber',
                                result.street_number || ''
                              );
                              form.setValue(
                                'defaultDropoffZip',
                                result.zip_code || ''
                              );
                              form.setValue(
                                'defaultDropoffCity',
                                result.city || ''
                              );
                            }
                          }}
                          placeholder='Optional'
                          className='h-8 text-[11px]'
                        />
                      </FormControl>
                      <div className='mt-2 grid grid-cols-4 gap-2'>
                        <FormField
                          control={form.control}
                          name='defaultDropoffStreet'
                          render={({ field: f }) => (
                            <FormItem className='col-span-2'>
                              <FormLabel className='text-[11px]'>
                                Straße
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='defaultDropoffStreetNumber'
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className='text-[11px]'>Nr.</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='defaultDropoffZip'
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className='text-[11px]'>PLZ</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='mt-2 grid grid-cols-4 gap-2'>
                        <FormField
                          control={form.control}
                          name='defaultDropoffCity'
                          render={({ field: f }) => (
                            <FormItem className='col-span-4'>
                              <FormLabel className='text-[11px]'>
                                Stadt
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  value={f.value || ''}
                                  className='h-7 text-[11px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormDescription className='mt-2'>
                        Vorgabe für Zieladresse im Fahrtenformular (z. B.
                        Klinik).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Fahrgast ── */}
              <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h4 className='mb-3 text-sm leading-none font-medium'>
                  Fahrgast
                </h4>
                <FormField
                  control={form.control}
                  name='requirePassenger'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Fahrgastname erforderlich</FormLabel>
                        <FormDescription>
                          Wenn deaktiviert, werden Fahrgast-Felder im Formular
                          ausgeblendet. Die Fahrt wird ohne Namen erstellt.
                        </FormDescription>
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
              </div>
            </div>
          </div>

          <DialogFooter className='bg-muted/10 border-t px-6 py-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isUpdatingBehavior}
            >
              Abbrechen
            </Button>
            <Button type='submit' disabled={isUpdatingBehavior}>
              {isUpdatingBehavior ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Speichern...
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
