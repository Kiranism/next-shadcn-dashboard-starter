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
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (result: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Straße suchen...',
  disabled = false,
  className
}: AddressAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(value, 500);

  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    // Don't fetch if the debounced query is exactly the same as a recent selection's address
    // This is simplified; in a real app you might want to track if it was a selection or manual type

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const OLDENBURG_LAT = 53.1435;
        const OLDENBURG_LON = 8.2147;

        // Use viewbox to strongly bias results toward Oldenburg region
        // viewbox = west,south,east,north (roughly ~30km around Oldenburg)
        const viewbox = `${OLDENBURG_LON - 0.5},${OLDENBURG_LAT - 0.3},${OLDENBURG_LON + 0.5},${OLDENBURG_LAT + 0.3}`;

        // First pass: bounded=1 forces results ONLY within viewbox
        const boundedResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedQuery
          )}&addressdetails=1&limit=20&countrycodes=de&dedupe=1&viewbox=${viewbox}&bounded=1`
        );
        const boundedData = await boundedResponse.json();

        // Second pass: unbounded fallback if no results found locally
        let rawData = boundedData;
        if (boundedData.length === 0) {
          const unboundedResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              debouncedQuery
            )}&addressdetails=1&limit=20&countrycodes=de&dedupe=1&viewbox=${viewbox}&bounded=0`
          );
          rawData = await unboundedResponse.json();
        }

        const results: AddressResult[] = rawData.map((item: any) => {
          const addr = item.address;
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          const distance = Math.sqrt(
            Math.pow(lat - OLDENBURG_LAT, 2) + Math.pow(lng - OLDENBURG_LON, 2)
          );

          // Capture city from ALL possible Nominatim fields
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.municipality ||
            addr.county ||
            '';

          return {
            address: item.display_name,
            street: addr.road || addr.pedestrian || addr.street,
            street_number: addr.house_number,
            zip_code: addr.postcode,
            city,
            lat,
            lng,
            distance
          };
        });

        // Deduplication
        const uniqueResults: AddressResult[] = [];
        const seen = new Set<string>();
        for (const r of results) {
          if (!r.street) continue;
          const key = `${r.street}|${r.zip_code || ''}|${r.city}`.toLowerCase();
          if (!seen.has(key)) {
            uniqueResults.push(r);
            seen.add(key);
          }
        }

        // Check against display_name too — catches Oldenburg when city field is tricky
        const oldenburgResults = uniqueResults.filter(
          (r) =>
            (r.city || '').toLowerCase().includes('oldenburg') ||
            r.address.toLowerCase().includes('oldenburg')
        );
        const nearbyResults = uniqueResults.filter(
          (r) => !oldenburgResults.includes(r)
        );

        nearbyResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        const finalResults =
          oldenburgResults.length > 0
            ? [...oldenburgResults, ...nearbyResults]
            : nearbyResults;

        setSuggestions(finalResults.slice(0, 15));
        if (finalResults.length > 0) setOpen(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelect = (result: AddressResult) => {
    onChange(result);
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
