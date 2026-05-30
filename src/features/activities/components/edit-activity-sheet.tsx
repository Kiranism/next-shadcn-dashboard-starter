'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FieldLabel } from '@/components/ui/field';
import { FormFieldSet, FormField, FormFieldError } from '@/components/ui/form-context';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { ActivitiesRepository } from '@/repositories/activities.repository';
import type { Activity } from '@/repositories/activities.repository';
import { toUserMessage } from '@/lib/api-client';
import { TimeSelect } from './time-select';
import { DateField } from './date-field';

const priorityOptions = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' }
];

const editSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    date: z
      .string()
      .min(1, 'Data é obrigatória')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    time_start: z
      .string()
      .min(1, 'Hora de início é obrigatória')
      .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    time_end: z
      .string()
      .min(1, 'Hora de fim é obrigatória')
      .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    priority: z.enum(['alta', 'media', 'baixa'])
  })
  .refine((v) => v.time_end > v.time_start, {
    message: 'Hora de fim deve ser após o início',
    path: ['time_end']
  });

type EditFormValues = z.infer<typeof editSchema>;

interface EditActivitySheetProps {
  activity: Activity | null;
  onClose: () => void;
}

export function EditActivitySheet({ activity, onClose }: EditActivitySheetProps) {
  const [allDay, setAllDay] = useState(false);
  const updateMutation = ActivitiesRepository.useUpdateActivity();
  const { FormSelectField, FormTextareaField } = useFormFields<EditFormValues>();

  const form = useAppForm({
    defaultValues: {
      name: activity?.name ?? '',
      description: activity?.description ?? '',
      date: activity?.date ?? '',
      time_start: activity?.time_start ?? '',
      time_end: activity?.time_end ?? '',
      priority: (activity?.priority ?? 'media') as EditFormValues['priority']
    } as EditFormValues,
    validators: { onSubmit: editSchema },
    onSubmit: ({ value }) => {
      if (!activity) return;
      updateMutation.mutate(
        { id: activity.id, data: value },
        {
          onSuccess: () => {
            toast.success('Atividade atualizada');
            onClose();
          },
          onError: (err: Error) => toast.error(toUserMessage(err))
        }
      );
    }
  });

  useEffect(() => {
    if (activity) {
      form.setFieldValue('name', activity.name);
      form.setFieldValue('description', activity.description ?? '');
      form.setFieldValue('date', activity.date);
      form.setFieldValue('time_start', activity.time_start);
      form.setFieldValue('time_end', activity.time_end);
      form.setFieldValue('priority', activity.priority);
      setAllDay(activity.time_start === '00:00' && activity.time_end === '23:59');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id]);

  return (
    <Sheet
      open={!!activity}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Editar atividade</SheetTitle>
          <SheetDescription>Atualize os dados do compromisso</SheetDescription>
        </SheetHeader>

        <form.AppForm>
          <form.Form className='gap-5 p-0 md:p-0'>
            <form.AppField name='name'>
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel htmlFor='edit-name'>Nome *</FieldLabel>
                    <Input
                      id='edit-name'
                      type='text'
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </FormField>
                  <FormFieldError />
                </FormFieldSet>
              )}
            </form.AppField>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <form.AppField name='date'>
                {(field) => (
                  <FormFieldSet>
                    <FormField>
                      <FieldLabel htmlFor='edit-date'>Data</FieldLabel>
                      <DateField
                        id='edit-date'
                        value={field.state.value}
                        onChange={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                    </FormField>
                    <FormFieldError />
                  </FormFieldSet>
                )}
              </form.AppField>

              <FormSelectField name='priority' label='Prioridade' options={priorityOptions} />
            </div>

            <FormTextareaField name='description' label='Descrição' />

            <div className='flex items-center gap-2'>
              <Checkbox
                id='edit-all-day'
                checked={allDay}
                onCheckedChange={(checked) => {
                  const on = !!checked;
                  setAllDay(on);
                  if (on) {
                    form.setFieldValue('time_start', '00:00');
                    form.setFieldValue('time_end', '23:59');
                  } else {
                    form.setFieldValue('time_start', '');
                    form.setFieldValue('time_end', '');
                  }
                }}
              />
              <Label htmlFor='edit-all-day' className='cursor-pointer text-sm my-2'>
                O dia todo
              </Label>
            </div>

            {!allDay && (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <form.AppField name='time_start'>
                  {(field) => (
                    <FormFieldSet>
                      <FormField>
                        <FieldLabel>Início *</FieldLabel>
                        <TimeSelect value={field.state.value} onChange={field.handleChange} />
                      </FormField>
                      <FormFieldError />
                    </FormFieldSet>
                  )}
                </form.AppField>

                <form.AppField name='time_end'>
                  {(field) => (
                    <FormFieldSet>
                      <FormField>
                        <FieldLabel>Fim *</FieldLabel>
                        <TimeSelect value={field.state.value} onChange={field.handleChange} />
                      </FormField>
                      <FormFieldError />
                    </FormFieldSet>
                  )}
                </form.AppField>
              </div>
            )}

            <div className='flex justify-end pt-1 my-2'>
              <form.SubmitButton className='w-full sm:w-auto'>Salvar alterações</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </SheetContent>
    </Sheet>
  );
}
