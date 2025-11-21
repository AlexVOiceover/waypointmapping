using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.Interfaces
{
    public interface IKMZService
    {
        Task<byte[]> GenerateKmzAsync(FlyToWaylineRequest request);
    }
}
