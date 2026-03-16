const DIRECTIONS_ENDPOINT =
  'https://maps.googleapis.com/maps/api/directions/json';

interface DirectionsLegDistance {
  value: number;
  text: string;
}

interface DirectionsLegDuration {
  value: number;
  text: string;
}

interface DirectionsLeg {
  distance?: DirectionsLegDistance;
  duration?: DirectionsLegDuration;
}

interface DirectionsRoute {
  legs?: DirectionsLeg[];
}

interface DirectionsResponse {
  status?: string;
  routes?: DirectionsRoute[];
}

export interface DrivingMetrics {
  distanceKm: number;
  durationSeconds: number;
}

export async function getDrivingMetrics(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DrivingMetrics | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set');
    return null;
  }

  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;

  const url = new URL(DIRECTIONS_ENDPOINT);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error('Directions API HTTP error', res.status, res.statusText);
      return null;
    }

    const data = (await res.json()) as DirectionsResponse;

    if (data.status && data.status !== 'OK') {
      console.error('Directions API status error', data.status);
      return null;
    }

    const firstRoute = data.routes?.[0];
    const firstLeg = firstRoute?.legs?.[0];
    const distanceMeters = firstLeg?.distance?.value;
    const durationSeconds = firstLeg?.duration?.value;

    if (
      typeof distanceMeters !== 'number' ||
      typeof durationSeconds !== 'number'
    ) {
      console.error('Directions API missing distance or duration');
      return null;
    }

    const distanceKm = distanceMeters / 1000;

    return {
      distanceKm,
      durationSeconds
    };
  } catch (error) {
    console.error('Error calling Directions API', error);
    return null;
  }
}
