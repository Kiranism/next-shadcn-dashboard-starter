'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconSearch, IconMapPin, IconX } from '@tabler/icons-react';

interface SearchBarProps {
  onSearch?: (params: {
    search?: string;
    coordinates?: [number, number];
    maxDistance?: string;
  }) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL search params
  const initialSearch = searchParams.get('search') || '';
  const initialCoordinates = searchParams.get('coordinates')
    ? (searchParams.get('coordinates')?.split(',').map(Number) as [
        number,
        number
      ])
    : undefined;

  // State for search inputs
  const [textSearch, setTextSearch] = useState(initialSearch);
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(
    initialCoordinates
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs for handling clicks outside
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize Places Autocomplete
  const {
    value: locationSearch,
    setValue: setLocationSearch,
    suggestions,
    clearSuggestions,
    getPlaceDetails
  } = usePlacesAutocomplete();

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle location suggestion selection
  const handleSelectLocation = async (placeId: string, description: string) => {
    setShowSuggestions(false);
    setLocationSearch(description);

    const placeDetails = await getPlaceDetails(placeId);
    if (
      placeDetails &&
      placeDetails.geometry &&
      placeDetails.geometry.location
    ) {
      const lat = placeDetails.geometry.location.lat();
      const lng = placeDetails.geometry.location.lng();
      setCoordinates([lng, lat]);
    }

    clearSuggestions();
  };

  // Handle search submission
  const handleSearch = () => {
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    // Update search params
    if (textSearch) {
      params.set('search', textSearch);
    } else {
      params.delete('search');
    }

    if (coordinates) {
      params.set('coordinates', coordinates.join(','));
      params.set('maxDistance', '50'); // Always set maxDistance to 50 as per requirements
    } else {
      params.delete('coordinates');
      params.delete('maxDistance');
    }

    // Set page to 1 when searching
    params.set('page', '1');

    // Update URL with search params
    router.push(`?${params.toString()}`);

    // Call onSearch callback if provided
    if (onSearch) {
      // Only include parameters that are actually set
      const searchParams: {
        search?: string;
        coordinates?: [number, number];
        maxDistance?: string;
      } = {};

      if (textSearch) {
        searchParams.search = textSearch;
      }

      if (coordinates) {
        searchParams.coordinates = coordinates;
        searchParams.maxDistance = '50';
      }

      onSearch(searchParams);
    }
  };

  // Clear all search inputs
  const clearSearch = () => {
    setTextSearch('');
    setLocationSearch('');
    setCoordinates(undefined);

    // Update URL by removing search params
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('coordinates');
    params.delete('maxDistance');
    params.set('page', '1'); // Reset to page 1
    router.push(`?${params.toString()}`);

    // Call onSearch callback if provided
    if (onSearch) {
      // Pass an empty object to clear all search parameters
      onSearch({});
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-2 ${className}`}
    >
      <div className='space-4 flex'>
        <div className='flex flex-1 items-center space-x-2'>
          <div className='relative flex-1'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconSearch className='h-5 w-5 text-gray-400' />
            </div>
            <Input
              type='text'
              placeholder='Search recruiters...'
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              className='rounded-md border-0 py-2 pr-10 pl-10 shadow-none focus:border-0 focus:ring-0'
            />
            {textSearch && (
              <button
                type='button'
                className='absolute inset-y-0 right-0 flex items-center pr-3'
                onClick={() => {
                  setTextSearch('');

                  // Update URL by removing search param
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('search');
                  params.set('page', '1'); // Reset to page 1
                  router.push(`?${params.toString()}`);

                  // Call onSearch callback if provided
                  if (onSearch) {
                    // Only include coordinates if they exist
                    const searchParams: {
                      search?: string;
                      coordinates?: [number, number];
                      maxDistance?: string;
                    } = {};

                    if (coordinates) {
                      searchParams.coordinates = coordinates;
                      searchParams.maxDistance = '50';
                    }

                    onSearch(searchParams);
                  }
                }}
              >
                <IconX className='h-5 w-5 text-gray-400' />
              </button>
            )}
          </div>
        </div>

        <div className='relative flex-1' ref={suggestionsRef}>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <IconMapPin className='h-5 w-5 text-gray-400' />
          </div>
          <Input
            type='text'
            placeholder='Search by location...'
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className='rounded-md border-0 py-2 pr-10 pl-10 shadow-none focus:border-0 focus:ring-0'
          />
          {locationSearch && (
            <button
              type='button'
              className='absolute inset-y-0 right-0 flex items-center pr-3'
              onClick={() => {
                setLocationSearch('');
                setCoordinates(undefined);

                // Update URL by removing location search params
                const params = new URLSearchParams(searchParams.toString());
                params.delete('coordinates');
                params.delete('maxDistance');
                params.set('page', '1'); // Reset to page 1
                router.push(`?${params.toString()}`);

                // Call onSearch callback if provided
                if (onSearch) {
                  // Only include search if it exists
                  const searchParams: {
                    search?: string;
                    coordinates?: [number, number];
                    maxDistance?: string;
                  } = {};

                  if (textSearch) {
                    searchParams.search = textSearch;
                  }

                  onSearch(searchParams);
                }
              }}
            >
              <IconX className='h-5 w-5 text-gray-400' />
            </button>
          )}

          {/* Location suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg'>
              <ul className='py-1'>
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className='cursor-pointer px-4 py-2 hover:bg-gray-100'
                    onClick={() =>
                      handleSelectLocation(
                        suggestion.place_id,
                        suggestion.description
                      )
                    }
                  >
                    <div className='flex items-center'>
                      <IconMapPin className='mr-2 h-5 w-5 text-gray-400' />
                      <span>{suggestion.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className='flex space-x-2'>
          <Button
            onClick={handleSearch}
            className='bg-primary hover:bg-primary/90 flex-1 rounded-md text-white'
          >
            Search
          </Button>
          {(textSearch || coordinates) && (
            <Button
              variant='outline'
              onClick={clearSearch}
              className='rounded-md'
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
