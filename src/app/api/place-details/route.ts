import { NextRequest, NextResponse } from 'next/server';

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

    // Extract lat, lng and zip_code from Google Place Details response
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
