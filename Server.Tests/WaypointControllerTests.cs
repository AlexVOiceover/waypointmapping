using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using WaypointMapping.Server.Controllers;
using WaypointMapping.Server.DTOs;
using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Models;
using Xunit;

namespace Server.Tests
{
    public class WaypointControllerTests
    {
        private readonly Mock<IWaypointService> _mockWaypointService;
        private readonly Mock<ILogger<WaypointsController>> _mockLogger;
        private readonly WaypointsController _controller;

        public WaypointControllerTests()
        {
            _mockWaypointService = new Mock<IWaypointService>();
            _mockLogger = new Mock<ILogger<WaypointsController>>();
            _controller = new WaypointsController(_mockWaypointService.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GenerateWaypoints_ReturnsOkResult_WithWaypoints()
        {
            // Arrange
            var bounds = new List<Coordinate>
            {
                new Coordinate { Lat = 60.0, Lng = 24.0 },
                new Coordinate { Lat = 60.0, Lng = 25.0 },
                new Coordinate { Lat = 61.0, Lng = 25.0 },
                new Coordinate { Lat = 61.0, Lng = 24.0 }
            };

            var waypoints = new List<Waypoint>
            {
                new Waypoint
                {
                    Index = 1,
                    Lat = 60.0,
                    Lng = 24.0,
                    Alt = 100,
                    Speed = 10,
                    Action = "takePhoto"
                },
                new Waypoint
                {
                    Index = 2,
                    Lat = 60.0,
                    Lng = 25.0,
                    Alt = 100,
                    Speed = 10,
                    Action = "takePhoto"
                }
            };

            _mockWaypointService
                .Setup(s =>
                    s.GenerateWaypointsAsync(
                        It.IsAny<List<ShapeData>>(),
                        It.IsAny<WaypointParameters>()
                    )
                )
                .ReturnsAsync(waypoints);

            // Act
            var result = await _controller.GenerateWaypoints(
                new GeneratePointsRequestDTO
                {
                    AllPointsAction = "takePhoto",
                    UnitType = 0,
                    Altitude = 100,
                    Speed = 10,
                    LineSpacing = 100,
                    Bounds = bounds,
                    BoundsType = "rectangle",
                    StartingIndex = 1,
                    PhotoInterval = 3,
                    UseEndpointsOnly = false,
                    IsNorthSouth = false
                }
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<Waypoint>>(okResult.Value);
            Assert.Equal(waypoints.Count, returnValue.Count);
        }

        [Fact]
        public async Task GenerateWaypoints_WithCircle_ReturnsOkResult()
        {
            // Arrange
            var bounds = new List<Coordinate>
            {
                new Coordinate
                {
                    Lat = 60.0,
                    Lng = 24.0,
                    Radius = 500
                }
            };

            var waypoints = new List<Waypoint>
            {
                new Waypoint
                {
                    Index = 1,
                    Lat = 60.0,
                    Lng = 24.0,
                    Alt = 100,
                    Speed = 10,
                    Action = "takePhoto"
                }
            };

            _mockWaypointService
                .Setup(s =>
                    s.GenerateWaypointsAsync(
                        It.IsAny<List<ShapeData>>(),
                        It.IsAny<WaypointParameters>()
                    )
                )
                .ReturnsAsync(waypoints);

            // Act
            var result = await _controller.GenerateWaypoints(
                new GeneratePointsRequestDTO
                {
                    AllPointsAction = "takePhoto",
                    UnitType = 0,
                    Altitude = 100,
                    Speed = 10,
                    LineSpacing = 100,
                    Bounds = bounds,
                    BoundsType = "circle",
                    StartingIndex = 1,
                    PhotoInterval = 3,
                    UseEndpointsOnly = false,
                    IsNorthSouth = false
                }
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<Waypoint>>(okResult.Value);
            Assert.Single(returnValue);
        }
    }
}
