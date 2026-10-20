import {
  type ColumnFilter,
  constructFilterFn,
  constructRow,
  type FilterFn,
  makeObjectMap,
  type Row,
  type RowData,
  type RowModel,
  skipFirstRun,
  type Table,
  type TableFeatures,
  tableMemo
} from '@tanstack/react-table';

import type { ColumnFilterItem, FilterVariant, JoinOperator } from '@/lib/data-table-types';

import {
  createPlainFilter,
  FILTER_VARIANTS,
  getIsActiveFilter,
  normalizeColumnFilter,
  parseFilterDate,
  stringifyFilterValue
} from '@/lib/data-table-utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const GLOBAL_FILTER_ID = '__global__';

const filterResultsByRow = new WeakMap<object, Record<string, boolean>>();

export function matchesFilter(
  cellValue: unknown,
  filter: Pick<ColumnFilterItem, 'operator' | 'variant' | 'value'>
): boolean {
  const { operator, variant, value } = filter;
  const isDate = variant === 'date' || variant === 'dateRange';
  const isNumeric = variant === 'number' || variant === 'range';

  switch (operator) {
    case 'iLike':
      return typeof value === 'string'
        ? getLowercaseText(cellValue).includes(value.toLowerCase())
        : true;

    case 'notILike':
      return typeof value === 'string'
        ? !getLowercaseText(cellValue).includes(value.toLowerCase())
        : true;

    case 'eq':
      if (variant === 'boolean') return getBooleanString(cellValue) === value;
      if (isDate) return getIsSameDay(cellValue, value);
      if (isNumeric) return parseNumber(cellValue) === parseNumber(value);
      return stringifyFilterValue(cellValue) === String(value);

    case 'ne':
      if (variant === 'boolean') return getBooleanString(cellValue) !== value;
      if (isDate) return !getIsSameDay(cellValue, value);
      if (isNumeric) return parseNumber(cellValue) !== parseNumber(value);
      return stringifyFilterValue(cellValue) !== String(value);

    case 'inArray':
      return Array.isArray(value) ? value.includes(stringifyFilterValue(cellValue)) : true;

    case 'notInArray':
      return Array.isArray(value) ? !value.includes(stringifyFilterValue(cellValue)) : true;

    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return compare(cellValue, value, operator, isDate);

    case 'isBetween':
      return getIsBetween(cellValue, value, isDate);

    case 'isRelativeToToday':
      return getIsRelativeToToday(cellValue, value);

    case 'isEmpty':
      return getIsEmptyValue(cellValue);

    case 'isNotEmpty':
      return !getIsEmptyValue(cellValue);

    default:
      return true;
  }
}

export const dataTableFilterFn = constructFilterFn({
  filter: (dataValue, filterValue, row, columnId) => {
    const variant = getFilterVariant(row.table.getColumn(columnId)?.columnDef.meta);
    const item = createPlainFilter(columnId, variant, filterValue);
    return !item || matchesFilter(dataValue, item);
  },
  autoRemove: (value) => value === undefined
});

export function createDataTableFilteredRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData
>() {
  return (table: Table<TFeatures, TData>) => {
    const instance = asFilteringTable(table);

    return tableMemo({
      feature: 'dataTableFilteringFeature',
      table,
      fnName: 'table.getFilteredRowModel',
      memoDeps: () => [
        table.getPreFilteredRowModel(),
        instance.atoms.columnFilters?.get(),
        instance.atoms.joinOperator?.get(),
        instance.atoms.globalFilter?.get()
      ],
      fn: () => getFilteredRowModel(table.getPreFilteredRowModel(), instance),
      onAfterUpdate: skipFirstRun(() => instance.autoResetPageIndex?.())
    });
  };
}

export function createDataTableFacetedRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData
>() {
  return (table: Table<TFeatures, TData>, columnId: string) => {
    const instance = asFilteringTable(table);

    return tableMemo({
      feature: 'columnFacetingFeature',
      table,
      fnName: 'createDataTableFacetedRowModel',
      memoDeps: () => [
        table.getPreFilteredRowModel(),
        instance.atoms.columnFilters?.get(),
        instance.atoms.joinOperator?.get(),
        instance.atoms.globalFilter?.get(),
        table.getFilteredRowModel()
      ],
      fn: () => getFacetedRowModel(table.getPreFilteredRowModel(), columnId, instance)
    });
  };
}

