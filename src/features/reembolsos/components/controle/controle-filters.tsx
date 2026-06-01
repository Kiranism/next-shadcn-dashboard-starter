'use client';

import { Input } from '@/components/ui/input';
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
  sector: string;
  role: string;
  status: string;
}

interface ControleFiltersProps {
  filters: ControleFiltersState;
  onChange: (filters: ControleFiltersState) => void;
}

export function ControleFilters({ filters, onChange }: ControleFiltersProps) {
  function set(key: keyof ControleFiltersState, value: string) {
    onChange({ ...filters, [key]: value === ALL ? '' : value });
  }

  return (
    <div className='flex flex-wrap gap-2'>
      <div className='relative min-w-[160px] flex-1'>
        <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2' />
        <Input
          placeholder='Buscar por nome...'
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className='h-8 pl-8 text-sm'
        />
      </div>

      <Select value={filters.sector || ALL} onValueChange={(v) => set('sector', v)}>
        <SelectTrigger className='h-8 w-[150px] text-sm'>
          <SelectValue placeholder='Setor' />
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

      <Select value={filters.role || ALL} onValueChange={(v) => set('role', v)}>
        <SelectTrigger className='h-8 w-[140px] text-sm'>
          <SelectValue placeholder='Cargo' />
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

      <Select value={filters.status || ALL} onValueChange={(v) => set('status', v)}>
        <SelectTrigger className='h-8 w-[140px] text-sm'>
          <SelectValue placeholder='Status' />
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
  );
}
