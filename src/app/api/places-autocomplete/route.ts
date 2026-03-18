import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!
        },
        body: JSON.stringify({
          input: query,
          // Soft bias toward Oldenburg city centre (53.1435°N, 8.2147°E).
          // Using locationBias (not locationRestriction) is intentional:
          //   - locationRestriction = hard wall, zero results outside the circle
          //   - locationBias       = preference, Google expands outward when no
          //     local match exists, returning the closest results geographically
          // This gives us "Oldenburg streets first, everything else as fallback."
          locationBias: {
            circle: {
              center: { latitude: 53.1435, longitude: 8.2147 }, // Oldenburg centre
              radius: 15000 // 15 km — covers the entire Oldenburg urban area
            }
          },
          // Include both route (street name only) and street_address (street +
          // house number) so dispatchers can enter precise pickup/dropoff points
          // like "Alexanderstraße 14" without the filter blocking them.
          includedPrimaryTypes: ['route', 'street_address'],
          includedRegionCodes: ['de'],
          languageCode: 'de'
        })
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in places-autocomplete:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
