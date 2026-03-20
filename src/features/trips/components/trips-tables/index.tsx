'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { columns } from './columns';
import { useTripsTableStore } from '@/features/trips/stores/use-trips-table-store';
import { getUrgencyLevel } from '@/features/trips/lib/urgency-logic';
import { URGENCY_STYLES } from '@/features/trips/constants/urgency-config';

export { columns };

interface TripsTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function TripsTable<TData, TValue>({
  data,
  totalItems,
  columns
}: TripsTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(50));
  const pageCount = Math.ceil(totalItems / pageSize);

  // Compute the row id to auto-scroll to: first trip >= now-15min, or last row.
  const anchorRowId = React.useMemo(() => {
    if (!data.length) return null;
    const cutoff = Date.now() - 15 * 60 * 1000;
    const idx = (data as any[]).findIndex((trip) => {
      const ts = trip.scheduled_at
        ? new Date(trip.scheduled_at).getTime()
        : null;
      return ts !== null && ts >= cutoff;
    });
    // If no future/recent trip found, anchor to the last row.
    const anchorIdx = idx === -1 ? data.length - 1 : idx;
    return String(anchorIdx);
  }, [data]);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  const setTable = useTripsTableStore((s) => s.setTable);
  const setColumnVisibility = useTripsTableStore((s) => s.setColumnVisibility);

  React.useEffect(() => {
    setTable(table as any);
    return () => setTable(null);
  }, [table, setTable]);

  const columnVisibility = table.getState().columnVisibility;
  React.useEffect(() => {
    setColumnVisibility(columnVisibility);
  }, [columnVisibility, setColumnVisibility]);

  // Calculate groups for visual indicators
  const groupCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((item: any) => {
      if (item.group_id) {
        counts[item.group_id] = (counts[item.group_id] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isNowWindow = (date: Date, windowMinutes = 30) => {
    const now = new Date();
    if (!isToday(date)) return false;
    const diffMinutes = Math.abs(date.getTime() - now.getTime()) / 60000;
    return diffMinutes <= windowMinutes;
  };

  return (
    <DataTable
      table={table}
      scrollAnchorRowId={anchorRowId}
      getRowClassName={(row: any) => {
        const classes: string[] = [];

        const scheduledAt = row.scheduled_at;
        const status = row.status;
        const urgency = getUrgencyLevel(scheduledAt, status);
        const style = URGENCY_STYLES[urgency];

        // 1. Group Highlight (highest priority side border)
        if (row.group_id && groupCounts[row.group_id] > 1) {
          classes.push(
            'border-l-4 border-l-green-500 bg-green-50/10 dark:bg-green-950/5'
          );
        } else if (style && style.rowClass) {
          // 2. Urgency Highlight
          classes.push(style.rowClass);
        }

        // 3. Base Today Highlight (lowest priority background)
        if (scheduledAt) {
          const date = new Date(scheduledAt);
          if (isToday(date)) {
            classes.push('bg-muted/10');
          }
        }

        return cn(classes);
      }}
    >
      <DataTableToolbar table={table} showViewOptions={false} />
    </DataTable>
  );
}
