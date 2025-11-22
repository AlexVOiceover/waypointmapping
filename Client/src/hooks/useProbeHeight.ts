import { useState, useCallback, useRef, useEffect } from 'react';

export interface ProbeHeightState {
  isProbeHeightActive: boolean;
  probeMarkers: google.maps.Marker[];
}

export interface ProbeHeightActions {
  handleProbeHeight: () => void;
  handleClearProbeMarkers: () => void;
  handleProbeClick: (clickPoint: google.maps.LatLngLiteral) => void;
}

interface UseProbeHeightOptions {
  mapInstance: google.maps.Map | null;
  onDeactivateDrawing?: () => void;
}

export const useProbeHeight = ({
  mapInstance,
  onDeactivateDrawing
}: UseProbeHeightOptions): ProbeHeightState & ProbeHeightActions => {
  const [isProbeHeightActive, setIsProbeHeightActive] = useState(false);
  const elevatorServiceRef = useRef<google.maps.ElevationService | null>(null);
  const probeMarkersRef = useRef<google.maps.Marker[]>([]);
  const onDeactivateDrawingRef = useRef(onDeactivateDrawing);

  // Keep ref updated
  useEffect(() => {
    onDeactivateDrawingRef.current = onDeactivateDrawing;
  }, [onDeactivateDrawing]);

  // Initialize Elevation Service
  useEffect(() => {
    if (window.google && window.google.maps) {
      if (!elevatorServiceRef.current) {
        elevatorServiceRef.current = new window.google.maps.ElevationService();
      }
    }
  }, []);

  const handleProbeHeight = useCallback(() => {
    const newState = !isProbeHeightActive;
    console.log('Probe Height toggled. New state:', newState);

    if (newState) {
      console.log('Activating probe height - stopping drawing mode');
      onDeactivateDrawingRef.current?.();
    }

    setIsProbeHeightActive(newState);
  }, [isProbeHeightActive]);

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

  const handleProbeClick = useCallback((clickPoint: google.maps.LatLngLiteral) => {
    if (!isProbeHeightActive || !elevatorServiceRef.current || !mapInstance) return;

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
  }, [isProbeHeightActive, mapInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      probeMarkersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      probeMarkersRef.current = [];
    };
  }, []);

  return {
    // State
    isProbeHeightActive,
    probeMarkers: probeMarkersRef.current,

    // Actions
    handleProbeHeight,
    handleClearProbeMarkers,
    handleProbeClick,
  };
};
