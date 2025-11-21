import { createContext, useContext, useState, ReactNode } from 'react';

// Shape type definition
type ShapeType = google.maps.Rectangle | google.maps.Circle | google.maps.Polyline;

// Waypoint interface
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

interface ShapeContextValue {
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
}

interface ShapeProviderProps {
  children: ReactNode;
}

// Create the context
const ShapeContext = createContext<ShapeContextValue | undefined>(undefined);

// Context provider component
export const ShapeProvider: React.FC<ShapeProviderProps> = ({ children }) => {
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Waypoint | null>(null);
  const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [bounds, setBounds] = useState<string>('');
  const [boundsType, setBoundsType] = useState<string | string[]>(['rectangle']);

  const value: ShapeContextValue = {
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
  };

  return <ShapeContext.Provider value={value}>{children}</ShapeContext.Provider>;
};

// Custom hook to use the shape context
export const useShapeContext = (): ShapeContextValue => {
  const context = useContext(ShapeContext);
  if (context === undefined) {
    throw new Error('useShapeContext must be used within a ShapeProvider');
  }
  return context;
};

export default ShapeContext;
