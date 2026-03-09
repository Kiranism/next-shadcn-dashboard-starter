'use client';

import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from 'sonner';
import { usePayers } from '../hooks/use-payers';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name ist zu kurz' }),
  number: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface AddPayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPayerDialog({ open, onOpenChange }: AddPayerDialogProps) {
  const { createPayer, isCreating } = usePayers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      number: ''
    }
  });

  async function onSubmit(data: FormValues) {
    try {
      await createPayer({ name: data.name, number: data.number || '' });
      toast.success('Kostenträger erstellt');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Erstellen des Kostenträgers');
    }
  }

  // Handle dialog close properly and reset form state
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isCreating) {
      form.reset();
      onOpenChange(false);
    } else if (newOpen) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Neuer Kostenträger</DialogTitle>
        </DialogHeader>
        <Form
          {...form}
          form={form as any}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='z.B. AOK Bayern' {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kostenträgernummer</FormLabel>
                <FormControl>
                  <Input placeholder='z.B. 108433428 (Optional)' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className='pt-4'>
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
