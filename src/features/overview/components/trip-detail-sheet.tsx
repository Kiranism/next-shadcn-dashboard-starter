'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Flag,
  Navigation,
  Phone,
  User2,
  Briefcase,
  History,
  MoreVertical,
  MapPinned,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react';

interface TripDetailSheetProps {
  tripId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TripDetailSheet({
  tripId,
  isOpen,
  onOpenChange
}: TripDetailSheetProps) {
  const { trip, isLoading } = useTrip(tripId);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'ERLEDIGT',
          class: 'bg-green-500/10 text-green-600 border-green-200'
        };
      case 'assigned':
        return {
          label: 'ZUGEWIESEN',
          class: 'bg-blue-500/10 text-blue-600 border-blue-200'
        };
      case 'in_progress':
      case 'driving':
        return {
          label: 'UNTERWEGS',
          class: 'bg-amber-500/10 text-amber-600 border-amber-200'
        };
      case 'cancelled':
        return {
          label: 'STORNIERT',
          class: 'bg-red-500/10 text-red-600 border-red-200'
        };
      default:
        return {
          label: status.toUpperCase(),
          class: 'bg-slate-100 text-slate-600 border-slate-200'
        };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 border-l p-0 sm:max-w-xl'>
        {/* Accessibility: Always provide a title */}
        <VisuallyHidden.Root>
          <SheetTitle>Fahrt Details {tripId}</SheetTitle>
        </VisuallyHidden.Root>

