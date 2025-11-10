import { useCallback } from 'react';
import { generateWaypoints } from '../services/WaypointService';
import axios from 'axios';
import { useMapContext } from '../context/MapContext';
import { GenerateWaypointInfoboxText } from '../services/JSFunctions';

// Get API base URL from environment variables
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Coordinate {
  Lat: number;
  Lng: number;
  lat?: number;
  lng?: number;
  radius?: number;
  Radius?: number;
}

interface WaypointRequestData {
  Bounds: Coordinate[];
  BoundsType: string;
  StartingIndex?: number;
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
  startingIndex?: number;
  altitude?: number;
  speed?: number;
  angle?: number;
  photoInterval?: number;
  overlap?: number;
  inDistance?: number;
  isNorthSouth?: boolean;
  NorthSouthDirection?: boolean;
  useEndpointsOnly?: boolean;
  allPointsAction?: string;
  finalAction?: string;
  flipPath?: boolean;
  unitType?: number;
}

interface CleanRequestData {
  Bounds: Coordinate[];
  BoundsType: string;
  StartingIndex: number;
  Altitude: number;
  Speed: number;
  Angle: number;
  PhotoInterval: number;
  Overlap: number;
  LineSpacing: number;
  IsNorthSouth: boolean;
  UseEndpointsOnly: boolean;
  AllPointsAction: string;
  Action: string;
  FinalAction: string;
  FlipPath: boolean;
  UnitType: number;
}

interface WaypointPoint {
  Lat?: number;
  lat?: number;
  Latitude?: number;
  latitude?: number;
  Lng?: number;
  lng?: number;
  Longitude?: number;
  longitude?: number;
  Index?: number;
  index?: number;
  Id?: number;
  id?: number;
  Alt?: number;
  alt?: number;
  Altitude?: number;
  altitude?: number;
  Speed?: number;
  speed?: number;
  Heading?: number;
  heading?: number;
  GimbalAngle?: number;
  gimbalAngle?: number;
  Action?: string;
  action?: string;
}

interface ExtendedMarker extends google.maps.Marker {
  lng: number;
  lat: number;
  altitude: number;
  speed: number;
  heading: number;
  angle: number;
  action: string;
  id: number;
}

interface KMLRequestData {
  FlyToWaylineMode: string;
  FinishAction: string;
  ExitOnRCLost: string;
  ExecuteRCLostAction: string;
  GlobalTransitionalSpeed: number;
  DroneInfo: {
    DroneEnumValue: number;
    DroneSubEnumValue: number;
  };
  Waypoints: Array<{
    Index: number;
    Latitude: number;
    Longitude: number;
    ExecuteHeight: number;
    WaypointSpeed: number;
    WaypointHeadingMode: string;
    WaypointHeadingAngle: number;
    WaypointHeadingPathMode: string;
    WaypointTurnMode: string;
    WaypointTurnDampingDist: string;
    Action: string;
  }>;
  ActionGroups: never[];
}

interface UseWaypointAPIReturn {
  generateWaypointsFromAPI: (requestData: WaypointRequestData) => Promise<WaypointPoint[]>;
  generateKml: (downloadLinkRef: React.RefObject<HTMLAnchorElement>) => Promise<void>;
}

/**
 * Hook to handle all waypoint API operations
 */
