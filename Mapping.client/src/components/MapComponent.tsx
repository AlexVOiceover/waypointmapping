import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polyline } from '@react-google-maps/api';
// @ts-expect-error - JS file without types
import { validateAndCorrectCoordinates } from '../services/JSFunctions';
import FlightParametersPanel from './FlightParametersPanel';
import MapToolbar from './MapToolbar';
// @ts-expect-error - JSX file without types
import LocationButton from './LocationButton';
// @ts-expect-error - JS file without types
import { useDrawingManager } from '../hooks/useDrawingManager';
import { useWaypointAPI } from '../hooks/useWaypointAPI';
import { MapProvider, useMapContext } from '../context/MapContext';

// Map configuration as static constants to prevent unnecessary reloads
const LIBRARIES: ('drawing' | 'places')[] = ['drawing', 'places'];
const DEFAULT_CENTER = { lat: 60.1699, lng: 24.9384 }; // Helsinki
const DEFAULT_ZOOM = 10;

// DrawingManager options
const DRAWING_MANAGER_OPTIONS = {
  drawingControl: false,
  drawingMode: null,
  rectangleOptions: {
    fillColor: '#2196F3',
    fillOpacity: 0.5,
    strokeWeight: 2,
    clickable: true,
    editable: true,
    zIndex: 1,
  },
  circleOptions: {
    fillColor: '#FF9800',
    fillOpacity: 0.5,
    strokeWeight: 2,
    clickable: true,
    editable: true,
    zIndex: 1,
  },
  polylineOptions: {
    strokeColor: '#FF0000',
    strokeWeight: 2,
    clickable: true,
    editable: true,
    zIndex: 1,
  },
};

interface MapInnerProps {
  inputRef: React.RefObject<HTMLInputElement>;
  downloadLinkRef: React.RefObject<HTMLAnchorElement>;
  mapInstance: google.maps.Map | null;
  setLatitude: (lat: string) => void;
  setLongitude: (lng: string) => void;
}

interface Coordinate {
  Lat: number;
  Lng: number;
  lat?: number;
  lng?: number;
  radius?: number;
  Radius?: number;
}

