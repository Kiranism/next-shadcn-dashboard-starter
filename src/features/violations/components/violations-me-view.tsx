'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { SeverityBadge } from './severity-badge';
import { ViolationsRepository } from '@/repositories/violations.repository';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function ViolationsMeView() {
  const { data, isLoading } = ViolationsRepository.useMe();

  const summary = data?.summary;
  const violations = data?.violations ?? [];

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-16 rounded-lg' />
          ))}
        </div>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-xl border p-4 space-y-2'>
              <div className='flex gap-2'>
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-4 w-20 rounded-md' />
              </div>
              <Skeleton className='h-3 w-3/4' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {summary && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <ScoreStat label='Score total' value={summary.score} highlight={summary.at_risk} />
          <ScoreStat label='Leves ativas' value={summary.active_leves} />
          <ScoreStat label='Moderadas ativas' value={summary.active_moderadas} />
          <ScoreStat label='Graves ativas' value={summary.active_graves} />
        </div>
      )}

      {summary?.at_risk && (
        <div className='flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3'>
          <Icons.warning className='size-5 shrink-0 text-destructive' />
          <p className='text-destructive text-sm font-medium'>
            Sua pontuação atingiu ou superou 18 pontos — você está em risco de desligamento.
          </p>
        </div>
      )}

      <div>
        <h3 className='text-sm font-semibold mb-3'>Minhas Faltas</h3>
        {violations.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center'>
            <Icons.circleCheck className='text-muted-foreground size-10' />
            <div>
              <p className='font-medium'>Nenhuma falta registrada</p>
              <p className='text-muted-foreground mt-0.5 text-sm'>Continue assim!</p>
            </div>
          </div>
        ) : (
          <div className='rounded-xl border divide-y'>
            {violations.map((v, i) => (
              <div key={v.id} className='px-4 py-3 space-y-1.5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-mono text-xs font-semibold text-muted-foreground'>
                    {v.norm.code}
                  </span>
                  <SeverityBadge severity={v.norm.severity} />
                  {v.status === 'cancelled' && (
                    <Badge variant='secondary' className='text-xs'>
                      Cancelada
                    </Badge>
                  )}
                </div>
                <p className='text-sm'>{v.norm.description}</p>
                {v.reason && (
                  <p className='text-muted-foreground text-xs'>
                    <span className='font-medium'>Motivo:</span> {v.reason}
                  </p>
                )}
                <p className='text-muted-foreground text-xs'>
                  Aplicada em {formatDate(v.applied_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreStat({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className='rounded-lg border bg-muted/30 px-3 py-3 text-center'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
