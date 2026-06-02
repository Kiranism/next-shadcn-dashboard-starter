'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { LeadCard } from './lead-card';
import { LeadsFilters } from './leads-filters';
import { LeadsEmptyState } from './leads-empty-state';
import { LeadDetailSheet } from './lead-detail-sheet';
import { LeadFormSheet } from './lead-form-sheet';
import { LeadsRepository } from '@/repositories/leads.repository';
import type { LeadStatus } from '@/types/api';

export function LeadsView() {
  const { data: leads = [], isLoading } = LeadsRepository.useList();

  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = leads;

    if (activeStatus !== 'all') {
      result = result.filter((l) => l.status === activeStatus);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.company_name.toLowerCase().includes(q) ||
          l.interest_items.some((i) => i.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, activeStatus, search]);

  const counts = useMemo(() => {
    const all = leads.length;
    const nao_contatado = leads.filter((l) => l.status === 'nao_contatado').length;
    const em_progresso = leads.filter((l) => l.status === 'em_progresso').length;
    const finalizado = leads.filter((l) => l.status === 'contatado').length;
    return { all, nao_contatado, em_progresso, finalizado };
  }, [leads]);

  function clearFilters() {
    setSearch('');
    setActiveStatus('all');
  }

  const isFiltered = search.trim() !== '' || activeStatus !== 'all';

  if (isLoading) {
    return (
      <div className='space-y-5'>
        <div className='space-y-3'>
          <Skeleton className='h-10 w-full' />
          <div className='flex gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-24 rounded-full' />
            ))}
          </div>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='rounded-xl border p-4 space-y-3'>
              <div className='flex items-start justify-between'>
                <Skeleton className='h-5 w-36' />
                <Skeleton className='size-3 rounded-full' />
              </div>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <div className='flex gap-2'>
                <Skeleton className='h-5 w-20 rounded-full' />
                <Skeleton className='h-5 w-16 rounded-full' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <LeadsFilters
            search={search}
            onSearchChange={setSearch}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            counts={counts}
          />
        </div>
        <Button size='sm' className='shrink-0' onClick={() => setFormOpen(true)}>
          <Icons.add className='mr-1.5 size-4' />
          Novo Lead
        </Button>
      </div>

      {filtered.length === 0 ? (
        <LeadsEmptyState
          filtered={isFiltered}
          onClearFilter={clearFilters}
          onNewLead={() => setFormOpen(true)}
        />
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLeadId(lead.id)} />
          ))}
        </div>
      )}

      <LeadDetailSheet leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />

      <LeadFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
