namespace WaypointMapping.Server.Models
{
    public class ActionModel
    {
        public int ActionId { get; set; }
        public string ActionActuatorFunc { get; set; } = string.Empty;
        public double GimbalPitchRotateAngle { get; set; }
        public int PayloadPositionIndex { get; set; }
    }
}
