# Address Autocomplete

This document describes how address search works in the taxigo admin panel, which files are involved, and the key design decisions behind the Oldenburg-first, global-fallback behavior.

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
| `src/features/trips/components/address-autocomplete.tsx` | Reusable UI component — renders the input, calls the API, sorts and displays suggestions |
| `src/app/api/places-autocomplete/route.ts` | Next.js API route — proxies queries to Google Places Autocomplete, applies locationBias |
| `src/app/api/place-details/route.ts` | Next.js API route — resolves a placeId into structured address fields + coordinates |

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
       │  POST Google Places API v1
       │  (locationBias: Oldenburg, includedPrimaryTypes: route | street_address)
       ▼
Google returns suggestions (with placeId, structuredFormat, distanceMeters)
       │
       ▼
AddressAutocomplete sorts:
  1. Oldenburg results  → alphabetical by street name
  2. Non-Oldenburg      → by distanceMeters from Oldenburg centre
       │
       ▼
User selects a suggestion
       │  GET /api/place-details?placeId=...
       ▼
/api/place-details
       │  GET Google Places API v1 (fields: location, addressComponents)
       ▼
Returns { lat, lng, zip_code, street, street_number, city }
       │
       ▼
onChange / onSelectCallback fired with full AddressResult
```

---

## Key Design Decision: `locationBias` vs `locationRestriction`

This is the most important configuration choice in the system.

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

## Establishment vs. Address Result Shape

The Google Places API returns a different `structuredFormat` shape for each type:

| Type | `mainText` | `secondaryText` |
|------|-----------|----------------|
| `route` / `street_address` | Street name or full address | City / region |
| `establishment` | **Place name** | Street address + city |

For establishments, `mainText` is the place name — not a street. The component detects this via `p.types` and routes `mainText → name` instead of `street`. The `name` field drives both the dropdown label and the input value after selection. The actual `street`, `street_number`, `zip_code`, and coordinates are resolved on selection via `/api/place-details`.

The `AddressResult.name` field is the signal used throughout: if `name` is set, the result is an establishment.

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
  street?: string;       // Street name (from structuredFormat mainText)
  street_number?: string; // House number (resolved via place-details)
  zip_code?: string;     // Postal code (resolved via place-details)
  city?: string;         // City name (from structuredFormat secondaryText)
  lat?: number;          // WGS-84 latitude (resolved via place-details)
  lng?: number;          // WGS-84 longitude (resolved via place-details)
  distance?: number;     // Distance in metres from bias centre (from autocomplete)
  placeId?: string;      // Google Place ID, used to fetch details on selection
}
```

`street_number`, `zip_code`, `lat`, and `lng` are only populated after a suggestion is selected and `/api/place-details` resolves them. They are not available in the autocomplete suggestions list itself.

---

## Environment Variables

```env
GOOGLE_PLACES_API_KEY=...   # Server-side only — never expose to client
```

The API key is used exclusively inside the two Next.js API routes. The frontend component calls `/api/places-autocomplete` and `/api/place-details`, never Google directly.

---

## Google Places API Billing Notes

- **Autocomplete** calls are billed per request. The 300ms debounce in the component reduces unnecessary calls while the user is still typing.
- **Place Details** calls (`/api/place-details`) are only triggered on selection, not on every keystroke.
- `X-Goog-FieldMask: location,addressComponents` on the details request limits the response to the two field groups we actually use, which avoids billing for unused SKUs (e.g. photos, reviews, opening hours).
