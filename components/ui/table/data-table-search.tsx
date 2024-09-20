'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseAsString, useQueryState } from 'nuqs';
import { useTransition } from 'react';
import { searchParams } from '@/lib/searchparams';

interface DataTableSearchProps {
  searchKey: string;
}

export function DataTableSearch({ searchKey }: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, startTransition, throttleMs: 1000 })
      .withDefault('')
  );

  return (
    <Input
      placeholder={`Search ${searchKey}...`}
      value={searchQuery ?? ''}
      onChange={(e) => setSearchQuery(e.target.value || null)}
      className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
    />
  );
}
