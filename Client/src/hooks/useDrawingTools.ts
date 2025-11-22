import { useState, useCallback, useRef, useEffect } from 'react';
import { useShapeContext } from '../context/ShapeContext';

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

type ShapeType = google.maps.Rectangle | google.maps.Circle | google.maps.Polyline;

export interface DrawingToolsState {
  activeDrawingMode: string | null;
  drawingPoints: google.maps.LatLngLiteral[];
  rectangleStart: google.maps.LatLngLiteral | null;
  circleCenter: google.maps.LatLngLiteral | null;
}

export interface DrawingToolsActions {
  handleDrawRectangle: () => void;
  handleDrawCircle: () => void;
  handleDrawPolyline: () => void;
  handleStopDrawing: () => void;
  stopDrawing: () => void;
  handleMapClick: (event: google.maps.MapMouseEvent) => void;
  handleMouseMove: (event: google.maps.MapMouseEvent) => void;
}

interface UseDrawingToolsOptions {
  mapInstance: google.maps.Map | null;
}

export const useDrawingTools = ({
  mapInstance
}: UseDrawingToolsOptions): DrawingToolsState & DrawingToolsActions => {
  const { setBounds, setBoundsType, setShapes, setSelectedShape } = useShapeContext();

  const [activeDrawingMode, setActiveDrawingMode] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [rectangleStart, setRectangleStart] = useState<google.maps.LatLngLiteral | null>(null);
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const previewRectangleRef = useRef<google.maps.Rectangle | null>(null);

  const stopDrawing = useCallback(() => {
    setActiveDrawingMode(null);
    setDrawingPoints([]);
    setRectangleStart(null);
    setCircleCenter(null);

    // Clean up preview rectangle
    if (previewRectangleRef.current) {
      previewRectangleRef.current.setMap(null);
      previewRectangleRef.current = null;
    }
  }, []);

  const handleDrawRectangle = useCallback(() => {
    console.log('Rectangle drawing started - deactivating probe height');
    setActiveDrawingMode('rectangle');
    setDrawingPoints([]);
    setRectangleStart(null);
  }, []);

  const handleDrawCircle = useCallback(() => {
    console.log('Circle drawing started - deactivating probe height');
    setActiveDrawingMode('circle');
    setDrawingPoints([]);
    setCircleCenter(null);
  }, []);

  const handleDrawPolyline = useCallback(() => {
    console.log('Polyline drawing started - deactivating probe height');
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

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng || !mapInstance) return;

    const clickPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };

    // Handle rectangle drawing
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
      }
      return;
    }

    // Handle circle drawing
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
        interface CircleCenter {
          lat: number;
          lng: number;
          radius: number;
        }
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

    // Handle polyline drawing
    if (activeDrawingMode === 'polyline') {
      // Add point to polyline
      console.log('Polyline: Adding point');
      setDrawingPoints((prev) => [...prev, clickPoint]);
      return;
    }
  }, [
    mapInstance,
    activeDrawingMode,
    rectangleStart,
    circleCenter,
    setBounds,
    setBoundsType,
    setShapes,
    setSelectedShape
  ]);

  const handleMouseMove = useCallback((event: google.maps.MapMouseEvent) => {
    if (activeDrawingMode === 'rectangle' && rectangleStart && event.latLng && mapInstance) {
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
  }, [activeDrawingMode, rectangleStart, mapInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewRectangleRef.current) {
        previewRectangleRef.current.setMap(null);
        previewRectangleRef.current = null;
      }
    };
  }, []);

  return {
    // State
    activeDrawingMode,
    drawingPoints,
    rectangleStart,
    circleCenter,

    // Actions
    handleDrawRectangle,
    handleDrawCircle,
    handleDrawPolyline,
    handleStopDrawing,
    stopDrawing,
    handleMapClick,
    handleMouseMove,
  };
};
