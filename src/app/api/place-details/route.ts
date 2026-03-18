import { NextRequest, NextResponse } from 'next/server';

// Called after the user selects an autocomplete suggestion.
// The autocomplete response only contains a placeId; this endpoint resolves it
// into structured fields (coordinates, zip code, street, house number, city)
// needed for trip creation and display.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    // X-Goog-FieldMask limits the response to only the fields we need,
    // which reduces response size and avoids billing for unused field data.
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'location,addressComponents'
        }
      }
    );

    const data = await response.json();

    const lat = data.location?.latitude;
    const lng = data.location?.longitude;
    const zip_code = data.addressComponents?.find((c: any) =>
      c.types.includes('postal_code')
    )?.shortText;

    const street = data.addressComponents?.find((c: any) =>
      c.types.includes('route')
    )?.shortText;

    const street_number = data.addressComponents?.find((c: any) =>
      c.types.includes('street_number')
    )?.shortText;

    const city = data.addressComponents?.find((c: any) =>
      c.types.includes('locality')
    )?.shortText;

    return NextResponse.json({
      lat,
      lng,
      zip_code,
      street,
      street_number,
      city
    });
  } catch (error) {
    console.error('Error in place-details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
