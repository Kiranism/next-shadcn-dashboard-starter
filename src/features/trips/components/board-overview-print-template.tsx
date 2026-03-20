'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import type { KanbanColumn } from '@/features/trips/lib/kanban-types';

import type { TripData } from './mobile-print-template';
import { PrintTripGroupsList } from './print-trip-groups-list';

/**
 * Kanban-artige Übersicht: eine lange Zeile von Fahrer-Spalten (hochformat).
 * Karten = gleiche Logik wie PDF (`PrintTripGroupsList` mit `compact`).
 */
export interface BoardOverviewPrintTemplateProps {
  date: Date;
  columns: KanbanColumn[];
  itemsByColumn: Record<string, TripData[]>;
}

export function BoardOverviewPrintTemplate({
  date,
  columns,
  itemsByColumn
}: BoardOverviewPrintTemplateProps) {
  return (
    <div
      data-board-overview-print
      className='bg-slate-100 font-sans text-slate-900'
      style={{
        width: 'max-content',
        maxWidth: 'none',
        minHeight: '260px',
        padding: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div className='mb-3 flex max-w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm'>
        <div className='min-w-0'>
          <h1 className='text-base font-black tracking-tight text-slate-950 uppercase sm:text-lg'>
            Fahrtenplan · Übersicht
          </h1>
          <p className='text-xs font-semibold text-emerald-700'>
            Zugewiesene Fahrer · Hochformat (Spalten)
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <p className='text-xs font-semibold text-slate-600'>
            {format(date, 'EEEE, dd.MM.yyyy', { locale: de })}
          </p>
          <p className='text-[10px] font-medium text-slate-400'>
            {format(new Date(), 'HH:mm')} · TaxiGo
          </p>
        </div>
      </div>

      <div
        className='flex flex-row flex-nowrap items-start gap-2'
        style={{ width: 'max-content' }}
      >
        {columns.map((column) => {
          const trips = itemsByColumn[column.id] ?? [];
          return (
            <section
              key={column.id}
              className='flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:w-[160px]'
              style={{ minHeight: '200px' }}
            >
              <header className='border-b border-slate-100 bg-slate-50 px-2 py-2'>
                <h2 className='line-clamp-3 text-center text-[11px] leading-tight font-bold text-slate-800 sm:text-xs'>
                  {column.title}
                </h2>
                {column.subtitle ? (
                  <p className='mt-0.5 text-center text-[9px] text-slate-500'>
                    {column.subtitle}
                  </p>
                ) : null}
                <p className='mt-1 text-center text-[10px] font-semibold text-slate-500 tabular-nums'>
                  {trips.length} {trips.length === 1 ? 'Fahrt' : 'Fahrten'}
                </p>
              </header>

              <div className='flex flex-1 flex-col p-1.5 pt-2'>
                {trips.length === 0 ? (
                  <p className='py-4 text-center text-[10px] text-slate-400'>
                    Keine Fahrten
                  </p>
                ) : (
                  <PrintTripGroupsList trips={trips} compact />
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className='mt-3 text-center text-[8px] text-slate-400'>
        Nur zugewiesene Fahrer · Hochformat · PDF-Logik
      </p>
    </div>
  );
}
