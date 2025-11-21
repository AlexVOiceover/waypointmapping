namespace WaypointMapping.Server.Models
{
    public class InputModel
    {
        public List<WaypointModel> Waypoints { get; set; } = [];
        public string? MissionName { get; set; }
        public int In_numberOfDrones { get; set; }
        public int In_batteryFlightMinutes { get; set; }
        public int FinalAction { get; set; }
    }
}
