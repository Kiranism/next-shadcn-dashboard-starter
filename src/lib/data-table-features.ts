import {
  assignPrototypeAPIs,
  assignTableAPIs,
  columnFacetingFeature,
  type ColumnFilter,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedMinMaxValues,
  createFacetedUniqueValues,
  createPaginatedRowModel,
  createSortedRowModel,
  functionalUpdate,
  makeStateUpdater,
  metaHelper,
  type OnChangeFn,
  type RowData,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  setStateSlice,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  type Table,
  type TableFeature,
  type TableFeatures,
  tableFeatures,
  type Updater
} from '@tanstack/react-table';

import type { ColumnFilterItem, DataTableColumnMeta, JoinOperator } from '@/lib/data-table-types';

import {
  createDataTableFacetedRowModel,
  createDataTableFilteredRowModel,
  dataTableFilterFn
} from '@/lib/data-table-filters';
import {
  getIsPlainFilter,
  getPlainFilterValue,
  normalizeColumnFilter
} from '@/lib/data-table-utils';

interface TableState_DataTableFiltering {
  joinOperator: JoinOperator;
}

interface TableOptions_DataTableFiltering {
  onJoinOperatorChange?: OnChangeFn<JoinOperator>;
}

interface Table_DataTableFiltering {
  getColumnFilterItems: () => ColumnFilterItem[];
  addColumnFilter: (filter: ColumnFilterItem) => void;
  updateColumnFilter: (
    filterId: string,
    updates: Partial<Omit<ColumnFilterItem, 'filterId'>>
  ) => void;
  removeColumnFilter: (filterId: string) => void;
  getJoinOperator: () => JoinOperator;
  setJoinOperator: (updater: Updater<JoinOperator>) => void;
  resetJoinOperator: (defaultState?: boolean) => void;
}

declare module '@tanstack/react-table' {
  interface Plugins {
    dataTableFilteringFeature: TableFeature;
  }

  interface TableState_FeatureMap {
    dataTableFilteringFeature: TableState_DataTableFiltering;
  }

  interface TableOptions_FeatureMap<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData
  > {
    dataTableFilteringFeature: TableOptions_DataTableFiltering;
  }

  interface Table_FeatureMap<in out TFeatures extends TableFeatures, in out TData extends RowData> {
    dataTableFilteringFeature: Table_DataTableFiltering;
  }
}

type DataTableInstance = Table<DataTableFeatures, RowData>;

/**
 * Feature hooks get a `Table` generic over any features. This feature is only
 * registered in `dataTableFeatures`, so its hooks can use that table's types.
 */
function asDataTable(table: object) {
  return table as DataTableInstance;
}

