import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: shortestData, error: shortestError } = await supabase
      .from('trips')
      .select('*')
      .not('driving_distance_km', 'is', null)
      .order('driving_distance_km', { ascending: true })
      .limit(1);

    if (shortestError) throw shortestError;

    const { data: longestData, error: longestError } = await supabase
      .from('trips')
      .select('*')
      .not('driving_distance_km', 'is', null)
      .order('driving_distance_km', { ascending: false })
      .limit(1);

    if (longestError) throw longestError;

    const { data: avgData, error: avgError } = await supabase
      .from('trips')
      .select('driving_distance_km', { head: false, count: 'exact' });

    if (avgError) throw avgError;

    const distances =
      avgData?.map((t: any) => t.driving_distance_km as number | null) || [];
    const validDistances = distances.filter(
      (d): d is number => typeof d === 'number'
    );

    const averageDistanceKm =
      validDistances.length > 0
        ? validDistances.reduce((sum, v) => sum + v, 0) / validDistances.length
        : null;

    return NextResponse.json({
      shortest_trip: shortestData?.[0] ?? null,
      longest_trip: longestData?.[0] ?? null,
      average_distance_km: averageDistanceKm
    });
  } catch (error: any) {
    console.error('Error in /api/trips/metrics', error);
    return NextResponse.json(
      { error: error.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}