type RowTest<TFeatures extends TableFeatures, TData extends RowData> = (
  row: Row<TFeatures, TData>
) => boolean;

interface FilteringColumn<TFeatures extends TableFeatures, TData extends RowData> {
  id: string;
  columnDef: { meta?: unknown };
  getFilterFn?: () => FilterFn<TFeatures, TData> | undefined;
  getCanGlobalFilter?: () => boolean;
}

interface FilteringMembers<TFeatures extends TableFeatures, TData extends RowData> {
  atoms: {
    columnFilters?: { get: () => ColumnFilter[] };
    joinOperator?: { get: () => JoinOperator };
    globalFilter?: { get: () => unknown };
  };
  options: { filterFromLeafRows?: boolean; maxLeafRowFilterDepth?: number };
  getColumn: (columnId: string) => FilteringColumn<TFeatures, TData> | undefined;
  getAllLeafColumns: () => FilteringColumn<TFeatures, TData>[];
  getGlobalFilterFn?: () => FilterFn<TFeatures, TData> | undefined;
  autoResetPageIndex?: () => void;
}

type FilteringInstance<TFeatures extends TableFeatures, TData extends RowData> = FilteringMembers<
  TFeatures,
  TData
> &
  Table<TFeatures, TData>;

function asFilteringTable<TFeatures extends TableFeatures, TData extends RowData>(
  table: Table<TFeatures, TData>
) {
  return table as FilteringInstance<TFeatures, TData>;
}

function getFilteredRowModel<TFeatures extends TableFeatures, TData extends RowData>(
  rowModel: RowModel<TFeatures, TData>,
  instance: FilteringInstance<TFeatures, TData>
): RowModel<TFeatures, TData> {
  const joinOperator = instance.atoms.joinOperator?.get() ?? 'and';
  const testsByColumn = new Map<string, RowTest<TFeatures, TData>[]>();

  for (const filter of instance.atoms.columnFilters?.get() ?? []) {
    const column = instance.getColumn(filter.id);
    const test = column ? getFilterTest(column, filter) : null;
    if (!test) continue;
    testsByColumn.set(filter.id, [...(testsByColumn.get(filter.id) ?? []), test]);
  }

  const globalTests = getGlobalFilterTests(instance);
  const hasFilters = testsByColumn.size > 0 || globalTests.length > 0;

  for (const row of rowModel.flatRows) {
    const results = makeObjectMap<boolean>();

    if (hasFilters) {
      for (const [columnId, tests] of testsByColumn) {
        results[columnId] =
          joinOperator === 'or'
            ? tests.some((test) => test(row))
            : tests.every((test) => test(row));
      }
      if (globalTests.length > 0) {
        results[GLOBAL_FILTER_ID] = globalTests.some((test) => test(row));
      }
    }

    setFilterResults(row, results);
  }

  if (!hasFilters || rowModel.rows.length === 0) return rowModel;

  return filterRows(rowModel.rows, (row) => getRowPasses(row, joinOperator), instance);
}

function getFacetedRowModel<TFeatures extends TableFeatures, TData extends RowData>(
  rowModel: RowModel<TFeatures, TData>,
  columnId: string,
  instance: FilteringInstance<TFeatures, TData>
): RowModel<TFeatures, TData> {
  const globalFilter = instance.atoms.globalFilter?.get();
  const hasGlobalFilter =
    columnId !== GLOBAL_FILTER_ID &&
    globalFilter !== undefined &&
    globalFilter !== null &&
    globalFilter !== '';
  const hasOtherFilters =
    hasGlobalFilter ||
    (instance.atoms.columnFilters?.get() ?? []).some((filter) => filter.id !== columnId);

  if (!hasOtherFilters || rowModel.rows.length === 0) return rowModel;

  const joinOperator = instance.atoms.joinOperator?.get() ?? 'and';

  return filterRows(rowModel.rows, (row) => getRowPasses(row, joinOperator, columnId), instance);
}

