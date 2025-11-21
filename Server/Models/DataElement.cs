namespace WaypointMapping.Server.Models
{
    internal class DataElement : SharpKml.Dom.Data
    {
        public new string Name { get; set; } = string.Empty;
        public new string Value { get; set; } = string.Empty;
    }
}