        {isLoading ? (
          <div className='space-y-6 p-6'>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Separator />
            <div className='space-y-4'>
              <Skeleton className='h-24 w-full rounded-xl' />
              <Skeleton className='h-24 w-full rounded-xl' />
              <Skeleton className='h-24 w-full rounded-xl' />
            </div>
          </div>
        ) : trip ? (
          <>
            <div
              className='relative overflow-hidden p-6 pb-4'
              style={{
                backgroundColor: trip.billing_types?.color
                  ? `color-mix(in srgb, ${trip.billing_types.color}, white 90%)`
                  : 'transparent',
                borderBottom: `1px solid ${trip.billing_types?.color || '#e2e8f0'}`
              }}
            >
              <div
                className='absolute top-0 left-0 h-full w-1.5'
                style={{ backgroundColor: trip.billing_types?.color }}
              />
              <div className='mb-2 flex items-start justify-between'>
                <Badge className={getStatusInfo(trip.status).class}>
                  {getStatusInfo(trip.status).label}
                </Badge>
              </div>
              <SheetHeader className='space-y-1 text-left'>
                <SheetTitle className='text-2xl font-bold tracking-tight'>
                  {trip.client_name || 'Unbekannter Kunde'}
                </SheetTitle>
                <SheetDescription className='text-foreground flex items-center gap-2 font-medium'>
                  <Clock className='text-primary h-4 w-4' />
                  {trip.scheduled_at
                    ? format(new Date(trip.scheduled_at), 'PPPP p')
                    : 'Keine Zeit'}
                </SheetDescription>
              </SheetHeader>
            </div>

            <ScrollArea className='flex-1'>
              <div className='space-y-8 p-6'>
                {/* Timeline / Stops */}
                <section>
                  <div className='mb-6 flex items-center justify-between'>
                    <h3 className='text-muted-foreground text-xs font-bold tracking-widest uppercase'>
                      Route & Verlauf
                    </h3>
                    <Badge
                      variant='outline'
                      className='h-5 px-2 py-0 text-[10px] font-semibold'
                    >
                      {trip.distance_km ? `${trip.distance_km} km` : 'Geplant'}
                    </Badge>
                  </div>

                  <div className='relative ml-3 space-y-0'>
                    {/* Vertical Line Connector */}
                    <div className='absolute top-4 bottom-4 left-[11px] w-[2px] bg-slate-100' />

                    {/* Pickup 1 (A1) */}
                    <TimelineItem
                      stopLabel='A1'
                      title='Start / Abholung'
                      address={trip.pickup_address}
                      time={trip.actual_pickup_at}
                      station={trip.pickup_station}
                      isCompleted={!!trip.actual_pickup_at}
                    />

                    {/* Additional Pickups (A2, A3...) */}
                    {(trip.additional_pickups as any[])?.map((stop, i) => (
                      <TimelineItem
                        key={`pickup-${i}`}
                        stopLabel={`A${i + 2}`}
                        title={`Abholung ${i + 2}`}
                        address={stop.address}
                        name={stop.name}
                        update={trip.stop_updates?.[stop.address]}
                      />
                    ))}

                    {/* Additional Dropoffs (Z1, Z2...) */}
                    {(trip.additional_dropoffs as any[])?.map((stop, i) => (
                      <TimelineItem
                        key={`dropoff-${i}`}
                        stopLabel={`Z${i + 1}`}
                        title={`Ausstieg ${i + 1}`}
                        address={stop.address}
                        name={stop.name}
                        update={trip.stop_updates?.[stop.address]}
                      />
                    ))}

                    {/* Final Dropoff (Z last) */}
                    <TimelineItem
                      stopLabel={`Z${(trip.additional_dropoffs?.length || 0) + 1}`}
                      title='Ziel / Ankunft'
                      address={trip.dropoff_address}
                      time={trip.actual_dropoff_at}
                      station={trip.dropoff_station}
                      isCompleted={!!trip.actual_dropoff_at}
                      isLast
                    />
                  </div>
                </section>

                <Separator />

                {/* Details Grid */}
                <section className='grid grid-cols-2 gap-x-8 gap-y-6 px-1'>
                  <DetailItem
                    icon={<User2 className='h-3.5 w-3.5' />}
                    label='Fahrer'
                    value={trip.driver?.name || 'Nicht zugewiesen'}
                  />
                  <DetailItem
                    icon={<Navigation className='h-3.5 w-3.5' />}
                    label='Fahrzeug'
                    value={
                      trip.is_wheelchair
                        ? 'Rollstuhl / Spezial'
                        : 'Kombi / Standard'
                    }
                  />
                  <DetailItem
                    icon={<CreditCard className='h-3.5 w-3.5' />}
                    label='Abrechnung'
                    value={trip.billing_types?.name || 'Privat'}
                  />
                  <DetailItem
                    icon={<Briefcase className='h-3.5 w-3.5' />}
                    label='Kostenträger'
                    value={trip.payers?.name || '---'}
                  />
                  <DetailItem
                    icon={<Phone className='h-3.5 w-3.5' />}
                    label='Kontakt'
                    value={trip.client_phone || 'Keine Nummer'}
                  />
                </section>

                {trip.notes && (
                  <section className='rounded-lg border border-amber-100 bg-amber-50 p-3'>
                    <h4 className='mb-1 flex items-center gap-1 text-xs font-bold text-amber-800'>
                      <AlertCircle className='h-3 w-3' /> Wichtige Hinweise
                    </h4>
                    <p className='text-sm text-amber-900'>{trip.notes}</p>
                  </section>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className='text-muted-foreground p-10 text-center'>
            Fehler beim Laden der Fahrt-Details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimelineItem({
  stopLabel,
  title,
  address,
  name,
  time,
  station,
  update,
  isCompleted,
  isLast
}: any) {
  const isCancelled = update?.status === 'not_present';

  return (
    <div className={`relative pb-8 pl-10 ${isLast ? 'pb-2' : ''}`}>
      <div className='absolute top-[10px] left-0 z-10'>
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold whitespace-nowrap shadow-sm ring-[4px] ring-white',
            stopLabel?.startsWith('A')
              ? 'border-green-600 bg-green-500 text-white'
              : 'border-red-600 bg-red-500 text-white'
          )}
        >
          {stopLabel}
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-[10px] font-bold tracking-tighter uppercase'>
            {title}
          </span>
          {time && (
            <span className='rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600 italic'>
              Erledigt: {format(new Date(time), 'HH:mm')}
            </span>
          )}
        </div>
        <div
          className={`flex flex-col text-sm leading-snug font-semibold ${isCancelled ? 'line-through opacity-50' : ''}`}
        >
          {address}
          {station && (
            <span className='text-xs font-normal text-slate-500'>
              ({station})
            </span>
          )}
        </div>
        {name && (
          <span className='text-xs font-medium text-slate-600'>
            Fahrgast: {name}
          </span>
        )}

        {isCancelled && (
          <div className='mt-1 flex w-fit items-center gap-1 rounded border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600'>
            <AlertCircle className='h-3 w-3' /> PERSON NICHT ERSCHIENEN
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className='space-y-1.5'>
      <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
        {icon}
        {label}
      </div>
      <div className='pl-6 text-sm font-semibold'>{value}</div>
    </div>
  );
}
