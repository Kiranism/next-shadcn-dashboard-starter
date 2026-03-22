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
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTripFormSections } from '../trip-form-sections-context';

export function CreateTripPayerSection() {
  const {
    form,
    watchedPayerId,
    billingTypes,
    payers,
    isLoading,
    selectedBillingType
  } = useTripFormSections();

  return (
    <div data-create-trip-section='payer' className='px-6 pt-4 pb-4'>
      <div className='mb-3 flex items-center gap-2'>
        <CreditCard className='text-muted-foreground h-4 w-4' />
        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Kostenträger
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2 sm:gap-3'>
        <FormField
          control={form.control as any}
          name='payer_id'
          render={({ field }) => (
            <FormItem
              className={cn(
                'min-w-0',
                (!watchedPayerId || billingTypes.length === 0) && 'col-span-2'
              )}
            >
              <FormLabel className='text-xs'>Kostenträger *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className='h-9 w-full min-w-0 text-base md:text-sm'>
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
        {watchedPayerId && billingTypes.length > 0 && (
          <FormField
            control={form.control as any}
            name='billing_type_id'
            render={({ field }) => (
              <FormItem className='min-w-0'>
                <FormLabel className='text-xs'>Abrechnungsart</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='h-9 w-full min-w-0 text-base md:text-sm'>
                      <SelectValue placeholder='Wählen...' />
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
  );
}
