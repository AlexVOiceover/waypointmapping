using WaypointMapping.Server.Interfaces;
using WaypointMapping.Server.Services;
using System.Globalization;

namespace WaypointMapping.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Register dependencies
            RegisterServices(builder.Services);

            var cultureInfo = new CultureInfo("en-US");
            CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
            
            builder.Services.AddControllers();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    });
            });

            var app = builder.Build();

            app.UseCors("AllowAll");
            app.UseDefaultFiles();

            app.UseHttpsRedirection();
            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        private static void RegisterServices(IServiceCollection services)
        {
            // Register service components
            services.AddScoped<IGeometryService, GeometryService>();
            services.AddScoped<IShapeService, RectangleShapeService>();
            services.AddScoped<IShapeService, PolygonShapeService>();
            services.AddScoped<IShapeService, CircleShapeService>();
            services.AddScoped<IShapeService, PolylineShapeService>();
            services.AddScoped<IWaypointService, WaypointService>();

            // Other services
            services.AddScoped<IKMZService, KMZService>();
        }
    }
}
