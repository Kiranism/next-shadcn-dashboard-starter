# Address Autocomplete

This document describes how address search works in the taxigo admin panel, which files are involved, and the key design decisions behind the Oldenburg-first behaviour, Place Details resolution, and postal code (PLZ) handling.

---

## Overview

Address input fields across the app (trip creation, client forms, recurring rules) use a shared `AddressAutocomplete` component backed by the **Google Places API v1** (New Places API). The system is designed to:

1. Prioritize streets and addresses within Oldenburg
2. Fall back to the nearest results outside Oldenburg when no local match exists
3. Resolve a selected suggestion into structured fields (coordinates, zip code, street, house number, city) for storage

---

## Files

| File | Role |
|------|------|
| [`src/features/trips/components/address-autocomplete.tsx`](../src/features/trips/components/address-autocomplete.tsx) | Reusable UI — input, debounced autocomplete, Oldenburg-first sorting, calls Place Details on selection |
| [`src/app/api/places-autocomplete/route.ts`](../src/app/api/places-autocomplete/route.ts) | Proxies queries to **Places Autocomplete** (New), `locationBias` around Oldenburg |
| [`src/app/api/place-details/route.ts`](../src/app/api/place-details/route.ts) | Proxies **Place Details** `places.get` — lat/lng, `addressComponents`, PLZ fallback |
| [`src/lib/google-geocoding.ts`](../src/lib/google-geocoding.ts) | Geocoding API helpers: forward geocode for address → coordinates; **reverse geocode** for PLZ fallback when Places returns an incomplete code |

---

## Request Flow

```
User types address
       │
       ▼ (debounced 300ms)
AddressAutocomplete
       │  POST { query }
       ▼
/api/places-autocomplete
       │  POST Google Places API v1 — Autocomplete
       │  (locationBias: Oldenburg, includedPrimaryTypes: route | street_address | establishment)
       ▼
Google returns suggestions (placeId, structuredFormat, distanceMeters, …)
       │
       ▼
AddressAutocomplete sorts:
  1. Oldenburg results  → alphabetical by street / place name
  2. Non-Oldenburg      → by distanceMeters from Oldenburg centre
       │
       ▼
User selects a suggestion
       │  GET /api/place-details?placeId=…
       ▼
/api/place-details
       │  GET Google Places API v1 — places.get (Place Details)
       │  optional: Geocoding API reverse (latlng) if PLZ incomplete for DE
       ▼
Returns { lat, lng, zip_code, street, street_number, city }
       │
       ▼
onChange / onSelectCallback fired with full AddressResult
```

---

## Key Design Decision: `locationBias` vs `locationRestriction`

This is the most important configuration choice in the autocomplete route.

**`locationRestriction`** — hard geographic wall. Google returns zero results for anything outside the defined circle, regardless of how good the match is. This was the original implementation and is why searching for addresses outside Oldenburg produced no results.

**`locationBias`** — soft preference. Google ranks results inside the circle higher, but expands outward when no local match exists. Results are returned closest-to-bias-centre first when falling back. This is the correct setting for a taxi dispatch system that operates primarily in Oldenburg but occasionally handles trips to/from other cities.

The bias is centred on Oldenburg city centre (53.1435°N, 8.2147°E) with a 15 km radius, which covers the entire Oldenburg urban area.

---

## `includedPrimaryTypes`

The autocomplete route specifies `['route', 'street_address', 'establishment']`:

- **`route`** — a named street without a house number (e.g. "Alexanderstraße, Oldenburg"). Useful for general area references.
- **`street_address`** — a full address including house number (e.g. "Alexanderstraße 14, Oldenburg"). Required for precise pickup and dropoff points.
- **`establishment`** — a named place (e.g. "Klinikum Oldenburg", "Hauptbahnhof Oldenburg"). The address is unknown at autocomplete time and is resolved from the placeId via `/api/place-details` on selection.

Google Places API v1 (New) allows mixing address types (`route`, `street_address`) and establishment types in the same `includedPrimaryTypes` array. This was not possible in the legacy Places API.

---

## Establishment vs. Address Result Shape

The Google Places API returns a different `structuredFormat` shape for each type:

| Type | `mainText` | `secondaryText` |
|------|-----------|----------------|
| `route` / `street_address` | Street name or full address | City / region |
| `establishment` | **Place name** | Street address + city |

For establishments, `mainText` is the place name — not a street. The component detects this via `p.types` and routes `mainText → name` instead of `street`. The `name` field drives both the dropdown label and the input value after selection. The actual `street`, `street_number`, `zip_code`, and coordinates are resolved on selection via `/api/place-details`.

