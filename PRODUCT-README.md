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
- APOD feature panel.
- ISS latitude, longitude, altitude, velocity, and current-position map.
- Crew count and crew list.
- Upcoming SpaceX launch list through a server-side Launch Library proxy.
- Near-Earth asteroid summary for the current day.
- Refresh action.
- Loading, empty, and error states.
- Server-side NASA API key handling.
- Lightweight serverless caching for NASA and launch responses.

## Design Decisions

- Vanilla HTML, CSS, and JavaScript instead of a framework.
- Bootstrap and Font Awesome Free for UI conventions and icons.
- Leaflet and OpenStreetMap tiles provide the ISS map without adding another API key.
- Vercel for deployment and serverless API routes.
- NASA APOD and NeoWs are proxied through `/api/apod` and `/api/neo`.
- NASA API keys stay server-side via `NASA_API_KEY`.
- NASA proxy responses scrub `api_key` values from NASA-provided links before returning data to the browser.
- SpaceX launch listings use Launch Library through `/api/launches`, with a normalized response shape before data reaches the dashboard.
- Frontend rendering escapes API-provided text before inserting it into the page.
- Frontend data loaders normalize third-party payloads before rendering visible values.
- Other public APIs remain browser-side for MVP simplicity.
- Visual direction now follows the quieter Odyssey-style product shell: Bootstrap-first top navigation, neutral surfaces, simple cards, and low-maintenance spacing.
- Dashboard data families use subtle accent colors for APOD, ISS, asteroids, launches, and crew while keeping surfaces neutral.
- Theme choice is stored locally in the browser; first-time visitors start in dark mode.
- Unsupported controls such as export, search, notifications, settings, and new observations are omitted until those workflows are requested.

## Roadmap

Recommended next steps:

1. Rotate the NASA API key in Vercel after the early key exposure issue.
2. Run final production QA after key rotation.
3. Add basic monitoring/error visibility if Apollo gets shared more broadly.
4. Add schema validation for API responses.
5. Add accessibility QA and browser coverage before a broader public launch.

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
- Third-party public APIs can fail or change response formats.
- Launch listings depend on Launch Library availability and its SpaceX search result format.
- No automated end-to-end test suite yet.