const dataTableFilteringFeature: TableFeature = {
  getInitialState: (initialState) => ({
    joinOperator: 'and',
    ...initialState
  }),
  getDefaultColumnDef: () => ({
    enableColumnFilter: false,
    filterFn: dataTableFilterFn
  }),
  getDefaultTableOptions: (table) => {
    const options: TableOptions_DataTableFiltering = {
      onJoinOperatorChange: makeStateUpdater('joinOperator', table)
    };
    return options;
  },
  assignColumnPrototype: (prototype, table) => {
    const instance = asDataTable(table);

    assignPrototypeAPIs('dataTableFilteringFeature', prototype, table, {
      column_getFilterValue: {
        fn: (column: { id: string }) =>
          getPlainFilter(instance, column.id, instance.atoms.columnFilters.get()).value,
        memoDeps: () => [instance.atoms.columnFilters.get()]
      },
      column_setFilterValue: {
        fn: (column: { id: string }, updater: Updater<unknown>) =>
          setPlainFilter(instance, column.id, updater)
      }
    });
  },
  constructTableAPIs: (table) => {
    const instance = asDataTable(table);
    const resolve = (filter: ColumnFilter) =>
      normalizeColumnFilter(
        filter,
        instance.getColumn(filter.id)?.columnDef.meta?.variant ?? 'text'
      );

    const setJoinOperator = (updater: Updater<JoinOperator>) =>
      instance.options.onJoinOperatorChange?.((old) => functionalUpdate(updater, old));

    assignTableAPIs('dataTableFilteringFeature', table, {
      table_setColumnFilters: {
        fn: (updater: Updater<ColumnFilter[]>) =>
          setStateSlice(table, 'columnFilters', (old: ColumnFilter[]) =>
            functionalUpdate(updater, old).filter(
              (filter) => !getShouldRemoveFilter(filter, instance)
            )
          )
      },
      table_getColumnFilterItems: {
        fn: () => instance.atoms.columnFilters.get().map(resolve),
        memoDeps: () => [instance.atoms.columnFilters.get()]
      },
      table_addColumnFilter: {
        fn: (filter: ColumnFilterItem) => instance.setColumnFilters((old) => [...old, filter])
      },
      table_updateColumnFilter: {
        fn: (filterId: string, updates: Partial<Omit<ColumnFilterItem, 'filterId'>>) =>
          instance.setColumnFilters((old) =>
            old.map((filter) => {
              const item = resolve(filter);
              return item.filterId === filterId ? { ...item, ...updates } : filter;
            })
          )
      },
      table_removeColumnFilter: {
        fn: (filterId: string) =>
          instance.setColumnFilters((old) =>
            old.filter((filter) => resolve(filter).filterId !== filterId)
          )
      },
      table_getJoinOperator: {
        fn: () => instance.atoms.joinOperator.get()
      },
      table_setJoinOperator: { fn: setJoinOperator },
      table_resetJoinOperator: {
        fn: (defaultState?: boolean) =>
          setJoinOperator(defaultState ? 'and' : (instance.initialState.joinOperator ?? 'and'))
      }
    });
  }
};

function getPlainFilter(instance: DataTableInstance, columnId: string, filters: ColumnFilter[]) {
  const variant = instance.getColumn(columnId)?.columnDef.meta?.variant ?? 'text';
  const index = filters.findIndex(
    (filter) => filter.id === columnId && getIsPlainFilter(normalizeColumnFilter(filter, variant))
  );
  const filter = filters[index];
  const value = filter ? getPlainFilterValue(normalizeColumnFilter(filter, variant)) : undefined;

  return { index, filter, value };
}

function setPlainFilter(instance: DataTableInstance, columnId: string, updater: Updater<unknown>) {
  instance.setColumnFilters((old) => {
    const {
      index,
      filter: previous,
      value: previousValue
    } = getPlainFilter(instance, columnId, old);
    const value = functionalUpdate(updater, previousValue);
    const next: ColumnFilter = previous?.filterId
      ? { id: columnId, value, filterId: previous.filterId }
      : { id: columnId, value };

    if (index === -1) return [...old, next];
    return old.map((filter, filterIndex) => (filterIndex === index ? next : filter));
  });
}

/**
 * TanStack's `autoRemove` rules for plain filters. Filters with an
 * `operator` are only removed by an `undefined` value, so empty drafts in the
 * filter list survive a column `filterFn` whose `autoRemove` would drop them.
 */
function getShouldRemoveFilter(filter: ColumnFilter, instance: DataTableInstance) {
  if (filter.value === undefined) return true;
  if (filter.operator) return false;

  const column = instance.getColumn(filter.id);
  if (!column) return false;

  const filterFn = column.getFilterFn();
  if (filterFn?.autoRemove) {
    return filterFn.autoRemove(filter.value, column);
  }
  return typeof filter.value === 'string' && !filter.value;
}

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnFacetingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  dataTableFilteringFeature,
  filteredRowModel: createDataTableFilteredRowModel(),
  facetedRowModel: createDataTableFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text
  },
  columnMeta: metaHelper<DataTableColumnMeta>()
});

export type DataTableFeatures = typeof dataTableFeatures;
