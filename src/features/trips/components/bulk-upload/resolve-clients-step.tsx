'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { clientsService } from '@/features/clients/api/clients.service';
import type { InsertTrip } from '@/features/trips/api/trips.service';
import type { UnresolvedRow } from './bulk-upload-types';

interface ResolveClientsStepProps {
  unresolvedRows: UnresolvedRow<InsertTrip>[];
  currentIndex: number;
  homeAddressChoice: 'pickup' | 'dropoff';
  isCreatingClient: boolean;
  onHomeAddressChange: (choice: 'pickup' | 'dropoff') => void;
  onUseAsNonClient: () => void;
  onDone: () => void;
}

export function ResolveClientsStep({
  unresolvedRows,
  currentIndex,
  homeAddressChoice,
  isCreatingClient,
  onHomeAddressChange,
  onUseAsNonClient,
  onDone
}: ResolveClientsStepProps) {
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const handleCreateAndLinkClient = async () => {
    const current = unresolvedRows[currentIndex];
    if (!current) return;

    try {
      setIsGeocoding(true);
      const supabase = createSupabaseClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      let companyIdStr = '00000000-0000-0000-0000-000000000000';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          companyIdStr = profile.company_id;
        }
      }

      const name =
        current.row.trip?.client_name ||
        `${current.row.source.firstname || ''} ${
          current.row.source.lastname || ''
        }`.trim();

      const [firstName, ...lastParts] = name.split(' ');
      const lastName = lastParts.join(' ').trim() || null;

      const usePickup = homeAddressChoice === 'pickup';

      const streetRaw = usePickup
        ? current.row.source.pickup_street || ''
        : current.row.source.dropoff_street || '';
      let zip = usePickup
        ? current.row.source.pickup_zip || ''
        : current.row.source.dropoff_zip || '';
      let city = usePickup
        ? current.row.source.pickup_city || ''
        : current.row.source.dropoff_city || '';

      let street = streetRaw;
      let streetNumber = '';
      const streetMatch = streetRaw.match(/^(.*\S)\s+(\d+\w*)$/);
      if (streetMatch) {
        street = streetMatch[1];
        streetNumber = streetMatch[2];
      }

      // Try to geocode the chosen home address so that the client (and trip)
      // receive lat/lng coordinates immediately.
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const res = await fetch('/api/geocode-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            street,
            street_number: streetNumber || undefined,
            zip_code: zip,
            city
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.lat === 'number' && typeof data.lng === 'number') {
            lat = data.lat;
            lng = data.lng;
          }

          // Normalise zip_code and city for the client based on Google's data,
          // similar to how trips are enriched in the bulk upload.
          if (typeof data.zip_code === 'string' && data.zip_code.trim()) {
            zip = data.zip_code.trim();
          }
          if (typeof data.city === 'string' && data.city.trim()) {
            city = data.city.trim();
          }
        }
      } catch {
        // Non-fatal: we can still create the client without coordinates.
      }

      const client = await clientsService.createClient({
        first_name: firstName || null,
        last_name: lastName,
        phone:
          current.row.source.phone || current.row.trip?.client_phone || null,
        street,
        street_number: streetNumber || '1',
        zip_code: zip,
        city,
        lat,
        lng,
        company_id: companyIdStr,
        is_company: false,
        relation: null,
        notes: null,
        requires_daily_scheduling: false,
        greeting_style: current.row.source.greeting_style || null
      });

      await supabase
        .from('trips')
        .update({
          client_id: client.id,
          client_name:
            `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
            null,
          ...(lat !== null && lng !== null
            ? usePickup
              ? {
                  pickup_lat: lat,
                  pickup_lng: lng,
                  has_missing_geodata: false
                }
              : {
                  dropoff_lat: lat,
                  dropoff_lng: lng,
                  has_missing_geodata: false
                }
            : {})
        })
        .eq('id', current.tripId);

      toast.success('Fahrgast wurde erstellt und mit der Fahrt verknüpft.');

      if (currentIndex + 1 < unresolvedRows.length) {
        onUseAsNonClient();
      } else {
        onDone();
      }
    } catch (error: any) {
      toast.error(
        error?.message || 'Konnte Fahrgast nicht erstellen und verknüpfen.'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  if (unresolvedRows.length === 0) {
    return null;
  }

  if (currentIndex >= unresolvedRows.length) {
    return (
      <div className='space-y-2 text-sm'>
        <p>Alle Fahrgäste aus diesem Upload wurden bearbeitet.</p>
        <Button type='button' className='w-full' onClick={onDone}>
          Fertig
        </Button>
      </div>
    );
  }

  const current = unresolvedRows[currentIndex];

  return (
    <div className='space-y-4'>
      <div className='space-y-3 text-sm'>
        <div className='font-medium'>
          Fahrgast {currentIndex + 1} von {unresolvedRows.length}
        </div>
        <div>
          <div className='font-medium'>Name</div>
          <div className='text-muted-foreground'>
            {current.row.trip?.client_name ||
              `${current.row.source.firstname || ''} ${
                current.row.source.lastname || ''
              }`.trim() ||
              '—'}
          </div>
        </div>
        <div>
          <div className='font-medium'>Abholadresse</div>
          <div className='text-muted-foreground'>
            {current.row.trip?.pickup_address || '—'}
          </div>
        </div>
        <div>
          <div className='font-medium'>Zieladresse</div>
          <div className='text-muted-foreground'>
            {current.row.trip?.dropoff_address || '—'}
          </div>
        </div>
        <div className='space-y-1 pt-1 text-xs'>
          <div className='font-medium'>
            Welche Adresse ist die Heimatadresse?
          </div>
          <div className='flex flex-col gap-1'>
            <label className='flex items-start gap-2'>
              <input
                type='radio'
                className='mt-0.5'
                checked={homeAddressChoice === 'pickup'}
                onChange={() => onHomeAddressChange('pickup')}
              />
              <span>
                <div className='font-medium'>Abholadresse</div>
                <div className='text-muted-foreground'>
                  {current.row.trip?.pickup_address || '—'}
                </div>
              </span>
            </label>
            <label className='flex items-start gap-2'>
              <input
                type='radio'
                className='mt-0.5'
                checked={homeAddressChoice === 'dropoff'}
                onChange={() => onHomeAddressChange('dropoff')}
              />
              <span>
                <div className='font-medium'>Zieladresse</div>
                <div className='text-muted-foreground'>
                  {current.row.trip?.dropoff_address || '—'}
                </div>
              </span>
            </label>
          </div>
        </div>

        <div className='space-y-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={onUseAsNonClient}
          >
            Als Nicht‑Kunde verwenden
          </Button>
          <Button
            type='button'
            className='w-full'
            disabled={isCreatingClient || isGeocoding}
            onClick={handleCreateAndLinkClient}
          >
            Neuen Fahrgast anlegen &amp; verknüpfen
          </Button>
        </div>
      </div>
    </div>
  );
}
