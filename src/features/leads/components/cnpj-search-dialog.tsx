'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { LeadsRepository } from '@/repositories/leads.repository';
import { CnpjResultContent } from './cnpj-result-content';
import { formatCnpj, validateCnpj } from '@/lib/format-cnpj';

interface CnpjSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CnpjSearchDialog({ open, onOpenChange }: CnpjSearchDialogProps) {
  const [inputCnpj, setInputCnpj] = useState('');
  const [searchedCnpj, setSearchedCnpj] = useState('');

  const { data, isLoading, isError, error } = LeadsRepository.useCnpjLookup(
    searchedCnpj,
    !!searchedCnpj && open
  );

  const isValid = validateCnpj(inputCnpj);
  const hasResult = !!searchedCnpj;

  function handleSearch() {
    if (!isValid) return;
    setSearchedCnpj(inputCnpj);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setInputCnpj('');
      setSearchedCnpj('');
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-4rem)] flex-col gap-0 p-0 sm:max-w-lg'>
        <DialogHeader className='shrink-0 border-b px-5 py-4 sm:px-6'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <Icons.search className='size-4 shrink-0' />
            Consultar CNPJ
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            Consulte dados públicos de uma empresa na Receita Federal.
          </p>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
          {/* Search form — always visible */}
          <div className='flex gap-2'>
            <Input
              value={inputCnpj}
              onChange={(e) => {
                setInputCnpj(formatCnpj(e.target.value));
                if (searchedCnpj) setSearchedCnpj('');
              }}
              onKeyDown={handleKeyDown}
              placeholder='00.000.000/0000-00'
              className='font-mono'
              inputMode='numeric'
              maxLength={18}
              autoComplete='off'
            />
            <Button onClick={handleSearch} disabled={!isValid || isLoading} className='shrink-0'>
              {isLoading ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                <Icons.search className='size-4' />
              )}
              <span className='ml-1.5 hidden sm:inline'>Consultar</span>
            </Button>
          </div>

          {inputCnpj.length > 0 && !isValid && (
            <p className='mt-1.5 text-xs text-destructive'>CNPJ inválido</p>
          )}

          {/* Result — shown once a search is triggered */}
          {hasResult && (
            <>
              <Separator className='my-5' />
              <CnpjResultContent
                isLoading={isLoading}
                isError={isError}
                error={error}
                data={data}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