function getRowPasses<TFeatures extends TableFeatures, TData extends RowData>(
  row: Row<TFeatures, TData>,
  joinOperator: JoinOperator,
  excludedColumnId?: string
) {
  const results = filterResultsByRow.get(row) ?? {};

  if (excludedColumnId !== GLOBAL_FILTER_ID && results[GLOBAL_FILTER_ID] === false) {
    return false;
  }

  const columnIds = Object.keys(results).filter(
    (id) => id !== GLOBAL_FILTER_ID && id !== excludedColumnId
  );
  if (columnIds.length === 0) return true;

  return joinOperator === 'or'
    ? columnIds.some((id) => results[id])
    : columnIds.every((id) => results[id]);
}

function setFilterResults<TFeatures extends TableFeatures, TData extends RowData>(
  row: Row<TFeatures, TData>,
  results: Record<string, boolean> = {}
) {
  filterResultsByRow.set(row, results);
  Object.assign(row, {
    columnFilters: results,
    columnFiltersMeta: makeObjectMap()
  });
}

function getFilterVariant(meta: unknown): FilterVariant {
  const variant = typeof meta === 'object' && meta && 'variant' in meta ? meta.variant : undefined;
  return FILTER_VARIANTS.find((item) => item === variant) ?? 'text';
}

function getFilterTest<TFeatures extends TableFeatures, TData extends RowData>(
  column: FilteringColumn<TFeatures, TData>,
  filter: ColumnFilter
): RowTest<TFeatures, TData> | null {
  const filterFn = column.getFilterFn?.();

  if (!filter.operator && filterFn && !Object.is(filterFn, dataTableFilterFn)) {
    const value = filterFn.resolveFilterValue?.(filter.value) ?? filter.value;
    return (row) => filterFn(row, column.id, value);
  }

  const item = normalizeColumnFilter(filter, getFilterVariant(column.columnDef.meta));
  if (!getIsActiveFilter(item)) return null;

  return (row) => matchesFilter(row.getValue(column.id), item);
}

function getGlobalFilterTests<TFeatures extends TableFeatures, TData extends RowData>(
  instance: FilteringInstance<TFeatures, TData>
): RowTest<TFeatures, TData>[] {
  const globalFilter = instance.atoms.globalFilter?.get();
  const filterFn = instance.getGlobalFilterFn?.();

  if (globalFilter === undefined || globalFilter === null || globalFilter === '' || !filterFn) {
    return [];
  }

  const value = filterFn.resolveFilterValue?.(globalFilter) ?? globalFilter;

  return instance
    .getAllLeafColumns()
    .filter((column) => column.getCanGlobalFilter?.())
    .map((column) => (row) => filterFn(row, column.id, value));
}

function filterRows<TFeatures extends TableFeatures, TData extends RowData>(
  rows: Row<TFeatures, TData>[],
  passes: RowTest<TFeatures, TData>,
  instance: FilteringInstance<TFeatures, TData>
): RowModel<TFeatures, TData> {
  const maxDepth = instance.options.maxLeafRowFilterDepth ?? 100;
  const flatRows: Row<TFeatures, TData>[] = [];
  const rowsById = makeObjectMap<Row<TFeatures, TData>>();

  function copyRow(row: Row<TFeatures, TData>) {
    const copy = constructRow(
      instance,
      row.id,
      row.original,
      row.index,
      row.depth,
      undefined,
      row.parentId
    );
    setFilterResults(copy, filterResultsByRow.get(row));
    return copy;
  }

  function addToFlat(subRows: Row<TFeatures, TData>[]) {
    for (const subRow of subRows) {
      flatRows.push(subRow);
      rowsById[subRow.id] = subRow;
      if (subRow.subRows.length) addToFlat(subRow.subRows);
    }
  }

  function fromLeafs(
    rowsToFilter: Row<TFeatures, TData>[],
    depth: number
  ): Row<TFeatures, TData>[] {
    const filtered: Row<TFeatures, TData>[] = [];

    for (const row of rowsToFilter) {
      const copy = copyRow(row);

      if (row.subRows.length && depth < maxDepth) {
        copy.subRows = fromLeafs(row.subRows, depth + 1);
        if (copy.subRows.length || passes(copy)) filtered.push(copy);
      } else if (passes(copy)) {
        copy.subRows = row.subRows;
        filtered.push(copy);
      }
    }

    return filtered;
  }

  function fromRoot(rowsToFilter: Row<TFeatures, TData>[], depth: number): Row<TFeatures, TData>[] {
    const filtered: Row<TFeatures, TData>[] = [];

    for (const row of rowsToFilter) {
      if (!passes(row)) continue;

      if (row.subRows.length && depth < maxDepth) {
        const copy = copyRow(row);
        filtered.push(copy);
        flatRows.push(copy);
        rowsById[copy.id] = copy;
        copy.subRows = fromRoot(row.subRows, depth + 1);
      } else {
        filtered.push(row);
        flatRows.push(row);
        rowsById[row.id] = row;
        if (row.subRows.length) addToFlat(row.subRows);
      }
    }

    return filtered;
  }

  if (instance.options.filterFromLeafRows) {
    const filtered = fromLeafs(rows, 0);
    addToFlat(filtered);
    return { rows: filtered, flatRows, rowsById };
  }

  return { rows: fromRoot(rows, 0), flatRows, rowsById };
}

