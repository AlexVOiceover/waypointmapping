namespace WaypointMapping.Server.Models
{
    public class KmlRequestModel
    {
        public string FlyToWaylineMode { get; set; } = "safely";
        public string FinishAction { get; set; } = "noAction";
        public string ExitOnRCLost { get; set; } = "executeLostAction";
        public string ExecuteRCLostAction { get; set; } = "hover";
        public double GlobalTransitionalSpeed { get; set; }
        public DroneInfoModel DroneInfo { get; set; } = new DroneInfoModel();
        public List<WaypointModel> Waypoints { get; set; } = [];
        public List<ActionGroupModel> ActionGroups { get; set; } = [];
    }
}
