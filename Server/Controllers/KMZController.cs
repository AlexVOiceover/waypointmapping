using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Models;
using WaypointMapping.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace WaypointMapping.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KMZController : ControllerBase
    {
        private readonly 
            IKMZService _kmzService;

        public KMZController(IKMZService kmzService)
        {
            _kmzService = kmzService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateKmlAndWpml([FromBody] FlyToWaylineRequest request)
        {
            if (request == null)
            {
                return BadRequest("The request field is required.");
            }
            // Generate KMZ file asynchronously with service
            byte[] kmzFile = await _kmzService.GenerateKmzAsync(request);

            // Return KMZ file for download
            return File(kmzFile, "application/vnd.google-earth.kmz", "output.kmz");
        }
    }
}
