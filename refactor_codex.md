# Refactor Notes (Codex Review)

## Backend
- `Server/Services/WaypointService.cs`: The new `GenerateWaypointsAsync(List<ShapeData>, WaypointParameters)` drops most camera/angle fields when delegating to shape services (Angle, FocalLength, SensorWidth/Height, Overlap, ManualSpeedSet). Any photo-spacing or gimbal calculations in the shape services are effectively disabled. Pass the full `WaypointParameters` through instead of reconstructing a minimal subset.
- `Server/Controllers/WaypointsController.cs`: No `ModelState.IsValid` check or validation response; malformed payloads go straight to the service and return 500s. Add validation and early 400 responses.
- `Server/Services/CircleShapeService.cs`: Contains debug-only fallbacks that overwrite user input with Helsinki coordinates when values are near zero and logs a large amount of noise. Remove magic defaults and prefer explicit validation errors.
- `Server/Services/KMZService.cs`: KMZ/WPML generation is hand-built string concatenation with hard-coded action groups, indexes, and gimbal actions. It ignores many request fields (e.g., action groups, headings, trigger ranges) and always injects two action groups with fixed IDs/start indexes of 2. Move to a structured model → serializer, validate inputs, and wire request data through instead of templated strings.
- `Server/Program.cs`: No centralized exception handling, no request logging/observability, and CORS is wide open for all origins/methods in all environments. Add `UseExceptionHandler`, tightened CORS per env, and minimal request logging.
- `Server/DTOs/GeneratePointsRequestDTO.cs`: Mixed JSON libs (Newtonsoft + System.Text) and legacy duplicate fields (`distance` vs `LineSpacing`, `interval` vs `PhotoInterval`). Normalize to a single serializer and deprecate/remove legacy properties to simplify the API contract.
- `Server/Models` duplication: Multiple waypoint-related models (`Models/Waypoint.cs`, `Models/WaypointModel.cs`, `Data/Waypoint.cs`, `WaypointGen`) with overlapping fields and naming conflicts. Consolidate to one domain model plus DTOs to reduce confusion and mapping errors.
- Package versions: `MappingBackend.Server.csproj` targets net8.0 but references EF Core 9.0 RC packages and adds Identity/EF packages that are unused. Align package versions with the target framework and remove unused dependencies to speed restore and cut vulnerability surface.
- Async conventions: Service methods are marked async but only return `Task.FromResult`. Make them synchronous or introduce real async operations to avoid misleading callers.

## Frontend
- `Client/src/config/api.config.ts`: Throws at import time if `VITE_API_BASE_URL` is missing, which crashes builds/tests and Storybook-like tooling. Guard with a fallback or throw at runtime where it can be surfaced in UI.
- `Client/src/hooks/useWaypointAPI.ts`: Very large function coupling API shaping, axios calls, Google Maps marker/polyline rendering, elevation fetching, and DOM manipulation of info windows. Split into: (1) a pure API client, (2) a map overlay manager, and (3) UI state management. This will also simplify testing.
- Map state stored on the Google Map instance via ad-hoc properties (`mapRef.current.flags/lines`) without typing. Replace with React state or a dedicated store plus proper TS typings to avoid runtime property leaks.
- `useWaypointAPI` + `JSFunctions.GenerateWaypointInfoboxText`: Info windows are built with raw HTML strings and direct DOM event wiring; this fights React and is fragile. Use React components with `@react-google-maps/api` InfoWindow or a lightweight popup component to manage state declaratively.
- Global mutation: Circle drawing caches to `window.lastCircleCenter` and server-side code also rewrites coordinates. Replace with context/state so data flow is explicit and testable.
- Request shaping duplication: `MapComponent`, `useWaypointAPI`, and `services/WaypointService` all re-map the same request fields with differing casing and defaults. Centralize a single mapper/types to avoid divergence and bugs (e.g., north/south flags, endpoints-only flags).
- Validation/UX: Numerous `alert()` calls and console logs; no user-friendly error surface or form validation around map inputs. Introduce a toast system and form-level validation for coordinates/API errors.
- Testing: `Client/src/tests/components/WaypointGenerator.test.tsx` targets a component/service path that no longer exists (`WaypointGenerator`, `services/waypointService` lowercase). The suite cannot run as-is; either restore the component or update tests to cover current entry points (e.g., Map flow, hooks, or services).
- Styling/structure: Side panels and toolbars are tightly coupled to map components; extracting them into smaller, focused components with props (and moving inline SVG/button definitions into shared UI elements) would improve readability and reusability.

## Cross-cutting / Quality
- API contract drift: The client sends both camelCase and PascalCase fields to match server quirks, and the server still accepts legacy names. Define a single canonical contract (e.g., PascalCase DTO) and enforce it on both ends to reduce parsing and logging noise.
- Logging: Excessive console and server logging (mostly `LogInformation`) without log level control makes troubleshooting harder. Introduce structured logging with levels, and trim noisy diagnostics outside debug builds.
- Error handling: Elevation service and KMZ generation failures surface as alerts or raw 500s. Provide consistent, user-facing error messages and retries where appropriate.
- Documentation: README points to generic setup; add explicit env var requirements (`VITE_GOOGLE_MAPS_API_KEY`, `VITE_API_BASE_URL`) and sample requests to keep client/server aligned.
