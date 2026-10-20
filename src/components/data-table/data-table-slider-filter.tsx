'use client';

import { type Column, type RowData, Subscribe } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import * as React from 'react';

import type { DataTableFeatures } from '@/lib/data-table-features';

import { Button } from '@/components/ui/button';
import { useDirection } from '@/components/ui/direction';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { IconCircleX, IconCirclePlus } from '@tabler/icons-react';

interface Range {
  min: number;
  max: number;
}

type RangeValue = [number, number];

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function parseRangeBounds(value: unknown): [number | undefined, number | undefined] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;

  const [start, end] = value.map(parseRangeBound);
  if (start === null || end === null) return undefined;
  if (start === undefined && end === undefined) return undefined;

  return [start, end];
}

function parseRangeBound(value: unknown) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'number' && typeof value !== 'string') return null;

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

interface DataTableSliderFilterProps<TData extends RowData> {
  column: Column<DataTableFeatures, TData>;
  title?: string;
}

export function DataTableSliderFilter<TData extends RowData>({
  column,
  ...props
}: DataTableSliderFilterProps<TData>) {
  return (
    <Subscribe source={column.table.atoms.columnFilters} selector={() => column.getFilterValue()}>
      {(filterValue) => (
        <DataTableSliderFilterContent column={column} columnFilterValue={filterValue} {...props} />
      )}
    </Subscribe>
  );
}

function DataTableSliderFilterContent<TData extends RowData>({
  column,
  title = column.columnDef.meta?.label ?? column.id,
  columnFilterValue: columnFilterValueProp
}: DataTableSliderFilterProps<TData> & {
  columnFilterValue: unknown;
}) {
  const dir = useDirection();
  const id = React.useId();

  const defaultRange = column.columnDef.meta?.range;
  const unit = column.columnDef.meta?.unit;

  const { min, max, step } = React.useMemo<Range & { step: number }>(() => {
    let minValue = 0;
    let maxValue = 100;

    if (defaultRange && getIsValidRange(defaultRange)) {
      [minValue, maxValue] = defaultRange;
    } else {
      const values = column.getFacetedMinMaxValues();
      if (values && Array.isArray(values) && values.length === 2) {
        const [facetMinValue, facetMaxValue] = values;
        if (typeof facetMinValue === 'number' && typeof facetMaxValue === 'number') {
          minValue = facetMinValue;
          maxValue = facetMaxValue;
        }
      }
    }

    const rangeSize = maxValue - minValue;
    const step =
      rangeSize <= 20
        ? 1
        : rangeSize <= 100
          ? Math.ceil(rangeSize / 20)
          : Math.ceil(rangeSize / 50);

    return { min: minValue, max: maxValue, step };
  }, [column, defaultRange]);

  // An open-ended bound, like `estimatedHours=,8`, shows as the column limit.
  const bounds = parseRangeBounds(columnFilterValueProp);
  const columnFilterValue: RangeValue | undefined = bounds
    ? [bounds[0] ?? min, bounds[1] ?? max]
    : undefined;
  const range: RangeValue = columnFilterValue ?? [min, max];

  const formatValue = React.useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, []);

  const onFromInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value);
      if (!Number.isNaN(numValue) && numValue >= min && numValue <= range[1]) {
        column.setFilterValue([numValue, range[1]]);
      }
    },
    [column, min, range]
  );

  const onToInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value);
      if (!Number.isNaN(numValue) && numValue <= max && numValue >= range[0]) {
        column.setFilterValue([range[0], numValue]);
      }
    },
    [column, max, range]
  );

  const onSliderValueChange = React.useCallback(
    (value: number | readonly number[]) => {
      if (Array.isArray(value) && value.length === 2) {
        column.setFilterValue(value);
      }
    },
    [column]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column]
  );

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' className='border-dashed' />}>
        {columnFilterValue ? (
          <span
            aria-hidden='true'
            className='rounded-sm opacity-70 transition-opacity hover:opacity-100'
            onClick={onReset}
          >
            <IconCircleX />
          </span>
        ) : (
          <IconCirclePlus />
        )}
        <span>{title}</span>
        {columnFilterValue ? (
          <>
            <Separator
              orientation='vertical'
              className='mx-0.5 data-vertical:h-4 data-vertical:self-center'
            />
            {formatValue(columnFilterValue[0])} - {formatValue(columnFilterValue[1])}
            {unit ? ` ${unit}` : ''}
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        aria-label={`${title} filter`}
        dir={dir}
        align='start'
        className='flex w-auto flex-col gap-4'
      >
        <div className='flex flex-col gap-3'>
          <p className='leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
            {title}
          </p>
          <div className='flex items-center gap-4'>
            <Label htmlFor={`${id}-from`} className='sr-only'>
              From
            </Label>
            <div className='relative'>
              <Input
                id={`${id}-from`}
                type='number'
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode='numeric'
                pattern='[0-9]*'
                placeholder={min.toString()}
                min={min}
                max={max}
                value={range[0]?.toString()}
                onChange={onFromInputChange}
                className={cn('w-24', unit && 'pe-8')}
              />
              {unit && (
                <span className='absolute inset-e-0 top-0 bottom-0 flex items-center rounded-e-md bg-accent px-2 text-sm text-muted-foreground'>
                  {unit}
                </span>
              )}
            </div>
            <Label htmlFor={`${id}-to`} className='sr-only'>
              to
            </Label>
            <div className='relative'>
              <Input
                id={`${id}-to`}
                type='number'
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode='numeric'
                pattern='[0-9]*'
                placeholder={max.toString()}
                min={min}
                max={max}
                value={range[1]?.toString()}
                onChange={onToInputChange}
                className={cn('w-24', unit && 'pe-8')}
              />
              {unit && (
                <span className='absolute inset-e-0 top-0 bottom-0 flex items-center rounded-e-md bg-accent px-2 text-sm text-muted-foreground'>
                  {unit}
                </span>
              )}
            </div>
          </div>
          <Label htmlFor={`${id}-slider`} className='sr-only'>
            {title} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={range}
            onValueChange={onSliderValueChange}
          />
        </div>
        <Button aria-label={`Clear ${title} filter`} variant='outline' onClick={onReset}>
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
