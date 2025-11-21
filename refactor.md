# WaypointMapping Refactoring Guide

**Version:** 1.0
**Date:** 2025-01-21
**Status:** Living Document

---

## Executive Summary

The WaypointMapping application is a React 18 + .NET 8 drone flight path planning tool with good architectural foundations but several areas requiring improvement. This document provides a comprehensive guide to refactoring opportunities that will improve maintainability, robustness, and type safety without adding unnecessary complexity.

**Key Statistics:**
- **Server:** 33 C# files (~7,000 lines after removing 1,036 lines of legacy code)
- **Client:** 40+ TypeScript/JavaScript files, ~15,000 lines
- **Build Status:** ✅ **0 Errors, 0 Warnings** (down from 39 warnings)
- **Test Status:** ✅ **20/20 Tests Passing**
- **Critical Issues:** ~~1~~ → **0** ✅ (Architecture migration completed)
- **Major Issues:** ~~12~~ → **6** ✅ (Server-side refactoring completed)
- **Minor Issues:** 20+ (Code Quality, Testing, Configuration)

---

## 1. Critical Issues (Must Fix)

### ✅ 1.1 Architecture: Dual Service Implementation (Transition State) - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Fixed 4 failing polyline and integration tests
   - Added single-point polyline support to PolylineShapeService
   - Fixed integration test setup to use WaypointService (was using legacy)
   - Fixed rectangle test data (was missing 2 corners)
   - Added Haversine formula mock to PolylineShapeServiceTests for realistic distance calculations
2. ✅ Removed `WaypointServiceAdapter.cs` (228 lines)
3. ✅ Removed legacy `WaypointService.cs` (808 lines)
4. ✅ Removed legacy `WaypointServiceTests.cs` test file
5. ✅ Renamed `WaypointServiceV2` → `WaypointService` (removed "V2" suffix)
6. ✅ Updated `Program.cs` to use `WaypointService` directly as `IWaypointService`
7. ✅ Updated test files to match new naming
8. ✅ All 20 tests passing
9. ✅ Solution builds with 0 warnings and 0 errors

**Final Implementation:**
```csharp
// Program.cs - Simplified and clean
services.AddScoped<IGeometryService, GeometryService>();
services.AddScoped<IShapeService, RectangleShapeService>();
services.AddScoped<IShapeService, PolygonShapeService>();
services.AddScoped<IShapeService, CircleShapeService>();
services.AddScoped<IShapeService, PolylineShapeService>();
services.AddScoped<IWaypointService, WaypointService>();
```

**Code Reduction:**
- **Removed:** 1,036+ lines of legacy/adapter code
- **Simplified:** DI registration from 9 lines to 6
- **Reduced Tests:** From 26 to 20 (removed 6 legacy-specific tests)

---

### ✅ 1.2 Duplicate API Endpoints - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Updated `/api/waypoints/generate` endpoint to use new WaypointService interface
   - Now uses `GenerateWaypointsAsync(List<ShapeData>, WaypointParameters)`
   - Includes all advanced parameters (camera settings, etc.)
   - Simplified and cleaner implementation
2. ✅ Removed `/api/waypoints/generatePointsV2` endpoint (unused by client)
3. ✅ Updated controller tests to use new interface
4. ✅ Removed unused imports from WaypointsController
5. ✅ All 20 tests passing
6. ✅ Clean build (0 warnings, 0 errors)

**Final Implementation:**
```csharp
[HttpPost("generate")]
public async Task<IActionResult> GenerateWaypoints([FromBody] GeneratePointsRequestDTO request)
{
    // Maps request to ShapeData and WaypointParameters
    var shapes = MapToShapeData(request);
    var parameters = MapToWaypointParameters(request);

    // Uses unified WaypointService interface
    var result = await _waypointService.GenerateWaypointsAsync(shapes, parameters);
    return Ok(result);
}
```

**Code Reduction:**
- **Removed:** ~120 lines of duplicate endpoint code
- **Single endpoint:** `/api/waypoints/generate` handles all requests
- **Backward compatible:** Client continues using same endpoint URL

---

## 2. Server-Side Refactoring Opportunities

