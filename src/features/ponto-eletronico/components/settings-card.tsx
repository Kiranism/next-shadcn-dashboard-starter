'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SettingsRepository } from '@/repositories/settings.repository';
import { toUserMessage } from '@/lib/api-client';

interface SettingRowProps {
  label: string;
  description: string;
  displayValue: string;
  isLoading: boolean;
  canEdit: boolean;
  isEditing: boolean;
  editValue: string;
  isPending: boolean;
  inputMin?: number;
  inputMax?: number;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChangeValue: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function SettingRow({
  label,
  description,
  displayValue,
  isLoading,
  canEdit,
  isEditing,
  editValue,
  isPending,
  inputMin = 0,
  inputMax,
  onStartEdit,
  onSave,
  onCancel,
  onChangeValue,
  onKeyDown
}: SettingRowProps) {
  return (
    <div className='space-y-2'>
      <div>
        <p className='text-sm font-medium leading-none'>{label}</p>
        <p className='text-muted-foreground mt-1 text-xs leading-snug'>{description}</p>
      </div>
      {isLoading ? (
        <Skeleton className='h-9 w-full' />
      ) : isEditing && canEdit ? (
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Input
              type='number'
              min={inputMin}
              max={inputMax}
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
              className='pr-8'
            />
            <span className='text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm'>
              h
            </span>
          </div>
          <Button onClick={onSave} disabled={isPending} size='default'>
            {isPending ? <Icons.spinner className='size-4 animate-spin' /> : 'OK'}
          </Button>
          <Button variant='ghost' onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className='flex items-center justify-between'>
          <div className='flex items-end gap-1.5'>
            <span className='text-3xl font-bold tabular-nums'>{displayValue}</span>
            <span className='text-muted-foreground pb-1 text-sm'>horas / semana</span>
          </div>
          {canEdit && (
            <Button variant='ghost' size='sm' onClick={onStartEdit}>
              <Icons.edit className='mr-1.5 size-3.5' />
              Editar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsCard() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 3;

  const { data: settings, isLoading } = SettingsRepository.useSettings();
  const mutation = SettingsRepository.useUpdateSettings();

  const [weekEditing, setWeekEditing] = useState(false);
  const [weekValue, setWeekValue] = useState('');

  const [availEditing, setAvailEditing] = useState(false);
  const [availValue, setAvailValue] = useState('');

  function startWeekEdit() {
    setWeekValue(String(settings?.min_week_hours ?? ''));
    setWeekEditing(true);
  }

  function saveWeek() {
    const parsed = parseInt(weekValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      toast.error('Informe um número inteiro maior que 0');
      return;
    }
    mutation.mutate(
      { min_week_hours: parsed },
      {
        onSuccess: (updated) => {
          toast.success(`Meta atualizada para ${updated.min_week_hours}h semanais`);
          setWeekEditing(false);
        },
        onError: (err: Error) => toast.error(toUserMessage(err))
      }
    );
  }

  function startAvailEdit() {
    setAvailValue(String(settings?.min_availability_hours ?? 0));
    setAvailEditing(true);
  }

  function saveAvail() {
    const parsed = parseInt(availValue, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 98) {
      toast.error('Informe um número entre 0 e 98');
      return;
    }
    mutation.mutate(
      { min_availability_hours: parsed },
      {
        onSuccess: (updated) => {
          const msg =
            updated.min_availability_hours === 0
              ? 'Disponibilidade mínima desabilitada'
              : `Disponibilidade mínima atualizada para ${updated.min_availability_hours}h`;
          toast.success(msg);
          setAvailEditing(false);
        },
        onError: (err: Error) => toast.error(toUserMessage(err))
      }
    );
  }

  const availDisplay =
    settings?.min_availability_hours === 0
      ? 'Desabilitado'
      : String(settings?.min_availability_hours ?? '—');

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>Configurações</CardTitle>
          <Icons.settings className='text-muted-foreground size-4' />
        </div>
      </CardHeader>

      <CardContent className='space-y-5'>
        <SettingRow
          label='Meta de Horas Semanais'
          description='Mínimo de horas semanais da rotina de sala'
          displayValue={String(settings?.min_week_hours ?? '—')}
          isLoading={isLoading}
          canEdit={canEdit}
          isEditing={weekEditing}
          editValue={weekValue}
          isPending={mutation.isPending}
          inputMin={1}
          onStartEdit={startWeekEdit}
          onSave={saveWeek}
          onCancel={() => setWeekEditing(false)}
          onChangeValue={setWeekValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveWeek();
            if (e.key === 'Escape') setWeekEditing(false);
          }}
        />

        <Separator />

        <SettingRow
          label='Disponibilidade Mínima'
          description='Mínimo de horas de disponibilidade semanal exigido na rotina de cada membro (Planilha de Alto Impacto).'
          displayValue={availDisplay}
          isLoading={isLoading}
          canEdit={canEdit}
          isEditing={availEditing}
          editValue={availValue}
          isPending={mutation.isPending}
          inputMin={0}
          inputMax={98}
          onStartEdit={startAvailEdit}
          onSave={saveAvail}
          onCancel={() => setAvailEditing(false)}
          onChangeValue={setAvailValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveAvail();
            if (e.key === 'Escape') setAvailEditing(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
