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
          // Hard-restrict to Oldenburg area so we always get local streets first
          locationRestriction: {
            circle: {
              center: { latitude: 53.1435, longitude: 8.2147 }, // Oldenburg
              radius: 15000 // 15km radius
            }
          },
          // Prefer street names; user can add house numbers after
          includedPrimaryTypes: ['route'],
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
