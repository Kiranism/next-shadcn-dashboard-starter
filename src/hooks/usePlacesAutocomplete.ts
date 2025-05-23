import { useState, useEffect } from 'react';

interface PlacesAutocompleteProps {
  initialValue?: string;
  debounce?: number;
}

interface PlacesAutocompleteResult {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  suggestions: google.maps.places.AutocompletePrediction[];
  loading: boolean;
  error: string | null;
  clearSuggestions: () => void;
  getPlaceDetails: (
    placeId: string
  ) => Promise<google.maps.places.PlaceResult | null>;
}

const loadGoogleMapsScript = (callback: () => void) => {
  // Check if the script is already loaded
  if (window.google && window.google.maps && window.google.maps.places) {
    callback();
    return;
  }

  // Create the script element
  const googleMapsApiKey = 'AIzaSyCesRg8-LDizp8FO4XuSrtY56F6sUdvW64';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
};

export const usePlacesAutocomplete = ({
  initialValue = '',
  debounce = 300
}: PlacesAutocompleteProps = {}): PlacesAutocompleteResult => {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load Google Maps script and initialize services
  useEffect(() => {
    loadGoogleMapsScript(() => {
      try {
        setAutocompleteService(
          new window.google.maps.places.AutocompleteService()
        );

        // Create a dummy element for PlacesService (it requires a DOM element)
        const dummyElement = document.createElement('div');
        setPlacesService(
          new window.google.maps.places.PlacesService(dummyElement)
        );
      } catch (error) {
        setError('Failed to initialize Google Maps services');
        console.error('Google Maps initialization error:', error);
      }
    });

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, []);

  // Fetch suggestions when value changes
  useEffect(() => {
    if (!value || !autocompleteService) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      setLoading(true);
      autocompleteService.getPlacePredictions(
        {
          input: value,
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          setLoading(false);

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            if (
              status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              setSuggestions([]);
            } else {
              setError(`Places API returned error: ${status}`);
              setSuggestions([]);
            }
            return;
          }

          setSuggestions(predictions);
        }
      );
    }, debounce);

    setDebounceTimeout(timeout);
  }, [value, autocompleteService, debounce]);

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const getPlaceDetails = async (
    placeId: string
  ): Promise<google.maps.places.PlaceResult | null> => {
    if (!placesService) {
      setError('Places service not initialized');
      return null;
    }

    return new Promise((resolve) => {
      placesService.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components']
        },
        (result, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
            setError(`Failed to get place details: ${status}`);
            resolve(null);
            return;
          }

          resolve(result);
        }
      );
    });
  };

  return {
    value,
    setValue,
    suggestions,
    loading,
    error,
    clearSuggestions,
    getPlaceDetails
  };
};
