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

const formSchema = z.object({
  returnPolicy: z.enum(['none', 'create_placeholder', 'create_on_demand']),
  lockPickup: z.boolean(),
  lockDropoff: z.boolean(),
  prefillDropoffFromPickup: z.boolean(),
  showPickupPassenger: z.boolean(),
  showDropoffPassenger: z.boolean(),
  defaultPickup: z.string().optional().nullable(),
  defaultDropoff: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

import { ScrollArea } from '@/components/ui/scroll-area';

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
      lockPickup: false,
      lockDropoff: false,
      prefillDropoffFromPickup: false,
      showPickupPassenger: true,
      showDropoffPassenger: true,
      defaultPickup: '',
      defaultDropoff: ''
    }
  });

  // Effect to update form values when the billing type changes
  useEffect(() => {
    if (billingType?.behavior_profile) {
      const b = billingType.behavior_profile as any;
      form.reset({
        returnPolicy: b.returnPolicy || b.return_policy || 'none',
        lockPickup: !!(b.lockPickup ?? b.lock_pickup),
        lockDropoff: !!(b.lockDropoff ?? b.lock_dropoff),
        prefillDropoffFromPickup: !!(
          b.prefillDropoffFromPickup ?? b.prefill_dropoff_from_pickup
        ),
        showPickupPassenger:
          b.showPickupPassenger ?? b.show_pickup_passenger ?? true,
        showDropoffPassenger:
          b.showDropoffPassenger ?? b.show_dropoff_passenger ?? true,
        defaultPickup: b.defaultPickup ?? b.default_pickup ?? '',
        defaultDropoff: b.defaultDropoff ?? b.default_dropoff ?? ''
      });
    }
  }, [billingType, form]);

  async function onSubmit(data: FormValues) {
    if (!billingType) return;

    try {
      // Clean up empty strings to null for the DB
      const processedData: BillingTypeBehavior = {
        ...data,
        defaultPickup: data.defaultPickup?.trim() || null,
        defaultDropoff: data.defaultDropoff?.trim() || null
      };

      await updateBehavior({ id: billingType.id, behavior: processedData });
      toast.success('Verhalten aktualisiert');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
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
              <FormField
                control={form.control}
                name='returnPolicy'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rückfahrt-Strategie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Wähle eine Strategie' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>Keine Rückfahrt</SelectItem>
                        <SelectItem value='create_placeholder'>
                          Rückfahrt sofort als Platzhalter
                        </SelectItem>
                        <SelectItem value='create_on_demand'>
                          Rückfahrt erst bei Bedarf
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <Input
                          placeholder='Optional'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h4 className='mb-3 text-sm leading-none font-medium'>Ziel</h4>
                <FormField
                  control={form.control}
                  name='prefillDropoffFromPickup'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Ziel mit Abholung vorbefüllen</FormLabel>
                        <FormDescription>
                          Kopiert die Abholadresse ins Ziel (gut für Konsil).
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
                        <Input
                          placeholder='Optional'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h4 className='mb-3 text-sm leading-none font-medium'>
                  Fahrgast
                </h4>
                <FormField
                  control={form.control}
                  name='showPickupPassenger'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Name bei Abholung</FormLabel>
                        <FormDescription>
                          Namenseingabefeld im Abholbereich anzeigen.
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
                  name='showDropoffPassenger'
                  render={({ field }) => (
                    <FormItem className='bg-background flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Name bei Ziel</FormLabel>
                        <FormDescription>
                          Namenseingabefeld im Zielbereich anzeigen.
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