### ✅ 2.1 Nullable Reference Warnings (CS8618) - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Fixed all CS8618 nullable warnings across DTOs and Models
2. ✅ Fixed CS8600, CS8601, CS8603 nullable warnings in Controllers
3. ✅ Fixed CS1998 async warning in Program.cs
4. ✅ Applied default values for string properties (e.g., "takePhoto", string.Empty)
5. ✅ Applied default values for collection properties using `[]` syntax
6. ✅ Applied nullable types (`string?`) where appropriate (optional fields)
7. ✅ Added `new` keyword for DataElement to suppress CS0108 warnings
8. ✅ **RESULT: 0 Errors, 0 Warnings** (down from 39 warnings)

**Files updated (17 total):**
- `Server/DTOs/WaypointDTO.cs` - Action default value
- `Server/DTOs/GeneratePointsRequestDTO.cs` - Nullable for optional fields, defaults for required
- `Server/Models/ActionGroupModel.cs` - Default values
- `Server/Models/ActionModel.cs` - Default values
- `Server/Models/BoundModel.cs` - Action default value
- `Server/Models/DataElement.cs` - Added `new` keyword, default values
- `Server/Models/WaypointParameters.cs` - Action default value
- `Server/Models/WaypointModel.cs` - Action default value
- `Server/Models/WaypointGen.cs` - Default values for all string properties
- `Server/Data/Waypoint.cs` - Action default value
- `Server/Models/Waypoint.cs` - Action default value
- `Server/Models/ShapeData.cs` - Default values for Id and Type
- `Server/Models/KmlRequestModel.cs` - Default values for all properties
- `Server/Models/InputModel.cs` - Collection initialization
- `Server/Models/FlyToWaylineRequest.cs` - Collection initialization
- `Server/Models/CoordinateCircle.cs` - Type default value
- `Server/Controllers/WaypointsController.cs` - Fixed null reference warnings
- `Server/Services/PolylineShapeService.cs` - Nullable return type
- `Server/Program.cs` - Removed unnecessary async

**Final Implementation Examples:**
```csharp
// Option 1: Default value for required strings
public string Action { get; set; } = "takePhoto";

// Option 2: Nullable for optional strings
public string? AllPointsAction { get; set; }

// Option 3: Collection initialization
public List<Coordinate> Bounds { get; set; } = [];

// Option 4: Hiding inherited members
public new string Name { get; set; } = string.Empty;
```

**Additional fixes:**
- Controllers: Fixed null coalescing with fallback to "takePhoto"
- Controllers: Removed unnecessary null checks for properties with default values
- Services: Changed `Coordinate` return type to `Coordinate?` for nullable returns
- Program.cs: Changed `async Task Main` to `void Main` (no async operations needed)

---

### ✅ 2.2 Extract Shape Type Mapping to Factory - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Created `Server/Factories/ShapeDataFactory.cs` with `CreateFromBoundsType` method
2. ✅ Implemented switch expression pattern for all shape types (rectangle, polygon, circle, polyline)
3. ✅ Added special handling for circle shapes (radius extraction)
4. ✅ Updated `WaypointsController.cs` to use factory
5. ✅ Reduced controller code from ~60 lines to ~20 lines
6. ✅ All 20 tests passing

**Final Implementation:**
```csharp
// Server/Factories/ShapeDataFactory.cs
public static class ShapeDataFactory
{
    public static ShapeData CreateFromBoundsType(string boundsType, List<Coordinate> bounds, string id = "1")
    {
        return boundsType?.ToLower() switch
        {
            "rectangle" => new ShapeData { Id = id, Type = ShapeTypes.Rectangle, Coordinates = bounds },
            "polygon" => new ShapeData { Id = id, Type = ShapeTypes.Polygon, Coordinates = bounds },
            "circle" => CreateCircleShape(bounds, id),
            "polyline" => new ShapeData { Id = id, Type = ShapeTypes.Polyline, Coordinates = bounds },
            _ => throw new ArgumentException($"Unknown bounds type: {boundsType}")
        };
    }
}
```

**Code Reduction:**
- **Removed:** ~40 lines of duplicate shape mapping logic from controller
- **Centralized:** Shape creation logic in one reusable location
- **Improved:** Error handling with ArgumentException for unknown types

---

