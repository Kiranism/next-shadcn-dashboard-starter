import { NextRequest, NextResponse } from 'next/server';
import { geocodeStructuredAddressToLatLng } from '@/lib/google-geocoding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { street, street_number, zip_code, city } = body ?? {};

    const result = await geocodeStructuredAddressToLatLng({
      street,
      street_number,
      zip_code,
      city
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Unable to geocode address' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/geocode-address', error);
    return NextResponse.json(
      { error: error.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}
