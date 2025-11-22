/**
 * WaypointService.ts
 * Service for managing waypoints and their operations
 */

import axios from 'axios';
import { ApiError } from './ApiError';
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config';

// Create API instance with centralized configuration
const api = axios.create({
  baseURL: `${API_CONFIG.baseURL}/api/`,
  timeout: API_CONFIG.timeout,
});

// Waypoint actions enum for consistency
export const WaypointActions = {
  NO_ACTION: 'noAction',
  TAKE_PHOTO: 'takePhoto',
  START_RECORD: 'startRecord',
  STOP_RECORD: 'stopRecord'
} as const;

// Type definitions
export interface Coordinate {
  Lat: number;
  Lng: number;
}

export interface GenerateWaypointRequest {
  Bounds: Coordinate[];
  BoundsType: string;
  Altitude?: number;
  Speed?: number;
  Angle?: number;
  PhotoInterval?: number;
  Overlap?: number;
  LineSpacing?: number;
  IsNorthSouth?: boolean;
  UseEndpointsOnly?: boolean;
  AllPointsAction?: string;
  FinalAction?: string;
  FlipPath?: boolean;
  UnitType?: number;
  StartingIndex?: number;
}

export interface WaypointModel {
  id: number;
  lat: number;
  lng: number;
  altitude?: number;
  speed?: number;
  angle?: number;
  heading?: number;
  action?: string;
  [key: string]: unknown;
}

export interface FlightParameters {
  inDistance: string;
  speed: string;
  groundWidth: string;
  groundHeight: string;
}

export interface CameraSettings {
  altitude: number;
  overlap: number;
  focalLength: number;
  sensorWidth: number;
  sensorHeight: number;
  interval: number;
}

export interface WaypointResponse {
  [key: string]: unknown;
}

// Generate waypoints on server
export const generateWaypoints = async (request: GenerateWaypointRequest): Promise<WaypointResponse[]> => {
  try {
    console.log('Original request for waypoints:', request);

    // Create a completely new object with only the properties we need
    // This avoids any circular references from Google Maps objects
    const cleanRequest = {
      Bounds: [] as Coordinate[],
      BoundsType: String(request.BoundsType || ''),
      Altitude: Number(request.Altitude || 60),
      Speed: Number(request.Speed || 2.5),
      Angle: Number(request.Angle || -45),
      PhotoInterval: Number(request.PhotoInterval || 2),
      Overlap: Number(request.Overlap || 80),
      LineSpacing: Number(request.LineSpacing || 10),
      IsNorthSouth: request.IsNorthSouth === true,
      UseEndpointsOnly: request.UseEndpointsOnly === true,
      AllPointsAction: String(request.AllPointsAction || 'takePhoto'),
      FinalAction: String(request.FinalAction || '0'),
      FlipPath: Boolean(request.FlipPath),
      UnitType: Number(request.UnitType || 0),
      StartingIndex: Number(request.StartingIndex || 1)
    };

    // Safely copy bounds array, ensuring we only take the Lat and Lng properties
    if (request.Bounds && Array.isArray(request.Bounds)) {
      cleanRequest.Bounds = request.Bounds.map(coord => {
        if (coord && typeof coord === 'object') {
          return {
            Lat: Number(coord.Lat || 0),
            Lng: Number(coord.Lng || 0)
          };
        }
        return { Lat: 0, Lng: 0 };
      });
    }

    // Validate Bounds
    if (!cleanRequest.Bounds || !Array.isArray(cleanRequest.Bounds) || cleanRequest.Bounds.length === 0) {
      throw new Error('Invalid bounds data: Bounds must be a non-empty array');
    }

    // Check if Bounds contains the expected properties
    const hasValidBounds = cleanRequest.Bounds.every(coord =>
      typeof coord === 'object' &&
      typeof coord.Lat === 'number' &&
      typeof coord.Lng === 'number'
    );

    if (!hasValidBounds) {
      console.error('Invalid bounds format, expecting array of {Lat: number, Lng: number}:', cleanRequest.Bounds);
      throw new Error('Invalid bounds format: Each coordinate must have Lat and Lng properties');
    }

    // Check if BoundsType is valid
    if (!cleanRequest.BoundsType || typeof cleanRequest.BoundsType !== 'string') {
      throw new Error('Invalid boundsType: Must be a non-empty string');
    }

    console.log('Sending clean request to API:', cleanRequest);

    // Use the clean request directly instead of re-parsing the serialized data
    const response = await api.post<WaypointResponse[]>('/waypoints/generate', cleanRequest);
    console.log('API response:', response);
    console.log('API response data type:', typeof response.data);
    console.log('API response data length:', Array.isArray(response.data) ? response.data.length : 'not an array');
    console.log('API response data:', JSON.stringify(response.data, null, 2));

    if (Array.isArray(response.data) && response.data.length === 0) {
      console.warn('Server returned an empty array of waypoints');
    }

    return response.data;
  } catch (error) {
    console.error('Error in generateWaypoints:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw new ApiError(
        error.response?.status || 500,
        error.response?.data,
        `Failed to generate waypoints: ${error.message}`
      );
    }
    throw error;
  }
};

