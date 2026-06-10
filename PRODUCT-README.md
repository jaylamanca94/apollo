# Apollo Project Notes

## Goals

- Create a public space-data dashboard that is simple to understand and easy to demo.
- Keep the product deployable, maintainable, and portable across machines.
- Use managed services and environment variables for public deployment.
- Preserve a tight MVP scope while making the app feel polished.

## Scope

Apollo is currently a public dashboard for live and near-live space data.

In scope:

- NASA Astronomy Picture of the Day
- ISS current position
- People currently in space
- Upcoming SpaceX launches
- Near-Earth asteroid daily summary
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
- Crew count and crew list.
- Upcoming SpaceX launch list through a server-side Launch Library proxy with inline mission details.
- Near-Earth asteroid summary for the current day with lunar-distance, velocity, and hazard-context cues.
- Refresh action.
- Loading, empty, and error states.
- Server-side NASA API key handling.
- Lightweight serverless caching for NASA and launch responses.

## Design Decisions

- Vanilla HTML, CSS, and JavaScript instead of a framework.
- Bootstrap and Font Awesome Free for UI conventions and icons.
- Leaflet and OpenStreetMap tiles provide the ISS map without adding another API key.
- Vercel for deployment and serverless API routes.
- NASA APOD and NeoWs are proxied through `/api/apod` and `/api/neo`, then normalized into dashboard-ready response contracts.
- NASA API keys stay server-side via `NASA_API_KEY`.
- APOD tries NASA's default response first, then Eastern-date fallbacks to avoid UTC publish-window failures.
- NASA proxy responses scrub `api_key` values from NASA-provided links before returning data to the browser.
- SpaceX launch listings use Launch Library through `/api/launches`, with a normalized response shape before data reaches the dashboard.
- Server-side normalizers provide stable APOD, launch, and Near-Earth Object shapes so third-party response changes are less likely to break card rendering.
- Frontend rendering escapes API-provided text before inserting it into the page.
- Frontend data loaders retain compatibility fallbacks for older raw NASA payload shapes.
- Detail experiences start as inline disclosure panels and source links instead of separate pages.
- Other public APIs remain browser-side for MVP simplicity.
- Visual direction now follows the quieter Odyssey-style product shell: Bootstrap-first top navigation, neutral surfaces, simple cards, and low-maintenance spacing.
- Dashboard content is grouped into Featured, Live Orbit, Upcoming Missions, and Near-Earth Objects sections.
- The single-page header avoids section jump navigation until Apollo has meaningful detail pages.
- Refresh state uses one global "Last updated" timestamp instead of repeated per-card timestamps.
- Dashboard data families use subtle accent colors for APOD, ISS, asteroids, launches, and crew while keeping surfaces neutral.
- Theme choice is stored locally in the browser; first-time visitors start in dark mode.
- Unsupported controls such as export, search, notifications, settings, and new observations are omitted until those workflows are requested.

## Roadmap

Recommended next steps:

1. Rotate the NASA API key in Vercel after the early key exposure issue.
2. Run final production QA after key rotation.
3. Add basic monitoring/error visibility if Apollo gets shared more broadly.
4. Add automated API contract fixture tests for the normalized APOD, launch, and NEO shapes.
5. Add accessibility QA and browser coverage before a broader public launch.
6. Decide whether APOD or launch details deserve dedicated URLs after the inline detail pattern is tested.

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
- Launch listings depend on Launch Library availability and its SpaceX search result format.
- No automated end-to-end test suite yet.
