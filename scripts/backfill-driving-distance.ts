import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { getDrivingMetrics } from '@/lib/google-directions';

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
    const { data: trips, error } = await supabase
      .from('trips')
      .select(
        'id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, driving_distance_km'
      )
      .is('driving_distance_km', null)
      .not('pickup_lat', 'is', null)
      .not('pickup_lng', 'is', null)
      .not('dropoff_lat', 'is', null)
      .not('dropoff_lng', 'is', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching trips for backfill', error);
      break;
    }

    if (!trips || trips.length === 0) {
      console.log('No more trips to backfill. Done.');
      break;
    }

    console.log(`Processing batch of ${trips.length} trips...`);

    for (const trip of trips) {
      const { id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = trip;

      if (
        pickup_lat == null ||
        pickup_lng == null ||
        dropoff_lat == null ||
        dropoff_lng == null
      ) {
        continue;
      }

      const metrics = await getDrivingMetrics(
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng
      );

      if (!metrics) {
        console.warn(`Skipping trip ${id} due to missing metrics`);
        continue;
      }

      const { distanceKm, durationSeconds } = metrics;

      const { error: updateError } = await supabase
        .from('trips')
        .update({
          driving_distance_km: distanceKm,
          driving_duration_seconds: durationSeconds
        })
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update trip ${id}`, updateError);
      } else {
        console.log(
          `Updated trip ${id} with distance=${distanceKm.toFixed(
            3
          )} km, duration=${durationSeconds} s`
        );
      }

      await sleep(SLEEP_MS);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
