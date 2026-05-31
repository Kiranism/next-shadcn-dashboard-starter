'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ROLE_LABEL, SECTOR_LABEL } from '@/constants/user-options';

export interface TeamFilterValues {
  q: string;
  sector: string;
  role: string;
}

interface TeamFiltersProps {
  values: TeamFilterValues;
  onChange: (patch: Partial<TeamFilterValues>) => void;
  sectors: string[];
  roles: string[];
  resultCount: number;
}

export function TeamFilters({ values, onChange, sectors, roles, resultCount }: TeamFiltersProps) {
  const hasFilters = !!values.q || values.sector !== 'all' || values.role !== 'all';

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
      <div className='relative flex-1'>
        <Icons.search className='text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2' />
        <Input
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder='Buscar membro pelo nome…'
          className='pl-8'
          aria-label='Buscar membro pelo nome'
        />
      </div>

      <div className='flex items-center gap-2'>
        {sectors.length > 1 && (
          <Select value={values.sector} onValueChange={(v) => onChange({ sector: v })}>
            <SelectTrigger className='w-full min-w-32 sm:w-40' aria-label='Filtrar por setor'>
              <SelectValue placeholder='Setor' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os setores</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {SECTOR_LABEL[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {roles.length > 1 && (
          <Select value={values.role} onValueChange={(v) => onChange({ role: v })}>
            <SelectTrigger className='w-full min-w-32 sm:w-40' aria-label='Filtrar por cargo'>
              <SelectValue placeholder='Cargo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os cargos</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <span className='text-muted-foreground hidden whitespace-nowrap text-sm tabular-nums sm:inline'>
          {resultCount} {resultCount === 1 ? 'membro' : 'membros'}
        </span>

        {hasFilters && (
          <Button
            variant='ghost'
            size='icon'
            className='size-9 shrink-0'
            onClick={() => onChange({ q: '', sector: 'all', role: 'all' })}
            aria-label='Limpar filtros'
          >
            <Icons.close className='size-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
