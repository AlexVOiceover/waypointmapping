/**
 * Common type definitions for the DroneKartta application
 */

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Waypoint data structure
 */
export interface Waypoint extends Coordinates {
  id: string;
  altitude?: number;
  order: number;
}

/**
 * Flight parameters for mission planning
 */
export interface FlightParameters {
  altitude: number;
  speed: number;
  angle: number;
  focalLength: number;
  sensorWidth: number;
  sensorHeight: number;
  photoInterval: number;
  overlap: number;
  inDistance: number;
  isNorthSouth: boolean;
  useEndpointsOnly: boolean;
  allPointsAction: 'noAction' | 'takePhoto' | 'startRecord' | 'stopRecord';
  toggleUseEndpointsOnly: () => void;
  toggleIsNorthSouth: () => void;
  setUseEndpointsOnly: (value: boolean) => void;
  setIsNorthSouth: (value: boolean) => void;
}

/**
 * Drawing mode types for map interaction
 */
export type DrawingMode = 'polygon' | 'circle' | 'rectangle' | 'waypoint' | null;

/**
 * Map bounds
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Shape overlay types
 */
export interface ShapeOverlay {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle';
  data: google.maps.Polygon | google.maps.Circle | google.maps.Rectangle;
  bounds?: MapBounds;
  area?: number;
}
