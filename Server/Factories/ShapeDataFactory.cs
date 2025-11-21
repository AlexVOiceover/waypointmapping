using WaypointMapping.Server.Models;

namespace WaypointMapping.Server.Factories
{
    public static class ShapeDataFactory
    {
        public static ShapeData CreateFromBoundsType(
            string boundsType,
            List<Coordinate> bounds,
            string id = "1"
        )
        {
            if (bounds == null || bounds.Count == 0)
            {
                throw new ArgumentException("Bounds cannot be null or empty", nameof(bounds));
            }

            return boundsType?.ToLower() switch
            {
                "rectangle"
                    => new ShapeData
                    {
                        Id = id,
                        Type = ShapeTypes.Rectangle,
                        Coordinates = bounds
                    },
                "polygon"
                    => new ShapeData
                    {
                        Id = id,
                        Type = ShapeTypes.Polygon,
                        Coordinates = bounds
                    },
                "circle" => CreateCircleShape(bounds, id),
                "polyline"
                    => new ShapeData
                    {
                        Id = id,
                        Type = ShapeTypes.Polyline,
                        Coordinates = bounds
                    },
                _ => throw new ArgumentException($"Unknown bounds type: {boundsType}")
            };
        }

        private static ShapeData CreateCircleShape(List<Coordinate> bounds, string id)
        {
            if (bounds.Count == 0)
            {
                throw new ArgumentException("Circle bounds must contain at least one coordinate");
            }

            var center = bounds[0];
            double radius = center.Radius > 0 ? center.Radius : 100;

            return new ShapeData
            {
                Id = id,
                Type = ShapeTypes.Circle,
                Coordinates = new List<Coordinate> { center },
                Radius = radius
            };
        }
    }
}
