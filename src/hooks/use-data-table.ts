import {
  type ColumnFiltersState,
  functionalUpdate,
  type PaginationState,
  type RowData,
  type SortingState,
  type TableOptions,
  type Updater,
  useTable
} from '@tanstack/react-table';
import {
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
  type UseQueryStateOptions,
  useQueryStates
} from 'nuqs';
import * as React from 'react';

import type {
  ColumnFilterItem,
  DataTableQueryKeys,
  FilterVariant,
  JoinOperator
} from '@/lib/data-table-types';

import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { type DataTableFeatures, dataTableFeatures } from '@/lib/data-table-features';
import {
  getColumnFilterParser,
  getColumnFilters,
  getColumnFiltersKey,
  getSortingStateParser,
  sortColumnFiltersBySearch
} from '@/lib/data-table-parsers';
import { getActiveFilters, JOIN_OPERATORS, normalizeColumnFilter } from '@/lib/data-table-utils';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'perPage';
const SORT_KEY = 'sort';
const JOIN_OPERATOR_KEY = 'joinOperator';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
const DEFAULT_PAGE_SIZE = 10;
const EMPTY_SORTING: SortingState = [];

interface FiltersDraft {
  filters: ColumnFiltersState;
  urlFiltersKey: string;
}

type UseDataTableProps<TData extends RowData> = Omit<
  TableOptions<DataTableFeatures, TData>,
  'state' | 'pageCount' | 'features' | 'manualFiltering' | 'manualPagination' | 'manualSorting'
> & {
  queryKeys?: Partial<DataTableQueryKeys>;
  history?: 'push' | 'replace';
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
} & (
    | {
        mode?: 'server';
        pageCount: number;
      }
    | {
        mode: 'client';
        pageCount?: never;
      }
  );

