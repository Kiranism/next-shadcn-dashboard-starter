'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { UserViolations } from '@/types/violations';

interface ViolationsTableProps {
  data: UserViolations[];
  userNames: Record<string, { name: string; role: string; sector: string }>;
  onSelectMember: (entry: UserViolations) => void;
}

export function ViolationsTable({ data, userNames, onSelectMember }: ViolationsTableProps) {
  const [search, setSearch] = useState('');

  const filtered = data
    .filter((entry) => {
      const info = userNames[entry.user_id];
      if (!info) return false;
      return info.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const nameA = userNames[a.user_id]?.name ?? '';
      const nameB = userNames[b.user_id]?.name ?? '';
      return nameA.localeCompare(nameB, 'pt-BR');
    });

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Icons.search className='text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2' />
        <Input
          placeholder='Buscar membro...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
            <Icons.warning className='size-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum membro encontrado</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {search
                ? 'Tente um termo de busca diferente.'
                : 'Você não possui subordinados com faltas.'}
            </p>
          </div>
        </div>
      ) : (
        <div className='rounded-xl border'>
          {/* Desktop table */}
          <div className='hidden md:block'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='px-4 py-3 text-left font-medium'>Membro</th>
                  <th className='px-4 py-3 text-left font-medium'>Cargo</th>
                  <th className='px-4 py-3 text-left font-medium'>Setor</th>
                  <th className='px-4 py-3 text-center font-medium'>Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const info = userNames[entry.user_id];
                  const { summary } = entry;
                  return (
                    <tr
                      key={entry.user_id}
                      className='hover:bg-muted/40 cursor-pointer border-b transition-colors last:border-0'
                      onClick={() => onSelectMember(entry)}
                    >
                      <td className='px-4 py-3'>
                        <span className='font-medium'>{info?.name ?? entry.user_id}</span>
                      </td>
                      <td className='text-muted-foreground px-4 py-3 capitalize'>
                        {info?.role ?? '—'}
                      </td>
                      <td className='text-muted-foreground px-4 py-3 capitalize'>
                        {info?.sector ?? '—'}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <div className='flex items-center justify-center gap-1.5'>
                          {summary.active_desligamentos > 0 ? (
                            <Badge variant='destructive' className='text-xs'>
                              Desligamento
                            </Badge>
                          ) : (
                            <>
                              <span
                                className={cn(
                                  'font-semibold',
                                  summary.at_risk && 'text-destructive'
                                )}
                              >
                                {summary.score}
                              </span>
                              {summary.at_risk && (
                                <Badge variant='destructive' className='text-xs'>
                                  Em Risco
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className='divide-y md:hidden'>
            {filtered.map((entry) => {
              const info = userNames[entry.user_id];
              const { summary } = entry;
              return (
                <button
                  key={entry.user_id}
                  className='hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors'
                  onClick={() => onSelectMember(entry)}
                >
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{info?.name ?? entry.user_id}</p>
                    <p className='text-muted-foreground truncate text-xs capitalize'>
                      {info?.role} · {info?.sector}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    {summary.active_desligamentos > 0 ? (
                      <Badge variant='destructive' className='text-xs'>
                        Desligamento
                      </Badge>
                    ) : (
                      <>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            summary.at_risk && 'text-destructive'
                          )}
                        >
                          {summary.score} pts
                        </span>
                        {summary.at_risk && (
                          <Badge variant='destructive' className='text-xs'>
                            Em Risco
                          </Badge>
                        )}
                      </>
                    )}
                    <Icons.chevronRight className='text-muted-foreground size-4' />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
