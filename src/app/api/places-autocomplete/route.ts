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
          // Three result types cover all dispatcher input patterns:
          //   route          — street name only ("Alexanderstraße")
          //   street_address — full address with house number ("Alexanderstraße 14")
          //   establishment  — named place ("Klinikum Oldenburg", "Hauptbahnhof")
          // Google Places API v1 (New) allows mixing address and establishment types
          // in the same request, unlike the legacy Places API.
          includedPrimaryTypes: ['route', 'street_address', 'establishment'],
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