function useDataTable<TData extends RowData>({
  columns,
  mode = 'server',
  pageCount,
  initialState,
  queryKeys,
  history = 'replace',
  debounceMs = DEBOUNCE_MS,
  throttleMs = THROTTLE_MS,
  clearOnDefault = false,
  scroll = false,
  shallow: shallowProp = true,
  startTransition,
  ...props
}: UseDataTableProps<TData>) {
  const isServer = mode === 'server';
  const shallow = isServer ? shallowProp : true;

  const pageKey = queryKeys?.page ?? PAGE_KEY;
  const perPageKey = queryKeys?.perPage ?? PER_PAGE_KEY;
  const sortKey = queryKeys?.sort ?? SORT_KEY;
  const joinOperatorKey = queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY;

  const queryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, 'parse'>>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition]
  );

  const [initialTableState] = React.useState(initialState);

  const pageParser = React.useMemo(
    () => parseAsInteger.withOptions(queryStateOptions).withDefault(1),
    [queryStateOptions]
  );
  const perPageParser = React.useMemo(
    () =>
      parseAsInteger
        .withOptions(queryStateOptions)
        .withDefault(initialTableState?.pagination?.pageSize ?? DEFAULT_PAGE_SIZE),
    [initialTableState, queryStateOptions]
  );

  const [page, setPage] = useQueryState(pageKey, pageParser);
  const [perPage, setPerPage] = useQueryState(perPageKey, perPageParser);

  const pagination = React.useMemo<PaginationState>(
    () => ({ pageIndex: page - 1, pageSize: perPage }),
    [page, perPage]
  );

  function onPaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    void setPage(next.pageIndex + 1);
    void setPerPage(next.pageSize);
  }

  const columnIndex = React.useMemo(() => {
    const sortableIds = new Set<string>();
    const filterableVariants = new Map<string, FilterVariant>();

    for (const column of columns) {
      if (!column.id) continue;
      const hasAccessor = 'accessorKey' in column || 'accessorFn' in column;
      if (hasAccessor && column.enableSorting !== false) {
        sortableIds.add(column.id);
      }
      if (!column.enableColumnFilter) continue;

      filterableVariants.set(column.id, column.meta?.variant ?? 'text');
    }

    return {
      sortableIds,
      filterableIds: [...filterableVariants.keys()],
      variantById: Object.fromEntries(filterableVariants),
      normalizeColumnFilters: (filters: ColumnFiltersState) =>
        filters.map((filter) =>
          normalizeColumnFilter(filter, filterableVariants.get(filter.id) ?? 'text')
        )
    };
  }, [columns]);

  const sortingParser = React.useMemo(
    () =>
      getSortingStateParser(columnIndex.sortableIds)
        .withOptions(queryStateOptions)
        .withDefault(initialTableState?.sorting ?? EMPTY_SORTING),
    [columnIndex, initialTableState, queryStateOptions]
  );

  const [sorting, setSorting] = useQueryState(sortKey, sortingParser);

  function onSortingChange(updater: Updater<SortingState>) {
    void setSorting(functionalUpdate(updater, sorting));
  }

  const joinOperatorParser = React.useMemo(
    () =>
      parseAsStringEnum([...JOIN_OPERATORS])
        .withOptions(queryStateOptions)
        .withDefault(initialTableState?.joinOperator ?? 'and'),
    [initialTableState, queryStateOptions]
  );

  const [joinOperator, setJoinOperator] = useQueryState(joinOperatorKey, joinOperatorParser);

  function onJoinOperatorChange(updater: Updater<JoinOperator>) {
    void setJoinOperator(functionalUpdate(updater, joinOperator));
  }

  const filterParsers = React.useMemo(
    () =>
      Object.fromEntries(
        columnIndex.filterableIds.map((id) => [
          id,
          getColumnFilterParser(id, columnIndex.variantById[id] ?? 'text').withOptions(
            queryStateOptions
          )
        ])
      ),
    [columnIndex, queryStateOptions]
  );

  const [filterParams, setFilterParams] = useQueryStates(filterParsers);

  const search = React.useSyncExternalStore(
    subscribeToHistory,
    getLocationSearch,
    getServerLocationSearch
  );

  const filterOrder = React.useMemo(() => {
    const filterableIds = new Set(columnIndex.filterableIds);
    return [...new Set(new URLSearchParams(search).keys())]
      .filter((key) => filterableIds.has(key))
      .join('&');
  }, [columnIndex, search]);

  const urlFilters = React.useMemo(
    () =>
      sortColumnFiltersBySearch(
        getColumnFilters(columnIndex.filterableIds, (id) => filterParams[id] ?? []),
        filterOrder
      ),
    [columnIndex, filterParams, filterOrder]
  );
  const urlFiltersKey = getColumnFiltersKey(urlFilters);

  const [filtersDraft, setFiltersDraft] = React.useState<FiltersDraft | null>(() => {
    const initialFilters = initialTableState?.columnFilters;
    if (urlFilters.length > 0 || !initialFilters?.length) return null;

    return {
      filters: columnIndex.normalizeColumnFilters(initialFilters),
      urlFiltersKey
    };
  });

  const columnFilters =
    filtersDraft?.urlFiltersKey === urlFiltersKey ? filtersDraft.filters : urlFilters;

  const debouncedWriteFilters = useDebouncedCallback(
    (columnFilters: ColumnFiltersState, sourceUrlFiltersKey: string) => {
      if (sourceUrlFiltersKey !== urlFiltersKey) return;

      const filters = getActiveFilters(columnIndex.normalizeColumnFilters(columnFilters)).filter(
        (filter) => Object.hasOwn(columnIndex.variantById, filter.id)
      );
      const params = new Map<string, ColumnFilterItem[] | null>();

      for (const filter of filters) {
        const group = params.get(filter.id);
        if (group) group.push(filter);
        else params.set(filter.id, [filter]);
      }
      for (const id of columnIndex.filterableIds) {
        if (!params.has(id)) params.set(id, null);
      }

      const nextUrlFiltersKey = getColumnFiltersKey(filters);
      setFiltersDraft((prev) => prev && { ...prev, urlFiltersKey: nextUrlFiltersKey });
      void setPage(1);
      void setFilterParams(Object.fromEntries(params));
    },
    debounceMs
  );

  function onColumnFiltersChange(updater: Updater<ColumnFiltersState>) {
    const filters = functionalUpdate(updater, columnFilters);
    setFiltersDraft({ filters, urlFiltersKey });
    debouncedWriteFilters(filters, urlFiltersKey);
  }

  const table = useTable(
    {
      ...props,
      features: dataTableFeatures,
      columns,
      initialState: initialTableState,
      pageCount: isServer ? pageCount : undefined,
      state: {
        pagination,
        sorting,
        columnFilters,
        joinOperator
      },
      onPaginationChange,
      onSortingChange,
      onColumnFiltersChange,
      onJoinOperatorChange,
      manualPagination: isServer,
      manualSorting: isServer,
      manualFiltering: isServer
    },
    (state) => ({
      columnFilters: state.columnFilters,
      joinOperator: state.joinOperator,
      pagination: state.pagination,
      sorting: state.sorting
    })
  );

  return React.useMemo(() => ({ table }), [table]);
}

function subscribeToHistory(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function getLocationSearch() {
  return window.location.search;
}

function getServerLocationSearch() {
  return '';
}

export { useDataTable, type UseDataTableProps };
