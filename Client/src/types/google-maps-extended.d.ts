/**
 * Extended type definitions for Google Maps with custom properties
 */

/// <reference types="@types/google.maps" />

declare global {
  namespace google.maps {
    interface Map {
      flags?: ExtendedMarker[];
      lines?: google.maps.Polyline[];
    }
  }

  interface ExtendedMarker extends google.maps.Marker {
    id: number;
    lng: number;
    lat: number;
    altitude: number;
    speed: number;
    heading: number;
    angle: number;
    action: string;
    terrainElevation?: number | null;
  }

  interface CircleCenter {
    lat: number;
    lng: number;
    radius: number;
  }

  interface Window {
    lastCircleCenter?: CircleCenter;
  }
}

export {};