### ✅ 2.3 Add Input Validation with Data Annotations - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Added validation attributes to GeneratePointsRequestDTO
2. ✅ Added [Range] attributes for numeric properties (Altitude, Speed, LineSpacing, PhotoInterval, Overlap, Angle, etc.)
3. ✅ Added [Required] and [MinLength] for Bounds and BoundsType
4. ✅ All validation constraints aligned with drone flight parameters
5. ✅ Build successful with 0 errors, 39 warnings (all CS8618 nullable - documented)

**Final Implementation:**
```csharp
[Range(0.1, 1000, ErrorMessage = "LineSpacing must be between 0.1 and 1000 meters")]
public double LineSpacing { get; set; }

[Range(1, 500, ErrorMessage = "Altitude must be between 1 and 500 meters")]
public double Altitude { get; set; }

[Range(0.1, 25, ErrorMessage = "Speed must be between 0.1 and 25 m/s")]
public double Speed { get; set; }

[Required(ErrorMessage = "Bounds are required")]
[MinLength(1, ErrorMessage = "At least one coordinate is required")]
public List<Coordinate> Bounds { get; set; }

[Required(ErrorMessage = "BoundsType is required")]
public string BoundsType { get; set; }

[Range(0.1, 100, ErrorMessage = "PhotoInterval must be between 0.1 and 100 meters")]
public double PhotoInterval { get; set; }

[Range(0, 100, ErrorMessage = "Overlap must be between 0 and 100 percent")]
public double Overlap { get; set; }

[Range(-90, 90, ErrorMessage = "Angle must be between -90 and 90 degrees")]
public double Angle { get; set; }

[Range(1, 1000, ErrorMessage = "FocalLength must be between 1 and 1000 mm")]
public double FocalLength { get; set; }

[Range(1, 100, ErrorMessage = "SensorWidth must be between 1 and 100 mm")]
public double SensorWidth { get; set; }

[Range(1, 100, ErrorMessage = "SensorHeight must be between 1 and 100 mm")]
public double SensorHeight { get; set; }
```

**Improvements:**
- **Input validation:** All numeric parameters now have range validation
- **Required fields:** Bounds and BoundsType marked as required
- **Error messages:** Clear, user-friendly validation error messages
- **API robustness:** Invalid requests will be rejected with 400 Bad Request automatically

---

### ✅ 2.4 Improve Exception Handling - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Added specific exception handling for ArgumentException (400 Bad Request)
2. ✅ Added specific exception handling for InvalidOperationException (422 Unprocessable Entity)
3. ✅ Improved error responses with appropriate HTTP status codes
4. ✅ Changed generic error logging to warnings for user errors
5. ✅ Hid internal error details in 500 responses for security
6. ✅ All 20 tests passing

**Final Implementation:**
```csharp
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
```

**Improvements:**
- **Better HTTP semantics:** 400 for bad input, 422 for invalid operations, 500 for server errors
- **Appropriate logging levels:** Warnings for user errors, errors for system failures
- **Security:** Internal error details not exposed to clients in 500 responses
- **Factory integration:** ArgumentException automatically thrown by ShapeDataFactory for unknown shape types

---

### ✅ 2.5 Extract Magic Numbers to Configuration - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Added DroneDefaults class to Constants.cs
2. ✅ Documented magic numbers with clear comments (DroneEnumValue = 68 is DJI Mavic 3 Enterprise)
3. ✅ Extracted GlobalTransitionalSpeed default (2.5 m/s)
4. ✅ Updated KMZService.cs to use constants
5. ✅ Build successful with 0 errors, 39 warnings (all CS8618 nullable - documented)

**Final Implementation:**
```csharp
// Server/Models/Constants.cs - Added DroneDefaults
public static class DroneDefaults
{
    /// <summary>
    /// Default drone model enum value (68 = DJI Mavic 3 Enterprise)
    /// </summary>
    public const int DroneEnumValue = 68;

    /// <summary>
    /// Default drone sub-model enum value
    /// </summary>
    public const int DroneSubEnumValue = 0;

    /// <summary>
    /// Default global transitional speed in m/s
    /// </summary>
    public const double GlobalTransitionalSpeed = 2.5;
}

// Server/Services/KMZService.cs - Updated usage
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
```