export const useWaypointAPI = (): UseWaypointAPIReturn => {
  const {
    mapRef,
    genInfoWindowRef,
    redrawFlightPaths,
    flightParams
  } = useMapContext();

  /**
   * Generate waypoints from server
   */
  const generateWaypointsFromAPI = useCallback(async (requestData: WaypointRequestData): Promise<WaypointPoint[]> => {
    try {
      // Clone the request data to ensure we have a clean object without circular references
      const cleanRequest: CleanRequestData = {
        Bounds: Array.isArray(requestData.Bounds)
          ? requestData.Bounds.map(coord => {
              // Create a base coordinate with Lat/Lng
              const cleanCoord: Coordinate = {
                Lat: Number(coord.Lat || coord.lat || 0),
                Lng: Number(coord.Lng || coord.lng || 0)
              };

              // For circle shapes, preserve the radius property
              if (requestData.BoundsType === 'circle' && (coord.radius || coord.Radius)) {
                cleanCoord.radius = Number(coord.radius || coord.Radius || 0);
                cleanCoord.Radius = Number(coord.radius || coord.Radius || 0);
              }

              return cleanCoord;
            })
          : [],
        BoundsType: String(requestData.BoundsType || ''),
        StartingIndex: Number(requestData.StartingIndex || requestData.startingIndex || 1),
        Altitude: Number(requestData.Altitude || requestData.altitude || 60),
        Speed: Number(requestData.Speed || requestData.speed || 2.5),
        Angle: Number(requestData.Angle || requestData.angle || -45),
        PhotoInterval: Number(requestData.PhotoInterval || requestData.photoInterval || 2),
        Overlap: Number(requestData.Overlap || requestData.overlap || 80),
        LineSpacing: Number(requestData.LineSpacing || requestData.inDistance || 10),
        IsNorthSouth: Boolean(requestData.IsNorthSouth || requestData.isNorthSouth || requestData.NorthSouthDirection),
        UseEndpointsOnly: Boolean(requestData.UseEndpointsOnly || requestData.useEndpointsOnly),
        AllPointsAction: String(requestData.AllPointsAction || requestData.allPointsAction || 'takePhoto'),
        Action: String(requestData.AllPointsAction || requestData.allPointsAction || 'takePhoto'),
        FinalAction: String(requestData.FinalAction || requestData.finalAction || '0'),
        FlipPath: Boolean(requestData.FlipPath || requestData.flipPath || false),
        UnitType: Number(requestData.UnitType || requestData.unitType || 0)
      };

      // For circle bounds, add the radius property to the first coordinate
      if (cleanRequest.BoundsType === 'circle' && cleanRequest.Bounds.length > 0) {
        // Verify that the original bounds has radius information
        const originalBounds = requestData.Bounds;
        if (originalBounds && originalBounds.length > 0 && originalBounds[0].radius) {
          // Make sure we assign the exact radius from the original request
          cleanRequest.Bounds[0].Radius = originalBounds[0].radius;

          // Add both lowercase and uppercase properties to ensure compatibility
          cleanRequest.Bounds[0].lat = cleanRequest.Bounds[0].Lat;
          cleanRequest.Bounds[0].lng = cleanRequest.Bounds[0].Lng;
          cleanRequest.Bounds[0].radius = cleanRequest.Bounds[0].Radius;
        }
      }

      // Validate request data before sending
      if (!cleanRequest.Bounds || cleanRequest.Bounds.length === 0) {
        throw new Error('No bounds provided for waypoint generation');
      }

      if (!cleanRequest.BoundsType) {
        throw new Error('Bounds type is required');
      }

      // CIRCLE SPECIFIC: Check for (0,0) coordinates which are definitely wrong
      if (cleanRequest.BoundsType === 'circle' &&
          cleanRequest.Bounds.length > 0 &&
          cleanRequest.Bounds[0].Lat === 0 &&
          cleanRequest.Bounds[0].Lng === 0) {

        console.error('CRITICAL ERROR: Circle center is at (0,0) in final request.');

        // Try to use the global cache if available
        if ((window as any).lastCircleCenter) {
          const cached = (window as any).lastCircleCenter;
          cleanRequest.Bounds[0].Lat = cached.lat;
          cleanRequest.Bounds[0].Lng = cached.lng;
          cleanRequest.Bounds[0].radius = cached.radius;
          cleanRequest.Bounds[0].Radius = cached.radius;
        } else {
          // Use a default location if all else fails
          console.warn('No cached coordinates available. Using Helsinki as fallback location');
          cleanRequest.Bounds[0].Lat = 60.1699;
          cleanRequest.Bounds[0].Lng = 24.9384;
        }
      }

      // Generate waypoints with clean data
      console.log('Generating waypoints with request:', cleanRequest);
      const generatedPoints = await generateWaypoints(cleanRequest);

      console.log('Waypoints generated:', generatedPoints);
      if (!generatedPoints || generatedPoints.length === 0) {
        throw new Error('No waypoints returned from the server');
      }

      // Clear previous waypoints before adding new ones
      if (mapRef.current && (mapRef.current as any).flags) {
        // Remove existing markers
        for (let i = 0; i < (mapRef.current as any).flags.length; i++) {
          (mapRef.current as any).flags[i].setMap(null);
        }
        (mapRef.current as any).flags = [];
      }

      // Clear previous flight paths
      if (mapRef.current && (mapRef.current as any).lines) {
        // Remove existing polylines
        for (let i = 0; i < (mapRef.current as any).lines.length; i++) {
          (mapRef.current as any).lines[i].setMap(null);
        }
        (mapRef.current as any).lines = [];
      }

      const flightPoints: google.maps.LatLngLiteral[] = [];
      const flagCount = cleanRequest.StartingIndex || 1;

      console.log('mapRef.current exists:', !!mapRef.current);
      console.log('Processing', generatedPoints.length, 'waypoints');

      // Adjust altitudes for terrain if enabled
      if (flightParams.accountForTerrain && mapRef.current) {
        try {
          const elevationService = new google.maps.ElevationService();
          const locations = generatedPoints.map((point: any) => {
            const latitude = point.Lat !== undefined ? point.Lat :
                            (point.lat !== undefined ? point.lat :
                            (point.Latitude !== undefined ? point.Latitude :
                            (point.latitude !== undefined ? point.latitude : 0)));
            const longitude = point.Lng !== undefined ? point.Lng :
                             (point.lng !== undefined ? point.lng :
                             (point.Longitude !== undefined ? point.Longitude :
                             (point.longitude !== undefined ? point.longitude : 0)));
            return { lat: latitude, lng: longitude };
          });

          // Get elevations for all waypoints
          const elevationResults = await new Promise<any[]>((resolve, reject) => {
            elevationService.getElevationForLocations(
              { locations },
              (results, status) => {
                if (status === 'OK' && results) {
                  resolve(results);
                } else {
                  console.warn('Elevation service failed:', status);
                  reject(new Error(`Elevation service failed: ${status}`));
                }
              }
            );
          }).catch(() => {
            // If elevation fails, just continue without terrain adjustment
            console.warn('Terrain adjustment disabled due to elevation service error');
            return null;
          });

          if (elevationResults && elevationResults.length > 0) {
            const baseElevation = elevationResults[0].elevation;
            console.log('Base elevation (first waypoint):', baseElevation);

            // Adjust altitudes based on terrain elevation differences
            for (let i = 0; i < generatedPoints.length && i < elevationResults.length; i++) {
              const terrainElevation = elevationResults[i].elevation;
              const elevationDifference = terrainElevation - baseElevation;

              // Get current altitude
              const currentAltitude = generatedPoints[i].Alt !== undefined ? generatedPoints[i].Alt :
                                     (generatedPoints[i].alt !== undefined ? generatedPoints[i].alt :
                                     (generatedPoints[i].Altitude !== undefined ? generatedPoints[i].Altitude :
                                     (generatedPoints[i].altitude !== undefined ? generatedPoints[i].altitude : 60)));

              // Adjust altitude by the elevation difference
              generatedPoints[i].altitude = currentAltitude + elevationDifference;
              console.log(`Waypoint ${i}: base=${currentAltitude}m, terrain_diff=${elevationDifference.toFixed(2)}m, adjusted=${generatedPoints[i].altitude.toFixed(2)}m`);
            }
          }
        } catch (error) {
          console.error('Error adjusting altitudes for terrain:', error);
        }
      }

      // Process each waypoint returned from the API
      for (let i = 0; i < generatedPoints.length; i++) {
        const point = generatedPoints[i];

        // Validate waypoint data
        if (!point) {
          console.error('Invalid waypoint data (null or undefined):', point);
          continue;
        }

        // Handle both property naming conventions (Lat/Lng vs latitude/longitude)
        const latitude = point.Lat !== undefined ? point.Lat :
                        (point.lat !== undefined ? point.lat :
                        (point.Latitude !== undefined ? point.Latitude :
                        (point.latitude !== undefined ? point.latitude : null)));

        const longitude = point.Lng !== undefined ? point.Lng :
                         (point.lng !== undefined ? point.lng :
                         (point.Longitude !== undefined ? point.Longitude :
                         (point.longitude !== undefined ? point.longitude : null)));

        if (latitude === null || longitude === null) {
          console.error('Invalid waypoint coordinates:', point);
          continue;
        }

        // Check for valid latitude/longitude ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          console.error(`Invalid coordinate range: lat=${latitude}, lng=${longitude}`);
          continue;
        }

        // Get ID using various property names
        const id = point.Index !== undefined ? point.Index :
                  (point.index !== undefined ? point.index :
                  (point.Id !== undefined ? point.Id :
                  (point.id !== undefined ? point.id : i + 1)));

        // Get altitude using various property names
        const altitude = point.Alt !== undefined ? point.Alt :
                        (point.alt !== undefined ? point.alt :
                        (point.Altitude !== undefined ? point.Altitude :
                        (point.altitude !== undefined ? point.altitude : 60)));

        console.log(`Creating marker for waypoint ${id} at (${latitude}, ${longitude})`);

        // Create marker icon - simple blue circle with waypoint number
        const responseMarker: google.maps.Symbol = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillOpacity: 0.9,
          fillColor: '#2563eb',
          strokeWeight: 2,
          strokeColor: 'white',
        };

        // Create the marker
        const genWaypointMarker = new google.maps.Marker({
          position: {
            lat: latitude,
            lng: longitude
          },
          map: mapRef.current,
          label: {
            text: id.toString(),
            color: "white",
            fontWeight: 'bold',
            fontSize: '12px',
          },
          draggable: true,
          icon: responseMarker,
          title: `Waypoint ${id}`,
          zIndex: 10,
        }) as ExtendedMarker;

        console.log(`Marker created for waypoint ${id}:`, genWaypointMarker);

        // Store additional data on the marker
        genWaypointMarker.id = id;
        genWaypointMarker.lng = longitude;
        genWaypointMarker.lat = latitude;
        genWaypointMarker.altitude = altitude;
        genWaypointMarker.speed = point.Speed || point.speed || 2.5;
        genWaypointMarker.heading = point.Heading || point.heading || 0;
        genWaypointMarker.angle = point.GimbalAngle || point.gimbalAngle || -45;
        genWaypointMarker.action = point.Action || point.action || flightParams.allPointsAction || 'noAction';

        // Add event listeners to the marker
        google.maps.event.addListener(genWaypointMarker, "click", function (this: ExtendedMarker) {
          if (genInfoWindowRef.current) {
            genInfoWindowRef.current.close();
            genInfoWindowRef.current.setContent(GenerateWaypointInfoboxText(this));
            genInfoWindowRef.current.open(this.getMap(), this);

            // Setup navigation buttons when info window is ready
            const allMarkers = (mapRef.current as any)?.flags || [];
            const currentWaypointId = this.id;
            const currentIndex = allMarkers.findIndex((m: any) => m.id === currentWaypointId);

            console.log('Info window opened for waypoint', currentWaypointId, 'at index', currentIndex, 'of', allMarkers.length);

            // Listen for domready event on info window
            const domreadyListener = google.maps.event.addListenerOnce(genInfoWindowRef.current, 'domready', () => {
              console.log('Info window DOM ready, attaching button listeners');

              const prevBtn = document.getElementById("waypointPrevBtn") as HTMLButtonElement;
              const nextBtn = document.getElementById("waypointNextBtn") as HTMLButtonElement;

              console.log('prevBtn found:', !!prevBtn, 'nextBtn found:', !!nextBtn);
              console.log('Current index:', currentIndex, 'Total markers:', allMarkers.length);

              // Disable/enable previous button
              if (prevBtn) {
                if (currentIndex === 0) {
                  prevBtn.disabled = true;
                  prevBtn.style.opacity = '0.5';
                  prevBtn.style.cursor = 'not-allowed';
                  prevBtn.title = 'At first waypoint';
                } else {
                  prevBtn.disabled = false;
                  prevBtn.style.opacity = '1';
                  prevBtn.style.cursor = 'pointer';
                  prevBtn.title = 'Previous waypoint';
                }

                prevBtn.onclick = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Previous clicked, current index:', currentIndex);
                  if (currentIndex > 0) {
                    const prevMarker = allMarkers[currentIndex - 1];
                    console.log('Triggering click on marker:', prevMarker.id);
                    google.maps.event.trigger(prevMarker, 'click');
                  }
                };
              }

              // Disable/enable next button
              if (nextBtn) {
                if (currentIndex === allMarkers.length - 1) {
                  nextBtn.disabled = true;
                  nextBtn.style.opacity = '0.5';
                  nextBtn.style.cursor = 'not-allowed';
                  nextBtn.title = 'At last waypoint';
                } else {
                  nextBtn.disabled = false;
                  nextBtn.style.opacity = '1';
                  nextBtn.style.cursor = 'pointer';
                  nextBtn.title = 'Next waypoint';
                }

                nextBtn.onclick = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Next clicked, current index:', currentIndex);
                  if (currentIndex < allMarkers.length - 1) {
                    const nextMarker = allMarkers[currentIndex + 1];
                    console.log('Triggering click on marker:', nextMarker.id);
                    google.maps.event.trigger(nextMarker, 'click');
                  }
                };
              }

              // Attach Save button handler
              const saveBtn = document.getElementById("editWaypointSave") as HTMLButtonElement;
              if (saveBtn) {
                saveBtn.onclick = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Save clicked for waypoint:', currentWaypointId);

                  // Get the updated values from the form inputs
                  const altInput = document.getElementById("editWaypointAltitude") as HTMLInputElement;
                  const speedInput = document.getElementById("editWaypointSpeed") as HTMLInputElement;
                  const angleInput = document.getElementById("editWaypointAngle") as HTMLInputElement;
                  const actionInput = document.getElementById("editWaypointAction") as HTMLSelectElement;

                  if (altInput && speedInput && angleInput && actionInput) {
                    // Update the marker's properties
                    const currentMarker = allMarkers.find((m: any) => m.id === currentWaypointId);
                    if (currentMarker) {
                      currentMarker.altitude = parseFloat(altInput.value) || currentMarker.altitude;
                      currentMarker.speed = parseFloat(speedInput.value) || currentMarker.speed;
                      currentMarker.angle = parseFloat(angleInput.value) || currentMarker.angle;
                      currentMarker.action = actionInput.value || currentMarker.action;

                      console.log('Waypoint updated:', {
                        id: currentWaypointId,
                        altitude: currentMarker.altitude,
                        speed: currentMarker.speed,
                        angle: currentMarker.angle,
                        action: currentMarker.action
                      });

                      // Add visual feedback - flash the button
                      const originalBg = saveBtn.style.backgroundColor;
                      const originalText = saveBtn.textContent;

                      saveBtn.style.backgroundColor = '#15803d';
                      saveBtn.textContent = 'Saved!';
                      saveBtn.style.pointerEvents = 'none';

                      setTimeout(() => {
                        saveBtn.style.backgroundColor = originalBg;
                        saveBtn.textContent = originalText;
                        saveBtn.style.pointerEvents = 'auto';
                      }, 1500);

                      // Modal stays open for further editing or navigation
                    }
                  }
                };
              }

              // Attach Delete button handler
              const deleteBtn = document.getElementById("editWaypointRemovee") as HTMLButtonElement;
              if (deleteBtn) {
                deleteBtn.onclick = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Delete clicked for waypoint:', currentWaypointId);

                  // Find and remove the marker
                  const markerIndex = allMarkers.findIndex((m: any) => m.id === currentWaypointId);
                  if (markerIndex > -1) {
                    const markerToRemove = allMarkers[markerIndex];
                    markerToRemove.setMap(null);
                    allMarkers.splice(markerIndex, 1);

                    // Close the info window
                    if (genInfoWindowRef.current) {
                      genInfoWindowRef.current.close();
                    }

                    // Redraw the flight paths
                    redrawFlightPaths();
                    console.log('Waypoint deleted, remaining waypoints:', allMarkers.length);
                  }
                };
              }
            });
          }

          // Safely try to update form fields if they exist
          try {
            const selectedId = document.getElementById("selectedWaypointId");
            if (selectedId) selectedId.innerHTML = `Waypoint ${this.id}`;

            const editAlt = document.getElementById("editWaypointAltitude") as HTMLInputElement;
            if (editAlt) editAlt.value = this.altitude.toString();

            const editSpeed = document.getElementById("editWaypointSpeed") as HTMLInputElement;
            if (editSpeed) editSpeed.value = this.speed.toString();

            const editAngle = document.getElementById("editWaypointAngle") as HTMLInputElement;
            if (editAngle) editAngle.value = this.angle.toString();

            const editHeading = document.getElementById("editWaypointHeading") as HTMLInputElement;
            if (editHeading) editHeading.value = this.heading.toString();

            const editAction = document.getElementById("editWaypointAction") as HTMLInputElement;
            if (editAction) editAction.value = this.action;

            const editId = document.getElementById("editWaypointID") as HTMLInputElement;
            if (editId) editId.value = this.id.toString();
          } catch (formError) {
            console.error('Error updating waypoint form:', formError);
          }
        });

        google.maps.event.addListener(genWaypointMarker, "mouseup", function () {
          redrawFlightPaths();
        });

        google.maps.event.addListener(genWaypointMarker, 'dragend', function (this: ExtendedMarker) {
          const position = this.getPosition();
          if (position) {
            this.lat = position.lat();
            this.lng = position.lng();
          }
          if (genInfoWindowRef.current) {
            genInfoWindowRef.current.close();
            genInfoWindowRef.current.setContent(GenerateWaypointInfoboxText(this));
            genInfoWindowRef.current.open(this.getMap(), this);
          }
        });

        // Add the marker to the map's flags array
        if (mapRef.current) {
          if (!(mapRef.current as any).flags) {
            (mapRef.current as any).flags = [];
          }
          (mapRef.current as any).flags.push(genWaypointMarker);
          console.log('Marker stored. Total markers:', (mapRef.current as any).flags.length);
        } else {
          console.error('mapRef.current is null - marker not added to map!');
        }
        flightPoints.push({ lat: latitude, lng: longitude });
      }

      console.log('Total waypoints created:', (mapRef.current as any)?.flags?.length || 0);

      // Create a polyline connecting all waypoints
      const flightPath = new google.maps.Polyline({
        path: flightPoints,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        zIndex: 100,
      });

      // Add the polyline to the map
      if (mapRef.current) {
        flightPath.setMap(mapRef.current);

        // Store the polyline in the map's lines array
        if (!(mapRef.current as any).lines) {
          (mapRef.current as any).lines = [];
        }
        (mapRef.current as any).lines.push(flightPath);
      }

      try {
        // Update starting index field if it exists
        const startingIndexField = document.getElementById("in_startingIndex") as HTMLInputElement;
        if (startingIndexField) {
          startingIndexField.value = flagCount.toString();
        }
      } catch (error) {
        console.error('Error updating starting index field:', error);
      }

      redrawFlightPaths();

      return generatedPoints;
    } catch (error: any) {
      console.error('Error generating waypoints:', error);

      // Log more detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        throw error.response.data || 'Server error generating waypoints';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        throw error;
      }
    }
  }, [mapRef, genInfoWindowRef, redrawFlightPaths]);

  /**
   * Generate KML file for waypoints
   */
  const generateKml = useCallback(async (downloadLinkRef: React.RefObject<HTMLAnchorElement>): Promise<void> => {
    if (!mapRef.current || !(mapRef.current as any).flags || (mapRef.current as any).flags.length === 0) {
      alert('No waypoints to export');
      return;
    }

    // Create a clean request object with only the properties we need
    const requestData: KMLRequestData = {
      FlyToWaylineMode: "safely",
      FinishAction: "0",
      ExitOnRCLost: "executeLostAction",
      ExecuteRCLostAction: "goBack",
      GlobalTransitionalSpeed: 2.5,
      DroneInfo: {
        DroneEnumValue: 1,
        DroneSubEnumValue: 1
      },
      Waypoints: [],
      ActionGroups: []
    };

    // Clean waypoints data to avoid circular references
    requestData.Waypoints = (mapRef.current as any).flags.map((wp: ExtendedMarker, index: number) => {
      return {
        Index: index,
        Latitude: Number(wp.lat || 0),
        Longitude: Number(wp.lng || 0),
        ExecuteHeight: Number(wp.altitude || 60),
        WaypointSpeed: Number(wp.speed || 2.5),
        WaypointHeadingMode: "smoothTransition",
        WaypointHeadingAngle: Number(wp.heading || 0),
        WaypointHeadingPathMode: "followBadArc",
        WaypointTurnMode: "toPointAndStopWithContinuityCurvature",
        WaypointTurnDampingDist: "0",
        Action: String(wp.action || "noAction")
      };
    });

    // Verify the data can be serialized
    try {
      JSON.stringify(requestData);
    } catch (jsonError) {
      console.error('Cannot serialize request data:', jsonError);
      alert('Failed to prepare KML data - please try again');
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/api/KMZ/generate`, requestData, {
        responseType: 'blob'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = downloadLinkRef.current;
      if (link) {
        link.href = url;
        link.setAttribute('download', 'generated.kml');
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating KML:', error);
      alert('Error generating KML file. Check console for details.');
    }
  }, [mapRef]);

  return {
    generateWaypointsFromAPI,
    generateKml
  };
};
