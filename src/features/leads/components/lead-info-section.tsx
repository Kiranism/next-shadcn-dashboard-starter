'use client';

import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadsRepository } from '@/repositories/leads.repository';
import { toUserMessage } from '@/lib/api-client';
import type { Lead, LeadStatus } from '@/types/api';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'nao_contatado', label: 'Não contatado' },
  { value: 'em_progresso', label: 'Em progresso' },
  { value: 'contatado', label: 'Finalizado' }
];

interface LeadInfoSectionProps {
  lead: Lead;
}

export function LeadInfoSection({ lead }: LeadInfoSectionProps) {
  const updateMutation = LeadsRepository.useUpdate();

  function handleStatusChange(value: LeadStatus) {
    updateMutation.mutate(
      { id: lead.id, payload: { status: value } },
      { onError: (err) => toast.error(toUserMessage(err)) }
    );
  }

  const fullAddress = [
    `${lead.address_logradouro}, ${lead.address_numero}`,
    lead.address_complemento,
    lead.address_bairro,
    `${lead.address_cidade} - ${lead.address_estado}`,
    lead.address_cep
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className='space-y-4'>
      {/* Status inline select */}
      <div className='flex items-center justify-between gap-3'>
        <LeadStatusBadge status={lead.status} />
        <Select
          value={lead.status}
          onValueChange={(v) => handleStatusChange(v as LeadStatus)}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className='h-8 w-auto text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interest items */}
      {lead.interest_items.length > 0 && (
        <div className='space-y-1.5'>
          <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
            Serviços de interesse
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {lead.interest_items.map((item) => (
              <span
                key={item}
                className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs'
              >
                <Icons.tag className='size-3 text-muted-foreground' />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Address */}
      <div className='space-y-1.5'>
        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
          Endereço
        </p>
        <div className='flex items-start gap-2 text-sm'>
          <Icons.mapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <p className='text-muted-foreground'>{fullAddress}</p>
        </div>
      </div>
    </div>
  );
}