**Improved (old example):**
```csharp
// Server/Models/Constants.cs
public static class DroneModels
{
    public const int DJI_MINI_4_PRO = 68;
    public const int DJI_AIR_3 = 89;
    public const int DJI_MAVIC_3 = 67;
}

public static class DefaultValues
{
    public const double DEFAULT_SPEED = 2.5;
    public const double DEFAULT_ALTITUDE = 40.0;
    public const double EARTH_RADIUS_METERS = 6378137.0;
}

// Usage
request.DroneInfo = new DroneInfo
{
    DroneEnumValue = DroneModels.DJI_MINI_4_PRO,
    DroneSubEnumValue = 0
};
```

---

### 2.6 Utilize C# 12 Modern Features

**Severity:** LOW
**Benefit:** Code clarity

**Primary Constructors:**
```csharp
// Current
public class GeometryService : IGeometryService
{
    private readonly ILogger<GeometryService> _logger;

    public GeometryService(ILogger<GeometryService> logger)
    {
        _logger = logger;
    }
}

// Modern C# 12
public class GeometryService(ILogger<GeometryService> logger) : IGeometryService
{
    // _logger is automatically available
}
```

**Collection Expressions:**
```csharp
// Current
var shapes = new List<ShapeData>();

// Modern C# 12
List<ShapeData> shapes = [];
```

**Required Properties:**
```csharp
public class Waypoint
{
    public required int Index { get; set; }
    public required double Lat { get; set; }
    public required double Lng { get; set; }
}
```

---

## 3. Client-Side Refactoring Opportunities

### ✅ 3.1 Convert All .jsx to .tsx - COMPLETED

**Status:** ✅ **COMPLETED** (2025-01-21)

**What was done:**
1. ✅ Converted `LocationButton.jsx` to TypeScript with proper interface
2. ✅ Converted `WaypointInfoBox.jsx` to TypeScript with typed props
3. ✅ Converted `WaypointList.jsx` to TypeScript with Waypoint interface
4. ✅ Removed all .jsx files (Navigation.jsx, main.jsx, App.jsx removed)
5. ✅ Added proper TypeScript type annotations for all props
6. ✅ Fixed type assertion issues with ACTION_ICONS

**Final Implementation Example:**
```tsx
// LocationButton.tsx
interface LocationButtonProps {
  map: google.maps.Map | null;
  setLatitude?: (value: string) => void;
  setLongitude?: (value: string) => void;
}

const LocationButton: React.FC<LocationButtonProps> = ({ map, setLatitude, setLongitude }) => {
  // Implementation with full type safety
};
```

**Improvements:**
- **Type Safety:** Removed PropTypes in favor of TypeScript interfaces
- **Better IntelliSense:** Full autocomplete and type checking
- **Cleaner Code:** Removed 70+ lines of PropTypes definitions
- **Consistency:** All components now use TypeScript

---

### 3.2 Fix Type Assertions and 'any' Usage

**Severity:** HIGH
**File:** `Client/src/hooks/useWaypointAPI.ts`

**Problem:** 44+ instances of `any` and type assertions

**Current:**
```typescript
(mapRef.current as any).flags?.forEach((flag: any) => flag.setMap(null));
(window as any).lastCircleCenter = { lat, lng, radius };
```

**Solution - Create proper type definitions:**
```typescript
// Client/src/types/google-maps-extended.ts
declare module '@react-google-maps/api' {
    namespace google.maps {
        interface Map {
            flags?: google.maps.Marker[];
            lines?: google.maps.Polyline[];
            rectangles?: google.maps.Rectangle[];
            circles?: google.maps.Circle[];
        }
    }
}

// Client/src/types/window-extended.ts
interface CircleCenter {
    lat: number;
    lng: number;
    radius: number;
}

declare global {
    interface Window {
        lastCircleCenter?: CircleCenter;
    }
}

// Usage (now type-safe)
mapRef.current?.flags?.forEach(flag => flag.setMap(null));
window.lastCircleCenter = { lat, lng, radius };
```

---

### 3.3 Break Down Large Components

**Severity:** HIGH
**Files:**
- `Client/src/components/MapComponent.tsx` (987 lines)
- `Client/src/hooks/useWaypointAPI.ts` (775 lines)

