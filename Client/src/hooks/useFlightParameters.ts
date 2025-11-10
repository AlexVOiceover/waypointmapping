import { useState, useEffect } from 'react';
import { calculateFlightParameters } from '../services/WaypointService';

interface FlightParametersInitialState {
  altitude?: number;
  speed?: number;
  angle?: number;
  focalLength?: number;
  sensorWidth?: number;
  sensorHeight?: number;
  photoInterval?: number;
  overlap?: number;
  inDistance?: number;
  isNorthSouth?: boolean;
  useEndpointsOnly?: boolean;
  allPointsAction?: string;
  finalAction?: string;
  flipPath?: boolean;
  unitType?: string;
  manualSpeedSet?: boolean;
  accountForTerrain?: boolean;
}

interface FlightParameters {
  altitude: number;
  speed: number;
  angle: number;
  interval: number;
  overlap: number;
  inDistance: number;
  isNorthSouth: boolean;
  useEndpointsOnly: boolean;
  allPointsAction: string;
  finalAction: string;
  flipPath: boolean;
  unitType: string;
  accountForTerrain: boolean;
}

interface UseFlightParametersReturn {
  // State variables
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
  allPointsAction: string;
  finalAction: string;
  flipPath: boolean;
  unitType: string;
  accountForTerrain: boolean;

  // Setters
  setAltitude: (value: number) => void;
  setSpeed: (value: number) => void;
  setAngle: (value: number) => void;
  setFocalLength: (value: number) => void;
  setSensorWidth: (value: number) => void;
  setSensorHeight: (value: number) => void;
  setPhotoInterval: (value: number) => void;
  setOverlap: (value: number) => void;
  setInDistance: (value: number) => void;
  setIsNorthSouth: (value: boolean) => void;
  setUseEndpointsOnly: (value: boolean) => void;
  setAllPointsAction: (value: string) => void;
  setFinalAction: (value: string) => void;
  setUnitType: (value: string) => void;
  setAccountForTerrain: (value: boolean) => void;

  // Toggle functions
  toggleUseEndpointsOnly: () => void;
  toggleIsNorthSouth: () => void;
  toggleFlipPath: () => void;

  // Get all parameters as an object (for API calls)
  getFlightParameters: () => FlightParameters;
}

/**
 * Custom hook to manage flight parameters and calculations
 */
export const useFlightParameters = (initialState: FlightParametersInitialState = {}): UseFlightParametersReturn => {
  // State for camera and flight parameters
  const [altitude, setAltitude] = useState<number>(initialState.altitude || 60);
  const [speed, setSpeed] = useState<number>(initialState.speed || 2.5);
  const [angle, setAngle] = useState<number>(initialState.angle || -45);
  const [focalLength, setFocalLength] = useState<number>(initialState.focalLength || 24);
  const [sensorWidth, setSensorWidth] = useState<number>(initialState.sensorWidth || 9.6);
  const [sensorHeight, setSensorHeight] = useState<number>(initialState.sensorHeight || 7.2);
  const [photoInterval, setPhotoInterval] = useState<number>(initialState.photoInterval || 2);
  const [overlap, setOverlap] = useState<number>(initialState.overlap || 83);
  const [inDistance, setInDistance] = useState<number>(initialState.inDistance || 10);
  const [isNorthSouth, setIsNorthSouth] = useState<boolean>(() => {
    // Default to true if not explicitly false
    return initialState.isNorthSouth === false ? false : true;
  });
  const [useEndpointsOnly, setUseEndpointsOnly] = useState<boolean>(() => {
    // Default to false if not explicitly true
    return initialState.useEndpointsOnly === true ? true : false;
  });
  const [allPointsAction, setAllPointsAction] = useState<string>(initialState.allPointsAction || 'takePhoto');
  const [finalAction, setFinalAction] = useState<string>(initialState.finalAction || '0');
  const [flipPath, setFlipPath] = useState<boolean>(initialState.flipPath || false);
  const [unitType, setUnitType] = useState<string>(initialState.unitType || '0');
  const [accountForTerrain, setAccountForTerrain] = useState<boolean>(initialState.accountForTerrain || false);

  // Calculate flight parameters whenever relevant state changes
  useEffect(() => {
    const params = calculateFlightParameters({
      altitude,
      overlap,
      focalLength,
      sensorWidth,
      sensorHeight,
      interval: photoInterval
    });

    setInDistance(params.inDistance);

    // Only update speed if the user hasn't manually changed it
    if (!initialState.manualSpeedSet) {
      setSpeed(params.speed);
    }
  }, [altitude, overlap, focalLength, sensorWidth, sensorHeight, photoInterval, initialState.manualSpeedSet]);

  // Explicitly define setUseEndpointsOnly to ensure boolean values
  const setUseEndpointsOnlyWithBool = (value: boolean): void => {
    // Always convert to explicit boolean
    const boolValue = value === true;
    setUseEndpointsOnly(boolValue);
  };

  // Explicitly define setIsNorthSouth to ensure boolean values
  const setIsNorthSouthWithBool = (value: boolean): void => {
    // Always convert to explicit boolean
    const boolValue = value === true;
    setIsNorthSouth(boolValue);
  };

  // Toggle functions
  const toggleUseEndpointsOnly = (): void => {
    // Force the value to be a boolean with the !! operator
    const currentValue = !!useEndpointsOnly;
    const newValue = !currentValue;
    setUseEndpointsOnly(newValue);
  };

  const toggleIsNorthSouth = (): void => {
    // Force the value to be a boolean with the !! operator
    const currentValue = !!isNorthSouth;
    const newValue = !currentValue;
    setIsNorthSouth(newValue);
  };

  const toggleFlipPath = (): void => setFlipPath(prev => !prev);

  // Package all states and setters into an object for easy access
  return {
    // State variables
    altitude,
    speed,
    angle,
    focalLength,
    sensorWidth,
    sensorHeight,
    photoInterval,
    overlap,
    inDistance,
    isNorthSouth,
    useEndpointsOnly,
    allPointsAction,
    finalAction,
    flipPath,
    unitType,
    accountForTerrain,

    // Setters
    setAltitude,
    setSpeed,
    setAngle,
    setFocalLength,
    setSensorWidth,
    setSensorHeight,
    setPhotoInterval,
    setOverlap,
    setInDistance,
    setIsNorthSouth: setIsNorthSouthWithBool,
    setUseEndpointsOnly: setUseEndpointsOnlyWithBool,
    setAllPointsAction,
    setFinalAction,
    setUnitType,
    setAccountForTerrain,

    // Toggle functions
    toggleUseEndpointsOnly,
    toggleIsNorthSouth,
    toggleFlipPath,

    // Get all parameters as an object (for API calls)
    getFlightParameters: (): FlightParameters => {
      // Create the parameters object with explicit boolean handling
      const params: FlightParameters = {
        altitude,
        speed,
        angle,
        interval: photoInterval,
        overlap,
        inDistance,
        isNorthSouth: isNorthSouth === true,
        useEndpointsOnly: useEndpointsOnly === true,
        allPointsAction,
        finalAction,
        flipPath: flipPath === true,
        unitType,
        accountForTerrain: accountForTerrain === true
      };

      return params;
    }
  };
};
