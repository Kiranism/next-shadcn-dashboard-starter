'use client';

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

interface TripRowProps {
  trip: any;
}

export function TripRow({ trip }: TripRowProps) {
  const scheduledTime = trip.scheduled_at
    ? format(new Date(trip.scheduled_at), 'HH:mm')
    : '--:--';

  const billingType = trip.billing_types;
  const rowColor = billingType?.color || 'transparent';

  return (
    <Link
      href={`/dashboard/trips/${trip.id}`}
      className='group mb-1 flex cursor-pointer items-start rounded-lg p-2 transition-all hover:brightness-95'
      style={{
        backgroundColor:
          rowColor !== 'transparent'
            ? `color-mix(in srgb, ${rowColor}, white 85%)`
            : undefined,
        borderLeft:
          rowColor !== 'transparent' ? `4px solid ${rowColor}` : undefined
      }}
    >
      <div className='flex min-w-[70px] flex-col'>
        <div className='text-primary text-lg leading-tight font-bold'>
          {scheduledTime}
        </div>
        {billingType?.name && (
          <span className='text-muted-foreground truncate text-[10px] font-medium uppercase'>
            {billingType.name}
          </span>
        )}
      </div>
      <div className='ml-4 flex-1 space-y-1'>
        <p className='group-hover:text-primary text-sm leading-none font-semibold transition-colors'>
          {trip.client_name || 'Unbekannter Kunde'}
        </p>
        <p className='text-muted-foreground line-clamp-1 text-xs'>
          {trip.dropoff_address || 'Keine Zieladresse'}
        </p>
      </div>
      <div className='ml-4 flex flex-col items-end gap-1'>
        <Badge
          variant={
            trip.status === 'completed'
              ? 'default'
              : trip.status === 'assigned'
                ? 'secondary'
                : 'outline'
          }
          className='h-5 px-2 py-0 text-[10px] capitalize'
        >
          {trip.status}
        </Badge>
        <p className='text-muted-foreground text-[10px] font-bold tracking-wider whitespace-nowrap uppercase'>
          Fahrer:{' '}
          <span className='text-foreground font-medium'>
            {trip.driver?.name || '---'}
          </span>
        </p>
      </div>
    </Link>
  );
}
