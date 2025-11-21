using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace WaypointMapping.Server.Models
{
    public class ActionGroupModel
    {
        public int ActionGroupId { get; set; }
        public int ActionGroupStartIndex { get; set; }
        public int ActionGroupEndIndex { get; set; }
        public string ActionGroupMode { get; set; } = string.Empty;
        public string ActionTriggerType { get; set; } = string.Empty;
        public ActionModel Action { get; set; } = new ActionModel();
    }
}
