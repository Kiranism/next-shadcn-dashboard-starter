import type { Column, ColumnFilter, RowData, SortingState, Table } from '@tanstack/react-table';

import type { DataTableFeatures } from '@/lib/data-table-features';
import type {
  ColumnFilterItem,
  FilterOperator,
  FilterOperatorOption,
  FilterVariant
} from '@/lib/data-table-types';

import { formatDate } from '@/lib/format';

export const FILTER_VARIANTS = [
  'text',
  'number',
  'range',
  'date',
  'dateRange',
  'boolean',
  'select',
  'multiSelect'
] as const;

export const FILTER_OPERATORS = {
  iLike: 'ilike',
  notILike: 'not.ilike',
  eq: 'eq',
  ne: 'neq',
  inArray: 'in',
  notInArray: 'not.in',
  isEmpty: 'is.empty',
  isNotEmpty: 'not.is.empty',
  lt: 'lt',
  lte: 'lte',
  gt: 'gt',
  gte: 'gte',
  isBetween: 'between',
  isRelativeToToday: 'rel'
} as const;

export const JOIN_OPERATORS = ['and', 'or'] as const;

export const SORT_ORDERS = [
  { label: 'Asc', value: 'asc' },
  { label: 'Desc', value: 'desc' }
] as const;

const TEXT_OPERATORS = [
  { label: 'Contains', value: 'iLike' },
  { label: 'Does not contain', value: 'notILike' },
  { label: 'Is', value: 'eq' },
  { label: 'Is not', value: 'ne' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' }
] satisfies FilterOperatorOption[];

const NUMERIC_OPERATORS = [
  { label: 'Is', value: 'eq' },
  { label: 'Is not', value: 'ne' },
  { label: 'Is less than', value: 'lt' },
  { label: 'Is less than or equal to', value: 'lte' },
  { label: 'Is greater than', value: 'gt' },
  { label: 'Is greater than or equal to', value: 'gte' },
  { label: 'Is between', value: 'isBetween' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' }
] satisfies FilterOperatorOption[];

const DATE_OPERATORS = [
  { label: 'Is', value: 'eq' },
  { label: 'Is not', value: 'ne' },
  { label: 'Is before', value: 'lt' },
  { label: 'Is after', value: 'gt' },
  { label: 'Is on or before', value: 'lte' },
  { label: 'Is on or after', value: 'gte' },
  { label: 'Is between', value: 'isBetween' },
  { label: 'Is relative to today', value: 'isRelativeToToday' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' }
] satisfies FilterOperatorOption[];

const SELECT_OPERATORS = [
  { label: 'Is', value: 'eq' },
  { label: 'Is not', value: 'ne' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' }
] satisfies FilterOperatorOption[];

const MULTI_SELECT_OPERATORS = [
  { label: 'Has any of', value: 'inArray' },
  { label: 'Has none of', value: 'notInArray' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' }
] satisfies FilterOperatorOption[];

const BOOLEAN_OPERATORS = [
  { label: 'Is', value: 'eq' },
  { label: 'Is not', value: 'ne' }
] satisfies FilterOperatorOption[];

const MULTI_VALUE_FILTER_VARIANTS: FilterVariant[] = [
  'select',
  'multiSelect',
  'range',
  'dateRange'
];

const FILTER_OPERATORS_BY_VARIANT: Record<FilterVariant, FilterOperatorOption[]> = {
  text: TEXT_OPERATORS,
  number: NUMERIC_OPERATORS,
  range: NUMERIC_OPERATORS,
  date: DATE_OPERATORS,
  dateRange: DATE_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  select: SELECT_OPERATORS,
  multiSelect: MULTI_SELECT_OPERATORS
};

function getColumnVar(columnId: string, property: 'size' | 'offset') {
  const name = columnId.replace(
    /[^a-zA-Z0-9-]/g,
    (char) => `_${char.codePointAt(0)?.toString(16)}_`
  );
  return `--column-${name}-${property}`;
}

export function getAriaSort(
  sorting: SortingState,
  columnId: string
): React.AriaAttributes['aria-sort'] {
  const sort = sorting[0];
  if (sort?.id !== columnId) return undefined;
  return sort.desc ? 'descending' : 'ascending';
}

export function getVisibleSelectedRows<TData extends RowData>(
  table: Table<DataTableFeatures, TData>
) {
  return table.getRowModel().rows.filter((row) => row.getIsSelected());
}

export function getColumnPinningStyle<TData extends RowData>(
  column: Column<DataTableFeatures, TData>
): React.CSSProperties {
  const isPinned = column.getIsPinned();

  return {
    insetInlineStart:
      isPinned === 'start' ? `var(${getColumnVar(column.id, 'offset')})` : undefined,
    insetInlineEnd: isPinned === 'end' ? `var(${getColumnVar(column.id, 'offset')})` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: `var(${getColumnVar(column.id, 'size')})`,
    zIndex: isPinned ? 20 : undefined
  };
}

export function getColumnSizingStyle<TData extends RowData>(
  table: Table<DataTableFeatures, TData>
): React.CSSProperties {
  const style: Record<string, string> = {
    minWidth: `${table.getTotalSize()}px`
  };

  for (const header of table.getFlatHeaders()) {
    style[getColumnVar(header.column.id, 'size')] = `${header.getSize()}px`;
  }

  for (const { column } of table.getLeafHeaders()) {
    const isPinned = column.getIsPinned();
    if (!isPinned) continue;

    const offset = isPinned === 'start' ? column.getStart('start') : column.getAfter('end');
    style[getColumnVar(column.id, 'offset')] = `${offset}px`;
  }

  return style;
}

export function getFilterOperators(filterVariant: FilterVariant) {
  return FILTER_OPERATORS_BY_VARIANT[filterVariant] ?? [];
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant);

  return operators[0]?.value ?? (filterVariant === 'text' ? 'iLike' : 'eq');
}

export function getIsEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function getIsValuelessOperator(operator: FilterOperator) {
  return operator === 'isEmpty' || operator === 'isNotEmpty';
}

export function coerceFilterValue(operator: FilterOperator, value: string | string[]) {
  if (getIsValuelessOperator(operator)) return '';

  if (operator === 'inArray' || operator === 'notInArray') {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  if (operator === 'isBetween') {
    return Array.isArray(value) ? value : [value, ''];
  }

  if (Array.isArray(value)) return value.find((item) => item !== '') ?? '';

  return value;
}

export function getDefaultFilter<TData extends RowData>(column: Column<DataTableFeatures, TData>) {
  const variant = column.columnDef.meta?.variant ?? 'text';

  return {
    id: column.id,
    variant,
    operator: getDefaultFilterOperator(variant),
    value: ''
  };
}

export function getSelectFilterValue(filter: ColumnFilterItem) {
  if (filter.variant === 'multiSelect') {
    return Array.isArray(filter.value) ? filter.value : [];
  }

  return typeof filter.value === 'string' ? filter.value : undefined;
}

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseFilterDate(value: unknown): Date | undefined {
  if (value instanceof Date) return getValidDate(value);
  if (typeof value === 'number') return getValidDate(new Date(value));
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  const text = value.trim();
  const match = CALENDAR_DATE_PATTERN.exec(text);
  if (match) {
    const [, year, month, day] = match.map(Number);
    if (year === undefined || month === undefined || day === undefined) {
      return undefined;
    }
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : undefined;
  }

  const numeric = Number(text);
  return getValidDate(new Date(Number.isNaN(numeric) ? text : numeric));
}

export function formatFilterDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getValidDate(date: Date) {
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function stringifyFilterDate(value: unknown) {
  const date = parseFilterDate(value);
  return date ? formatFilterDate(date) : '';
}

export function getIsDateVariant(variant: FilterVariant) {
  return variant === 'date' || variant === 'dateRange';
}

function getFilterValueStringifier(variant: FilterVariant, operator: FilterOperator) {
  return getIsDateVariant(variant) && operator !== 'isRelativeToToday'
    ? stringifyFilterDate
    : stringifyFilterValue;
}

export function getFilterDates(value: ColumnFilterItem['value']) {
  return (Array.isArray(value) ? value : [value]).flatMap((item) => {
    const date = parseFilterDate(item);
    return date ? [date] : [];
  });
}

export function getFilterDateValue(date: Date | undefined) {
  return date ? formatFilterDate(date) : '';
}

export function getDateFilterLabel(filter: ColumnFilterItem) {
  const [startDate, endDate] = getFilterDates(filter.value);
  if (!startDate) return undefined;

  const start = formatDate(startDate, { month: 'short' });
  if (
    filter.operator !== 'isBetween' ||
    !endDate ||
    startDate.toDateString() === endDate.toDateString()
  ) {
    return start;
  }

  return `${start} - ${formatDate(endDate, { month: 'short' })}`;
}

export function stringifyFilterValue(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value as string | number | boolean | bigint);
}

export function getIsMultiValueVariant(variant: FilterVariant) {
  return MULTI_VALUE_FILTER_VARIANTS.includes(variant);
}

export function getPlainFilterOperator(variant: FilterVariant): FilterOperator {
  if (variant === 'select' || variant === 'multiSelect') return 'inArray';
  if (variant === 'range' || variant === 'dateRange') return 'isBetween';
  return getDefaultFilterOperator(variant);
}

export function getIsPlainFilter(filter: ColumnFilterItem) {
  return (
    filter.operator === getPlainFilterOperator(filter.variant) &&
    Array.isArray(filter.value) === getIsMultiValueVariant(filter.variant)
  );
}

export function getPlainFilterId(columnId: string) {
  return `${columnId}-filter`;
}

export function createPlainFilter<TColumnId extends string>(
  id: TColumnId,
  variant: FilterVariant,
  value: unknown
): ColumnFilterItem<TColumnId> | null {
  if (value === undefined || value === null || value === '') return null;

  const operator = getPlainFilterOperator(variant);
  const filterId = getPlainFilterId(id);
  const stringify = getFilterValueStringifier(variant, operator);

  if (getIsMultiValueVariant(variant)) {
    const values = (Array.isArray(value) ? value : [value]).map(stringify);
    if (values.every((item) => item === '')) return null;
    return { id, variant, operator, value: values, filterId };
  }

  if (Array.isArray(value)) return null;

  return { id, variant, operator, value: stringify(value), filterId };
}

export function normalizeColumnFilter(
  filter: ColumnFilter,
  variant: FilterVariant
): ColumnFilterItem {
  const filterId = filter.filterId ?? getPlainFilterId(filter.id);

  if (filter.operator) {
    const filterVariant = filter.variant ?? variant;
    const stringify = getFilterValueStringifier(filterVariant, filter.operator);

    return {
      id: filter.id,
      variant: filterVariant,
      operator: filter.operator,
      value: Array.isArray(filter.value) ? filter.value.map(stringify) : stringify(filter.value),
      filterId
    };
  }

  const item = createPlainFilter(filter.id, variant, filter.value);
  if (item) return { ...item, filterId };

  return {
    id: filter.id,
    variant,
    operator: getPlainFilterOperator(variant),
    value: getIsMultiValueVariant(variant) ? [] : '',
    filterId
  };
}

export function getPlainFilterValue(filter: ColumnFilterItem): unknown {
  const { variant, value } = filter;

  if (variant === 'select' || variant === 'multiSelect') {
    return Array.isArray(value) ? value : [value];
  }

  if (variant === 'range') {
    return Array.isArray(value)
      ? value.map((item) => (item === '' ? undefined : Number(item)))
      : value;
  }

  if (getIsDateVariant(variant)) {
    return Array.isArray(value)
      ? value.map((item) => parseFilterDate(item)?.getTime())
      : parseFilterDate(value)?.getTime();
  }

  return value;
}

export function getIsActiveFilter(filter: ColumnFilterItem) {
  return (
    getIsValuelessOperator(filter.operator) ||
    (Array.isArray(filter.value)
      ? filter.value.some((value) => value !== '')
      : filter.value !== '' && filter.value !== null && filter.value !== undefined)
  );
}

export function getActiveFilters<TFilterItem extends ColumnFilterItem>(
  filters: TFilterItem[]
): TFilterItem[] {
  return filters.filter(getIsActiveFilter);
}