The `AddressResult.name` field is the signal used throughout: if `name` is set, the result is an establishment.

---

## Place Details (`/api/place-details`) and Postal Codes (PLZ)

Autocomplete **does not** return a full German PLZ in structured form. After the user selects a row, the client calls **`/api/place-details`** with the suggestion’s `placeId`. That route calls Google’s **Place Details (New)** method [`places.get`](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/get).

### Place ID in the URL

The HTTP path must be `GET https://places.googleapis.com/v1/places/{placeId}` where `{placeId}` is the **bare** place id (e.g. `ChIJ…`). Some responses may include a `places/` prefix; the server **strips** `places/` so the path is not `/v1/places/places/…`, which would target the wrong resource.

The client passes `placeId` in the query string with **`encodeURIComponent`**, so any `/` in the id is not lost when the browser sends the request.

### Reading `addressComponents` for PLZ

Place Details returns `addressComponents` with `longText` and `shortText`. For `postal_code`, we prefer **`longText`**, then `shortText`, and if multiple `postal_code` components exist we keep the **longest** candidate. Relying on `shortText` alone can yield abbreviated values.

### Reverse geocode fallback (Germany)

Autocomplete is configured with **`includedRegionCodes: ['de']`**. A normal German PLZ has **five digits**. If Place Details returns a missing or shorter numeric PLZ (e.g. some route-level features), `/api/place-details` calls the **Geocoding API** reverse lookup (`latlng` → `address_components`) via [`reverseGeocodeLatLngToPostalCode`](../src/lib/google-geocoding.ts) and uses that `postal_code` when it matches five digits.

This requires **`GOOGLE_MAPS_API_KEY`** and the **Geocoding API** enabled for that key’s project. If the key is missing, Places-only behavior remains.

---

## Frontend Sorting Logic

After the API returns suggestions, `AddressAutocomplete` applies a two-pass sort:

1. **Oldenburg bucket** — results where the city secondary text includes "oldenburg", sorted alphabetically by street name then house number. Alphabetical is more natural for dispatchers who know the street name.
2. **Nearby bucket** — all remaining results, sorted by `distanceMeters` ascending (provided by Google when `locationBias` is active). Results with no distance value sink to the bottom.

The final list is `[...oldenburgResults, ...nearbyResults]`. If nothing matched locally, the nearby bucket becomes the entire list.

---

## AddressResult Type

```typescript
interface AddressResult {
  address: string;       // Full display string
  name?: string;         // Establishment / POI name (when not a plain street row)
  street?: string;       // Street name (from structuredFormat mainText)
  street_number?: string; // House number (resolved via place-details)
  zip_code?: string;     // Postal code (resolved via place-details; may use geocode fallback)
  city?: string;         // City name (from structuredFormat secondaryText)
  lat?: number;          // WGS-84 latitude (resolved via place-details)
  lng?: number;          // WGS-84 longitude (resolved via place-details)
  distance?: number;     // Distance in metres from bias centre (from autocomplete)
  placeId?: string;      // Google Place ID, used to fetch details on selection
}
```

`street_number`, `zip_code`, `lat`, and `lng` are only populated after a suggestion is selected and `/api/place-details` resolves them. They are not available in the autocomplete suggestions list itself (the dropdown PLZ badge for street rows is therefore usually empty until selection).

---

## Environment Variables

| Variable | Used in | Purpose |
|----------|---------|---------|
| `GOOGLE_PLACES_API_KEY` | `places-autocomplete`, `place-details` | Server-side only — Autocomplete + Place Details (New). Never expose to the client. |
| `GOOGLE_MAPS_API_KEY` | `google-geocoding.ts` (reverse PLZ fallback) | Geocoding API for reverse lookup when Place Details PLZ is incomplete. Same GCP project as Places is typical; **Geocoding API** must be enabled. |

The frontend calls only `/api/places-autocomplete` and `/api/place-details`, never Google directly.

---

## Google Places API Billing Notes

- **Autocomplete** calls are billed per request. The 300ms debounce in the component reduces unnecessary calls while the user is still typing.
- **Place Details** calls (`/api/place-details`) are only triggered on selection, not on every keystroke.
- `X-Goog-FieldMask: location,addressComponents` on the details request limits the response to the fields we use, which avoids billing for unused data (e.g. photos, reviews).
- **Geocoding** reverse lookups are **additional** billable calls, only when PLZ is not already a valid five-digit German code.

---

## References

- [Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Method: places.get](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/get)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)