**Current Structure:**
```
MapComponent.tsx (987 lines)
├── Map initialization
├── Shape drawing (rectangle, circle, polyline, polygon)
├── Event handling
├── Preview rectangles
├── Elevation service
└── Drawing mode state
```

**Proposed Structure:**
```
components/
├── MapComponent.tsx (orchestrator, ~150 lines)
├── MapCanvas.tsx (map initialization, ~100 lines)
├── DrawingTools/
│   ├── RectangleDrawer.tsx (~150 lines)
│   ├── CircleDrawer.tsx (~150 lines)
│   ├── PolylineDrawer.tsx (~200 lines)
│   ├── PolygonDrawer.tsx (~150 lines)
│   └── PreviewRectangle.tsx (~80 lines)
├── WaypointMarkers.tsx (~200 lines)
└── ElevationService.tsx (~100 lines)

hooks/
├── useWaypointAPI.ts (orchestrator, ~100 lines)
├── useWaypointGeneration.ts (~150 lines)
├── useElevationAdjustment.ts (~100 lines)
├── useWaypointMarkers.ts (~200 lines)
├── useWaypointInfoWindow.ts (~150 lines)
└── useKMLGeneration.ts (~100 lines)
```

---

### 3.4 Split Context to Prevent Unnecessary Re-renders

**Severity:** MEDIUM
**File:** `Client/src/context/MapContext.tsx`

**Problem:** Single context with many values causes all consumers to re-render when any value changes

**Solution:**
```typescript
// contexts/MapContext.tsx - Read-only map references
export const MapContext = React.createContext<MapContextType | null>(null);

// contexts/FlightParamsContext.tsx - Flight parameters
export const FlightParamsContext = React.createContext<FlightParamsContextType | null>(null);

// contexts/ShapeContext.tsx - Shape/bounds data
export const ShapeContext = React.createContext<ShapeContextType | null>(null);

// Consumers only re-render when their specific context changes
const Component = () => {
    const { mapRef } = useContext(MapContext); // Not re-rendered when flightParams change
    const flightParams = useContext(FlightParamsContext);
};
```

---

### 3.5 Consistent API Error Handling

**Severity:** MEDIUM
**File:** `Client/src/services/api.js`

**Current:**
```javascript
catch (error) {
    throw error.response?.data || 'Failed to generate waypoints';
}
```

**Problem:** Sometimes throws object, sometimes throws string

**Solution:**
```typescript
// Client/src/services/ApiError.ts
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public data: any,
        message?: string
    ) {
        super(message || 'API Error');
        this.name = 'ApiError';
    }
}

// Client/src/services/api.ts
export const generateWaypoints = async (request: GenerateWaypointRequest): Promise<Waypoint[]> => {
    try {
        const response = await api.post<Waypoint[]>('/waypoints/generate', request);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new ApiError(
                error.response?.status || 500,
                error.response?.data,
                `Failed to generate waypoints: ${error.message}`
            );
        }
        throw error;
    }
};

// Usage
try {
    const waypoints = await generateWaypoints(request);
} catch (error) {
    if (error instanceof ApiError) {
        console.error(`API Error ${error.statusCode}:`, error.data);
    }
}
```

---

### 3.6 Fix ESLint Configuration

**Severity:** MEDIUM
**File:** `Client/eslint.config.js`

**Current:**
```javascript
'@typescript-eslint/no-explicit-any': 'warn', // Should be error
'@typescript-eslint/no-empty-object-type': 'off', // Should be error
```

**Improved:**
```javascript
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/no-empty-object-type': 'error',
'@typescript-eslint/no-unused-vars': 'error',
```

---

### 3.7 Improve API Configuration

**Severity:** MEDIUM
**File:** `Client/src/services/api.js`

**Current:**
```javascript
const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
```

**Problem:** Falls back to empty string, which may not work

**Solution:**
```typescript
// Client/src/config/api.config.ts
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    retries: 3
} as const;

if (!API_CONFIG.baseURL) {
    throw new Error('VITE_API_BASE_URL environment variable is required');
}

// Fail at startup, not at runtime
```

---

## 4. Project Structure Improvements

### 4.1 Organize Test Files

