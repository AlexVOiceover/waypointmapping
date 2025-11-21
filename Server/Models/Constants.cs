namespace WaypointMapping.Server.Models
{
    /// <summary>
    /// Constants for waypoint actions
    /// </summary>
    public static class WaypointActions
    {
        public const string NoAction = "noAction";
        public const string TakePhoto = "takePhoto";
        public const string StartRecord = "startRecord";
        public const string StopRecord = "stopRecord";
    }

    /// <summary>
    /// Constants for shape types
    /// </summary>
    public static class ShapeTypes
    {
        public const string Rectangle = "rectangle";
        public const string Polygon = "polygon";
        public const string Circle = "circle";
        public const string Polyline = "polyline";
    }

    /// <summary>
    /// Constants for drone configuration
    /// </summary>
    public static class DroneDefaults
    {
        /// <summary>
        /// Default drone model enum value (68 = DJI Mavic 3 Enterprise)
        /// </summary>
        public const int DroneEnumValue = 68;

        /// <summary>
        /// Default drone sub-model enum value
        /// </summary>
        public const int DroneSubEnumValue = 0;

        /// <summary>
        /// Default global transitional speed in m/s
        /// </summary>
        public const double GlobalTransitionalSpeed = 2.5;
    }
}
