import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocodeLatLngToPostalCode } from '@/lib/google-geocoding';

/**
 * Place Details proxy — resolves a Google Place ID to lat/lng and structured address fields.
 *
 * Uses Places API (New) `places.get`. PLZ may be completed via Geocoding API reverse lookup when Places
 * returns an incomplete German postal code (see `docs/address-autocomplete.md`).
 */

interface PlacesAddressComponent {
  types?: string[];
  longText?: string;
  shortText?: string;
}

/**
 * Extract PLZ from `addressComponents`. Prefer `longText` over `shortText` (Google abbreviates the latter
 * for some component types). If several `postal_code` rows exist, keep the longest string.
 */
function postalCodeFromComponents(
  components: PlacesAddressComponent[] | undefined
): string | undefined {
  if (!Array.isArray(components)) return undefined;
  const candidates = components
    .filter((c) => c.types?.includes('postal_code'))
    .map((c) => (c.longText ?? c.shortText ?? '').trim())
    .filter(Boolean);
  if (candidates.length === 0) return undefined;
  return candidates.reduce((a, b) => (a.length >= b.length ? a : b));
}

/**
 * Places `places.get` expects the path `/v1/places/{placeId}` where `{placeId}` is the
 * text id only (see docs). Autocomplete sometimes returns `places/ChIJ…`; if we pass that
 * whole string into the path we get `/places/places/ChIJ…` — wrong resource.
 */
function normalizePlaceIdForPlacesGet(placeId: string): string {
  const t = placeId.trim();
  return t.startsWith('places/') ? t.slice('places/'.length) : t;
}

/**
 * Product autocomplete targets Germany (`includedRegionCodes: ['de']`). A valid German PLZ is five digits.
 * Missing or shorter numeric fragments (e.g. route centroids) trigger a Geocoding API fallback using lat/lng.
 */
function needsGermanPostalFallback(zip: string | undefined): boolean {
  if (!zip?.trim()) return true;
  return !/^\d{5}$/.test(zip.trim());
}

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

    const placeResourceId = normalizePlaceIdForPlacesGet(placeId);

    // Field mask is required by Places API (New); omitting it returns an error. Restricting fields lowers cost.
    const response = await fetch(
      // Path must be `/v1/places/{id}` with the bare id; encodeURIComponent keeps the segment valid if the id ever contains unusual characters.
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeResourceId)}`,
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

    if (!response.ok) {
      console.error('Places places.get error', response.status, data);
      return NextResponse.json(
        { error: data?.error?.message ?? 'Places API error', details: data },
        { status: response.status }
      );
    }

    const lat = data.location?.latitude;
    const lng = data.location?.longitude;
    let zip_code = postalCodeFromComponents(
      data.addressComponents as PlacesAddressComponent[] | undefined
    );

    // Places sometimes returns a partial `postal_code` for route-level features; Geocoding reverse lookup
    // at the same coordinates usually yields a full DE PLZ. Requires GOOGLE_MAPS_API_KEY (see docs).
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      needsGermanPostalFallback(zip_code)
    ) {
      const geoZip = await reverseGeocodeLatLngToPostalCode({ lat, lng });
      if (geoZip && /^\d{5}$/.test(geoZip)) {
        zip_code = geoZip;
      }
    }

    const street = (
      data.addressComponents as PlacesAddressComponent[] | undefined
    )?.find((c) => c.types?.includes('route'))?.shortText;

    const street_number = (
      data.addressComponents as PlacesAddressComponent[] | undefined
    )?.find((c) => c.types?.includes('street_number'))?.shortText;

    const city = (
      data.addressComponents as PlacesAddressComponent[] | undefined
    )?.find((c) => c.types?.includes('locality'))?.shortText;

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
