import { createParser, parseAsInteger, parseAsNativeArrayOf, parseAsStringEnum } from 'nuqs/server';
import { z } from 'zod';

import type {
  ColumnFilterItem,
  ColumnSortItem,
  DataTableColumnConfig,
  DataTableColumnConfigs,
  DataTableColumnConfigsQuery,
  FilterableColumnId,
  FilterOperator,
  FilterVariant,
  JoinOperator,
  SortableColumnId
} from '@/lib/data-table-types';

import {
  FILTER_OPERATORS,
  getFilterOperators,
  getIsActiveFilter,
  getIsValuelessOperator,
  getPlainFilterOperator,
  JOIN_OPERATORS,
  normalizeColumnFilter
} from '@/lib/data-table-utils';

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean()
});

export const getSortingStateParser = <TColumnId extends string = string>(
  columnIds?: readonly TColumnId[] | Set<TColumnId>
) => {
  const validIds = getIdSet(columnIds);

  return createParser<ColumnSortItem<TColumnId>[]>({
    parse: (value) => {
      const sorting = parseSorting(value);
      return sorting && getHasKnownIds(sorting, validIds) ? sorting : null;
    },
    serialize: (value) => {
      const compact = value.map((item) => `${item.id}.${item.desc ? 'desc' : 'asc'}`).join(',');
      const parsed = parseSorting(compact);

      // Ids with a comma, or a first id starting with `[`, don't round-trip.
      return parsed && getIsSameSorting(parsed, value) ? compact : JSON.stringify(value);
    },
    eq: getIsSameSorting
  });
};

const OPERATORS_BY_NAME = new Map(
  getKeys(FILTER_OPERATORS).flatMap((operator): [string, FilterOperator][] => [
    [FILTER_OPERATORS[operator], operator],
    [operator.toLowerCase(), operator]
  ])
);

const MAX_OPERATOR_PART_COUNT = 3;

const LIST_OPERATORS = new Set<FilterOperator>(['inArray', 'notInArray', 'isBetween']);

export function parseColumnFilter<TColumnId extends string>(
  id: TColumnId,
  variant: FilterVariant,
  param: string
): ColumnFilterItem<TColumnId> {
  const { operator, rawValue } = splitFilterOperator(param, variant);

  const filter = normalizeColumnFilter(
    {
      id,
      variant,
      operator,
      value: getIsValuelessOperator(operator)
        ? ''
        : LIST_OPERATORS.has(operator)
          ? parseListValue(rawValue, operator)
          : rawValue
    },
    variant
  );

  return { ...filter, id };
}

export function serializeColumnFilter(filter: ColumnFilterItem) {
  const name = FILTER_OPERATORS[filter.operator];
  if (getIsValuelessOperator(filter.operator)) return name;

  const rawValue = Array.isArray(filter.value) ? joinListValue(filter.value) : filter.value;

  if (filter.operator === getPlainFilterOperator(filter.variant)) {
    const implicit = parseColumnFilter(filter.id, filter.variant, rawValue);
    if (getIsSameFilter(implicit, filter)) return rawValue;
  }

  return `${name}.${rawValue}`;
}

export function getColumnFilterParser<TColumnId extends string>(
  id: TColumnId,
  variant: FilterVariant
) {
  return parseAsNativeArrayOf(
    createParser<ColumnFilterItem<TColumnId>>({
      // nuqs drops items that parse to null, so `?title=` reads as no filter.
      parse: (param) => {
        const filter = parseColumnFilter(id, variant, param);
        return getIsActiveFilter(filter) ? filter : null;
      },
      serialize: serializeColumnFilter,
      eq: (a, b) => serializeColumnFilter(a) === serializeColumnFilter(b)
    })
  );
}

export function getColumnFilters<TColumnId extends string>(
  columnIds: readonly TColumnId[],
  getFilters: (id: TColumnId) => ColumnFilterItem<TColumnId>[]
) {
  return columnIds.flatMap((id) =>
    getFilters(id).map((filter, index) => ({
      ...filter,
      filterId: `${id}-${index}`
    }))
  );
}

