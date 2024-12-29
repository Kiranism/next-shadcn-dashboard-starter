'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Options } from 'nuqs';
import { useTransition } from 'react';

interface DataTableSearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  searchKey: string;
  searchQuery: string;
  setSearchQuery: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  // setPage: <Shallow>(
  //   value: number | ((old: number) => number | null) | null,
  //   options?: Options | undefined
  // ) => Promise<URLSearchParams>;
}

export function DataTableSearch({
  search,
  setSearch,
  searchKey,
  searchQuery,
  setSearchQuery
  // setPage
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setSearchQuery(value, { startTransition });
    // setPage(1); // Reset page to 1 when search changes
    setSearch(value);
  };

  return (
    <Input
      placeholder={`Search ${searchKey}...`}
      value={search ?? ''}
      onChange={(e) => handleSearch(e.target.value)}
      className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
    />
  );
}
