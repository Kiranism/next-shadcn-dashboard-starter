'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from 'use-places-autocomplete';
import SearchButton from './Buttons/SearchButton';
import type { IJobLocation } from '@/types/query.types';

interface AllJobsSearchProps {
  onSearch: (params: {
    search: string;
    coordinates?: [number, number];
  }) => void;
  onClear?: () => void;
  initialSearch?: string;
  initialLocation?: string;
}

const AllJobsSearch = ({
  onSearch,
  onClear,
  initialSearch = '',
  initialLocation = ''
}: AllJobsSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [location, setLocation] = useState<IJobLocation | null>(null);

  const {
    ready,
    value: locationValue,
    setValue: setLocationValue,
    suggestions: { status, data: locationSuggestions },
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
    defaultValue: initialLocation
  });

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setLocationValue(initialLocation);
    // Reset location state when initialLocation changes
    if (!initialLocation) {
      setLocation(null);
    }
  }, [initialLocation, setLocationValue]);

  const handleLocationSelect = async (address: string) => {
    setLocationValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = getLatLng(results[0]);
      const addressComponents = results[0].address_components;

      // Define a type for address components
      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      const city =
        addressComponents.find((c: AddressComponent) =>
          c.types.includes('locality')
        )?.long_name || '';
      const state =
        addressComponents.find((c: AddressComponent) =>
          c.types.includes('administrative_area_level_1')
        )?.long_name || '';
      const country =
        addressComponents.find((c: AddressComponent) =>
          c.types.includes('country')
        )?.long_name || '';

      setLocation({
        type: 'Point',
        coordinates: [lng, lat], // Note: API expects [longitude, latitude]
        formattedAddress: address,
        city,
        state,
        country
      });
    } catch (error) {
      toast.error('Failed to get location details');
      // Log error in development only
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Error selecting location:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const searchParams: { search: string; coordinates?: [number, number] } = {
      search: searchTerm
    };

    if (location && location.coordinates) {
      // Ensure coordinates are numbers and in the correct format [longitude, latitude]
      searchParams.coordinates = [
        Number(location.coordinates[0]),
        Number(location.coordinates[1])
      ] as [number, number];
    }

    onSearch(searchParams);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setLocationValue('');
    setLocation(null);
    clearSuggestions();

    // Call parent's onClear if provided
    if (onClear) {
      onClear();
    }
  };

  //   const handleClearSearch = () => {
  //     setSearchTerm('');
  //     // Don't clear location, just search term
  //   };

  //   const handleClearLocation = () => {
  //     setLocationValue('');
  //     setLocation(null);
  //     clearSuggestions();
  //     // Don't clear search term, just location
  //   };

  return (
    <form onSubmit={handleSubmit}>
      <div className='mb-4 grid w-full grid-cols-3 space-y-4 gap-x-10 rounded-xl bg-white p-4 shadow-xl sm:space-y-0 sm:rounded-full'>
        <div className='relative flex w-full items-center space-x-2'>
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='22'
              height='22'
              fill='none'
              viewBox='0 0 22 22'
            >
              <path
                stroke='#737373'
                strokeWidth='1.6'
                d='M10.5 20a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z'
              ></path>
              <path
                stroke='#737373'
                strokeLinecap='round'
                strokeWidth='1.6'
                d='M17.5 17.5 21 21'
              ></path>
            </svg>
          </div>
          <input
            type='text'
            className='w-full rounded-full p-2 outline-none placeholder:text-gray-100'
            placeholder='Find job here'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* {searchTerm && (
            <button
              type='button'
              className='absolute right-3'
              onClick={handleClearSearch}
              aria-label='Clear search'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
          )} */}
        </div>
        <div className='relative flex w-full items-center space-x-2'>
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='22'
              fill='none'
              viewBox='0 0 18 22'
            >
              <path
                stroke='#737373'
                strokeWidth='1.6'
                d='M1 9.143C1 4.646 4.582 1 9 1s8 3.646 8 8.143c0 4.462-2.553 9.67-6.537 11.531a3.45 3.45 0 0 1-2.926 0C3.553 18.812 1 13.606 1 9.144z'
              ></path>
              <path
                stroke='#737373'
                strokeWidth='1.6'
                d='M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
              ></path>
            </svg>
          </div>
          <input
            type='text'
            className='w-full rounded-full p-2 outline-none placeholder:text-gray-100'
            placeholder='Australia'
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
            disabled={!ready}
          />
          {/* {locationValue && (
            <button
              type='button'
              className='absolute right-3'
              onClick={handleClearLocation}
              aria-label='Clear location'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
          )} */}
          {status === 'OK' && locationSuggestions.length > 0 && (
            <ul className='absolute top-full left-0 z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white'>
              {locationSuggestions.map(({ place_id, description }) => (
                <li
                  key={place_id}
                  className='cursor-pointer p-2 hover:bg-gray-100'
                  onClick={() => handleLocationSelect(description)}
                >
                  {description}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='flex flex-grow justify-end gap-2'>
          {(searchTerm || locationValue) && (
            <button
              type='button'
              onClick={handleClearAll}
              className='rounded-full border border-gray-300 bg-white px-4 py-3 font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50'
            >
              Clear All
            </button>
          )}
          <SearchButton text='Search' />
        </div>
      </div>
    </form>
  );
};

export default AllJobsSearch;
