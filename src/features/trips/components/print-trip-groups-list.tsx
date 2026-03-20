'use client';

/**
 * Shared trip cards for print/PDF: same grouping, billing colors, wheelchair,
 * Gruppe, Start/Ziel/stations, Hinweis as MobilePrintTemplate.
 * `compact` scales typography for narrow landscape columns.
 */

import * as React from 'react';
import { format } from 'date-fns';
import { Accessibility } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { TripData } from './mobile-print-template';

export interface PrintTripGroupsListProps {
  trips: TripData[];
  /** Narrow column layout (landscape overview) — same rules, smaller type */
  compact?: boolean;
}

function formatAddress(addr: string | null): React.ReactNode {
  if (!addr) return '-';
  const parts = addr.split(',');
  if (parts.length < 2) return addr;
  return <span className='font-bold text-slate-900'>{parts[0].trim()}</span>;
}

function formatCity(addr: string | null): string {
  if (!addr) return '';
  const parts = addr.split(',');
  if (parts.length < 2) return '';
  const cityPart = parts[1].trim();
  if (/\bOldenburg\b/i.test(cityPart)) return '';
  return ` (${cityPart})`;
}

export function PrintTripGroupsList({
  trips,
  compact = false
}: PrintTripGroupsListProps) {
  const tripGroups = React.useMemo(() => {
    type Group = { key: string; groupId: string | null; trips: TripData[] };
    const map = new Map<string, TripData[]>();
    const singles: TripData[] = [];

    for (const trip of trips) {
      const groupId = trip.group_id ?? null;
      if (!groupId) {
        singles.push(trip);
        continue;
      }
      const list = map.get(groupId);
      if (list) list.push(trip);
      else map.set(groupId, [trip]);
    }

    const groups: Group[] = [];

    for (const trip of singles) {
      groups.push({ key: `single:${trip.id}`, groupId: null, trips: [trip] });
    }

    for (const [groupId, groupTrips] of map.entries()) {
      groupTrips.sort((a, b) => {
        if (a.stop_order != null && b.stop_order != null) {
          return a.stop_order - b.stop_order;
        }
        return (
          new Date(a.scheduled_at ?? 0).getTime() -
          new Date(b.scheduled_at ?? 0).getTime()
        );
      });
      groups.push({ key: `group:${groupId}`, groupId, trips: groupTrips });
    }

    groups.sort((a, b) => {
      const aTime = new Date(a.trips[0]?.scheduled_at ?? 0).getTime();
      const bTime = new Date(b.trips[0]?.scheduled_at ?? 0).getTime();
      return aTime - bTime;
    });

    return groups;
  }, [trips]);

  const c = compact;

  return (
    <div className={cn('w-full space-y-2', c && 'space-y-1.5')}>
      {tripGroups.map((group) => {
        const isGrouped = group.trips.length > 1;
        const primaryTrip = group.trips[0];
        const billingType = primaryTrip?.billing_types;
        const billingColor = billingType?.color || null;

        if (!isGrouped && primaryTrip) {
          const trip = primaryTrip;
          const singleBillingType = trip.billing_types;
          const singleBillingColor = singleBillingType?.color || null;

          return (
            <div
              key={group.key}
              className={cn(
                'relative overflow-hidden rounded-xl border border-slate-200 shadow-sm',
                c ? 'rounded-lg p-2' : 'p-3'
              )}
              style={{
                backgroundColor: singleBillingColor
                  ? `color-mix(in srgb, ${singleBillingColor}, white 92%)`
                  : 'white'
              }}
            >
              <div
                className='absolute top-0 left-0 h-full w-1.5'
                style={{ backgroundColor: singleBillingColor || '#0f172a' }}
              />

              <div
                className={cn(
                  'flex items-center justify-between gap-2 border-b border-slate-100/50 pb-2',
                  c ? 'mb-1.5' : 'mb-2 gap-3'
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <div
                    className={cn(
                      'shrink-0 rounded-lg font-black text-white tabular-nums',
                      c ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-base'
                    )}
                    style={{
                      backgroundColor: singleBillingColor || '#0f172a'
                    }}
                  >
                    {format(new Date(trip.scheduled_at), 'HH:mm')}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <p
                        className={cn(
                          'truncate font-extrabold text-slate-900',
                          c ? 'text-xs' : 'text-base'
                        )}
                      >
                        {[trip.greeting_style, trip.client_name || 'Anonym']
                          .filter(Boolean)
                          .join(' ')
                          .trim() || 'Anonym'}
                      </p>
                      {trip.is_wheelchair && (
                        <Accessibility
                          className={cn(
                            'shrink-0 text-red-600',
                            c ? 'h-3.5 w-3.5' : 'h-4 w-4'
                          )}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <div className='flex items-center justify-between'>
                      {trip.client_phone && (
                        <p
                          className='text-[10px] font-bold text-slate-600 tabular-nums'
                          data-phone={trip.client_phone}
                        >
                          {trip.client_phone}
                        </p>
                      )}
                      {singleBillingType?.name && (
                        <p className='text-[9px] font-bold tracking-wider text-slate-500 uppercase'>
                          {singleBillingType.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn('space-y-1.5 px-0.5', c && 'space-y-1')}>
                <div className='flex items-baseline gap-1.5'>
                  <span
                    className={cn(
                      'shrink-0 font-black tracking-tighter text-slate-400 uppercase',
                      c ? 'w-8 text-[9px]' : 'w-10 text-[10px]'
                    )}
                  >
                    Start
                  </span>
                  <div
                    className={cn(
                      'min-w-0 flex-1 leading-tight',
                      c ? 'text-[11px]' : 'text-sm'
                    )}
                    data-address={trip.pickup_address || ''}
                  >
                    {formatAddress(trip.pickup_address)}
                    {trip.pickup_station && (
                      <span className='ml-1 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1 py-0.5 text-[9px] font-bold text-slate-700'>
                        {trip.pickup_station}
                      </span>
                    )}
                    <span
                      className={cn(
                        'ml-1 font-medium text-slate-400',
                        c ? 'text-[10px]' : 'text-[11px]'
                      )}
                    >
                      {formatCity(trip.pickup_address)}
                    </span>
                  </div>
                </div>

                <div className='flex items-baseline gap-1.5'>
                  <span
                    className={cn(
                      'shrink-0 font-black tracking-tighter text-slate-400 uppercase',
                      c ? 'w-8 text-[9px]' : 'w-10 text-[10px]'
                    )}
                  >
                    Ziel
                  </span>
                  <div
                    className={cn(
                      'min-w-0 flex-1 leading-tight',
                      c ? 'text-[11px]' : 'text-sm'
                    )}
                    data-address={trip.dropoff_address || ''}
                  >
                    {formatAddress(trip.dropoff_address)}
                    {trip.dropoff_station && (
                      <span className='ml-1 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1 py-0.5 text-[9px] font-bold text-slate-700'>
                        {trip.dropoff_station}
                      </span>
                    )}
                    <span
                      className={cn(
                        'ml-1 font-medium text-slate-400',
                        c ? 'text-[10px]' : 'text-[11px]'
                      )}
                    >
                      {formatCity(trip.dropoff_address)}
                    </span>
                  </div>
                </div>

                {trip.notes && trip.notes.trim() !== '' && (
                  <div
                    className={cn(
                      'flex items-start gap-2 rounded-lg border border-amber-100/50 bg-amber-50/50',
                      c ? 'mt-1.5 p-1.5' : 'mt-2 p-2'
                    )}
                  >
                    <span className='mt-0.5 text-[9px] font-black tracking-tighter text-amber-600 uppercase'>
                      Hinweis
                    </span>
                    <p
                      className={cn(
                        'flex-1 leading-tight font-bold text-amber-900',
                        c ? 'text-[10px]' : 'text-[11px]'
                      )}
                    >
                      {trip.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        }

        const passengerMap = new Map<
          string,
          { name: string; greeting_style: string | null; wheelchair: boolean }
        >();
        for (const t of group.trips) {
          const name = t.client_name?.trim();
          if (!name) continue;
          const existing = passengerMap.get(name);
          if (existing) {
            if (t.is_wheelchair) existing.wheelchair = true;
          } else {
            passengerMap.set(name, {
              name,
              greeting_style: t.greeting_style ?? null,
              wheelchair: t.is_wheelchair
            });
          }
        }
        const passengerEntries = Array.from(passengerMap.values());
        const passengerNames = passengerEntries.map(
          (p) =>
            [p.greeting_style, p.name].filter(Boolean).join(' ').trim() ||
            p.name
        );

        const dropoffStops = new Map<
          string,
          { address: string | null; station: string | null; names: string[] }
        >();

        const pickupStops = new Map<
          string,
          { address: string | null; station: string | null; names: string[] }
        >();

        for (const t of group.trips) {
          const key = `${t.pickup_address || ''}-${t.pickup_station || ''}`;
          if (!pickupStops.has(key)) {
            pickupStops.set(key, {
              address: t.pickup_address ?? null,
              station: t.pickup_station ?? null,
              names: t.client_name ? [t.client_name] : []
            });
          } else {
            const s = pickupStops.get(key);
            if (s && t.client_name && !s.names.includes(t.client_name)) {
              s.names.push(t.client_name);
            }
          }
        }

        for (const t of group.trips) {
          const key = `${t.dropoff_address || ''}-${t.dropoff_station || ''}`;
          if (!dropoffStops.has(key)) {
            dropoffStops.set(key, {
              address: t.dropoff_address ?? null,
              station: t.dropoff_station ?? null,
              names: t.client_name ? [t.client_name] : []
            });
          } else {
            const s = dropoffStops.get(key);
            if (s && t.client_name && !s.names.includes(t.client_name)) {
              s.names.push(t.client_name);
            }
          }
        }

        const uniqueDropoffs = Array.from(dropoffStops.values()).filter(
          (s) => (s.address || '').trim() !== ''
        );

        const uniquePickups = Array.from(pickupStops.values()).filter(
          (s) => (s.address || '').trim() !== ''
        );

        const effectivePickups =
          uniquePickups.length > 0
            ? uniquePickups
            : [
                {
                  address: primaryTrip?.pickup_address ?? null,
                  station: primaryTrip?.pickup_station ?? null,
                  names: passengerNames
                }
              ];

        const effectiveDropoffs =
          uniqueDropoffs.length > 0
            ? uniqueDropoffs
            : [
                {
                  address: primaryTrip?.dropoff_address ?? null,
                  station: primaryTrip?.dropoff_station ?? null,
                  names: passengerNames
                }
              ];

        return (
          <div
            key={group.key}
            className={cn(
              'relative overflow-hidden rounded-xl border border-slate-200 shadow-sm',
              c ? 'rounded-lg p-2' : 'p-3'
            )}
            style={{
              backgroundColor: billingColor
                ? `color-mix(in srgb, ${billingColor}, white 92%)`
                : 'white'
            }}
          >
            <div
              className='absolute top-0 left-0 h-full w-1.5'
              style={{ backgroundColor: billingColor || '#0f172a' }}
            />

            <div
              className={cn(
                'flex items-center justify-between gap-2 border-b border-slate-100/50 pb-2',
                c ? 'mb-1.5' : 'mb-2 gap-3'
              )}
            >
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <div
                  className={cn(
                    'shrink-0 rounded-lg font-black text-white tabular-nums',
                    c ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-base'
                  )}
                  style={{ backgroundColor: billingColor || '#0f172a' }}
                >
                  {primaryTrip?.scheduled_at
                    ? format(new Date(primaryTrip.scheduled_at), 'HH:mm')
                    : '-'}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5'>
                    <div
                      className={cn(
                        'truncate text-slate-900',
                        c
                          ? 'text-xs font-extrabold'
                          : 'text-base font-extrabold'
                      )}
                    >
                      {passengerEntries.length > 0
                        ? passengerEntries.map((p, index) => (
                            <span
                              key={p.name}
                              className='inline-flex items-center'
                            >
                              {index > 0 && ', '}
                              <span>
                                {[p.greeting_style, p.name]
                                  .filter(Boolean)
                                  .join(' ')
                                  .trim() || p.name}
                              </span>
                              {p.wheelchair && (
                                <Accessibility
                                  className={cn(
                                    'ml-1 shrink-0 text-red-600',
                                    c ? 'h-3.5 w-3.5' : 'h-4 w-4'
                                  )}
                                  strokeWidth={3}
                                />
                              )}
                            </span>
                          ))
                        : `${group.trips.length} Fahrten`}
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    {billingType?.name && (
                      <p className='text-[9px] font-bold tracking-wider text-slate-500 uppercase'>
                        {billingType.name}
                      </p>
                    )}
                    {group.groupId && (
                      <p className='text-[9px] font-bold text-slate-400 uppercase'>
                        Gruppe
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={cn('space-y-1.5 px-0.5', c && 'space-y-1')}>
              {effectivePickups.map((start, index) => (
                <div
                  key={`start-${index}`}
                  className='flex items-baseline gap-1.5'
                >
                  <span
                    className={cn(
                      'shrink-0 font-black tracking-tighter text-slate-400 uppercase',
                      c ? 'w-8 text-[9px]' : 'w-10 text-[10px]'
                    )}
                  >
                    {index === 0 ? 'Start' : `Start ${index + 1}`}
                  </span>
                  <div
                    className={cn(
                      'min-w-0 flex-1 leading-tight',
                      c ? 'text-[11px]' : 'text-sm'
                    )}
                    data-address={start.address || ''}
                  >
                    {formatAddress(start.address)}
                    {start.station && (
                      <span className='ml-1 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1 py-0.5 text-[9px] font-bold text-slate-700'>
                        {start.station}
                      </span>
                    )}
                    <span
                      className={cn(
                        'ml-1 font-medium text-slate-400',
                        c ? 'text-[10px]' : 'text-[11px]'
                      )}
                    >
                      {formatCity(start.address)}
                    </span>
                    {start.names.length > 0 && (
                      <div className='mt-0.5 text-[10px] font-bold text-slate-600'>
                        {start.names.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {effectiveDropoffs.map((ziel, index) => (
                <div
                  key={`ziel-${index}`}
                  className='flex items-baseline gap-1.5'
                >
                  <span
                    className={cn(
                      'shrink-0 font-black tracking-tighter text-slate-400 uppercase',
                      c ? 'w-8 text-[9px]' : 'w-10 text-[10px]'
                    )}
                  >
                    {index === 0 ? 'Ziel' : `Ziel ${index + 1}`}
                  </span>
                  <div
                    className={cn(
                      'min-w-0 flex-1 leading-tight',
                      c ? 'text-[11px]' : 'text-sm'
                    )}
                    data-address={ziel.address || ''}
                  >
                    {formatAddress(ziel.address)}
                    {ziel.station && (
                      <span className='ml-1 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1 py-0.5 text-[9px] font-bold text-slate-700'>
                        {ziel.station}
                      </span>
                    )}
                    <span
                      className={cn(
                        'ml-1 font-medium text-slate-400',
                        c ? 'text-[10px]' : 'text-[11px]'
                      )}
                    >
                      {formatCity(ziel.address)}
                    </span>
                    {ziel.names.length > 0 && (
                      <div className='mt-0.5 text-[10px] font-bold text-slate-600'>
                        {ziel.names.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {group.trips.some((t) => t.notes && t.notes.trim() !== '') && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border border-amber-100/50 bg-amber-50/50',
                    c ? 'mt-1.5 p-1.5' : 'mt-2 p-2'
                  )}
                >
                  <span className='mt-0.5 text-[9px] font-black tracking-tighter text-amber-600 uppercase'>
                    Hinweis
                  </span>
                  <p
                    className={cn(
                      'flex-1 leading-tight font-bold text-amber-900',
                      c ? 'text-[10px]' : 'text-[11px]'
                    )}
                  >
                    {Array.from(
                      new Set(
                        group.trips
                          .map((t) => t.notes?.trim())
                          .filter((n): n is string => !!n)
                      )
                    ).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
