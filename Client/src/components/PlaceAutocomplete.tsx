import { useEffect, useRef } from 'react';

interface PlaceAutocompleteSelectEvent extends Event {
  placePrediction: google.maps.places.PlacePrediction;
}

interface PlaceAutocompleteProps {
  mapInstance: google.maps.Map | null;
  className?: string;
  onPlaceSelect?: (lat: number, lng: number) => void;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  mapInstance,
  className = '',
  onPlaceSelect
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mapInstance || !inputRef.current) {
      console.log('Autocomplete init skipped - missing mapInstance or inputRef');
      return;
    }

    console.log('Initializing PlaceAutocompleteElement...');

    const initPlaceAutocomplete = async () => {
      try {
        console.log('Loading places library...');
        // @ts-expect-error - PlaceAutocompleteElement is not in the standard types
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        console.log('Places library loaded, PlaceAutocompleteElement:', PlaceAutocompleteElement);

        if (PlaceAutocompleteElement && inputRef.current) {
          console.log('Creating PlaceAutocompleteElement...');
          const autocompleteElement = new PlaceAutocompleteElement();
          console.log('PlaceAutocompleteElement created:', autocompleteElement);

          // Replace the input with the autocomplete element
          const parentElement = inputRef.current.parentElement;
          if (parentElement) {
            // Copy classes from original input
            autocompleteElement.className = inputRef.current.className;
            autocompleteElement.setAttribute('placeholder', 'Search for a location');

            console.log('Replacing input with autocomplete element...');
            // Replace input with autocomplete element
            parentElement.replaceChild(autocompleteElement, inputRef.current);

            // Store reference for cleanup
            elementRef.current = autocompleteElement;

            // Handler function for place selection using the NEW gmp-select event
            const handlePlaceSelect = async (event: PlaceAutocompleteSelectEvent) => {
              console.log('✅ Place selected event fired!', event);

              // New API uses placePrediction instead of place
              const placePrediction = event.placePrediction;
              console.log('Place prediction:', placePrediction);

              if (!placePrediction) {
                console.error('❌ No placePrediction found in event');
                return;
              }

              try {
                // Convert placePrediction to Place object
                console.log('Converting placePrediction to Place...');
                const place = placePrediction.toPlace();
                console.log('Place object:', place);

                // Fetch fields to get location data
                console.log('Fetching place fields...');
                await place.fetchFields({
                  fields: ['location', 'viewport', 'displayName', 'formattedAddress']
                });

                console.log('After fetchFields - location:', place.location);
                console.log('After fetchFields - viewport:', place.viewport);

                if (!place.location) {
                  console.error("❌ No location found for place after fetch");
                  return;
                }

                // Update latitude and longitude via callback
                const lat = place.location.lat();
                const lng = place.location.lng();
                if (onPlaceSelect) {
                  onPlaceSelect(lat, lng);
                }
                console.log('✅ Updated lat/lng:', lat, lng);

                // Center map on the selected place
                console.log('✅ Setting center to:', place.location);
                mapInstance.setCenter(place.location);

                // Zoom in if it's a specific location, zoom out if it's a large area
                if (place.viewport) {
                  console.log('✅ Fitting bounds to viewport');
                  mapInstance.fitBounds(place.viewport);
                } else {
                  console.log('✅ Setting zoom to 15');
                  mapInstance.setZoom(15);
                }
              } catch (error) {
                console.error('❌ Error handling place selection:', error);
              }
            };

            console.log('Adding gmp-select event listener (new API)...');
            // Use the NEW gmp-select event (replaces gmp-placeselect)
            autocompleteElement.addEventListener('gmp-select', handlePlaceSelect);

            // Log the element for debugging
            console.log('Autocomplete element:', autocompleteElement);

            console.log('✅ PlaceAutocompleteElement setup complete!');
          }
        }
      } catch (error) {
        console.error('❌ Error in initPlaceAutocomplete:', error);
        throw error;
      }
    };

    initPlaceAutocomplete().catch(error => {
      console.error('❌ PlaceAutocompleteElement failed:', error);
    });

    // Cleanup function
    return () => {
      if (elementRef.current) {
        elementRef.current.remove();
        elementRef.current = null;
      }
    };
  }, [mapInstance, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search for a location"
      className={className}
    />
  );
};
