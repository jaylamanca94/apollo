# Apollo Project Notes

## Goals

- Create a public space-data dashboard that is simple to understand and easy to demo.
- Keep the product deployable, maintainable, and portable across machines.
- Use managed services and environment variables for public deployment.
- Preserve a tight MVP scope while making the app feel polished.

## Product Discipline

Apollo must stay focused on its core job: making live and near-live space data simple to understand and easy to demo.

- Do not broaden Apollo into a general science, education, simulation, productivity, or account-based platform unless the founder explicitly changes the product direction.
- Prefer focused dashboard clarity over feature volume.
- Say no or defer when a feature is interesting but does not strengthen the current space-data dashboard mission.
- Keep scope decisions grounded in user value, source quality, maintainability, and demo clarity.

## Scope

Apollo is currently a public dashboard for live and near-live space data.

In scope:

- NASA Astronomy Picture of the Day
- ISS current position
- People currently in space
- Upcoming SpaceX launches
- NOAA SWPC space weather
- Near-Earth asteroid daily summary
- Dedicated launches detail page
- Responsive Bootstrap dashboard UI
- Vercel deployment with serverless NASA proxy routes

Out of scope for the MVP:

- Location-based ISS pass times
- Charts
- Filters
- Auth
- Persistence
- Account-backed saved settings
- Database-backed workflows

## Features

- Responsive Apollo dashboard shell with a dark-first Light/Dark theme toggle.
- APOD-first feature panel.
- APOD credit, full-media link, NASA source link, and inline full-description detail.
- ISS latitude, longitude, altitude, velocity, and current-position map.
- Crew count and responsive People in Space grid.
- Upcoming SpaceX launch summary through a server-side launch-data proxy with inline mission details.
- Dedicated launches page with a next-launch spotlight plus fuller upcoming list, status, vehicle, provider, window, pad, location, and source links.
- Near-Earth asteroid summary for the current day with lunar-distance, velocity, and hazard-context cues.
- NOAA SWPC space-weather status with current K-index observation time, 3-day K-index outlook, and recent notices.
- Dashboard-level data-source status summary for APOD, ISS position, crew, launches, asteroids, and space weather.
- Refresh action.
- Loading, empty, and error states.
- Server-side NASA API key handling.
- Lightweight serverless caching for NASA and launch responses.
- Automated fixture tests for normalized APOD, launch, and Near-Earth Object API contracts.
- `/api/health` endpoint for uptime checks and server-side NASA key configuration status.
- GitHub Actions check workflow for pushes to `main` and pull requests.

## Design Decisions

- Vanilla HTML, CSS, and JavaScript instead of a framework.
- Bootstrap and Font Awesome Free for UI conventions and icons.
- Leaflet and OpenStreetMap tiles provide the ISS map without adding another API key.
- Vercel for deployment and serverless API routes.
- NASA APOD and NeoWs are proxied through `/api/apod` and `/api/neo`, then normalized into dashboard-ready response contracts.
- NASA API keys stay server-side via `NASA_API_KEY`.
- APOD tries NASA's default response first, then Eastern-date fallbacks to avoid UTC publish-window failures.
- NASA proxy responses scrub `api_key` values from NASA-provided links before returning data to the browser.
- SpaceX launch listings use The Space Devs launch data through `/api/launches`, with a normalized response shape before data reaches the dashboard and launches page.
- NOAA SWPC space weather uses `/api/space-weather`, with current K-index, forecast, and alert data normalized before rendering.
- Server-side normalizers provide stable APOD, launch, Near-Earth Object, and space-weather shapes so third-party response changes are less likely to break card rendering.
- Frontend rendering escapes API-provided text before inserting it into the page.
- Frontend data loaders retain compatibility fallbacks for older raw NASA payload shapes.
- Launch details can graduate to dedicated static pages when the dashboard card would become too dense.
- Other public APIs remain browser-side for MVP simplicity.
- Visual direction now follows a darker operational dashboard shell: charcoal page background, compact top navigation, red accent actions, split APOD feature, simple bordered cards, and low-maintenance spacing.
- Dashboard content uses a split APOD feature followed by a compact two-column grid for ISS, people in space, launches, asteroids, and space weather.
- The dashboard ends with a compact data-source status card so public demos can distinguish a source outage from a broken product.
- The single-page header avoids section jump navigation until Apollo has meaningful detail pages.
- Refresh state uses one global "Last updated" timestamp instead of repeated per-card timestamps.
- Dashboard data families use neutral cards, sparse icons, red action accents, and positive green styling for safe/good status messages.
- Theme choice is stored locally in the browser; first-time visitors start in dark mode.
- Unsupported controls such as export, search, notifications, settings, and new observations are omitted until those workflows are requested.

## Roadmap

Recommended next steps:

1. Rotate the NASA API key in Vercel after the early key exposure issue.
2. Run final production QA after key rotation.
3. Wire external monitoring/error logging to `/api/health` if Apollo gets shared more broadly.
4. Add accessibility QA and browser coverage before a broader public launch.
5. Decide whether APOD or asteroid details deserve dedicated URLs after the launches page pattern is tested.

Future enhancements only if requested:

- Location-based ISS pass times
- Asteroid or launch charts
- Data filters
- Auth
- Account-backed saved preferences
- Supabase-backed workflows

## Known Limitations

- NASA data depends on the configured Vercel `NASA_API_KEY`.
- Vercel in-memory cache is per warm serverless function instance and may reset.
- Third-party public APIs can fail or change response formats; Apollo now normalizes key server responses, but source outages can still affect sections.
- Launch listings depend on The Space Devs launch data availability and its SpaceX search result format.
- Space weather depends on NOAA SWPC public feeds.
- No automated end-to-end test suite yet.