**Current:**
```
Server.Tests/
├── WaypointControllerTests.cs
├── WaypointServiceTests.cs
├── WaypointServiceV2Tests.cs
├── PolylineShapeServiceTests.cs
└── IntegrationTests.cs
```

**Improved:**
```
Server.Tests/
├── Unit/
│   ├── Services/
│   │   ├── WaypointServiceTests.cs
│   │   ├── PolylineShapeServiceTests.cs
│   │   ├── CircleShapeServiceTests.cs
│   │   ├── GeometryServiceTests.cs
│   │   └── KMZServiceTests.cs
│   ├── Controllers/
│   │   ├── WaypointsControllerTests.cs
│   │   └── KMZControllerTests.cs
│   └── Factories/
│       └── ShapeDataFactoryTests.cs
├── Integration/
│   └── WaypointGenerationIntegrationTests.cs
└── TestHelpers/
    ├── TestDataBuilder.cs
    └── WaypointBuilder.cs
```

---

### 4.2 Add Configuration Files

**Files to add:**

**`.editorconfig`:**
```ini
root = true

[*.cs]
indent_style = space
indent_size = 4
end_of_line = crlf
charset = utf-8
trim_trailing_whitespace = true

[*.{ts,tsx,js,jsx}]
indent_style = space
indent_size = 2
end_of_line = lf

[*.json]
indent_style = space
indent_size = 2
```

**`Client/.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "always",
  "printWidth": 100
}
```

---

### 4.3 Add CI/CD Pipeline

**`.github/workflows/test.yml`:**
```yaml
name: Test and Build

on: [push, pull_request]

jobs:
  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Test
        run: dotnet test --no-build --configuration Release --verbosity normal

  test-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./Client
        run: npm ci

      - name: Lint
        working-directory: ./Client
        run: npm run lint

      - name: Build
        working-directory: ./Client
        run: npm run build
```

---

### 4.4 Add Docker Support

**`Dockerfile`:**
```dockerfile
# Build server
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-server
WORKDIR /src
COPY ["Server/MappingBackend.Server.csproj", "Server/"]
RUN dotnet restore "Server/MappingBackend.Server.csproj"
COPY Server/ Server/
RUN dotnet build "Server/MappingBackend.Server.csproj" -c Release -o /app/build
RUN dotnet publish "Server/MappingBackend.Server.csproj" -c Release -o /app/publish

# Build client
FROM node:18 AS build-client
WORKDIR /src/Client
COPY Client/package*.json ./
RUN npm ci
COPY Client/ .
RUN npm run build

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build-server /app/publish .
COPY --from=build-client /src/Client/dist ./wwwroot
EXPOSE 80
ENTRYPOINT ["dotnet", "MappingBackend.Server.dll"]
```

**`docker-compose.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5037:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION_STRING}
    env_file:
      - .env.production
```

---

## 5. Refactoring Roadmap

### Phase 1: Security & Stabilization (Week 1)
**Priority: CRITICAL**

- [ ] Remove hardcoded credentials from `appsettings.json`
- [ ] Remove API key from `.env.development`
- [ ] Setup user-secrets for development
- [ ] Document environment variable requirements
- [ ] Complete WaypointService V2 migration
- [ ] Remove legacy `WaypointService` and `WaypointServiceAdapter`
- [ ] Update tests to use V2 only

**Success Criteria:**
- No credentials in committed files
- Build passes with V2 only
- All tests passing

---

### Phase 2: Type Safety (Week 2)
**Priority: HIGH**

- [ ] Convert all `.jsx` files to `.tsx`
- [ ] Create Google Maps type definitions
- [ ] Create Window extension types
- [ ] Remove all `any` assertions from `useWaypointAPI.ts`
- [ ] Fix nullable warnings (CS8618) in server models
- [ ] Update ESLint rules to `error` for `no-explicit-any`

**Success Criteria:**
- No `.jsx` files remaining
- Zero `any` types in client code
- Zero CS8618 warnings
- ESLint passes with stricter rules

---

### Phase 3: Architecture Improvements (Week 3)
**Priority: HIGH**

**Server:**
- [ ] Extract `ShapeDataFactory`
- [ ] Add data annotations for validation
- [ ] Improve exception handling in controllers
- [ ] Extract magic numbers to constants

