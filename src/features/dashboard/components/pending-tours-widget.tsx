import { useState } from 'react';
import {
  usePendingTours,
  PendingClient
} from '@/features/dashboard/hooks/use-pending-tours';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tripsService } from '@/features/trips/api/trips.service';
import { addDays, set } from 'date-fns';
import { toast } from 'sonner';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PendingToursWidget() {
  const { pendingClients, isLoading, refresh } = usePendingTours();

  if (isLoading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Offene Touren für Morgen</CardTitle>
          <CardDescription>Lade Fahrgäste...</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Offene Touren für Morgen</CardTitle>
        <CardDescription>
          {pendingClients.length} Fahrg
          {pendingClients.length === 1 ? 'ast' : 'äste'} benötig
          {pendingClients.length === 1 ? 't' : 'en'} eine Abholzeit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingClients.length === 0 ? (
          <div className='border-muted flex h-32 items-center justify-center rounded-lg border-2 border-dashed'>
            <p className='text-muted-foreground text-sm italic'>
              Alles erledigt für morgen!
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {pendingClients.map((client) => (
              <PendingTourRow
                key={client.id}
                client={client}
                onScheduled={refresh}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTourRow({
  client,
  onScheduled
}: {
  client: PendingClient;
  onScheduled: () => void;
}) {
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientName = client.is_company
    ? client.company_name
    : [client.first_name, client.last_name].filter(Boolean).join(' ');

  const handleCreateTrip = async () => {
    if (!time) {
      toast.error('Bitte geben Sie eine Abholzeit ein.');
      return;
    }

    try {
      setIsSubmitting(true);
      const tomorrow = addDays(new Date(), 1);
      const [hours, minutes] = time.split(':');

      const scheduledDate = set(tomorrow, {
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: 0,
        milliseconds: 0
      });

      const fullAddress = `${client.street} ${client.street_number}, ${client.zip_code} ${client.city}`;

      await tripsService.createTrip({
        client_id: client.id,
        client_name: clientName,
        client_phone: client.phone || '',
        pickup_address: fullAddress,
        dropoff_address: '', // Default to empty, admin can edit later if needed
        status: 'open',
        scheduled_at: scheduledDate.toISOString()
      });

      toast.success(`Fahrt für ${clientName} erfolgreich erstellt.`);
      setTime('');
      onScheduled();
    } catch (err: any) {
      toast.error(`Fehler beim Erstellen der Fahrt: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex items-center justify-between rounded-lg border p-3'>
      <div className='flex flex-col'>
        <span className='text-sm font-medium'>{clientName}</span>
        {client.notes && (
          <span className='text-muted-foreground line-clamp-1 text-xs'>
            {client.notes}
          </span>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <Input
          type='time'
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className='h-8 w-28 text-xs'
          disabled={isSubmitting}
        />
        <Button
          size='sm'
          className='h-8 px-2'
          onClick={handleCreateTrip}
          disabled={!time || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <PlusCircle className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}
