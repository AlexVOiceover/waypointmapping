using Microsoft.AspNetCore.Mvc;
using WaypointMapping.Server.DTOs;
using WaypointMapping.Server.Factories;
using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.Controllers
{
    //[Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WaypointsController : ControllerBase
    {
        private readonly IWaypointService _waypointService;
        private readonly ILogger<WaypointsController> _logger;

        public WaypointsController(
            IWaypointService waypointService,
            ILogger<WaypointsController> logger
        )
        {
            _waypointService = waypointService;
            _logger = logger;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateWaypoints(
            [FromBody] GeneratePointsRequestDTO request
        )
        {
            try
            {
                _logger.LogInformation("Generating waypoints for {BoundsType}", request.BoundsType);

                string action = request.AllPointsAction ?? request.Action ?? "takePhoto";
                double lineSpacing = request.LineSpacing;
                double photoInterval = request.PhotoInterval;
                bool isNorthSouth = request.IsNorthSouth;

                // Force isNorthSouth to false for polylines
                if (request.BoundsType.ToLower() == "polyline")
                {
                    isNorthSouth = false;
                }

                // Create parameter object
                var parameters = new WaypointParameters
                {
                    Altitude = request.Altitude,
                    Speed = request.Speed,
                    Angle = request.Angle,
                    LineSpacing = lineSpacing,
                    StartingIndex = request.StartingIndex,
                    Action = action,
                    PhotoInterval = photoInterval,
                    UseEndpointsOnly = request.UseEndpointsOnly,
                    IsNorthSouth = isNorthSouth,
                    UnitType = request.UnitType,
                    FocalLength = request.FocalLength,
                    SensorWidth = request.SensorWidth,
                    SensorHeight = request.SensorHeight,
                    Overlap = request.Overlap,
                    ManualSpeedSet = request.ManualSpeedSet
                };

                // Map boundaries to shape data
                var shapes = new List<ShapeData>();

                if (request.Bounds.Count > 0)
                {
                    var shape = ShapeDataFactory.CreateFromBoundsType(
                        request.BoundsType,
                        request.Bounds
                    );

                    if (shape.Type == ShapeTypes.Circle)
                    {
                        _logger.LogInformation(
                            "Processing circle with center at ({Lat}, {Lng}) and radius {Radius}m",
                            shape.Coordinates[0].Lat,
                            shape.Coordinates[0].Lng,
                            shape.Radius
                        );
                    }

                    shapes.Add(shape);
                }

                var result = await _waypointService.GenerateWaypointsAsync(shapes, parameters);

                if (result == null || result.Count == 0)
                {
                    _logger.LogWarning(
                        "No waypoints generated for {BoundsType}",
                        request.BoundsType
                    );
                    return Ok(result ?? new List<Waypoint>());
                }

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid arguments: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation: {Message}", ex.Message);
                return UnprocessableEntity(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error generating waypoints");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
