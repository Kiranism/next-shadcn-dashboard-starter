'use client';

import { useState } from 'react';
import { Plus, Search, Layers, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePayers } from '../hooks/use-payers';
import { PayerCard } from './payer-card';
import { AddPayerDialog } from './add-payer-dialog';
import { PayerDetailsSheet } from './payer-details-sheet';
import type { PayerWithBillingCount } from '../types/payer.types';
import { Skeleton } from '@/components/ui/skeleton';

export function PayersPage() {
  const { data: payers, isLoading, error } = usePayers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPayer, setSelectedPayer] =
    useState<PayerWithBillingCount | null>(null);

  const filteredPayers = payers?.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(q) ?? false;
    const numMatch = p.number?.toLowerCase().includes(q) ?? false;
    return nameMatch || numMatch;
  });

  return (
    <div className='mx-auto w-full max-w-6xl flex-1 space-y-6 pb-10'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Kostenträger</h2>
          <p className='text-muted-foreground mt-1'>
            Verwalten Sie alle Kostenträger und deren Abrechnungsarten.
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className='shrink-0 gap-2'
        >
          <Plus className='h-4 w-4' />
          Neuer Kostenträger
        </Button>
      </div>

      <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
        <div className='bg-muted/20 border-b p-4'>
          <div className='relative max-w-md'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Kostenträger suchen...'
              className='bg-background pl-9'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className='bg-background min-h-[400px] p-4'>
          {isLoading ? (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className='h-[90px] w-full rounded-xl' />
              ))}
            </div>
          ) : error ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <div className='bg-destructive/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
                <span className='text-destructive text-xl font-bold'>!</span>
              </div>
              <h3 className='mb-1 text-lg font-semibold'>Fehler beim Laden</h3>
              <p className='text-muted-foreground max-w-sm'>
                Die Kostenträger konnten nicht geladen werden. Bitte versuchen
                Sie es später erneut.
              </p>
            </div>
          ) : filteredPayers?.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <div className='bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <BookOpen className='text-muted-foreground/60 h-8 w-8' />
              </div>
              <h3 className='mb-1 text-lg font-semibold'>
                {searchQuery ? 'Keine Treffer' : 'Keine Kostenträger'}
              </h3>
              <p className='text-muted-foreground max-w-sm'>
                {searchQuery
                  ? 'Es wurden keine Kostenträger gefunden, die Ihrer Suche entsprechen.'
                  : 'Sie haben noch keine Kostenträger angelegt.'}
              </p>
              {!searchQuery && (
                <Button
                  variant='outline'
                  className='mt-4 gap-2'
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className='h-4 w-4' />
                  Ersten Kostenträger anlegen
                </Button>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredPayers?.map((payer) => (
                <PayerCard
                  key={payer.id}
                  payer={payer}
                  onClick={(p) => setSelectedPayer(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPayerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <PayerDetailsSheet
        payer={selectedPayer}
        open={!!selectedPayer}
        onOpenChange={(open) => !open && setSelectedPayer(null)}
      />
    </div>
  );
}
