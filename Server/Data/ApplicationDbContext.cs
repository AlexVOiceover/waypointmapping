using WaypointMapping.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace WaypointMapping.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<Waypoint> Waypoints { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
    }
}
