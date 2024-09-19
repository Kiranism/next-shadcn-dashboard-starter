'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface DataTableSearchProps {
  searchKey: string;
}

export function DataTableSearch({ searchKey }: DataTableSearchProps) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );
  const [inputValue, setInputValue] = useState(searchQuery ?? '');
  const debouncedValue = useDebounce(inputValue, 300);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value || null);
    },
    [setSearchQuery]
  );

  useEffect(() => {
    handleSearch(debouncedValue);
  }, [debouncedValue, handleSearch]);

  return (
    <Input
      placeholder={`Search ${searchKey}...`}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className="w-full md:max-w-sm"
    />
  );
}
