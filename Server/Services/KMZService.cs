using System.Globalization;
using System.IO.Compression;
using System.Xml.Linq;
using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.Services
{
    public class KMZService : IKMZService
    {
        private static readonly XNamespace kmlNs = "http://www.opengis.net/kml/2.2"; // KML namespace
        private static readonly XNamespace wpmlNs = "http://www.dji.com/wpmz/1.0.2"; // WPML namespace

        public async Task<byte[]> GenerateKmzAsync(FlyToWaylineRequest request)
        {
            // Set default values if needed
            SetDefaultValues(request);
            // Generate KML content programmatically
            string kmlContent = await GenerateKmlAsync(request);

            // Generate WPML content programmatically
            string wpmlContent = await GenerateWpmlAsync(request);

            // Create KMZ (ZIP) file with KML and WPML files
            return await CreateKmzAsync(kmlContent, wpmlContent);
        }

        private void SetDefaultValues(FlyToWaylineRequest request)
        {
            if (request.Waypoints == null || !request.Waypoints.Any())
            {
                request.Waypoints = GetDefaultWaypoints();
            }

            // Set default values if needed
            request.FlyToWaylineMode ??= "safely";
            request.FinishAction ??= "noAction";
            request.ExitOnRCLost ??= "executeLostAction";
            request.ExecuteRCLostAction ??= "hover";
            request.GlobalTransitionalSpeed =
                request.GlobalTransitionalSpeed <= 0
                    ? DroneDefaults.GlobalTransitionalSpeed
                    : request.GlobalTransitionalSpeed;

            if (request.DroneInfo == null)
            {
                request.DroneInfo = new DroneInfo
                {
                    DroneEnumValue = DroneDefaults.DroneEnumValue,
                    DroneSubEnumValue = DroneDefaults.DroneSubEnumValue
                };
            }
        }

        private List<WaypointGen> GetDefaultWaypoints()
        {
            // Default waypoints
            return new List<WaypointGen>
            {
                new WaypointGen
                {
                    Latitude = 60.4040751527782,
                    Longitude = 26.254953488815023,
                    ExecuteHeight = 40,
                    WaypointSpeed = 2.5,
                    Index = 0
                },
                new WaypointGen
                {
                    Latitude = 60.4040751527782,
                    Longitude = 26.25485348881502,
                    ExecuteHeight = 40,
                    WaypointSpeed = 2.5,
                    Index = 1
                },
                new WaypointGen
                {
                    Latitude = 60.4040751527782,
                    Longitude = 26.25275348881502,
                    ExecuteHeight = 40,
                    WaypointSpeed = 2.5,
                    Index = 2
                }
            };
        }

        private async Task<string> GenerateKmlAsync(FlyToWaylineRequest request)
        {
            // Create KML content programmatically
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var kmlDocument = new XDocument(
                new XElement(
                    kmlNs + "kml", // KML namespace in root element
                    new XAttribute(XNamespace.Xmlns + "wpml", wpmlNs), // WPML namespace defined at root level
                    new XElement(
                        kmlNs + "Document",
                        // Use wpmlNs and kmlNs only where they are actually needed
                        new XElement(
                            wpmlNs + "missionConfig",
                            new XElement(wpmlNs + "flyToWaylineMode", request.FlyToWaylineMode),
                            new XElement(wpmlNs + "finishAction", request.FinishAction),
                            new XElement(wpmlNs + "exitOnRCLost", request.ExitOnRCLost),
                            new XElement(
                                wpmlNs + "executeRCLostAction",
                                request.ExecuteRCLostAction
                            ),
                            new XElement(
                                wpmlNs + "globalTransitionalSpeed",
                                request.GlobalTransitionalSpeed.ToString(
                                    CultureInfo.InvariantCulture
                                ) ?? "2.5"
                            ),
                            new XElement(
                                wpmlNs + "droneInfo",
                                new XElement(
                                    wpmlNs + "droneEnumValue",
                                    request.DroneInfo?.DroneEnumValue.ToString(
                                        CultureInfo.InvariantCulture
                                    ) ?? "68"
                                ),
                                new XElement(
                                    wpmlNs + "droneSubEnumValue",
                                    request.DroneInfo?.DroneSubEnumValue.ToString(
                                        CultureInfo.InvariantCulture
                                    ) ?? "0"
                                )
                            )
                        ),
                        // ActionGroup added correctly to WPML namespace
                        new XElement(
                            wpmlNs + "actionGroup",
                            new XElement(wpmlNs + "actionGroupId", "1"),
                            new XElement(wpmlNs + "actionGroupMode", "parallel"),
                            new XElement(
                                wpmlNs + "actionTrigger",
                                new XElement(wpmlNs + "actionTriggerType", "timeInterval"),
                                new XElement(
                                    wpmlNs + "timeInterval",
                                    request.Interval.ToString(CultureInfo.InvariantCulture)
                                )
                            ),
                            new XElement(
                                wpmlNs + "action",
                                new XElement(wpmlNs + "actionId", "1"),
                                new XElement(wpmlNs + "actionActuatorFunc", "takePhoto")
                            )
                        )
                    )
                )
            );

            // Return KML content as string
            using var stringWriter = new StringWriter();
            kmlDocument.Save(stringWriter);
            return await Task.FromResult(stringWriter.ToString());
        }

        private async Task<string> GenerateWpmlAsync(FlyToWaylineRequest request)
        {
            var wpmlContent = new System.Text.StringBuilder();

            // WPML headers and missionConfig section
            wpmlContent.AppendLine(@"<?xml version=""1.0"" encoding=""UTF-8""?>");
            wpmlContent.AppendLine($@"<kml xmlns=""{kmlNs}"" xmlns:wpml=""{wpmlNs}"">");
            wpmlContent.AppendLine(@"  <Document>");
            wpmlContent.AppendLine(@"    <wpml:missionConfig>");
            wpmlContent.AppendLine(
                $@"      <wpml:flyToWaylineMode>{request.FlyToWaylineMode}</wpml:flyToWaylineMode>"
            );
            wpmlContent.AppendLine(
                $@"      <wpml:finishAction>{request.FinishAction}</wpml:finishAction>"
            );
            wpmlContent.AppendLine(
                $@"      <wpml:exitOnRCLost>{request.ExitOnRCLost}</wpml:exitOnRCLost>"
            );
            wpmlContent.AppendLine(
                $@"      <wpml:executeRCLostAction>{request.ExecuteRCLostAction}</wpml:executeRCLostAction>"
            );
            wpmlContent.AppendLine(
                $@"      <wpml:globalTransitionalSpeed>{request.GlobalTransitionalSpeed.ToString(CultureInfo.InvariantCulture)}</wpml:globalTransitionalSpeed>"
            );
            wpmlContent.AppendLine(@"      <wpml:droneInfo>");
            wpmlContent.AppendLine(
                $@"        <wpml:droneEnumValue>{request.DroneInfo?.DroneEnumValue.ToString(CultureInfo.InvariantCulture) ?? "68"}</wpml:droneEnumValue>"
            );
            wpmlContent.AppendLine(
                $@"        <wpml:droneSubEnumValue>{request.DroneInfo?.DroneSubEnumValue.ToString(CultureInfo.InvariantCulture) ?? "0"}</wpml:droneSubEnumValue>"
            );
            wpmlContent.AppendLine(@"      </wpml:droneInfo>");
            wpmlContent.AppendLine(@"    </wpml:missionConfig>");

            // Start Folder section
            wpmlContent.AppendLine(@"    <Folder>");
            wpmlContent.AppendLine(@"      <wpml:templateId>1</wpml:templateId>"); // Reference to actionGroup
            wpmlContent.AppendLine(
                @"      <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>"
            );
            wpmlContent.AppendLine(@"      <wpml:waylineId>0</wpml:waylineId>");
            wpmlContent.AppendLine(@"      <wpml:distance>0</wpml:distance>");
            wpmlContent.AppendLine(@"      <wpml:duration>0</wpml:duration>");
            wpmlContent.AppendLine(@"      <wpml:autoFlightSpeed>2.5</wpml:autoFlightSpeed>");

            // Add Placemark elements for waypoints
            foreach (var waypoint in request.Waypoints)
            {
                // Define variables for waypoints
                var lat = waypoint.Latitude.ToString("F14", CultureInfo.InvariantCulture);
                var lng = waypoint.Longitude.ToString("F14", CultureInfo.InvariantCulture);
                var height = waypoint.ExecuteHeight.ToString(CultureInfo.InvariantCulture);
                var speed = waypoint.WaypointSpeed.ToString(CultureInfo.InvariantCulture);
                var headingMode = waypoint.WaypointHeadingMode ?? "smooth";
                var headingAngle = waypoint.WaypointHeadingAngle ?? "0";
                var waypointPoiPoint = waypoint.WaypointPoiPoint ?? "0.000000,0.000000,0.000000";
                var headingAngleEnable = waypoint.WaypointHeadingAngleEnable ?? 0;
                var pathMode = waypoint.WaypointHeadingPathMode ?? "followBadArc";
                var turnMode = waypoint.WaypointTurnMode ?? "toPointAndPassWithContinuityCurvature";
                var dampingDist =
                    waypoint.WaypointTurnDampingDist.ToString(CultureInfo.InvariantCulture) ?? "0";
                var useStraightLine = waypoint.UseStraightLine ?? "0";

                // Determine the action to use based on waypoint.Action property
                string actionActuatorFunc = GetActionActuatorFunc(waypoint.Action);
                string actionXml = GetActionXml(actionActuatorFunc);

                // Add Placemark section in WPML content
                wpmlContent.AppendLine(
                    $@"
                       <Placemark>
              <Point>
                  <coordinates>{lng},{lat}</coordinates>
              </Point>
              <wpml:index>{waypoint.Index}</wpml:index>
              <wpml:executeHeight>{height}</wpml:executeHeight>
              <wpml:waypointSpeed>{speed}</wpml:waypointSpeed>
              <wpml:waypointHeadingParam>
                  <wpml:waypointHeadingMode>{headingMode}</wpml:waypointHeadingMode>
                  <wpml:waypointHeadingAngle>{headingAngle}</wpml:waypointHeadingAngle>
                  <wpml:waypointPoiPoint>{waypointPoiPoint}</wpml:waypointPoiPoint>
                  <wpml:waypointHeadingAngleEnable>{headingAngleEnable}</wpml:waypointHeadingAngleEnable>
                  <wpml:waypointHeadingPathMode>{pathMode}</wpml:waypointHeadingPathMode>
              </wpml:waypointHeadingParam>
              <wpml:waypointTurnParam>
                  <wpml:waypointTurnMode>{turnMode}</wpml:waypointTurnMode>
                  <wpml:waypointTurnDampingDist>{dampingDist}</wpml:waypointTurnDampingDist>
              </wpml:waypointTurnParam>
              <wpml:useStraightLine>{useStraightLine}</wpml:useStraightLine>
              <wpml:actionGroup>
                  <wpml:actionGroupId>1</wpml:actionGroupId>
                  <wpml:actionGroupStartIndex>2</wpml:actionGroupStartIndex>
                  <wpml:actionGroupEndIndex>2</wpml:actionGroupEndIndex>
                  <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
                  <wpml:actionTrigger>
                      <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
                  </wpml:actionTrigger>
                  {actionXml}
              </wpml:actionGroup>
         <wpml:actionGroup>
          <wpml:actionGroupId>2</wpml:actionGroupId>
          <wpml:actionGroupStartIndex>2</wpml:actionGroupStartIndex>
          <wpml:actionGroupEndIndex>2</wpml:actionGroupEndIndex>
          <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
          <wpml:actionTrigger>
            <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
          </wpml:actionTrigger>
          <wpml:action>
            <wpml:actionId>7</wpml:actionId>
            <wpml:actionActuatorFunc>gimbalEvenlyRotate</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:gimbalPitchRotateAngle>-45</wpml:gimbalPitchRotateAngle>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:actionActuatorFuncParam>
          </wpml:action>
        </wpml:actionGroup>
          </Placemark>"
                );
            }

            wpmlContent.AppendLine(@"    </Folder>");
            wpmlContent.AppendLine(@"  </Document>");
            wpmlContent.AppendLine(@"</kml>");

            return await Task.FromResult(wpmlContent.ToString());
        }

        private async Task<byte[]> CreateKmzAsync(string kmlContent, string wpmlContent)
        {
            using (var memoryStream = new MemoryStream())
            {
                using (var zipArchive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    // Create KML file in KMZ
                    var kmlEntry = zipArchive.CreateEntry("template.kml");
                    using (var kmlStream = kmlEntry.Open())
                    using (var streamWriter = new StreamWriter(kmlStream))
                    {
                        await streamWriter.WriteAsync(kmlContent);
                    }

                    // Create WPML file in KMZ
                    var wpmlEntry = zipArchive.CreateEntry("waylines.wpml");
                    using (var wpmlStream = wpmlEntry.Open())
                    using (var streamWriter = new StreamWriter(wpmlStream))
                    {
                        await streamWriter.WriteAsync(wpmlContent);
                    }
                }

                return memoryStream.ToArray();
            }
        }

        /// <summary>
        /// Convert the action string from the waypoint to the DJI WPML actionActuatorFunc
        /// </summary>
        private string GetActionActuatorFunc(string action)
        {
            return action?.ToLower() switch
            {
                "takephoto" => "takePhoto",
                "startrecord" => "startRecord",
                "stoprecord" => "stopRecord",
                "noaction" => "none",
                _ => "none" // Default to no action if not recognized
            };
        }

        /// <summary>
        /// Generate the XML action block for the waypoint action
        /// </summary>
        private string GetActionXml(string actionActuatorFunc)
        {
            return actionActuatorFunc switch
            {
                "takePhoto"
                    => @"
                  <wpml:action>
                      <wpml:actionId>1</wpml:actionId>
                      <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
                  </wpml:action>
                  <wpml:action>
                    <wpml:actionId>6</wpml:actionId>
                    <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
                    <wpml:actionActuatorFuncParam>
                      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
                    </wpml:actionActuatorFuncParam>
                  </wpml:action>",
                "startRecord"
                    => @"
                  <wpml:action>
                      <wpml:actionId>1</wpml:actionId>
                      <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
                  </wpml:action>
                  <wpml:action>
                    <wpml:actionId>6</wpml:actionId>
                    <wpml:actionActuatorFunc>startRecord</wpml:actionActuatorFunc>
                    <wpml:actionActuatorFuncParam>
                      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
                    </wpml:actionActuatorFuncParam>
                  </wpml:action>",
                "stopRecord"
                    => @"
                  <wpml:action>
                    <wpml:actionId>6</wpml:actionId>
                    <wpml:actionActuatorFunc>stopRecord</wpml:actionActuatorFunc>
                    <wpml:actionActuatorFuncParam>
                      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
                    </wpml:actionActuatorFuncParam>
                  </wpml:action>",
                _ => "" // No action - empty action group
            };
        }
    }
}
