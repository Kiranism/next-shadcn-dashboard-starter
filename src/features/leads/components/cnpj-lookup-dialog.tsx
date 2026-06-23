'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { LeadsRepository } from '@/repositories/leads.repository';
import { CnpjResultContent } from './cnpj-result-content';

interface CnpjLookupDialogProps {
  cnpj: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CnpjLookupDialog({ cnpj, open, onOpenChange }: CnpjLookupDialogProps) {
  const { data, isLoading, isError, error } = LeadsRepository.useCnpjLookup(cnpj, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-4rem)] flex-col gap-0 p-0 sm:max-w-lg'>
        <DialogHeader className='shrink-0 border-b px-5 py-4 sm:px-6'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <Icons.building className='size-4 shrink-0' />
            Consulta Receita Federal
          </DialogTitle>
          <p className='font-mono text-xs text-muted-foreground'>{cnpj}</p>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
          <CnpjResultContent isLoading={isLoading} isError={isError} error={error} data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
