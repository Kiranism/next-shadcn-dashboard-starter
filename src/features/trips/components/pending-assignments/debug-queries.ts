import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('trips')
    .select('id, client_name, scheduled_at, requested_date, driver_id, status')
    .is('driver_id', null)
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: false })
    .limit(20);

  console.log('Error:', error);
  console.log('Unassigned non-cancelled trips (up to 20):');
  console.table(data);
}

check().catch(console.error);
