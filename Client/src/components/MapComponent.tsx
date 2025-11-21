import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { validateAndCorrectCoordinates } from '../services/JSFunctions';
import FlightParametersPanel from './FlightParametersPanel';
import MapToolbar from './MapToolbar';
import LocationButton from './LocationButton';
import { useWaypointAPI } from '../hooks/useWaypointAPI';
import { MapProvider, useMapContext } from '../context/MapContext';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Map configuration as static constants to prevent unnecessary reloads
const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];
const DEFAULT_CENTER = { lat: 51.556437, lng: -0.110961 };
const DEFAULT_ZOOM = 20; // Approximately 50m scale at equator

// Shape styling options
const RECTANGLE_OPTIONS = {
  fillColor: '#2196F3',
  fillOpacity: 0.5,
  strokeWeight: 2,
  strokeColor: '#2196F3',
  clickable: true,
  editable: true,
  zIndex: 1,
};

const CIRCLE_OPTIONS = {
  fillColor: '#FF9800',
  fillOpacity: 0.5,
  strokeWeight: 2,
  strokeColor: '#FF9800',
  clickable: true,
  editable: true,
  zIndex: 1,
};

const POLYLINE_OPTIONS = {
  strokeColor: '#FF0000',
  strokeWeight: 2,
  clickable: true,
  editable: true,
  zIndex: 1,
};

interface MapInnerProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLElement>;
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

interface CircleCenter {
  lat: number;
  lng: number;
  radius: number;
}

interface PlaceAutocompleteSelectEvent extends Event {
  placePrediction: google.maps.places.PlacePrediction;
}

type ShapeType = google.maps.Rectangle | google.maps.Circle | google.maps.Polyline;

