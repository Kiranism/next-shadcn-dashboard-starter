'use client';

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPinned, Users, Share2 } from 'lucide-react';
import { copyTripToClipboard } from '@/features/trips/lib/share-utils';
import { toast } from 'sonner';

interface TripRowProps {
  trip: any;
  onClick: () => void;
  compact?: boolean;
  showDate?: boolean;
}

export function TripRow({
  trip,
  onClick,
  compact = false,
  showDate = false
}: TripRowProps) {
  const scheduledTime = trip.scheduled_at
    ? format(new Date(trip.scheduled_at), 'HH:mm')
    : '--:--';

  const billingType = trip.billing_types;
  const rowColor = billingType?.color || 'transparent';

  const isGrouped = !!trip.group_id;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
      case 'open':
        return 'Offen';
      case 'assigned':
        return 'Zugewiesen';
      case 'in_progress':
      case 'driving':
        return 'Unterwegs';
      case 'completed':
        return 'Erledigt';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'assigned':
        return 'secondary';
      case 'in_progress':
      case 'driving':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group mb-0 flex cursor-pointer items-start rounded-lg p-1.5 transition-all select-none',
        rowColor === 'transparent'
          ? 'hover:bg-slate-100/50'
          : 'hover:brightness-95'
      )}
      style={{
        backgroundColor:
          rowColor !== 'transparent'
            ? `color-mix(in srgb, ${rowColor}, white 85%)`
            : undefined,
        borderLeft:
          rowColor !== 'transparent' ? `4px solid ${rowColor}` : undefined
      }}
    >
      <div className='flex min-w-[56px] flex-col'>
        <div
          className={cn(
            'text-primary leading-tight font-bold',
            compact ? 'text-sm' : 'text-lg'
          )}
        >
          {scheduledTime}
        </div>
        {showDate && trip.scheduled_at && (
          <div className='text-muted-foreground mt-0.5 text-[10px] font-medium'>
            {format(new Date(trip.scheduled_at), 'dd.MM.yy')}
          </div>
        )}
        {billingType?.name && (
          <span className='text-muted-foreground truncate text-[10px] font-medium uppercase'>
            {billingType.name}
          </span>
        )}
        {trip.is_wheelchair && (
          <span className='truncate text-[10px] font-bold text-rose-600 uppercase'>
            Rollstuhl
          </span>
        )}
      </div>
      <div className='ml-4 flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <p
            className={cn(
              'group-hover:text-primary leading-none font-semibold transition-colors',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {trip.client_name || 'Unbekannter Kunde'}
          </p>
          {isGrouped && (
            <div className='flex items-center gap-0.5 rounded-full border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700'>
              <Users className='h-2.5 w-2.5' /> Gruppe
            </div>
          )}
        </div>
        <p className='text-muted-foreground line-clamp-1 text-xs'>
          {trip.dropoff_address || 'Keine Zieladresse'}
        </p>
      </div>
      <div className='ml-4 flex flex-col items-end gap-1.5'>
        <div className='flex items-center gap-1.5'>
          <Badge
            variant={getBadgeVariant(trip.status) as any}
            className={cn(
              'px-2 py-0 whitespace-nowrap',
              compact ? 'h-4 text-[9px]' : 'h-5 text-[10px]'
            )}
          >
            {getStatusLabel(trip.status)}
          </Badge>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const success = await copyTripToClipboard(trip);
              if (success) {
                toast.success('Details kopiert');
              } else {
                toast.error('Fehler');
              }
            }}
            className='hover:bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white/50 text-slate-500 transition-colors hover:text-blue-600'
            title='QuickShare (WhatsApp)'
          >
            <Share2 className='h-3.5 w-3.5' />
          </button>
        </div>
        <p className='text-muted-foreground text-[10px] font-bold tracking-wider whitespace-nowrap uppercase'>
          Fahrer:{' '}
          <span className='text-foreground font-medium'>
            {trip.driver?.name || '---'}
          </span>
        </p>
      </div>
    </div>
  );
}
