import type { ColumnFilter, ColumnSort, Row, RowData } from '@tanstack/react-table';

import type { DataTableFeatures } from '@/lib/data-table-features';
import type { FILTER_OPERATORS, FILTER_VARIANTS, JOIN_OPERATORS } from '@/lib/data-table-utils';

export interface DataTableColumnMeta {
  label?: string;
  placeholder?: string;
  variant?: FilterVariant;
  options?: FilterOption[];
  range?: [number, number];
  unit?: string;
  icon?: React.ComponentType<React.ComponentProps<'svg'>>;
}

export interface DataTableQueryKeys {
  page: string;
  perPage: string;
  sort: string;
  joinOperator: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<React.ComponentProps<'svg'>>;
}

export type FilterOperator = keyof typeof FILTER_OPERATORS;
export type FilterVariant = (typeof FILTER_VARIANTS)[number];
export type JoinOperator = (typeof JOIN_OPERATORS)[number];

export interface FilterOperatorOption {
  label: string;
  value: FilterOperator;
}

export interface ColumnSortItem<TColumnId extends string = string> extends ColumnSort {
  id: TColumnId;
}

export interface ColumnFilterItem<TColumnId extends string = string> extends ColumnFilter {
  id: TColumnId;
  value: string | string[];
  variant: FilterVariant;
  operator: FilterOperator;
  filterId: string;
}

declare module '@tanstack/react-table' {
  interface ColumnFilter extends Partial<
    Pick<ColumnFilterItem, 'operator' | 'variant' | 'filterId'>
  > {}
}

export interface DataTableColumnConfig {
  variant?: FilterVariant;
  isSortable?: boolean;
}

export type DataTableColumnConfigs = Record<string, DataTableColumnConfig>;

export type FilterableColumnId<TColumnConfigs extends DataTableColumnConfigs> = {
  [K in keyof TColumnConfigs]: TColumnConfigs[K] extends {
    variant: FilterVariant;
  }
    ? K
    : never;
}[keyof TColumnConfigs] &
  string;

export type SortableColumnId<TColumnConfigs extends DataTableColumnConfigs> = {
  [K in keyof TColumnConfigs]: TColumnConfigs[K] extends { isSortable: false } ? never : K;
}[keyof TColumnConfigs] &
  string;

export interface DataTableQuery<
  TFilterColumnId extends string = string,
  TSortColumnId extends string = TFilterColumnId
> {
  page: number;
  perPage: number;
  sorting: ColumnSortItem<TSortColumnId>[];
  filters: ColumnFilterItem<TFilterColumnId>[];
  joinOperator: JoinOperator;
}

export type DataTableColumnConfigsQuery<TColumnConfigs extends DataTableColumnConfigs> =
  DataTableQuery<FilterableColumnId<TColumnConfigs>, SortableColumnId<TColumnConfigs>>;

export interface DataTableRowAction<TData extends RowData> {
  row: Row<DataTableFeatures, TData>;
  variant: 'update' | 'delete';
}
