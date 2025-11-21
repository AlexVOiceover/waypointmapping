using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Newtonsoft.Json;
using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.DTOs
{
    /// <summary>
    /// Data Transfer Object for waypoint generation requests
    /// </summary>
    public class GeneratePointsRequestDTO
    {
        /// <summary>
        /// Gets or sets the unit type for measurements (0 = Metric, 1 = Imperial)
        /// </summary>
        [JsonProperty("UnitType")]
        [Range(0, 1, ErrorMessage = "UnitType must be 0 (Metric) or 1 (Imperial)")]
        public int UnitType { get; set; }

        /// <summary>
        /// Gets or sets the action to perform at waypoints
        /// Legacy property, prefer using AllPointsAction
        /// </summary>
        public string? Action { get; set; }

        /// <summary>
        /// Gets or sets the altitude in meters
        /// </summary>
        [JsonProperty("Altitude")]
        [Range(1, 500, ErrorMessage = "Altitude must be between 1 and 500 meters")]
        public double Altitude { get; set; }

        /// <summary>
        /// Gets or sets the speed in meters per second
        /// </summary>
        [JsonProperty("Speed")]
        [Range(0.1, 25, ErrorMessage = "Speed must be between 0.1 and 25 m/s")]
        public double Speed { get; set; }

        /// <summary>
        /// Gets or sets the distance between lines in meters
        /// Legacy property, prefer using LineSpacing
        /// </summary>
        [JsonProperty("distance")]
        [Obsolete("Use LineSpacing instead")]
        public double Distance { get; set; }

        /// <summary>
        /// Gets or sets the distance between lines in meters
        /// </summary>
        [JsonProperty("LineSpacing")]
        [Range(0.1, 1000, ErrorMessage = "LineSpacing must be between 0.1 and 1000 meters")]
        public double LineSpacing { get; set; }

        /// <summary>
        /// Gets or sets the interval for photo capture
        /// Legacy property, prefer using PhotoInterval
        /// </summary>
        [JsonProperty("interval")]
        [Obsolete("Use PhotoInterval instead")]
        public double Interval { get; set; }

        /// <summary>
        /// Gets or sets the list of coordinate points that define the bounds of the shape.
        /// </summary>
        [JsonProperty("Bounds")]
        [Required(ErrorMessage = "Bounds are required")]
        [MinLength(1, ErrorMessage = "At least one coordinate is required")]
        public List<Coordinate> Bounds { get; set; } = [];

        /// <summary>
        /// Gets or sets the type of bounds (e.g., "rectangle", "polygon").
        /// </summary>
        [JsonProperty("BoundsType")]
        [Required(ErrorMessage = "BoundsType is required")]
        public string BoundsType { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the starting index for waypoint IDs.
        /// </summary>
        [JsonProperty("StartingIndex")]
        [Range(0, int.MaxValue, ErrorMessage = "StartingIndex must be non-negative")]
        public int StartingIndex { get; set; }

        /// <summary>
        /// Gets or sets the action for all points.
        /// </summary>
        [JsonProperty("AllPointsAction")]
        public string? AllPointsAction { get; set; }

        /// <summary>
        /// Gets or sets whether to use only endpoints when generating waypoints.
        /// </summary>
        [JsonProperty("UseEndpointsOnly")]
        public bool UseEndpointsOnly { get; set; }

        /// <summary>
        /// Gets or sets whether to use north-south direction.
        /// </summary>
        [JsonProperty("IsNorthSouth")]
        public bool IsNorthSouth { get; set; }

        /// <summary>
        /// Gets or sets the photo interval.
        /// </summary>
        [JsonProperty("PhotoInterval")]
        [Range(0.1, 100, ErrorMessage = "PhotoInterval must be between 0.1 and 100 meters")]
        public double PhotoInterval { get; set; }

        /// <summary>
        /// Gets or sets the overlap percentage.
        /// </summary>
        [JsonProperty("Overlap")]
        [Range(0, 100, ErrorMessage = "Overlap must be between 0 and 100 percent")]
        public double Overlap { get; set; }

        /// <summary>
        /// Gets or sets the final action.
        /// </summary>
        [JsonProperty("FinalAction")]
        public string? FinalAction { get; set; }

        /// <summary>
        /// Gets or sets the angle for the waypoints.
        /// </summary>
        [JsonProperty("Angle")]
        [Range(-90, 90, ErrorMessage = "Angle must be between -90 and 90 degrees")]
        public double Angle { get; set; }

        /// <summary>
        /// Gets or sets whether to flip the path.
        /// </summary>
        [JsonProperty("FlipPath")]
        public bool FlipPath { get; set; }

        /// <summary>
        /// Gets or sets the camera focal length in millimeters.
        /// </summary>
        [JsonProperty("FocalLength")]
        [Range(1, 1000, ErrorMessage = "FocalLength must be between 1 and 1000 mm")]
        public double FocalLength { get; set; }

        /// <summary>
        /// Gets or sets the camera sensor width in millimeters.
        /// </summary>
        [JsonProperty("SensorWidth")]
        [Range(1, 100, ErrorMessage = "SensorWidth must be between 1 and 100 mm")]
        public double SensorWidth { get; set; }

        /// <summary>
        /// Gets or sets the camera sensor height in millimeters.
        /// </summary>
        [JsonProperty("SensorHeight")]
        [Range(1, 100, ErrorMessage = "SensorHeight must be between 1 and 100 mm")]
        public double SensorHeight { get; set; }

        /// <summary>
        /// Gets or sets whether the speed was manually set.
        /// </summary>
        [JsonProperty("ManualSpeedSet")]
        public bool ManualSpeedSet { get; set; }
    }
}
