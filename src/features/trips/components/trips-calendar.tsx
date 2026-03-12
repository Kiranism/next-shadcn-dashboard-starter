'use client';

import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Trip } from '@/features/trips/api/trips.service';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Navigation, RepeatIcon } from 'lucide-react';
import { format } from 'date-fns';

// Set moment to German
moment.locale('de');
const localizer = momentLocalizer(moment);

interface TripsCalendarProps {
  trips: Trip[];
}

export function TripsCalendar({ trips }: TripsCalendarProps) {
  const router = useRouter();

  const events = useMemo(() => {
    return trips
      .map((trip) => {
        if (!trip.scheduled_at) return null;

        const startDate = new Date(trip.scheduled_at);
        // Default 1 hour duration for visualization if no end time exists
        const endDate = trip.actual_dropoff_at
          ? new Date(trip.actual_dropoff_at)
          : new Date(startDate.getTime() + 60 * 60 * 1000);

        return {
          id: trip.id,
          title: `${trip.client_name || 'Unbekannt'} - ${trip.pickup_address?.split(',')[0]}`,
          start: startDate,
          end: endDate,
          resource: trip
        };
      })
      .filter(Boolean);
  }, [trips]);

  const handleSelectEvent = (event: any) => {
    // Open the trip edit sheet/page (You likely have a standard way to open trips)
    // For now, we'll route to a hypothetical trip details page or open a dialog
    // Using existing application patterns where possible.
    console.log('Selected Trip ID:', event.resource.id);
    // Implement your standard trip click handler here
  };

  const CustomEvent = ({ event }: any) => {
    const trip = event.resource as Trip;
    const isRecurring = !!trip.rule_id;

    return (
      <div className='flex h-full flex-col gap-0.5 overflow-hidden p-1 text-xs'>
        <div className='flex items-center gap-1 font-semibold'>
          {format(new Date(trip.scheduled_at!), 'HH:mm')}
          {isRecurring && <RepeatIcon className='h-3 w-3 text-blue-200' />}
        </div>
        <div className='truncate font-medium'>{trip.client_name}</div>
        <div className='flex items-center gap-1 truncate text-[10px] opacity-80'>
          <MapPin className='h-2.5 w-2.5 shrink-0' />
          <span className='truncate'>{trip.pickup_address?.split(',')[0]}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className='flex min-h-[600px] flex-1 flex-col overflow-hidden p-4'>
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-event {
          background-color: hsl(var(--primary));
          border: none;
          border-radius: var(--radius);
          padding: 2px;
        }
        .rbc-event.recurring-event {
          background-color: hsl(var(--blue-600) / 0.9);
          border-left: 3px solid hsl(var(--blue-400));
        }
        .rbc-today {
          background-color: hsl(var(--muted) / 0.3);
        }
        .rbc-header {
          padding: 8px 0;
          font-weight: 600;
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.1);
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor='start'
        endAccessor='end'
        style={{ flex: 1 }}
        views={['month', 'week', 'day']}
        defaultView='month'
        onSelectEvent={handleSelectEvent}
        messages={{
          next: 'Vor',
          previous: 'Zurück',
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag',
          agenda: 'Agenda',
          date: 'Datum',
          time: 'Zeit',
          event: 'Fahrt',
          noEventsInRange: 'Keine Fahrten in diesem Zeitraum.',
          showMore: (total) => `+ ${total} weitere`
        }}
        components={{
          event: CustomEvent
        }}
        eventPropGetter={(event) => {
          const trip = event.resource as Trip;
          return {
            className: trip.rule_id ? 'recurring-event' : ''
          };
        }}
      />
    </Card>
  );
}
