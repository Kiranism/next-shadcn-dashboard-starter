'use client';

/**
 * Address search for dispatch forms: Google Places Autocomplete (New) → optional Place Details on select.
 *
 * Suggestions come from `/api/places-autocomplete` (debounced). Structured fields (PLZ, house number,
 * coordinates) are filled only after `/api/place-details` runs — see `docs/address-autocomplete.md`.
 */
import * as React from 'react';
import { Building2, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';

export interface AddressResult {
  address: string;
  // For establishment results (hospitals, stations, etc.) `name` holds the
  // place name shown in the input after selection. `street` is left empty
  // until place-details resolves the actual street from the placeId.
  name?: string;
  street?: string;
  street_number?: string;
  zip_code?: string;
  city?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  placeId?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (result: AddressResult | string) => void;
  onSelectCallback?: (result: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectCallback,
  placeholder = 'Adresse suchen...',
  disabled = false,
  className
}: AddressAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(value, 300);

  // Only fetch when the user is actively typing. Without this, a pre-filled
  // value (page reload, panel reopen) would trigger the dropdown immediately.
  const userIsTypingRef = React.useRef(false);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      // Skip API call if the value change came from a prop update (pre-filled
      // form, page reload) rather than from the user typing in the field.
      if (!userIsTypingRef.current) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/places-autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedQuery })
        });
        const data = await response.json();

        // Google Places v1 usually returns `suggestions`, but be defensive and
        // also support `predictions` or a direct array response.
        const apiSuggestions = (
          Array.isArray(data?.suggestions)
            ? data.suggestions
            : Array.isArray(data?.predictions)
              ? data.predictions
              : Array.isArray(data)
                ? data
                : []
        ) as any[];

        const rawSuggestions: AddressResult[] = apiSuggestions
          .map((item: any) => {
            const p = item.placePrediction ?? item;

            // Support both Google Places API v1 (structuredFormat) and legacy (structured_formatting)
            const mainText =
              p.structuredFormat?.mainText?.text ??
              p.structured_formatting?.main_text ??
              p.structured_formatting?.mainText ??
              p.description;

            const secondaryText =
              p.structuredFormat?.secondaryText?.text ??
              p.structured_formatting?.secondary_text ??
              p.structured_formatting?.secondaryText ??
              undefined;

            const addressText =
              p.text?.text ??
              p.description ??
              [mainText, secondaryText].filter(Boolean).join(', ');

            // Determine if this is a named place (establishment, POI) rather than
            // a pure address. For establishments, mainText is the PLACE NAME and
            // secondaryText is the street address — so we must not assign mainText
            // to `street`. We detect this by checking the absence of address-only
            // types; if types is empty we fall back to treating it as an address.
            const types: string[] = p.types ?? [];
            const isEstablishment =
              types.length > 0 &&
              !types.includes('route') &&
              !types.includes('street_address') &&
              !types.includes('geocode') &&
              !types.includes('premise');

            return {
              address: addressText,
              // Place name shown in the input after selecting an establishment
              name: isEstablishment ? mainText : undefined,
              // For addresses mainText IS the street; for establishments the street
              // is unknown until place-details resolves it from the placeId.
              street: isEstablishment ? undefined : mainText,
              // secondaryText for establishments already contains the readable address
              // hint (e.g. "Rahel-Straus-Straße 10, Oldenburg") — keep it in city
              // so the dropdown can display it as a location hint below the name.
              city: secondaryText,
              placeId: p.placeId ?? p.place_id,
              distance:
                typeof p.distanceMeters === 'number'
                  ? p.distanceMeters
                  : typeof item.distanceMeters === 'number'
                    ? item.distanceMeters
                    : undefined
            };
          })
          .filter((r) => !!r.address);

        if (rawSuggestions.length === 0) {
          setSuggestions([]);
          setOpen(false);
          return;
        }

        // Keep results that have either a street (address types) or a name
        // (establishment types). Both are actionable for dispatch — establishments
        // get their street resolved later via place-details on selection.
        const validResults = rawSuggestions.filter(
          (r) => !!r.street || !!r.name
        );

        // Split into two buckets:
        //   1. Oldenburg results  — city secondary text includes "oldenburg"
        //   2. Everything else    — fallback when locationBias found no local match
        // For establishments, `city` holds the secondary address hint from Google
        // (e.g. "Rahel-Straus-Straße 10, Oldenburg") so the check still works.
        const oldenburgResults = validResults.filter((r) =>
          (r.city || '').toLowerCase().includes('oldenburg')
        );

        const nearbyResults = validResults.filter(
          (r) => !oldenburgResults.includes(r)
        );

        // Within Oldenburg: alphabetical by display label (place name or street).
        // Establishments sort by name; address results sort by street + house number.
        oldenburgResults.sort((a, b) => {
          const labelA = a.name || a.street || '';
          const labelB = b.name || b.street || '';
          const labelCompare = labelA.localeCompare(labelB);
          if (labelCompare !== 0) return labelCompare;
          return (a.street_number || '').localeCompare(b.street_number || '');
        });

        // Outside Oldenburg: sort by distanceMeters from the bias centre
        // (provided by Google Places API when locationBias is used).
        // Falls back to Infinity so un-distanced results sink to the bottom.
        nearbyResults.sort(
          (a, b) =>
            (a.distance || Number.POSITIVE_INFINITY) -
            (b.distance || Number.POSITIVE_INFINITY)
        );

        // Final order: Oldenburg first (if any), then nearest-outside results.
        // If nothing matched locally, nearbyResults becomes the full list.
        const finalResults =
          oldenburgResults.length > 0
            ? [...oldenburgResults, ...nearbyResults]
            : nearbyResults;

        setSuggestions(finalResults);
        if (finalResults.length > 0) setOpen(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelect = async (result: AddressResult) => {
    // Mark typing as done so the resolved value doesn't re-trigger the dropdown
    userIsTypingRef.current = false;

    if (result.placeId) {
      setIsLoading(true);
      try {
        // Encode so ids containing `/` (e.g. `places/ChIJ…`) survive the query string intact server-side.
        const res = await fetch(
          `/api/place-details?placeId=${encodeURIComponent(result.placeId)}`
        );
        const details = await res.json();

        // Merge server-resolved geometry + address; establishment rows still use `name` for the input label.
        const finalResult = {
          ...result,
          // For establishments the input should show the place name, not the
          // raw Google address string. For regular addresses keep the full text.
          address: result.name ?? result.address,
          lat: details.lat,
          lng: details.lng,
          zip_code: details.zip_code,
          // place-details resolves the actual street for establishments
          street: details.street || result.street,
          street_number: details.street_number,
          city: details.city || result.city
        };

        onChange(finalResult);
        onSelectCallback?.(finalResult);
      } catch (error) {
        console.error('Error fetching place details:', error);
        onChange(result);
      } finally {
        setIsLoading(false);
      }
    } else {
      onChange(result);
    }
    setOpen(false);
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className='relative w-full'>
          <Input
            value={value}
            onChange={(e) => {
              userIsTypingRef.current = true;
              onChange({ address: e.target.value });
            }}
            placeholder={placeholder}
            disabled={disabled}
            // Taller field on small screens — matches other trip form inputs (~44px touch target)
            className={cn('h-10 text-sm sm:h-8 sm:text-[11px]', className)}
            autoComplete='off'
          />
          {isLoading && (
            <div className='absolute top-1/2 right-2 -translate-y-1/2'>
              <Loader2 className='text-muted-foreground h-3 w-3 animate-spin' />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className='h-auto overflow-visible'>
          <CommandList
            className='overflow-y-auto overscroll-contain'
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>Keine Adresse gefunden.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((s, i) =>
                s.name ? (
                  // Establishment / named place result
                  <CommandItem
                    key={i}
                    value={s.address}
                    onSelect={() => handleSelect(s)}
                    className='flex flex-col items-start gap-1 py-3'
                  >
                    <div className='flex w-full items-center gap-1.5'>
                      <Building2 className='text-muted-foreground h-3 w-3 shrink-0' />
                      <span className='text-xs font-medium'>{s.name}</span>
                    </div>
                    {s.city && (
                      <div className='text-muted-foreground line-clamp-1 pl-[18px] text-[10px]'>
                        {s.city}
                      </div>
                    )}
                  </CommandItem>
                ) : (
                  // Street / address result
                  <CommandItem
                    key={i}
                    value={s.address}
                    onSelect={() => handleSelect(s)}
                    className='flex flex-col items-start gap-1 py-3'
                  >
                    <div className='flex w-full items-center justify-between'>
                      <div className='text-xs font-medium'>
                        {s.street} {s.street_number}
                      </div>
                      {/* PLZ is normally unset here — it is applied after place-details; badge is for edge cases */}
                      {s.zip_code && (
                        <div className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px]'>
                          {s.zip_code}
                        </div>
                      )}
                    </div>
                    <div className='text-muted-foreground line-clamp-1 text-[10px]'>
                      {s.city}
                      {s.address.split(',').slice(2).join(',')}
                    </div>
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
