import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { useFlightParameters } from '../hooks/useFlightParameters';

// Shape type definition
type ShapeType = google.maps.Rectangle | google.maps.Circle | google.maps.Polyline;

// TypeScript interfaces
interface Waypoint {
  id: string | number;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  angle: number;
  heading: number;
  action: string;
  isVertex?: boolean;
  marker?: google.maps.Marker;
}

interface MapContextValue {
  // State
  shapes: ShapeType[];
  setShapes: React.Dispatch<React.SetStateAction<ShapeType[]>>;
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  selectedShape: ShapeType | null;
  setSelectedShape: React.Dispatch<React.SetStateAction<ShapeType | null>>;
  selectedMarker: Waypoint | null;
  setSelectedMarker: React.Dispatch<React.SetStateAction<Waypoint | null>>;
  path: google.maps.LatLngLiteral[];
  setPath: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral[]>>;
  bounds: string;
  setBounds: React.Dispatch<React.SetStateAction<string>>;
  boundsType: string | string[];
  setBoundsType: React.Dispatch<React.SetStateAction<string | string[]>>;

  // Refs
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
  genInfoWindowRef: React.MutableRefObject<google.maps.InfoWindow | null>;

  // Functions
  clearAll: () => void;
  clearWaypoints: () => void;
  redrawFlightPaths: () => void;
  updateMarkerIcon: (waypoint: Waypoint) => void;
  redrawMarkers: () => void;
  handleWaypointClick: (marker: Waypoint) => void;
  handleWaypointDragEnd: (marker: Waypoint) => void;
  flightParams: ReturnType<typeof useFlightParameters>;
}

interface MapProviderProps {
  children: ReactNode;
}

// Create the context with undefined as initial value
const MapContext = createContext<MapContextValue | undefined>(undefined);

// Context provider component
export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  // Map state
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Waypoint | null>(null);
  const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [bounds, setBounds] = useState<string>('');
  const [boundsType, setBoundsType] = useState<string | string[]>(['rectangle']);
  const flightParams = useFlightParameters();

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const genInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Clear all shapes and waypoints
  const clearAll = () => {
    shapes.forEach((shape) => {
      if ('setMap' in shape && typeof shape.setMap === 'function') {
        shape.setMap(null);
      }
    });
    setShapes([]);
    setBounds('');
    setBoundsType('');

    // Remove all markers from the map
    if (mapRef.current?.flags) {
      mapRef.current.flags.forEach((marker: google.maps.Marker) => {
        marker.setMap(null);
      });
      mapRef.current.flags = [];
    }

    // Remove all routes (polylines) from the map
    if (mapRef.current?.lines) {
      mapRef.current.lines.forEach((line: google.maps.Polyline) => {
        line.setMap(null);
      });
      mapRef.current.lines = [];
    }

    // Clear waypoints state
    setWaypoints([]);
  };

  // Clear only waypoints (not shapes/drawings)
  const clearWaypoints = () => {
    // Remove all markers from the map
    if (mapRef.current?.flags) {
      mapRef.current.flags.forEach((marker: google.maps.Marker) => {
        marker.setMap(null);
      });
      mapRef.current.flags = [];
    }

    // Remove all routes (polylines) from the map
    if (mapRef.current?.lines) {
      mapRef.current.lines.forEach((line: google.maps.Polyline) => {
        line.setMap(null);
      });
      mapRef.current.lines = [];
    }

    // Clear waypoints state
    setWaypoints([]);
  };

  // Redraw flight paths
  const redrawFlightPaths = () => {
    if (!mapRef.current) return;

    // Clear existing flight paths
    if (mapRef.current.lines) {
      mapRef.current.lines.forEach((line: google.maps.Polyline) => line.setMap(null));
      mapRef.current.lines = [];
    }

    // Redraw flight paths based on current markers
    const flags = mapRef.current.flags;
    if (!flags || flags.length === 0) return;

    const flightPoints = flags.map((marker: ExtendedMarker) => ({
      lat: marker.lat,
      lng: marker.lng
    }));

    const flightPath = new google.maps.Polyline({
      path: flightPoints,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      zIndex: 100,
    });

    flightPath.setMap(mapRef.current);
    if (!mapRef.current.lines) {
      mapRef.current.lines = [];
    }
    mapRef.current.lines.push(flightPath);
  };

  // Update marker icon
  const updateMarkerIcon = (waypoint: Waypoint) => {
    if (!waypoint.marker) return;

    const updateMarker: google.maps.Symbol = {
      path: 'M 230 80 A 45 45, 0, 1, 0, 275 125 L 275 80 Z',
      fillOpacity: 0.8,
      fillColor: 'blue',
      anchor: new google.maps.Point(228, 125),
      strokeWeight: 3,
      strokeColor: 'white',
      scale: 0.5,
      rotation: waypoint.heading - 45,
      labelOrigin: new google.maps.Point(228, 125),
    };
    waypoint.marker.setIcon(updateMarker);
  };

  // Redraw markers
  const redrawMarkers = () => {
    if (mapRef.current && mapRef.current.flags) {
      mapRef.current.flags.forEach((waypoint: Waypoint) => {
        if (waypoint.marker) {
          waypoint.marker.setLabel(`${waypoint.id}`);
        }
      });
    }
  };

  // Handle waypoint click
  const handleWaypointClick = (marker: Waypoint) => {
    setSelectedMarker(marker);
  };

  // Handle waypoint drag end
  const handleWaypointDragEnd = (marker: Waypoint) => {
    if (!marker.marker) return;

    const position = marker.marker.getPosition();
    if (!position) return;

    marker.lat = position.lat();
    marker.lng = position.lng();

    setWaypoints(prevWaypoints =>
      prevWaypoints.map(way => (way.id === marker.id ? { ...marker, lat: marker.lat, lng: marker.lng } : way))
    );
    redrawFlightPaths();
  };

  // Export the context value
  const value: MapContextValue = {
    // State
    shapes,
    setShapes,
    waypoints,
    setWaypoints,
    selectedShape,
    setSelectedShape,
    selectedMarker,
    setSelectedMarker,
    path,
    setPath,
    bounds,
    setBounds,
    boundsType,
    setBoundsType,

    // Refs
    mapRef,
    drawingManagerRef,
    genInfoWindowRef,

    // Functions
    clearAll,
    clearWaypoints,
    redrawFlightPaths,
    updateMarkerIcon,
    redrawMarkers,
    handleWaypointClick,
    handleWaypointDragEnd,
    flightParams
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook to use the map context
export const useMapContext = (): MapContextValue => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

export default MapContext;
