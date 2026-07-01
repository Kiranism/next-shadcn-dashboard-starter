'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { SECTOR_OPTIONS, ROLE_OPTIONS } from '@/constants/user-options';
import type { ReimbursementStatus } from '@/types/api';

const ALL = '__all__';

const STATUS_OPTIONS: { value: ReimbursementStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Recusado' }
];

export interface ControleFiltersState {
  search: string;
  keyword: string;
  sector: string;
  role: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: ControleFiltersState = {
  search: '',
  keyword: '',
  sector: '',
  role: '',
  status: '',
  dateFrom: '',
  dateTo: ''
};

export function countActiveFilters(filters: ControleFiltersState): number {
  return Object.values(filters).filter(Boolean).length;
}

interface ControleFiltersProps {
  filters: ControleFiltersState;
  onChange: (filters: ControleFiltersState) => void;
}

export function ControleFilters({ filters, onChange }: ControleFiltersProps) {
  function set(key: keyof ControleFiltersState, value: string) {
    onChange({ ...filters, [key]: value === ALL ? '' : value });
  }

  const activeCount = countActiveFilters(filters);

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Nome do colaborador</Label>
          <div className='relative'>
            <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2' />
            <Input
              placeholder='Buscar por nome...'
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              className='h-9 pl-8 text-sm'
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Palavra-chave</Label>
          <div className='relative'>
            <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2' />
            <Input
              placeholder='Título ou descrição da solicitação...'
              value={filters.keyword}
              onChange={(e) => set('keyword', e.target.value)}
              className='h-9 pl-8 text-sm'
            />
          </div>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Setor</Label>
          <Select value={filters.sector || ALL} onValueChange={(v) => set('sector', v)}>
            <SelectTrigger className='h-9 w-full text-sm'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os setores</SelectItem>
              {SECTOR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Cargo</Label>
          <Select value={filters.role || ALL} onValueChange={(v) => set('role', v)}>
            <SelectTrigger className='h-9 w-full text-sm'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os cargos</SelectItem>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Status</Label>
          <Select value={filters.status || ALL} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className='h-9 w-full text-sm'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>De</Label>
          <Input
            type='date'
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            className='h-9 w-full text-sm'
          />
        </div>

        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs font-normal'>Até</Label>
          <Input
            type='date'
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className='h-9 w-full text-sm'
          />
        </div>
      </div>

      {activeCount > 0 && (
        <div className='flex items-center justify-between border-t pt-3'>
          <p className='text-muted-foreground text-xs'>
            {activeCount} filtro{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
          </p>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <Icons.close className='mr-1 size-3' />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
