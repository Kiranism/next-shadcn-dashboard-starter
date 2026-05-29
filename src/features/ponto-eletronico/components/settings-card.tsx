'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SettingsRepository } from '@/repositories/settings.repository';
import { toUserMessage } from '@/lib/api-client';

export function SettingsCard() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 3;

  const { data: settings, isLoading } = SettingsRepository.useSettings();
  const mutation = SettingsRepository.useUpdateSettings();

  const [editValue, setEditValue] = useState<string>('');
  const [editing, setEditing] = useState(false);

  function startEdit() {
    setEditValue(String(settings?.min_week_hours ?? ''));
    setEditing(true);
  }

  function handleSave() {
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      toast.error('Informe um número inteiro positivo');
      return;
    }
    mutation.mutate(
      { min_week_hours: parsed },
      {
        onSuccess: (updated) => {
          toast.success(`Meta atualizada para ${updated.min_week_hours}h semanais`);
          setEditing(false);
        },
        onError: (err: Error) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <CardTitle className='text-base font-semibold'>Meta de Horas Semanais</CardTitle>
            <CardDescription className='mt-0.5 text-xs'>
              Horas mínimas para status &quot;Cumpriu&quot;.
            </CardDescription>
          </div>
          <Icons.settings className='text-muted-foreground mt-0.5 size-4 shrink-0' />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className='h-9 w-full' />
        ) : editing && canEdit ? (
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Input
                type='number'
                min={1}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className='pr-8'
              />
              <span className='text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm'>
                h
              </span>
            </div>
            <Button onClick={handleSave} disabled={mutation.isPending} size='default'>
              {mutation.isPending ? <Icons.spinner className='size-4 animate-spin' /> : 'OK'}
            </Button>
            <Button variant='ghost' onClick={() => setEditing(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className='flex items-center justify-between'>
            <div className='flex items-end gap-1.5'>
              <span className='text-3xl font-bold tabular-nums'>
                {settings?.min_week_hours ?? '—'}
              </span>
              <span className='text-muted-foreground pb-1 text-sm'>horas / semana</span>
            </div>
            {canEdit && (
              <Button variant='ghost' size='sm' onClick={startEdit}>
                <Icons.edit className='mr-1.5 size-3.5' />
                Editar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
