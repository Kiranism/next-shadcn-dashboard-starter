import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { geocodeStructuredAddressToLatLng } from '@/lib/google-geocoding';

const BATCH_SIZE = 50;
const SLEEP_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, street, street_number, zip_code, city, lat, lng')
      .is('lat', null)
      .is('lng', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching clients for backfill', error);
      break;
    }

    if (!clients || clients.length === 0) {
      console.log('No more clients to backfill. Done.');
      break;
    }

    console.log(`Processing batch of ${clients.length} clients...`);

    for (const client of clients) {
      const { id, street, street_number, zip_code, city } = client;

      const result = await geocodeStructuredAddressToLatLng({
        street,
        street_number,
        zip_code,
        city
      });

      if (!result) {
        console.warn(`Skipping client ${id} due to missing geocode result`);
        continue;
      }

      const { lat, lng } = result;

      const { error: updateError } = await supabase
        .from('clients')
        .update({ lat, lng })
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update client ${id}`, updateError);
      } else {
        console.log(
          `Updated client ${id} with lat=${lat.toFixed(6)}, lng=${lng.toFixed(
            6
          )}`
        );
      }

      await sleep(SLEEP_MS);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