// Update waypoint on server
export const updateWaypoint = async (id: number, updatedWaypoint: WaypointModel): Promise<unknown> => {
  try {
    const response = await api.put(API_ENDPOINTS.waypoints.update(id), updatedWaypoint);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.status || 500,
        error.response?.data,
        `Failed to update waypoint ${id}: ${error.message}`
      );
    }
    throw error;
  }
};

// Delete waypoint from server
export const deleteWaypoint = async (id: number): Promise<unknown> => {
  try {
    const response = await api.delete(API_ENDPOINTS.waypoints.delete(id));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.status || 500,
        error.response?.data,
        `Failed to delete waypoint ${id}: ${error.message}`
      );
    }
    throw error;
  }
};

// Calculate flight parameters based on camera settings
export const calculateFlightParameters = ({
  altitude,
  overlap,
  focalLength,
  sensorWidth,
  sensorHeight,
  interval
}: CameraSettings): FlightParameters => {
  // Convert all parameters to numbers
  const altitudeNum = parseFloat(String(altitude));
  const overlapNum = parseFloat(String(overlap));
  const focalLengthNum = parseFloat(String(focalLength));
  const sensorWidthNum = parseFloat(String(sensorWidth));
  const sensorHeightNum = parseFloat(String(sensorHeight));
  const intervalNum = parseFloat(String(interval));

  // Calculate horizontal and vertical FOV in radians
  const fovH = 2 * Math.atan(sensorWidthNum / (2 * focalLengthNum));
  const fovV = 2 * Math.atan(sensorHeightNum / (2 * focalLengthNum));

  // Calculate ground coverage dimensions
  const groundWidth = 2 * altitudeNum * Math.tan(fovH / 2);
  const groundHeight = 2 * altitudeNum * Math.tan(fovV / 2);

  // Calculate distance between flight lines
  const inDistance = groundWidth * (1 - overlapNum / 100);

  // Calculate distance between photos
  const distanceBetweenPhotos = groundHeight * (1 - overlapNum / 100);

  // Calculate required speed
  const speed = distanceBetweenPhotos / intervalNum;

  return {
    inDistance: inDistance.toFixed(1),
    speed: speed.toFixed(1),
    groundWidth: groundWidth.toFixed(1),
    groundHeight: groundHeight.toFixed(1)
  };
};

// Generate a basic waypoint model for new waypoints
export const createWaypointModel = (id: number, lat: number, lng: number, options: Partial<WaypointModel> = {}): WaypointModel => {
  return {
    id: id,
    lat: lat,
    lng: lng,
    altitude: options.altitude || 60,
    speed: options.speed || 2.5,
    angle: options.angle || -45,
    heading: options.heading || 0,
    action: options.action || WaypointActions.NO_ACTION,
    ...options
  };
};
