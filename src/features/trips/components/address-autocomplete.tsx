'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, MapPin } from 'lucide-react';
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

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }

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

            // Try multiple shapes for structured formatting
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

            return {
              address: addressText,
              street: mainText,
              city: secondaryText,
              placeId: p.placeId ?? p.place_id,
              // Google Places autocomplete can include distanceMeters from the bias center
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

        // If we clearly have a street-like main text, prefer those; otherwise fall back to all.
        const streetResults =
          rawSuggestions.filter((r) => !!r.street) ?? rawSuggestions;

        // Prioritize Oldenburg streets, then nearby streets by distance
        const oldenburgResults = streetResults.filter((r) =>
          (r.city || '').toLowerCase().includes('oldenburg')
        );

        const nearbyResults = streetResults.filter(
          (r) => !oldenburgResults.includes(r)
        );

        // Sort Oldenburg streets alphabetically (street, then house number if present later)
        oldenburgResults.sort((a, b) => {
          const streetCompare = (a.street || '').localeCompare(b.street || '');
          if (streetCompare !== 0) return streetCompare;
          return (a.street_number || '').localeCompare(b.street_number || '');
        });

        // Sort nearby streets by distance from Oldenburg bias center if available
        nearbyResults.sort(
          (a, b) =>
            (a.distance || Number.POSITIVE_INFINITY) -
            (b.distance || Number.POSITIVE_INFINITY)
        );

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
    if (result.placeId) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/place-details?placeId=${result.placeId}`);
        const details = await res.json();

        const finalResult = {
          ...result,
          lat: details.lat,
          lng: details.lng,
          zip_code: details.zip_code,
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
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('h-8 text-[11px]', className)}
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
              {suggestions.map((s, i) => (
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
