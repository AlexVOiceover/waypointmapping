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
            var document = new XDocument(
                new XElement(
                    kmlNs + "kml",
                    new XAttribute(XNamespace.Xmlns + "wpml", wpmlNs),
                    new XElement(
                        kmlNs + "Document",
                        new XElement(
                            wpmlNs + "missionConfig",
                            new XElement(wpmlNs + "flyToWaylineMode", request.FlyToWaylineMode),
                            new XElement(wpmlNs + "finishAction", request.FinishAction),
                            new XElement(wpmlNs + "exitOnRCLost", request.ExitOnRCLost),
                            new XElement(wpmlNs + "executeRCLostAction", request.ExecuteRCLostAction),
                            new XElement(
                                wpmlNs + "globalTransitionalSpeed",
                                request.GlobalTransitionalSpeed.ToString(CultureInfo.InvariantCulture)
                            ),
                            new XElement(
                                wpmlNs + "droneInfo",
                                new XElement(
                                    wpmlNs + "droneEnumValue",
                                    request.DroneInfo?.DroneEnumValue.ToString(CultureInfo.InvariantCulture)
                                        ?? DroneDefaults.DroneEnumValue.ToString(CultureInfo.InvariantCulture)
                                ),
                                new XElement(
                                    wpmlNs + "droneSubEnumValue",
                                    request.DroneInfo?.DroneSubEnumValue.ToString(CultureInfo.InvariantCulture)
                                        ?? DroneDefaults.DroneSubEnumValue.ToString(CultureInfo.InvariantCulture)
                                )
                            )
                        ),
                        new XElement(
                            kmlNs + "Folder",
                            new XElement(wpmlNs + "templateId", "1"),
                            new XElement(wpmlNs + "executeHeightMode", "relativeToStartPoint"),
                            new XElement(wpmlNs + "waylineId", "0"),
                            new XElement(wpmlNs + "distance", "0"),
                            new XElement(wpmlNs + "duration", "0"),
                            new XElement(
                                wpmlNs + "autoFlightSpeed",
                                request.GlobalTransitionalSpeed.ToString(CultureInfo.InvariantCulture)
                            ),
                            request.Waypoints.Select(CreatePlacemark)
                        )
                    )
                )
            );

            using var stringWriter = new StringWriter();
            document.Save(stringWriter);
            return await Task.FromResult(stringWriter.ToString());
        }

        private XElement CreatePlacemark(WaypointGen waypoint)
        {
            string actuatorFunc = GetActionActuatorFunc(waypoint.Action);
            var actionGroup = CreateActionGroup(actuatorFunc, waypoint.Index);

            return new XElement(
                kmlNs + "Placemark",
                new XElement(
                    kmlNs + "Point",
                    new XElement(
                        kmlNs + "coordinates",
                        $"{waypoint.Longitude.ToString("F14", CultureInfo.InvariantCulture)}," +
                        $"{waypoint.Latitude.ToString("F14", CultureInfo.InvariantCulture)}"
                    )
                ),
                new XElement(wpmlNs + "index", waypoint.Index),
                new XElement(
                    wpmlNs + "executeHeight",
                    waypoint.ExecuteHeight.ToString(CultureInfo.InvariantCulture)
                ),
                new XElement(
                    wpmlNs + "waypointSpeed",
                    waypoint.WaypointSpeed.ToString(CultureInfo.InvariantCulture)
                ),
                new XElement(
                    wpmlNs + "waypointHeadingParam",
                    new XElement(
                        wpmlNs + "waypointHeadingMode",
                        waypoint.WaypointHeadingMode ?? "smooth"
                    ),
                    new XElement(
                        wpmlNs + "waypointHeadingAngle",
                        waypoint.WaypointHeadingAngle?.ToString() ?? "0"
                    ),
                    new XElement(
                        wpmlNs + "waypointPoiPoint",
                        waypoint.WaypointPoiPoint ?? "0.000000,0.000000,0.000000"
                    ),
                    new XElement(
                        wpmlNs + "waypointHeadingAngleEnable",
                        waypoint.WaypointHeadingAngleEnable ?? 0
                    ),
                    new XElement(
                        wpmlNs + "waypointHeadingPathMode",
                        waypoint.WaypointHeadingPathMode ?? "followBadArc"
                    )
                ),
                new XElement(
                    wpmlNs + "waypointTurnParam",
                    new XElement(
                        wpmlNs + "waypointTurnMode",
                        waypoint.WaypointTurnMode ?? "toPointAndPassWithContinuityCurvature"
                    ),
                    new XElement(
                        wpmlNs + "waypointTurnDampingDist",
                        waypoint.WaypointTurnDampingDist.ToString(CultureInfo.InvariantCulture)
                    )
                ),
                new XElement(wpmlNs + "useStraightLine", waypoint.UseStraightLine ?? "0"),
                actionGroup
            );
        }

        private XElement? CreateActionGroup(string actuatorFunc, int waypointIndex)
        {
            if (string.IsNullOrWhiteSpace(actuatorFunc) || actuatorFunc == "none")
            {
                return null;
            }

            return new XElement(
                wpmlNs + "actionGroup",
                new XElement(wpmlNs + "actionGroupId", waypointIndex),
                new XElement(wpmlNs + "actionGroupStartIndex", waypointIndex),
                new XElement(wpmlNs + "actionGroupEndIndex", waypointIndex),
                new XElement(wpmlNs + "actionGroupMode", "parallel"),
                new XElement(
                    wpmlNs + "actionTrigger",
                    new XElement(wpmlNs + "actionTriggerType", "reachPoint")
                ),
                CreateActionElement(actuatorFunc)
            );
        }

        private XElement CreateActionElement(string actuatorFunc)
        {
            return actuatorFunc switch
            {
                "takePhoto"
                    => new XElement(
                        wpmlNs + "action",
                        new XElement(wpmlNs + "actionId", "6"),
                        new XElement(wpmlNs + "actionActuatorFunc", "takePhoto"),
                        new XElement(
                            wpmlNs + "actionActuatorFuncParam",
                            new XElement(wpmlNs + "payloadPositionIndex", "0")
                        )
                    ),
                "startRecord"
                    => new XElement(
                        wpmlNs + "action",
                        new XElement(wpmlNs + "actionId", "6"),
                        new XElement(wpmlNs + "actionActuatorFunc", "startRecord"),
                        new XElement(
                            wpmlNs + "actionActuatorFuncParam",
                            new XElement(wpmlNs + "payloadPositionIndex", "0")
                        )
                    ),
                "stopRecord"
                    => new XElement(
                        wpmlNs + "action",
                        new XElement(wpmlNs + "actionId", "6"),
                        new XElement(wpmlNs + "actionActuatorFunc", "stopRecord"),
                        new XElement(
                            wpmlNs + "actionActuatorFuncParam",
                            new XElement(wpmlNs + "payloadPositionIndex", "0")
                        )
                    ),
                _ => new XElement(wpmlNs + "action") // Fallback empty action
            };
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

    }
}
