'use client';

/**
 * Landscape ZIP export: **same column layout** as the Hochformat strip (Fahrer =
 * Spalten), trips top-to-bottom by time. Cards use `PrintTripGroupsList` with
 * `compact` — identical rules to PDF (billing, Gruppe, wheelchair, Start/Ziel, Hinweis).
 */

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import type { KanbanColumn } from '@/features/trips/lib/kanban-types';

import type { TripData } from './mobile-print-template';
import { PrintTripGroupsList } from './print-trip-groups-list';

export interface BoardLandscapeOnlyPrintTemplateProps {
  date: Date;
  columns: KanbanColumn[];
  itemsByColumn: Record<string, TripData[]>;
}

export function BoardLandscapeOnlyPrintTemplate({
  date,
  columns,
  itemsByColumn
}: BoardLandscapeOnlyPrintTemplateProps) {
  const LANDSCAPE_W = 1280;

  return (
    <div
      data-board-landscape-only-print
      className='bg-slate-50 p-3 font-sans text-slate-900'
      style={{
        width: `${LANDSCAPE_W}px`,
        maxWidth: `${LANDSCAPE_W}px`,
        boxSizing: 'border-box'
      }}
    >
      <div className='mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div>
          <p className='text-[10px] font-bold tracking-widest text-emerald-700 uppercase'>
            Querformat · Spalten
          </p>
          <h1 className='text-xl font-black tracking-tighter text-slate-950 uppercase'>
            Fahrtenplan
          </h1>
          <p className='text-sm font-bold text-emerald-600'>
            Gleiche Karten-Logik wie PDF · zum Vergleich nach Uhrzeit
          </p>
        </div>
        <div className='text-right'>
          <p className='text-xs font-medium text-slate-500'>
            {format(date, 'dd.MM.yy', { locale: de })}
          </p>
          <p className='text-[10px] font-medium text-slate-400'>
            {format(new Date(), 'HH:mm')} · TaxiGo
          </p>
        </div>
      </div>

      <div className='flex w-full flex-row flex-nowrap items-start gap-2'>
        {columns.map((column) => {
          const trips = itemsByColumn[column.id] ?? [];
          if (trips.length === 0) return null;

          return (
            <section
              key={column.id}
              className='flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
            >
              <header className='border-b border-slate-100 bg-slate-50 px-2 py-2'>
                <h2 className='line-clamp-3 text-center text-[11px] leading-tight font-bold text-slate-800'>
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

              <div className='flex w-full min-w-0 flex-1 flex-col gap-0 p-3 pt-2'>
                <PrintTripGroupsList trips={trips} compact />
              </div>
            </section>
          );
        })}
      </div>

      <p className='mt-3 w-full text-center text-[8px] text-slate-400'>
        Querformat · volle Breite {LANDSCAPE_W}px · Spalten teilen sich den
        Platz
      </p>
    </div>
  );
}
