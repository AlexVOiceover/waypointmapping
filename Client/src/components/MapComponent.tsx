import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { validateAndCorrectCoordinates } from '../services/JSFunctions';
import FlightParametersPanel from './FlightParametersPanel';
import MapToolbar from './MapToolbar';
import LocationButton from './LocationButton';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { DrawingIndicators } from './DrawingIndicators';
import { useWaypointAPI } from '../hooks/useWaypointAPI';
import { useDrawingTools } from '../hooks/useDrawingTools';
import { useProbeHeight } from '../hooks/useProbeHeight';
import { useMapContext } from '../context/MapContext';
import { useShapeContext } from '../context/ShapeContext';
import { useFlightParamsContext } from '../context/FlightParamsContext';
import { AppProviders } from '../context/AppProviders';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Map configuration as static constants to prevent unnecessary reloads
const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];
const DEFAULT_CENTER = { lat: 51.556437, lng: -0.110961 };
const DEFAULT_ZOOM = 20; // Approximately 50m scale at equator

interface MapInnerProps {
  mapInstance: google.maps.Map | null;
  downloadLinkRef: React.RefObject<HTMLAnchorElement>;
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

const MapInner: React.FC<MapInnerProps> = ({ downloadLinkRef, mapInstance, setLatitude, setLongitude }) => {
  // Map context - refs and map-specific functions
  const {
    clearAll,
    clearWaypoints,
    mapRef,
    genInfoWindowRef
  } = useMapContext();

  // Shape context - shapes, waypoints, bounds
  const {
    path,
    bounds,
    boundsType,
    selectedShape,
  } = useShapeContext();

  // Flight params context - all flight parameters
  const flightParams = useFlightParamsContext();
  const { generateWaypointsFromAPI, generateKml } = useWaypointAPI();
  const [startingIndex, setStartingIndex] = useState(1);

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

  // Drawing tools hook
  const drawingTools = useDrawingTools({
    mapInstance
  });

  // Probe height hook
  const probeHeight = useProbeHeight({
    mapInstance,
    onDeactivateDrawing: drawingTools.stopDrawing
  });

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
      UseEndpointsOnly: flightParameters.useEndpointsOnly === true,
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

  // Combined map click handler
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const clickPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    console.log('Map clicked. Probe height active:', probeHeight.isProbeHeightActive, 'Drawing mode:', drawingTools.activeDrawingMode);

    // If probe height mode is active, handle probe click
    if (probeHeight.isProbeHeightActive) {
      probeHeight.handleProbeClick(clickPoint);
      return;
    }

    // Otherwise, handle drawing click
    drawingTools.handleMapClick(event);
  }, [probeHeight, drawingTools]);

  // Set up map click and mouse move listeners
  useEffect(() => {
    if (!mapInstance) return;

    const clickListener = mapInstance.addListener('click', handleMapClick);
    const mouseMoveListener = mapInstance.addListener('mousemove', drawingTools.handleMouseMove);

    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
      if (mouseMoveListener) {
        window.google.maps.event.removeListener(mouseMoveListener);
      }
    };
  }, [mapInstance, handleMapClick, drawingTools.handleMouseMove]);

  // Change cursor when probe height or drawing modes are active
  useEffect(() => {
    if (mapInstance) {
      const mapDiv = mapInstance.getDiv();
      const shouldShowCrosshair = probeHeight.isProbeHeightActive || drawingTools.activeDrawingMode !== null;

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
  }, [mapInstance, probeHeight.isProbeHeightActive, drawingTools.activeDrawingMode]);

  // Keyboard support for completing polyline
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && drawingTools.activeDrawingMode === 'polyline' && drawingTools.drawingPoints.length >= 2) {
        console.log('Enter pressed - completing polyline');
        drawingTools.handleStopDrawing();
      }
      if (e.key === 'Escape' && drawingTools.activeDrawingMode) {
        console.log('Escape pressed - canceling drawing');
        drawingTools.stopDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [drawingTools]);

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

      <DrawingIndicators
        activeDrawingMode={drawingTools.activeDrawingMode}
        circleCenter={drawingTools.circleCenter}
        drawingPoints={drawingTools.drawingPoints}
      />

      <MapToolbar
        onStopDrawing={drawingTools.handleStopDrawing}
        onGenerateWaypoints={handleGenerateWaypoints}
        onGenerateKml={handleGenerateKml}
        onDrawRectangle={drawingTools.handleDrawRectangle}
        onDrawCircle={drawingTools.handleDrawCircle}
        onDrawPolyline={drawingTools.handleDrawPolyline}
        onClearShapes={clearAll}
        onClearWaypoints={clearWaypoints}
        onProbeHeight={probeHeight.handleProbeHeight}
        onClearProbeHeight={probeHeight.handleClearProbeMarkers}
        isProbeHeightActive={probeHeight.isProbeHeightActive}
        activeDrawingMode={drawingTools.activeDrawingMode}
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

  const handlePlaceSelect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  }, []);

  if (loadError) {
    return <div className="flex items-center justify-center h-screen">Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading map...</div>;
  }

  return (
    <AppProviders>
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
                  <PlaceAutocomplete
                    mapInstance={mapInstance}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    onPlaceSelect={handlePlaceSelect}
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
              downloadLinkRef={downloadLinkRef}
              mapInstance={mapInstance}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />
          </GoogleMap>
        </div>
      </div>
    </AppProviders>
  );
};

export default MapComponent;