function getLowercaseText(value: unknown) {
  return stringifyFilterValue(value).toLowerCase();
}

function getBooleanString(value: unknown) {
  return value === true || value === 'true' ? 'true' : 'false';
}

function parseNumber(value: unknown) {
  if (value === '' || value == null) return Number.NaN;
  return typeof value === 'number' ? value : Number(value);
}

function parseTime(value: unknown) {
  return parseFilterDate(value)?.getTime() ?? Number.NaN;
}

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(time: number) {
  const date = new Date(time);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function getIsSameDay(cellValue: unknown, value: unknown) {
  const cell = parseTime(cellValue);
  const target = parseTime(value);
  if (Number.isNaN(cell) || Number.isNaN(target)) return false;
  return cell >= startOfDay(target) && cell <= endOfDay(target);
}

function compare(
  cellValue: unknown,
  value: unknown,
  operator: 'lt' | 'lte' | 'gt' | 'gte',
  isDate: boolean
) {
  if (Array.isArray(value)) return true;

  let cell: number;
  let target: number;

  if (isDate) {
    cell = parseTime(cellValue);
    const time = parseTime(value);
    target = operator === 'lt' || operator === 'gte' ? startOfDay(time) : endOfDay(time);
  } else {
    cell = parseNumber(cellValue);
    target = parseNumber(value);
  }

  if (Number.isNaN(cell) || Number.isNaN(target)) return false;

  switch (operator) {
    case 'lt':
      return cell < target;
    case 'lte':
      return cell <= target;
    case 'gt':
      return cell > target;
    default:
      return cell >= target;
  }
}

function getIsBetween(cellValue: unknown, value: unknown, isDate: boolean) {
  if (!Array.isArray(value) || value.length !== 2) return true;

  const [rawStart, rawEnd] = value;
  const hasStart = stringifyFilterValue(rawStart).trim() !== '';
  const hasEnd = stringifyFilterValue(rawEnd).trim() !== '';

  if (!hasStart && !hasEnd) return true;

  const cell = isDate ? parseTime(cellValue) : parseNumber(cellValue);
  if (Number.isNaN(cell)) return false;

  if (isDate) {
    const start = hasStart ? startOfDay(parseTime(rawStart)) : null;
    const end = hasEnd ? endOfDay(parseTime(rawEnd)) : null;
    return (start === null || cell >= start) && (end === null || cell <= end);
  }

  const start = hasStart ? parseNumber(rawStart) : null;
  const end = hasEnd ? parseNumber(rawEnd) : null;

  return (start === null || cell >= start) && (end === null || cell <= end);
}

function getIsRelativeToToday(cellValue: unknown, value: unknown) {
  if (typeof value !== 'string') return true;

  const [amountRaw, unit] = value.split(' ');
  const amount = Number.parseInt(amountRaw ?? '', 10);
  if (Number.isNaN(amount) || !unit) return true;

  const today = Date.now();
  let start: number;
  let end: number;

  switch (unit) {
    case 'days':
      start = startOfDay(today + amount * DAY_MS);
      end = endOfDay(start);
      break;
    case 'weeks':
      start = startOfDay(today + amount * 7 * DAY_MS);
      end = endOfDay(start + 6 * DAY_MS);
      break;
    case 'months':
      start = startOfDay(today + amount * 30 * DAY_MS);
      end = endOfDay(start + 29 * DAY_MS);
      break;
    default:
      return true;
  }

  const cell = parseTime(cellValue);
  if (Number.isNaN(cell)) return false;
  return cell >= start && cell <= end;
}

function getIsEmptyValue(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}
