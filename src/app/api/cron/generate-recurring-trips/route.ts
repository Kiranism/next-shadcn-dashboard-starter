import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RRule, rrulestr } from 'rrule';
import {
  addDays,
  startOfDay,
  endOfDay,
  format,
  isAfter,
  isBefore
} from 'date-fns';
import type { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // We use the service_role key to bypass RLS since this is an automated server endpoint
    // that creates trips for all users automatically based on a generic schedule.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // 1. Define Rolling Window (e.g. Next 14 days)
    const todayLocal = startOfDay(new Date());
    const windowEndLocal = endOfDay(addDays(todayLocal, 14));

    // 2. Fetch all active recurring rules
    const { data: rules, error: rulesError } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: 'No active rules found' });
    }

    // 3. Fetch all exceptions for these rules within the window
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('recurring_rule_exceptions')
      .select('*')
      .in(
        'rule_id',
        rules.map((r) => r.id)
      )
      .gte('exception_date', format(todayLocal, 'yyyy-MM-dd'))
      .lte('exception_date', format(windowEndLocal, 'yyyy-MM-dd'));

    if (exceptionsError) throw exceptionsError;

    const tripsToInsert: Database['public']['Tables']['trips']['Insert'][] = [];

    for (const rule of rules) {
      // Fetch client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', rule.client_id)
        .single();

      if (clientError || !client) continue;

      const clientName = client.is_company
        ? client.company_name
        : `${client.first_name || ''} ${client.last_name || ''}`.trim();

      const ruleStartDateLocal = startOfDay(new Date(rule.start_date));
      const ruleEndDateLocal = rule.end_date
        ? endOfDay(new Date(rule.end_date))
        : windowEndLocal;

      // Generate RRule instances. rrule operates best with UTC naive dates
      // to avoid timezone shifts jumping dates around.
      const dtStartUTC = new Date(
        Date.UTC(
          ruleStartDateLocal.getFullYear(),
          ruleStartDateLocal.getMonth(),
          ruleStartDateLocal.getDate(),
          0,
          0,
          0
        )
      );

      let rruleObj: RRule;
      try {
        // Prepend string to define DTSTART
        const dtStartStr = format(dtStartUTC, "yyyyMMdd'T'HHmmss'Z'");
        const rruleStr = `DTSTART:${dtStartStr}\n${rule.rrule_string}`;
        rruleObj = rrulestr(rruleStr) as RRule;
      } catch (e) {
        console.error('Invalid RRule', rule.rrule_string, e);
        continue;
      }

      // Get all dates in our standard window that also fall within the rule's validity
      const searchStartLocal = isAfter(todayLocal, ruleStartDateLocal)
        ? todayLocal
        : ruleStartDateLocal;
      const searchEndLocal = isBefore(windowEndLocal, ruleEndDateLocal)
        ? windowEndLocal
        : ruleEndDateLocal;

      if (isAfter(searchStartLocal, searchEndLocal)) continue; // Rule ended before our window

      const searchStartUTC = new Date(
        Date.UTC(
          searchStartLocal.getFullYear(),
          searchStartLocal.getMonth(),
          searchStartLocal.getDate()
        )
      );
      const searchEndUTC = new Date(
        Date.UTC(
          searchEndLocal.getFullYear(),
          searchEndLocal.getMonth(),
          searchEndLocal.getDate(),
          23,
          59,
          59
        )
      );

      const occurrencesUTC = rruleObj.between(
        searchStartUTC,
        searchEndUTC,
        true
      );

      for (const dateUTC of occurrencesUTC) {
        // Ensure date string relies on the UTC naive date to perfectly match local date
        const dateStr = dateUTC.toISOString().split('T')[0];

        // Helper to process trip (Hinfahrt or Rückfahrt)
        const processTripInstance = (isReturnTrip: boolean) => {
          const basePickupTime = isReturnTrip
            ? rule.return_time
            : rule.pickup_time;
          if (!basePickupTime) return;

          // 1. Check Exceptions
          const exception = exceptions?.find(
            (e) =>
              e.rule_id === rule.id &&
              e.exception_date === dateStr &&
              e.original_pickup_time === basePickupTime
          );

          if (exception && exception.is_cancelled) {
            return; // Skip generation entirely for this instance
          }

          // 2. Resolve final values
          const pickupTime = exception?.modified_pickup_time || basePickupTime;
          const pickupAddress =
            exception?.modified_pickup_address ||
            (isReturnTrip ? rule.dropoff_address : rule.pickup_address);
          const dropoffAddress =
            exception?.modified_dropoff_address ||
            (isReturnTrip ? rule.pickup_address : rule.dropoff_address);

          // Recombine into an actual timestamp in local time
          const scheduledAtStr = `${dateStr}T${pickupTime}`;
          const scheduledAt = new Date(scheduledAtStr).toISOString();

          tripsToInsert.push({
            company_id: client.company_id,
            client_id: client.id,
            client_name: clientName || '',
            client_phone: client.phone || '',
            pickup_address: pickupAddress,
            dropoff_address: dropoffAddress,
            scheduled_at: scheduledAt,
            status: 'pending',
            rule_id: rule.id,
            // 'return' marks this as the Rückfahrt so direction can be read
            // directly from the trip row without querying the rule or partner.
            // null means this is the Hinfahrt (outbound leg).
            link_type: isReturnTrip ? 'return' : null
          });
        };

        // Generate Hinfahrt
        processTripInstance(false);

        // Generate Rückfahrt
        if (rule.return_trip && rule.return_time) {
          processTripInstance(true);
        }
      }
    }

    if (tripsToInsert.length === 0) {
      return NextResponse.json({
        message: 'No new trips to generate within the window.'
      });
    }

    // Idempotency: Verify these trips don't already exist.
    // We'll check by client_id and scheduled_at to prevent double creation.
    let actuallyInserted = 0;

    for (const trip of tripsToInsert) {
      const { data: existing, error: existError } = await supabase
        .from('trips')
        .select('id')
        .eq('client_id', trip.client_id as string)
        .eq('scheduled_at', trip.scheduled_at as string)
        .maybeSingle();

      if (!existing && !existError) {
        const { error: insertError } = await supabase
          .from('trips')
          .insert(trip);
        if (!insertError) {
          actuallyInserted++;
        } else {
          console.error('Failed to insert trip:', insertError);
        }
      }
    }

    return NextResponse.json({
      message: `Successfully processed recurring rules.`,
      trips_evaluated: tripsToInsert.length,
      trips_inserted: actuallyInserted
    });
  } catch (error: any) {
    console.error('Cron Error generating recurring trips:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
