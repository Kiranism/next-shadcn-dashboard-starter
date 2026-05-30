'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { FormFieldSet, FormField, FormFieldError } from '@/components/ui/form-context';
import { Icons } from '@/components/icons';
import { ActivitiesRepository } from '@/repositories/activities.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { TimeSelect } from './time-select';
import { DateField } from './date-field';

const priorityOptions = [
  {
    value: 'alta',
    label: 'Alta',
    dot: 'bg-red-500',
    active: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
  },
  {
    value: 'media',
    label: 'Média',
    dot: 'bg-orange-500',
    active: 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
  },
  {
    value: 'baixa',
    label: 'Baixa',
    dot: 'bg-blue-500',
    active: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
  }
] as const;

const activitySchema = z
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

type ActivityFormValues = z.infer<typeof activitySchema>;

const defaultValues: ActivityFormValues = {
  name: '',
  description: '',
  date: '',
  time_start: '',
  time_end: '',
  priority: 'media'
};

interface ActivityFormCardProps {
  selectedDate?: string;
}

export function ActivityFormCard({ selectedDate }: ActivityFormCardProps) {
  const [allDay, setAllDay] = useState(false);
  const createMutation = ActivitiesRepository.useCreateActivity();
  const { FormTextareaField } = useFormFields<ActivityFormValues>();

  // Keep the latest selected day available inside callbacks without re-creating the form.
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const form = useAppForm({
    defaultValues: {
      ...defaultValues,
      date: selectedDate ?? ''
    } as ActivityFormValues,
    validators: { onSubmit: activitySchema },
    onSubmit: ({ value }) => {
      createMutation.mutate(
        {
          name: value.name,
          description: value.description || undefined,
          date: value.date,
          time_start: value.time_start,
          time_end: value.time_end,
          priority: value.priority
        },
        {
          onSuccess: () => {
            toast.success('Atividade criada com sucesso');
            form.reset();
            form.setFieldValue('date', selectedDateRef.current ?? '');
            setAllDay(false);
          },
          onError: (err: Error) => toast.error(toUserMessage(err))
        }
      );
    }
  });

  // Mirror the day picked on the calendar into the date field.
  useEffect(() => {
    if (selectedDate) form.setFieldValue('date', selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <Icons.add className='size-5' />
          </span>
          <div className='min-w-0'>
            <CardTitle className='text-base font-semibold'>Novo compromisso</CardTitle>
            <CardDescription>Preencha os dados da atividade</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-1'>
        <form.AppForm>
          <form.Form className='gap-6 p-0 md:p-0'>
            {/* Name — full width */}
            <form.AppField name='name'>
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel htmlFor='activity-name'>Nome da atividade *</FieldLabel>
                    <Input
                      id='activity-name'
                      type='text'
                      placeholder='Ex: Prova de Sistemas'
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </FormField>
                  <FormFieldError />
                </FormFieldSet>
              )}
            </form.AppField>

            {/* Date */}
            <form.AppField name='date'>
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel htmlFor='activity-date' className={'mt-2'}>
                      Data *
                    </FieldLabel>
                    <DateField
                      id='activity-date'
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                    />
                  </FormField>
                  <FormFieldError />
                </FormFieldSet>
              )}
            </form.AppField>

            {/* Priority — segmented control */}
            <form.AppField name='priority'>
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel className='mt-2'>Prioridade</FieldLabel>
                    <div className='grid grid-cols-3 gap-2'>
                      {priorityOptions.map((opt) => {
                        const isActive = field.state.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type='button'
                            aria-pressed={isActive}
                            onClick={() => field.handleChange(opt.value)}
                            className={cn(
                              'flex h-9 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors',
                              isActive
                                ? opt.active
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            <span className={cn('size-2 rounded-full', opt.dot)} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </FormFieldSet>
              )}
            </form.AppField>

            {/* Time range */}
            <FormFieldSet>
              <div className='flex items-center justify-between'>
                <FieldLabel>Horário *</FieldLabel>
                <div className='flex items-center gap-2 my-4'>
                  <Checkbox
                    id='all-day'
                    className='size-4'
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
                  <Label
                    htmlFor='all-day'
                    className='text-muted-foreground cursor-pointer text-xs font-normal'
                  >
                    O dia todo
                  </Label>
                </div>
              </div>

              {!allDay && (
                <div className='grid grid-cols-2 gap-3'>
                  <form.AppField name='time_start'>
                    {(field) => (
                      <FormFieldSet>
                        <FormField>
                          <span className='text-muted-foreground text-xs'>Início</span>
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
                          <span className='text-muted-foreground text-xs'>Fim</span>
                          <TimeSelect value={field.state.value} onChange={field.handleChange} />
                        </FormField>
                        <FormFieldError />
                      </FormFieldSet>
                    )}
                  </form.AppField>
                </div>
              )}
            </FormFieldSet>

            {/* Description */}
            <div className='mt-2'>
              <FormTextareaField
                name='description'
                label='Descrição'
                placeholder='Detalhes do compromisso (opcional)'
              />
            </div>

            <form.SubmitButton className='mt-1 w-full my-4'>
              <Icons.add className='size-4' />
              Adicionar atividade
            </form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
