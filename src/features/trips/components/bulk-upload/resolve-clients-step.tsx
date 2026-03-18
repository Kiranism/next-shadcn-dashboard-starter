'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { clientsService } from '@/features/clients/api/clients.service';
import type { RehydratedTripRow } from './bulk-upload-types';

interface ResolveClientsStepProps {
  rows: RehydratedTripRow[];
  currentIndex: number;
  homeAddressChoice: 'pickup' | 'dropoff';
  onHomeAddressChange: (choice: 'pickup' | 'dropoff') => void;
  onSkip: () => void;
  onDone: () => void;
}

export function ResolveClientsStep({
  rows,
  currentIndex,
  homeAddressChoice,
  onHomeAddressChange,
  onSkip,
  onDone
}: ResolveClientsStepProps) {
  const [isWorking, setIsWorking] = React.useState(false);

  const handleCreateAndLinkClient = async () => {
    const current = rows[currentIndex];
    if (!current) return;

    try {
      setIsWorking(true);
      const supabase = createSupabaseClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      let companyIdStr = '00000000-0000-0000-0000-000000000000';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('accounts')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          companyIdStr = profile.company_id;
        }
      }

      // Use the original CSV columns when available (fresh upload path).
      // Fall back to splitting the concatenated name only for the resume-from-DB
      // path where the separate parts are no longer recoverable.
      let firstName: string | null;
      let lastName: string | null;
      if (current.clientFirstName !== null || current.clientLastName !== null) {
        firstName = current.clientFirstName;
        lastName = current.clientLastName;
      } else {
        const parts = (current.clientName || '').trim().split(/\s+/);
        firstName = parts[0] || null;
        lastName = parts.slice(1).join(' ') || null;
      }

      const usePickup = homeAddressChoice === 'pickup';

      // Use pre-split street fields from the DB row when available,
      // otherwise fall through to the full address string.
      const streetRaw = usePickup
        ? current.pickupStreet || current.pickupAddress || ''
        : current.dropoffStreet || current.dropoffAddress || '';
      let zip = usePickup ? current.pickupZip || '' : current.dropoffZip || '';
      let city = usePickup
        ? current.pickupCity || ''
        : current.dropoffCity || '';

      let street = streetRaw;
      let streetNumber =
        (usePickup
          ? current.pickupStreetNumber
          : current.dropoffStreetNumber) || '';

      // If explicit street_number is missing, try to split from the raw value.
      if (!streetNumber) {
        const streetMatch = streetRaw.match(/^(.*\S)\s+(\d+\w*)$/);
        if (streetMatch) {
          street = streetMatch[1];
          streetNumber = streetMatch[2];
        }
      }

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const res = await fetch('/api/geocode-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          if (typeof data.zip_code === 'string' && data.zip_code.trim()) {
            zip = data.zip_code.trim();
          }
          if (typeof data.city === 'string' && data.city.trim()) {
            city = data.city.trim();
          }
        }
      } catch {
        // Non-fatal: client is still created without coordinates.
      }

      const client = await clientsService.createClient({
        first_name: firstName || null,
        last_name: lastName,
        phone: current.clientPhone || null,
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
        greeting_style: current.greetingStyle || null
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
              ? { pickup_lat: lat, pickup_lng: lng, has_missing_geodata: false }
              : {
                  dropoff_lat: lat,
                  dropoff_lng: lng,
                  has_missing_geodata: false
                }
            : {})
        })
        .eq('id', current.tripId);

      toast.success('Fahrgast wurde erstellt und mit der Fahrt verknüpft.');

      if (currentIndex + 1 < rows.length) {
        onSkip();
      } else {
        onDone();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(msg || 'Konnte Fahrgast nicht erstellen und verknüpfen.');
    } finally {
      setIsWorking(false);
    }
  };

  if (rows.length === 0) return null;

  if (currentIndex >= rows.length) {
    return (
      <div className='space-y-2 text-sm'>
        <p>Alle Fahrgäste aus diesem Upload wurden bearbeitet.</p>
        <Button type='button' className='w-full' onClick={onDone}>
          Fertig
        </Button>
      </div>
    );
  }

  const current = rows[currentIndex];

  return (
    <div className='space-y-4'>
      <div className='space-y-3 text-sm'>
        <div className='font-medium'>
          Fahrgast {currentIndex + 1} von {rows.length}
        </div>
        <div>
          <div className='font-medium'>Name</div>
          <div className='text-muted-foreground'>
            {current.clientName || '—'}
          </div>
        </div>
        <div>
          <div className='font-medium'>Abholadresse</div>
          <div className='text-muted-foreground'>
            {current.pickupAddress || '—'}
          </div>
        </div>
        <div>
          <div className='font-medium'>Zieladresse</div>
          <div className='text-muted-foreground'>
            {current.dropoffAddress || '—'}
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
                  {current.pickupAddress || '—'}
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
                  {current.dropoffAddress || '—'}
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
            onClick={onSkip}
            disabled={isWorking}
          >
            Als Nicht‑Kunde verwenden
          </Button>
          <Button
            type='button'
            className='w-full'
            disabled={isWorking}
            onClick={handleCreateAndLinkClient}
          >
            {isWorking ? (
              <span className='flex items-center gap-2'>
                <span className='border-background h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent' />
                Wird erstellt…
              </span>
            ) : (
              'Neuen Fahrgast anlegen \u0026 verknüpfen'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
