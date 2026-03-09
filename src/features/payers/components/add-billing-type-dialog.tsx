'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useBillingTypes } from '../hooks/use-billing-types';
import { cn } from '@/lib/utils';
import type { BillingType } from '../types/payer.types';

// Same preset colors used in the flutter app
const PRESET_COLORS = [
  '#26A69A', // Teal
  '#42A5F5', // Blue
  '#EF5350', // Red
  '#AB47BC', // Purple
  '#FF7043', // Deep Orange
  '#FFCA28', // Amber
  '#66BB6A', // Green
  '#8D6E63', // Brown
  '#78909C', // Blue Grey
  '#EC407A', // Pink
  '#29B6F6', // Light Blue
  '#D4E157' // Lime
];

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name ist zu kurz' }),
  color: z.string()
});

type FormValues = z.infer<typeof formSchema>;

interface AddBillingTypeDialogProps {
  payerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBillingTypes: BillingType[];
}

export function AddBillingTypeDialog({
  payerId,
  open,
  onOpenChange,
  existingBillingTypes
}: AddBillingTypeDialogProps) {
  const { createBillingType, isCreating } = useBillingTypes(payerId);

  // Compute used colors to gently push the user toward unused ones (we don't strictly forbid reuse)
  const usedColors = new Set(
    existingBillingTypes.map((bt) => bt.color.toUpperCase())
  );
  const availableColors = PRESET_COLORS.filter((c) => !usedColors.has(c));

  // Default to first available color, or just the first color if all are used
  const defaultSelectedColor =
    availableColors.length > 0 ? availableColors[0] : PRESET_COLORS[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: defaultSelectedColor
    }
  });

  // Reset form when dialog opens with a new default color
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const currentAvailableColors = PRESET_COLORS.filter(
        (c) =>
          !new Set(
            existingBillingTypes.map((bt) => bt.color.toUpperCase())
          ).has(c)
      );
      form.reset({
        name: '',
        color:
          currentAvailableColors.length > 0
            ? currentAvailableColors[0]
            : PRESET_COLORS[0]
      });
    }
    onOpenChange(newOpen);
  };

  async function onSubmit(data: FormValues) {
    try {
      await createBillingType({ name: data.name, color: data.color });
      toast.success('Abrechnungsart erstellt');
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Erstellen der Abrechnungsart');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isCreating && handleOpenChange(val)}
    >
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Neue Abrechnungsart</DialogTitle>
        </DialogHeader>
        <Form
          {...form}
          form={form as any}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bezeichnung</FormLabel>
                <FormControl>
                  <Input
                    placeholder='z.B. Konsil, Anreise...'
                    {...field}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='color'
            render={({ field }) => (
              <FormItem>
                <div className='mb-3 flex items-center'>
                  <FormLabel className='mr-3 mb-0'>Farbe</FormLabel>
                  <div
                    className='h-5 w-5 rounded-full shadow-sm ring-2 ring-transparent ring-offset-2 transition-colors'
                    style={{ backgroundColor: field.value }}
                  />
                </div>
                <FormControl>
                  <div className='flex flex-wrap gap-3'>
                    {PRESET_COLORS.map((color) => {
                      const isSelected = field.value === color;
                      const isUsed = usedColors.has(color);

                      // Don't show used colors to keep the UI clean, unless there are very few left
                      if (isUsed && availableColors.length > 2) return null;

                      return (
                        <div
                          key={color}
                          onClick={() => field.onChange(color)}
                          className={cn(
                            'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all',
                            'hover:scale-110',
                            isSelected
                              ? 'ring-foreground ring-2 ring-offset-2'
                              : '',
                            isUsed ? 'opacity-40' : ''
                          )}
                          style={{ backgroundColor: color }}
                          title={isUsed ? 'Bereits verwendet' : 'Auswählen'}
                        >
                          {isSelected && (
                            <Check className='h-5 w-5 text-white' />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Abbrechen
            </Button>
            <Button type='submit' disabled={isCreating}>
              {isCreating ? (
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