const MapInner: React.FC<MapInnerProps> = ({ inputRef, downloadLinkRef, mapInstance, setLatitude, setLongitude }) => {
  const {
    path,
    setPath,
    clearAll,
    flightParams,
    bounds,
    boundsType,
    selectedShape
  } = useMapContext();
  const { onDrawingManagerLoad, onDrawingComplete, enableDrawingMode, stopDrawing, parseShapeBounds } = useDrawingManager();
  const { generateWaypointsFromAPI, generateKml } = useWaypointAPI();
  const [startingIndex, setStartingIndex] = useState(1);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const handleDrawRectangle = useCallback(() => {
    enableDrawingMode('rectangle');
  }, [enableDrawingMode]);

  const handleDrawCircle = useCallback(() => {
    enableDrawingMode('circle');
  }, [enableDrawingMode]);

  const handleDrawPolyline = useCallback(() => {
    enableDrawingMode('polyline');
  }, [enableDrawingMode]);

  const handleStopDrawing = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleDrawingManagerLoad = (drawingManager: google.maps.drawing.DrawingManager) => {
    onDrawingManagerLoad(drawingManager);
  };

  const handleOverlayComplete = (overlay: google.maps.drawing.OverlayCompleteEvent) => {
    onDrawingComplete(overlay);
  };

  const handleGenerateWaypoints = async () => {
    if (!bounds) {
      alert('No bounds defined. Please draw a shape first.');
      return;
    }

    if (!boundsType) {
      alert('No bounds type defined. Please draw a shape first.');
      return;
    }

    // Validate coordinates based on bounds type
    let validCoordinates: Coordinate[];
    try {
      if (boundsType === "rectangle" || boundsType === "polyline") {
        validCoordinates = validateAndCorrectCoordinates(bounds);
      } else if (boundsType === "circle") {
        // For circles, use cached center if available
        if ((window as any).lastCircleCenter) {
          const cached = (window as any).lastCircleCenter;
          validCoordinates = [{
            Lat: cached.lat,
            Lng: cached.lng,
            lat: cached.lat,
            lng: cached.lng,
            radius: cached.radius,
            Radius: cached.radius
          }];
        } else {
          // Parse from bounds as fallback
          const circleData = parseShapeBounds(bounds, boundsType);

          if (!circleData || !circleData.lat || !circleData.lng) {
            alert('Error: Failed to determine circle center coordinates. Please try drawing the circle again.');
            return;
          }

          validCoordinates = [{
            Lat: circleData.lat,
            Lng: circleData.lng,
            lat: circleData.lat,
            lng: circleData.lng,
            radius: circleData.radius,
            Radius: circleData.radius
          }];
        }
      } else {
        validCoordinates = parseShapeBounds(bounds, boundsType);
      }

      if (!validCoordinates || !Array.isArray(validCoordinates) || validCoordinates.length === 0) {
        throw new Error('Failed to parse coordinates from bounds');
      }

      // Normalize coordinate format
      validCoordinates = validCoordinates.map(coord => {
        const newCoord: Coordinate = {
          Lat: Number(coord.Lat || coord.lat || 0),
          Lng: Number(coord.Lng || coord.lng || 0)
        };

        if (boundsType === "circle") {
          newCoord.radius = Number(coord.radius || coord.Radius || 0);
          newCoord.Radius = Number(coord.radius || coord.Radius || 0);
        }

        return newCoord;
      });

    } catch (error) {
      console.error('Error parsing coordinates:', error);
      alert(`Error parsing coordinates: ${(error as Error).message}`);
      return;
    }

    const flightParameters = flightParams.getFlightParameters();

    const requestData = {
      Bounds: validCoordinates,
      BoundsType: String(boundsType || ''),
      StartingIndex: Number(startingIndex || 1),
      Altitude: Number(flightParameters.altitude || 60),
      Speed: Number(flightParameters.speed || 2.5),
      Angle: Number(flightParameters.angle || -45),
      PhotoInterval: Number(flightParameters.interval || 2),
      Overlap: Number(flightParameters.overlap || 80),
      LineSpacing: Number(flightParameters.inDistance || 10),
      IsNorthSouth: flightParameters.isNorthSouth === true,
      isNorthSouth: flightParameters.isNorthSouth === true,
      UseEndpointsOnly: flightParameters.useEndpointsOnly === true,
      useEndpointsOnly: flightParameters.useEndpointsOnly === true,
      AllPointsAction: String(flightParameters.allPointsAction || 'noAction'),
      FinalAction: String(flightParameters.finalAction || '0'),
      FlipPath: Boolean(flightParameters.flipPath),
      UnitType: Number(flightParameters.unitType || 0)
    };

    // Test JSON serialization before sending
    try {
      JSON.stringify(requestData);
    } catch (jsonError) {
      console.error('Cannot serialize request data:', jsonError);
      alert('Error: Cannot serialize waypoint data. Please try again with a simpler shape.');
      return;
    }

    try {
      const response = await generateWaypointsFromAPI(requestData);

      if (response && Array.isArray(response) && response.length > 0) {
        setStartingIndex(prev => prev + 1);

        if (selectedShape) {
          // Keep shape on map for reference
        }
      }
    } catch (error) {
      console.error('Generate waypoints error:', error);
      alert('Error generating waypoints: ' + ((error as Error).message || error));
    }
  };

  const handleGenerateKml = useCallback(() => {
    generateKml(downloadLinkRef);
  }, [generateKml, downloadLinkRef]);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.drawing) {
      setGoogleLoaded(true);
    }
  }, []);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newPoint = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setPath((prevPath) => [...prevPath, newPoint]);
    }
  }, [setPath]);

  useEffect(() => {
    if (mapInstance) {
      mapInstance.addListener('click', handleMapClick);
    }
  }, [mapInstance, handleMapClick]);

  // Setup Place Autocomplete Element (modern web component approach)
  useEffect(() => {
    if (!mapInstance || !inputRef.current) {
      console.log('Autocomplete init skipped - missing mapInstance or inputRef');
      return;
    }

    console.log('Initializing PlaceAutocompleteElement...');

    // Use the new PlaceAutocompleteElement
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

            // Update ref to point to new element
            (inputRef as any).current = autocompleteElement;

            // Handler function for place selection using the NEW gmp-select event
            const handlePlaceSelect = async (event: any) => {
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

                // Update latitude and longitude fields
                const lat = place.location.lat();
                const lng = place.location.lng();
                setLatitude(lat.toFixed(6));
                setLongitude(lng.toFixed(6));
                console.log('✅ Updated lat/lng fields:', lat, lng);

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
  }, [mapInstance]);

  return (
    <>
      <LocationButton
        map={mapInstance}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
      />
      {path.length > 0 && (
        <Polyline
          path={path}
          options={{ strokeColor: '#FF0000', strokeWeight: 2 }}
        />
      )}

      {googleLoaded && window.google && window.google.maps && window.google.maps.drawing && (
        <DrawingManager
          onLoad={handleDrawingManagerLoad}
          onOverlayComplete={handleOverlayComplete}
          options={DRAWING_MANAGER_OPTIONS}
        />
      )}

      <MapToolbar
        onStopDrawing={handleStopDrawing}
        onGenerateWaypoints={handleGenerateWaypoints}
        onGenerateKml={handleGenerateKml}
        onDrawRectangle={handleDrawRectangle}
        onDrawCircle={handleDrawCircle}
        onDrawPolyline={handleDrawPolyline}
        onClearShapes={clearAll}
        startingIndex={startingIndex}
      />
    </>
  );
};

const MapComponent: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleCenterByCoordinates = useCallback(() => {
    if (!mapInstance || !latitude || !longitude) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    mapInstance.setCenter({ lat, lng });
    mapInstance.setZoom(15);
  }, [mapInstance, latitude, longitude]);

  if (loadError) {
    return <div className="flex items-center justify-center h-screen">Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading map...</div>;
  }

  return (
    <MapProvider>
      <div className="flex h-screen">
        <div className="w-1/4 p-4 bg-gray-100 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Drone Flight Planner</h2>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a location"
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />

          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Or enter coordinates:</div>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded text-sm min-w-0"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded text-sm min-w-0"
              />
            </div>
            <button
              onClick={handleCenterByCoordinates}
              disabled={!latitude || !longitude}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Center Map
            </button>
          </div>

          <a ref={downloadLinkRef} style={{ display: 'none' }}>Download KML</a>
          <FlightParametersPanel />
        </div>
        <div className="w-3/4">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={handleMapLoad}
            options={{
              zoomControl: true,
              mapTypeControl: true,
              mapTypeControlOptions: {
                position: window.google?.maps?.ControlPosition?.TOP_LEFT || 1,
                style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU || 1,
              },
              scaleControl: true,
              streetViewControl: true,
              rotateControl: true,
              fullscreenControl: true,
              disableDefaultUI: false
            }}
          >
            <MapInner
              inputRef={inputRef}
              downloadLinkRef={downloadLinkRef}
              mapInstance={mapInstance}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />
          </GoogleMap>
        </div>
      </div>
    </MapProvider>
  );
};

export default MapComponent;