const MapInner: React.FC<MapInnerProps> = ({ inputRef, downloadLinkRef, mapInstance, setLatitude, setLongitude }) => {
  const {
    path,
    clearAll,
    clearWaypoints,
    flightParams,
    bounds,
    boundsType,
    selectedShape,
    setBounds,
    setBoundsType,
    setShapes,
    setSelectedShape,
    mapRef,
    genInfoWindowRef
  } = useMapContext();
  const { generateWaypointsFromAPI, generateKml } = useWaypointAPI();
  const [startingIndex, setStartingIndex] = useState(1);
  const [isProbeHeightActive, setIsProbeHeightActive] = useState(false);
  const [activeDrawingMode, setActiveDrawingMode] = useState<string | null>(null);
  const elevatorServiceRef = useRef<google.maps.ElevationService | null>(null);
  const probeMarkersRef = useRef<google.maps.Marker[]>([]);

  // Update mapRef when mapInstance changes
  useEffect(() => {
    if (mapInstance) {
      mapRef.current = mapInstance;
      console.log('mapRef updated with mapInstance');
    }
  }, [mapInstance, mapRef]);

  // Initialize info window ref
  useEffect(() => {
    if (!genInfoWindowRef.current && mapInstance) {
      genInfoWindowRef.current = new window.google.maps.InfoWindow();
      console.log('InfoWindow initialized');
    }
  }, [mapInstance, genInfoWindowRef]);

  // Drawing state for custom shapes
  const [drawingPoints, setDrawingPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [rectangleStart, setRectangleStart] = useState<google.maps.LatLngLiteral | null>(null);
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const previewRectangleRef = useRef<google.maps.Rectangle | null>(null);

  // Custom drawing handlers
  const stopDrawing = useCallback(() => {
    setActiveDrawingMode(null);
    setDrawingPoints([]);
    setRectangleStart(null);
    setCircleCenter(null);
  }, []);

  const handleDrawRectangle = useCallback(() => {
    console.log('Rectangle drawing started - deactivating probe height');
    setIsProbeHeightActive(false);
    setActiveDrawingMode('rectangle');
    setDrawingPoints([]);
    setRectangleStart(null);
  }, []);

  const handleDrawCircle = useCallback(() => {
    console.log('Circle drawing started - deactivating probe height');
    setIsProbeHeightActive(false);
    setActiveDrawingMode('circle');
    setDrawingPoints([]);
    setCircleCenter(null);
  }, []);

  const handleDrawPolyline = useCallback(() => {
    console.log('Polyline drawing started - deactivating probe height');
    setIsProbeHeightActive(false);
    setActiveDrawingMode('polyline');
    setDrawingPoints([]);
  }, []);

  const handleStopDrawing = useCallback(() => {
    // If we're in polyline mode with points, complete the polyline
    if (activeDrawingMode === 'polyline' && drawingPoints.length >= 2) {
      console.log('Polyline: Completing with', drawingPoints.length, 'points');

      const pathCoordinates = drawingPoints.map(p => `${p.lat},${p.lng}`).join(';');
      setBounds(pathCoordinates);
      setBoundsType('polyline');

      // Create polyline overlay
      const polyline = new window.google.maps.Polyline({
        path: drawingPoints,
        ...POLYLINE_OPTIONS,
        map: mapInstance
      });

      setShapes((prev: ShapeType[]) => [...prev, polyline]);
      setSelectedShape(polyline);
    }

    stopDrawing();
  }, [stopDrawing, activeDrawingMode, drawingPoints, mapInstance, setBounds, setBoundsType, setShapes, setSelectedShape]);

  const handleProbeHeight = useCallback(() => {
    const newState = !isProbeHeightActive;
    console.log('Probe Height toggled. New state:', newState);

    if (newState) {
      console.log('Activating probe height - stopping drawing mode');
      setActiveDrawingMode(null);
      stopDrawing();
    }

    setIsProbeHeightActive(newState);
  }, [isProbeHeightActive, stopDrawing]);

  const handleClearProbeMarkers = useCallback(() => {
    console.log('Clearing all probe height markers');
    // Remove all stored markers from map
    probeMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    // Clear the array
    probeMarkersRef.current = [];
    console.log('Probe height markers cleared');
  }, []);

  // Helper function to parse shape bounds
  const parseShapeBounds = useCallback((boundsStr: string, type: string) => {
    if (!boundsStr) return [];

    if (type === 'rectangle' || type === 'polyline') {
      return boundsStr.split(';').map(coord => {
        const [lat, lng] = coord.trim().split(',').map(Number);
        return { Lat: lat, Lng: lng };
      });
    } else if (type === 'circle') {
      const parts = boundsStr.split(';');
      const [lat, lng] = parts[0].split(',').map(Number);
      const radiusMatch = parts[1].match(/radius:\s*([\d.]+)/);
      const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 0;
      return [{ Lat: lat, Lng: lng, radius, Radius: radius }];
    }
    return [];
  }, []);

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
        const coords = validateAndCorrectCoordinates(bounds);
        if (!coords) {
          throw new Error('Failed to validate coordinates');
        }
        validCoordinates = coords;
      } else if (boundsType === "circle") {
        // For circles, use cached center if available
        const windowWithCircle = window as unknown as Window & { lastCircleCenter: CircleCenter };
        if (windowWithCircle.lastCircleCenter) {
          const cached = windowWithCircle.lastCircleCenter;
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
          const circleDataArray = parseShapeBounds(bounds, boundsType);

          if (!circleDataArray || circleDataArray.length === 0) {
            alert('Error: Failed to determine circle center coordinates. Please try drawing the circle again.');
            return;
          }

          const circleData = circleDataArray[0];
          if (!circleData || typeof circleData.Lat !== 'number' || typeof circleData.Lng !== 'number') {
            alert('Error: Failed to determine circle center coordinates. Please try drawing the circle again.');
            return;
          }

          validCoordinates = [{
            Lat: circleData.Lat,
            Lng: circleData.Lng,
            lat: circleData.Lat,
            lng: circleData.Lng,
            radius: ('radius' in circleData) ? circleData.radius : 0,
            Radius: ('Radius' in circleData) ? circleData.Radius : 0
          }];
        }
      } else {
        validCoordinates = parseShapeBounds(bounds, String(boundsType));
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error parsing coordinates: ${errorMessage}`);
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
      AllPointsAction: String(flightParameters.allPointsAction || 'takePhoto'),
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Error generating waypoints: ' + errorMessage);
    }
  };

  const handleGenerateKml = useCallback(() => {
    generateKml(downloadLinkRef);
  }, [generateKml, downloadLinkRef]);

  useEffect(() => {
    if (window.google && window.google.maps) {
      // Initialize Elevation Service
      if (!elevatorServiceRef.current) {
        elevatorServiceRef.current = new window.google.maps.ElevationService();
      }
    }
  }, []);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const clickPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    console.log('Map clicked. Probe height active:', isProbeHeightActive, 'Drawing mode:', activeDrawingMode);

    // If probe height mode is active, get elevation
    if (isProbeHeightActive && elevatorServiceRef.current) {
      console.log('Probe height mode - fetching elevation');
      elevatorServiceRef.current.getElevationForLocations(
        { locations: [clickPoint] },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const elevation = results[0].elevation;
            const elevationMeters = elevation.toFixed(2);
            const elevationFeet = (elevation * 3.28084).toFixed(2);

            // Create a marker with elevation label
            const marker = new window.google.maps.Marker({
              position: clickPoint,
              map: mapInstance,
              title: `Elevation: ${elevationMeters}m (${elevationFeet}ft)`,
              label: {
                text: `${elevationMeters}m`,
                color: '#000000',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Arial Black, Arial, sans-serif',
              },
            });

            // Store marker for cleanup
            probeMarkersRef.current.push(marker);
          } else {
            console.error('Elevation service failed:', status);
            alert('Unable to retrieve elevation data. Status: ' + status);
          }
        }
      );
      return;
    }

    // Handle custom drawing modes
    if (activeDrawingMode === 'rectangle') {
      if (!rectangleStart) {
        // First click - set start corner
        console.log('Rectangle: First corner set');
        setRectangleStart(clickPoint);
      } else {
        // Second click - complete rectangle
        console.log('Rectangle: Second corner set, completing shape');

        // Create bounds with proper corner order (southwest and northeast)
        const sw = new window.google.maps.LatLng(
          Math.min(rectangleStart.lat, clickPoint.lat),
          Math.min(rectangleStart.lng, clickPoint.lng)
        );
        const ne = new window.google.maps.LatLng(
          Math.max(rectangleStart.lat, clickPoint.lat),
          Math.max(rectangleStart.lng, clickPoint.lng)
        );
        const bounds = new window.google.maps.LatLngBounds(sw, ne);

        const nw = new window.google.maps.LatLng(ne.lat(), sw.lng());
        const se = new window.google.maps.LatLng(sw.lat(), ne.lng());

        const coordinates = `${ne.lat()},${ne.lng()};${se.lat()},${se.lng()};${sw.lat()},${sw.lng()};${nw.lat()},${nw.lng()}`;
        setBounds(coordinates);
        setBoundsType('rectangle');

        // Create rectangle overlay
        const rectangle = new window.google.maps.Rectangle({
          bounds: bounds,
          ...RECTANGLE_OPTIONS,
          map: mapInstance
        });

        setShapes((prev: ShapeType[]) => [...prev, rectangle]);
        setSelectedShape(rectangle);

        // Clean up preview rectangle
        if (previewRectangleRef.current) {
          previewRectangleRef.current.setMap(null);
          previewRectangleRef.current = null;
        }

        setRectangleStart(null);
        setActiveDrawingMode(null);
        return; // Important: return here to prevent adding to path
      }
      return;
    }

    if (activeDrawingMode === 'circle') {
      if (!circleCenter) {
        // First click - set center
        console.log('Circle: Center set');
        setCircleCenter(clickPoint);
      } else {
        // Second click - complete circle
        console.log('Circle: Radius set, completing shape');
        const radius = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(circleCenter.lat, circleCenter.lng),
          new window.google.maps.LatLng(clickPoint.lat, clickPoint.lng)
        );

        const coordinates = `${circleCenter.lat},${circleCenter.lng}; radius: ${radius.toFixed(2)}`;
        setBounds(coordinates);
        setBoundsType('circle');

        // Cache center for later use
        const windowWithCircleCenter = window as unknown as Window & { lastCircleCenter: CircleCenter };
        windowWithCircleCenter.lastCircleCenter = {
          lat: circleCenter.lat,
          lng: circleCenter.lng,
          radius: radius
        };

        // Create circle overlay
        const circle = new window.google.maps.Circle({
          center: circleCenter,
          radius: radius,
          ...CIRCLE_OPTIONS,
          map: mapInstance
        });

        setShapes((prev: ShapeType[]) => [...prev, circle]);
        setSelectedShape(circle);
        setCircleCenter(null);
        setActiveDrawingMode(null);
      }
      return;
    }

    if (activeDrawingMode === 'polyline') {
      // Add point to polyline
      console.log('Polyline: Adding point');
      setDrawingPoints((prev) => [...prev, clickPoint]);
      return;
    }

    // Don't add points to path by default - only through explicit drawing tools
  }, [isProbeHeightActive, mapInstance, activeDrawingMode, rectangleStart, circleCenter, setBounds, setBoundsType, setShapes, setSelectedShape]);

  useEffect(() => {
    if (!mapInstance) return;

    const clickListener = mapInstance.addListener('click', handleMapClick);

    // Add mouse move listener for rectangle preview
    const mouseMoveListener = mapInstance.addListener('mousemove', (event: google.maps.MapMouseEvent) => {
      if (activeDrawingMode === 'rectangle' && rectangleStart && event.latLng) {
        const currentPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };

        // Create bounds with proper corner order (southwest and northeast)
        const sw = new window.google.maps.LatLng(
          Math.min(rectangleStart.lat, currentPoint.lat),
          Math.min(rectangleStart.lng, currentPoint.lng)
        );
        const ne = new window.google.maps.LatLng(
          Math.max(rectangleStart.lat, currentPoint.lat),
          Math.max(rectangleStart.lng, currentPoint.lng)
        );
        const bounds = new window.google.maps.LatLngBounds(sw, ne);

        // Update or create preview rectangle
        if (previewRectangleRef.current) {
          previewRectangleRef.current.setBounds(bounds);
        } else {
          previewRectangleRef.current = new window.google.maps.Rectangle({
            bounds: bounds,
            fillColor: '#2196F3',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#2196F3',
            map: mapInstance,
            editable: false,
            clickable: false,
            zIndex: 0,
          });
        }
      }
    });

    // Cleanup function to remove listeners when dependencies change
    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
      if (mouseMoveListener) {
        window.google.maps.event.removeListener(mouseMoveListener);
      }
      if (previewRectangleRef.current) {
        previewRectangleRef.current.setMap(null);
        previewRectangleRef.current = null;
      }
    };
  }, [mapInstance, handleMapClick, activeDrawingMode, rectangleStart]);

  // Change cursor when probe height or drawing modes are active
  useEffect(() => {
    if (mapInstance) {
      const mapDiv = mapInstance.getDiv();
      const shouldShowCrosshair = isProbeHeightActive || activeDrawingMode !== null;

      if (shouldShowCrosshair) {
        console.log('Setting cursor to crosshair');
        mapDiv.style.setProperty('cursor', 'crosshair', 'important');

        const allElements = mapDiv.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            el.style.setProperty('cursor', 'crosshair', 'important');
          }
        });
      } else {
        console.log('Resetting cursor to default');
        mapDiv.style.removeProperty('cursor');

        const allElements = mapDiv.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            el.style.removeProperty('cursor');
          }
        });
      }
    }
  }, [mapInstance, isProbeHeightActive, activeDrawingMode]);

  // Keyboard support for completing polyline
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeDrawingMode === 'polyline' && drawingPoints.length >= 2) {
        console.log('Enter pressed - completing polyline');
        handleStopDrawing();
      }
      if (e.key === 'Escape' && activeDrawingMode) {
        console.log('Escape pressed - canceling drawing');
        stopDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeDrawingMode, drawingPoints, handleStopDrawing, stopDrawing]);

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
            (inputRef as React.MutableRefObject<HTMLElement | HTMLInputElement>).current = autocompleteElement;

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
  }, [mapInstance, inputRef, setLatitude, setLongitude]);

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

      {/* Render temporary drawing indicators */}
      {activeDrawingMode === 'circle' && circleCenter && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          Click to set radius
        </div>
      )}

      {activeDrawingMode === 'polyline' && drawingPoints.length > 0 && (
        <>
          <Polyline
            path={drawingPoints}
            options={{ ...POLYLINE_OPTIONS, strokeOpacity: 0.6 }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            Click to add points • Enter to finish • Esc to cancel
          </div>
        </>
      )}

      <MapToolbar
        onStopDrawing={handleStopDrawing}
        onGenerateWaypoints={handleGenerateWaypoints}
        onGenerateKml={handleGenerateKml}
        onDrawRectangle={handleDrawRectangle}
        onDrawCircle={handleDrawCircle}
        onDrawPolyline={handleDrawPolyline}
        onClearShapes={clearAll}
        onClearWaypoints={clearWaypoints}
        onProbeHeight={handleProbeHeight}
        onClearProbeHeight={handleClearProbeMarkers}
        isProbeHeightActive={isProbeHeightActive}
        activeDrawingMode={activeDrawingMode}
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
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState<boolean>(true);

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
      <div className="h-screen relative">
        {/* Collapsible Side Panel - using absolute positioning with natural height */}
        <div className={`absolute left-0 top-0 transition-all duration-300 ease-in-out z-40 overflow-hidden ${isPanelCollapsed ? 'w-0' : 'w-60'}`}>
          <div className="w-60 bg-white shadow-lg border-r border-gray-300 flex flex-col">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0">
              <h2 className="font-semibold text-gray-900">Drone Flight Planner</h2>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Hide panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Content sections */}
            <div className="max-h-[calc(100vh-60px)] overflow-y-auto discreet-scrollbar-left">
              {/* Search and Coordinates Section */}
              <div className="bg-cyan-50 border-2 border-cyan-300 p-4">
                <button
                  onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                  className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-cyan-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-gray-900">Location</span>
                  </div>
                  {isLocationExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>

                {isLocationExpanded && <div className="flex flex-col gap-3 pt-3">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for a location"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">Coordinates:</div>
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
                      className="w-full p-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Center Map
                    </button>
                  </div>
                </div>}
              </div>

              {/* Flight Parameters Panel */}
              <a ref={downloadLinkRef} style={{ display: 'none' }}>Download KML</a>
              <FlightParametersPanel />
            </div>
          </div>
        </div>

        {/* Expand Button - shown when panel is collapsed */}
        {isPanelCollapsed && (
          <button
            onClick={() => setIsPanelCollapsed(false)}
            className="absolute left-0 top-0 z-50 bg-gray-100 hover:bg-gray-200 p-3 rounded-r-lg shadow-lg transition-colors border border-l-0 border-gray-300"
            title="Expand panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="w-full h-full">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={handleMapLoad}
            options={{
              zoomControl: true,
              mapTypeControl: true,
              mapTypeControlOptions: {
                position: window.google?.maps?.ControlPosition?.TOP_CENTER || 2,
                style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU || 1,
              },
              scaleControl: true,
              streetViewControl: true,
              rotateControl: true,
              fullscreenControl: false,
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