**Client:**
- [ ] Break down `MapComponent` into smaller components
- [ ] Split `useWaypointAPI` hook into focused hooks
- [ ] Split context to prevent unnecessary re-renders
- [ ] Create consistent `ApiError` class

**Success Criteria:**
- No component > 300 lines
- No hook > 200 lines
- Proper error handling throughout

---

### Phase 4: Testing & Quality (Week 4)
**Priority: MEDIUM**

- [ ] Organize test files into Unit/Integration folders
- [ ] Add test builders (`WaypointBuilder`, etc.)
- [ ] Increase test coverage to 80%+
- [ ] Add integration tests
- [ ] Add CI/CD pipeline
- [ ] Add Docker configuration

**Success Criteria:**
- Test coverage > 80%
- CI/CD pipeline running
- Docker build successful

---

### Phase 5: Ongoing Improvements
**Priority: LOW**

- [ ] Add `.editorconfig` and `.prettierrc`
- [ ] Adopt C# 12 features (primary constructors, collection expressions)
- [ ] Add performance monitoring
- [ ] Document API contracts (OpenAPI/Swagger)
- [ ] Add frontend error boundary
- [ ] Add loading states and skeleton screens

---

## 6. Deprecated/Obsolete Code to Remove

### After V2 Migration:
- [ ] `Server/Services/WaypointService.cs`
- [ ] `Server/Services/WaypointServiceAdapter.cs`
- [ ] `Server/Controllers/WaypointsController.cs:25-73` (old endpoint)

### Check Usage and Remove if Unused:
- [ ] `SharpKml.Core` package (verify it's actually used)
- [ ] `Server/vite.config.js:46-49` (weatherforecast proxy - looks unused)

---

## 7. Quick Wins (Low Effort, High Impact)

1. **Add .gitignore entries** (5 minutes)
   ```
   **/appsettings.Development.json
   **/.env*.local
   ```

2. **Extract constants** (30 minutes)
   - Create `Constants.cs` with drone models and default values

3. **Add data annotations** (1 hour)
   - Add `[Required]`, `[Range]` to DTOs

4. **Update ESLint config** (10 minutes)
   - Change `warn` to `error` for type safety rules

5. **Create type definitions** (2 hours)
   - `google-maps-extended.ts`
   - `window-extended.ts`

---

## 8. Code Quality Metrics

### Current State:
- **Server LOC:** ~8,000
- **Client LOC:** ~15,000
- **Test Coverage:** Unknown (estimate <30%)
- **Type Safety:** Medium (many `any` assertions)
- **Component Size:** Poor (largest: 987 lines)
- **Code Duplication:** Medium (shape mapping in 3 places)

### Target State:
- **Test Coverage:** >80%
- **Type Safety:** High (zero `any`)
- **Component Size:** Good (max 300 lines)
- **Code Duplication:** Low (extracted to factories/utilities)
- **CI/CD:** Automated testing and deployment

---

## 9. Resources

### Documentation to Create:
- [ ] `docs/ARCHITECTURE.md` - System architecture overview
- [ ] `docs/API.md` - API endpoint documentation
- [ ] `docs/DEPLOYMENT.md` - Deployment instructions
- [ ] `docs/DEVELOPMENT.md` - Local setup guide

### Tools to Integrate:
- **SonarQube** - Code quality and security scanning
- **Codecov** - Test coverage reporting
- **Dependabot** - Automated dependency updates

---

## 10. Migration Checklist

When implementing each refactoring:

- [ ] Create feature branch
- [ ] Write/update tests first
- [ ] Implement changes
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Code review
- [ ] Merge to main

---

## Conclusion

This refactoring guide provides a structured approach to improving the WaypointMapping application. Focus on **Phase 1 (Security)** first, then proceed through the phases systematically. Each phase builds on the previous one, ensuring a stable codebase throughout the refactoring process.

**Key Principles:**
1. **Security First** - Remove credentials immediately
2. **Type Safety** - Eliminate `any` and nullable warnings
3. **Simplicity** - Break large components into focused modules
4. **Testing** - Increase coverage before and during refactoring
5. **Documentation** - Update docs as you refactor

**Estimated Timeline:** 4-6 weeks for Phases 1-4, ongoing for Phase 5.

---

*Last Updated: 2025-01-21*