export function sortColumnFiltersBySearch<TFilter extends ColumnFilterItem>(
  filters: TFilter[],
  search: string | URLSearchParams
) {
  const positions = new Map<string, number>();
  for (const key of new URLSearchParams(search).keys()) {
    if (!positions.has(key)) positions.set(key, positions.size);
  }

  return [...filters].sort(
    (a, b) =>
      (positions.get(a.id) ?? Number.POSITIVE_INFINITY) -
      (positions.get(b.id) ?? Number.POSITIVE_INFINITY)
  );
}

export function getColumnFiltersKey(filters: ColumnFilterItem[]) {
  return filters
    .map((filter) => `${filter.id}=${serializeColumnFilter(filter)}`)
    .sort()
    .join('&');
}

export function getFilterableColumns<TColumnConfigs extends DataTableColumnConfigs>(
  columnConfigs: TColumnConfigs
) {
  const entries = getKeys<keyof TColumnConfigs & string>(columnConfigs).flatMap((id) => {
    const variant = columnConfigs[id]?.variant;
    return variant ? [[id, variant] as const] : [];
  });

  return Object.fromEntries(entries) as Record<FilterableColumnId<TColumnConfigs>, FilterVariant>;
}

export function getSortableColumns<TColumnConfigs extends DataTableColumnConfigs>(
  columnConfigs: TColumnConfigs
) {
  return getKeys<keyof TColumnConfigs & string>(columnConfigs).filter(
    (id): id is SortableColumnId<TColumnConfigs> => columnConfigs[id]?.isSortable !== false
  );
}

export function getColumnOptions(config: DataTableColumnConfig) {
  return {
    enableColumnFilter: config.variant !== undefined,
    enableSorting: config.isSortable !== false
  };
}

interface DataTableSearchParamsOptions<TColumnConfigs extends DataTableColumnConfigs> {
  columnConfigs: TColumnConfigs;
  defaultSorting?: ColumnSortItem<NoInfer<SortableColumnId<TColumnConfigs>>>[];
  defaultPerPage?: number;
}

export function getDataTableSearchParams<TColumnConfigs extends DataTableColumnConfigs>({
  columnConfigs,
  defaultSorting = [],
  defaultPerPage = 10
}: DataTableSearchParamsOptions<TColumnConfigs>) {
  return {
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(defaultPerPage),
    sort: getSortingStateParser(getSortableColumns(columnConfigs)).withDefault(defaultSorting),
    joinOperator: parseAsStringEnum([...JOIN_OPERATORS]).withDefault('and'),
    ...getFilterParsers(getFilterableColumns(columnConfigs))
  };
}

interface DataTableSearch<TSortColumnId extends string> {
  page: number;
  perPage: number;
  sort: ColumnSortItem<TSortColumnId>[];
  joinOperator: JoinOperator;
}

export function getDataTableQuery<TColumnConfigs extends DataTableColumnConfigs>(
  search: NoInfer<
    DataTableSearch<SortableColumnId<TColumnConfigs>> &
      Record<
        FilterableColumnId<TColumnConfigs>,
        ColumnFilterItem<FilterableColumnId<TColumnConfigs>>[]
      >
  >,
  columnConfigs: TColumnConfigs
): DataTableColumnConfigsQuery<TColumnConfigs> {
  const filtersById: Record<
    FilterableColumnId<TColumnConfigs>,
    ColumnFilterItem<FilterableColumnId<TColumnConfigs>>[]
  > = search;

  return {
    page: search.page,
    perPage: search.perPage,
    sorting: search.sort,
    filters: getColumnFilters(
      getKeys(getFilterableColumns(columnConfigs)),
      (id) => filtersById[id]
    ),
    joinOperator: search.joinOperator
  };
}

function getFilterParsers<TColumnId extends string>(columns: Record<TColumnId, FilterVariant>) {
  const parsers = getKeys(columns).map(
    (id) => [id, getColumnFilterParser(id, columns[id])] as const
  );
  return Object.fromEntries(parsers) as Record<
    TColumnId,
    ReturnType<typeof getColumnFilterParser<TColumnId>>
  >;
}

