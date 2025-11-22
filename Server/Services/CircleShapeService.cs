using System;
using System.Collections.Generic;
using System.Diagnostics;
using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.Services
{
    /// <summary>
    /// Service for generating waypoints for circle shapes
    /// </summary>
    public class CircleShapeService : IShapeService
    {
        private readonly IGeometryService _geometryService;
        private readonly ILogger<CircleShapeService> _logger;

        public CircleShapeService(
            IGeometryService geometryService,
            ILogger<CircleShapeService> logger
        )
        {
            _geometryService = geometryService;
            _logger = logger;
        }

        /// <inheritdoc />
        public bool CanHandleShapeType(string shapeType)
        {
            return shapeType?.ToLower() == ShapeTypes.Circle;
        }

        /// <inheritdoc />
        public List<Waypoint> GenerateWaypoints(ShapeData shape, WaypointParameters parameters)
        {
            if (shape == null || shape.Coordinates == null || shape.Coordinates.Count < 1)
            {
                return new List<Waypoint>();
            }

            var center = shape.Coordinates[0];
            double radiusMeters = shape.Radius;

            if (radiusMeters <= 0)
            {
                throw new ArgumentException("Circle radius must be greater than zero.", nameof(shape));
            }

            // Optional fallback only when coordinates are clearly invalid (0,0)
            if (Math.Abs(center.Lat) < 1e-9 && Math.Abs(center.Lng) < 1e-9)
            {
                _logger.LogWarning("Circle center at (0,0) detected. Falling back to London coordinates.");
                center = new Coordinate
                {
                    Lat = 51.5074,
                    Lng = -0.1278,
                    Radius = center.Radius
                };
            }

            double centerLat = center.Lat;
            double centerLng = center.Lng;

            var waypoints = new List<Waypoint>();

            // Calculate the number of waypoints based on circumference and speed
            double circumference = 2 * Math.PI * radiusMeters;
            double distancePerWaypoint = parameters.Speed * parameters.PhotoInterval;
            int numberOfWaypoints = Math.Max(24, (int)(circumference / distancePerWaypoint));

            _logger.LogInformation("Creating {Count} waypoints for circle", numberOfWaypoints);

            // Generate waypoints using an approach matching Google Maps' circle display
            // For perfect circles, we need at least 24 points for smooth appearance
            double angleStep = 360.0 / numberOfWaypoints;
            int id = parameters.StartingIndex;

            for (int i = 0; i < numberOfWaypoints; i++)
            {
                // Calculate angle for this waypoint in degrees
                double angle = i * angleStep;
                double angleRad = angle * (Math.PI / 180.0);

                // Calculate heading from center to this point on circle (90 degrees offset from angle)
                double headingFromCenter = (angle + 90) % 360;
                double headingRadians = headingFromCenter * (Math.PI / 180.0);

                // Use the same formula Google Maps uses for geodesic circles
                // This ensures waypoints exactly match the displayed circle
                double angularDistance = radiusMeters / 6378137.0; // Earth radius in meters

                double startLatRad = centerLat * (Math.PI / 180.0);
                double startLonRad = centerLng * (Math.PI / 180.0);

                // Calculate endpoint using spherical law of cosines
                double endLatRad = Math.Asin(
                    Math.Sin(startLatRad) * Math.Cos(angularDistance)
                        + Math.Cos(startLatRad)
                            * Math.Sin(angularDistance)
                            * Math.Cos(headingRadians)
                );

                double endLonRad =
                    startLonRad
                    + Math.Atan2(
                        Math.Sin(headingRadians)
                            * Math.Sin(angularDistance)
                            * Math.Cos(startLatRad),
                        Math.Cos(angularDistance) - Math.Sin(startLatRad) * Math.Sin(endLatRad)
                    );

                // Convert back to degrees
                double waypointLat = endLatRad * (180.0 / Math.PI);
                double waypointLng = endLonRad * (180.0 / Math.PI);

                // Calculate the heading toward the center (reverse of heading from center)
                double headingToCenter = (headingFromCenter + 180.0) % 360.0;

                var waypoint = new Waypoint(
                    id++,
                    waypointLat,
                    waypointLng,
                    parameters.Altitude,
                    parameters.Speed,
                    parameters.Action
                );

                waypoint.Heading = headingToCenter;
                waypoints.Add(waypoint);
            }

            // Log the first waypoint for debugging
            if (waypoints.Count > 0)
            {
                var firstWp = waypoints[0];
                _logger.LogInformation(
                    "First waypoint: Lat={Lat}, Lng={Lng}, Heading={Heading}",
                    firstWp.Lat,
                    firstWp.Lng,
                    firstWp.Heading
                );

                // Calculate and log the distance from center to first waypoint to verify radius
                double distance = _geometryService.CalculateDistance(
                    center.Lat,
                    center.Lng,
                    firstWp.Lat,
                    firstWp.Lng
                );
                _logger.LogInformation(
                    "Distance from center to first waypoint: {Distance}m (should be close to radius: {Radius}m)",
                    distance,
                    radiusMeters
                );
            }

            _logger.LogInformation("Generated {Count} waypoints for circle", waypoints.Count);
            return waypoints;
        }
    }
}
