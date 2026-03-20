import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // X-Goog-FieldMask limits the response to only the fields we need.
    // We add formattedAddress as a fallback for zip code extraction.
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'location,addressComponents,formattedAddress'
        }
      }
    );

    const data = await response.json();
    console.log(
      'DEBUG: place-details data from Google:',
      JSON.stringify(data, null, 2)
    );

    const lat = data.location?.latitude;
    const lng = data.location?.longitude;

    // 1. Try to get zip code from address components first
    let zip_code = (
      data.addressComponents?.find((c: any) =>
        c.types.includes('postal_code')
      ) ??
      data.addressComponents?.find((c: any) =>
        c.types.includes('postal_code_prefix')
      )
    )?.longText;

    console.log('DEBUG: zip_code from components:', zip_code);

    // 2. Fallback: If zip_code is missing or looks truncated (less than 5 digits for Germany),
    // try to extract it from the formattedAddress using regex.
    if ((!zip_code || zip_code.length < 5) && data.formattedAddress) {
      const zipMatch = data.formattedAddress.match(/\b\d{5}\b/);
      if (zipMatch) {
        zip_code = zipMatch[0];
        console.log(
          'DEBUG: zip_code extracted from formattedAddress:',
          zip_code
        );
      }
    }

    const street = data.addressComponents?.find((c: any) =>
      c.types.includes('route')
    )?.longText;

    const street_number = data.addressComponents?.find((c: any) =>
      c.types.includes('street_number')
    )?.longText;

    const city = data.addressComponents?.find((c: any) =>
      c.types.includes('locality')
    )?.longText;

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
