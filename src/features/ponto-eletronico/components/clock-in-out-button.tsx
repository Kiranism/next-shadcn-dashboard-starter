'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { TimeEntriesRepository } from '@/repositories';
import { toUserMessage } from '@/lib/api-client';
import type { SummaryResponse } from '@/types/api';

interface ClockInOutButtonProps {
  summary: SummaryResponse | undefined;
}

export function ClockInOutButton({ summary }: ClockInOutButtonProps) {
  const isOpen =
    summary?.current_session?.status === 'open' || summary?.current_session?.status === 'invalid';

  const clockInMutation = TimeEntriesRepository.useClockIn();
  const clockOutMutation = TimeEntriesRepository.useClockOut();

  const handleClockIn = () => {
    clockInMutation.mutate(undefined, {
      onSuccess: () => toast.success('Entrada registrada com sucesso'),
      onError: (err: Error) => toast.error(toUserMessage(err))
    });
  };

  const handleClockOut = () => {
    clockOutMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.status === 'annulled') {
          toast.warning('Saída registrada, mas a sessão foi anulada por exceder 8 horas');
        } else {
          toast.success(`Saída registrada — ${data.duration_minutes} min trabalhados`);
        }
      },
      onError: (err: Error) => toast.error(toUserMessage(err))
    });
  };

  const isPending = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <Button
      size='lg'
      variant={isOpen ? 'destructive' : 'default'}
      disabled={isPending}
      onClick={() => (isOpen ? handleClockOut() : handleClockIn())}
      className='w-full sm:w-auto'
    >
      {isPending ? (
        <Icons.spinner className='mr-2 size-4 animate-spin' />
      ) : (
        <Icons.clock className='mr-2 size-4' />
      )}
      {isOpen ? 'Registrar Saída' : 'Registrar Entrada'}
    </Button>
  );
}
