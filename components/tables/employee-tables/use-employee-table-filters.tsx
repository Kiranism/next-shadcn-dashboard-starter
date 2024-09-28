'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

export function useEmployeeTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [genderFilter, setGenderFilter] = useQueryState(
    'gender',
    searchParams.gender.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setGenderFilter(null);

    setPage(1);
  }, [setSearchQuery, setGenderFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!genderFilter;
  }, [searchQuery, genderFilter]);

  return {
    searchQuery,
    setSearchQuery,
    genderFilter,
    setGenderFilter,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive
  };
}