function splitFilterOperator(param: string, variant: FilterVariant) {
  const parts = param.split('.');

  for (let count = Math.min(MAX_OPERATOR_PART_COUNT, parts.length); count > 0; count--) {
    const operator = OPERATORS_BY_NAME.get(parts.slice(0, count).join('.').toLowerCase());
    if (!operator || !getIsVariantOperator(variant, operator)) continue;
    if (count === parts.length && !getIsValuelessOperator(operator)) continue;

    return { operator, rawValue: parts.slice(count).join('.') };
  }

  return { operator: getPlainFilterOperator(variant), rawValue: param };
}

function getIsVariantOperator(variant: FilterVariant, operator: FilterOperator) {
  return (
    operator === getPlainFilterOperator(variant) ||
    getFilterOperators(variant).some((option) => option.value === operator)
  );
}

function parseListValue(rawValue: string, operator: FilterOperator) {
  const items: string[] = [];
  let item = '';
  let isQuoted = false;
  let wasQuoted = false;

  for (let index = 0; index < rawValue.length; index++) {
    const char = rawValue[index];

    if (char === '"') {
      if (isQuoted && rawValue[index + 1] === '"') {
        item += char;
        index++;
      } else {
        isQuoted = !isQuoted;
        wasQuoted = true;
      }
    } else if (char === ',' && !isQuoted) {
      items.push(wasQuoted ? item : item.trim());
      item = '';
      wasQuoted = false;
    } else {
      item += char;
    }
  }
  if (rawValue !== '') items.push(wasQuoted ? item : item.trim());

  if (operator === 'isBetween') return [items[0] ?? '', items[1] ?? ''];
  return items.filter((value) => value !== '');
}

function joinListValue(values: string[]) {
  return values
    .map((value) =>
      /[,"]/.test(value) || value !== value.trim() ? `"${value.replaceAll('"', '""')}"` : value
    )
    .join(',');
}

function getIsSameFilter(a: ColumnFilterItem, b: ColumnFilterItem) {
  if (a.operator !== b.operator) return false;
  if (!Array.isArray(a.value) || !Array.isArray(b.value)) {
    return a.value === b.value;
  }
  const otherValue = b.value;
  return (
    a.value.length === otherValue.length &&
    a.value.every((item, index) => item === otherValue[index])
  );
}

function getKeys<TKey extends string>(record: Record<TKey, unknown>) {
  return Object.keys(record).filter((key): key is TKey => Object.hasOwn(record, key));
}

function parseSorting(value: string): ColumnSortItem[] | null {
  if (value.startsWith('[')) {
    try {
      const result = z.array(sortingItemSchema).safeParse(JSON.parse(value));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  const sorting: ColumnSortItem[] = [];

  for (const part of value.split(',')) {
    const index = part.lastIndexOf('.');
    const order = part.slice(index + 1);

    if (index <= 0 || (order !== 'asc' && order !== 'desc')) return null;

    sorting.push({ id: part.slice(0, index), desc: order === 'desc' });
  }

  return sorting;
}

function getIsSameSorting(a: ColumnSortItem[], b: ColumnSortItem[]) {
  return (
    a.length === b.length &&
    a.every((item, index) => item.id === b[index]?.id && item.desc === b[index]?.desc)
  );
}

function getIdSet<TColumnId extends string>(ids?: readonly TColumnId[] | Set<TColumnId>) {
  if (!ids) return null;
  return ids instanceof Set ? ids : new Set(ids);
}

function getHasKnownIds<TColumnItem extends { id: string }, TColumnId extends string>(
  items: TColumnItem[],
  ids: ReadonlySet<TColumnId> | null
): items is (TColumnItem & { id: TColumnId })[] {
  const knownIds: ReadonlySet<string> | null = ids;
  return knownIds === null || items.every((item) => knownIds.has(item.id));
}
