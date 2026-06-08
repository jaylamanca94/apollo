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

- Maps
- Charts
- Filters
- Auth
- Persistence
- Saved settings
- Database-backed workflows

## Features

- Dark Apollo dashboard shell with sidebar, toolbar, stat cards, and data panels.
- APOD feature panel.
- ISS latitude, longitude, altitude, and velocity.
- Crew count and crew list.
- Upcoming launch list with SpaceX API and Launch Library fallback.
- Near-Earth asteroid summary for the current day.
- Refresh action.
- Loading, empty, and error states.
- Server-side NASA API key handling.
- Lightweight serverless caching for NASA responses.

## Design Decisions

- Vanilla HTML, CSS, and JavaScript instead of a framework.
- Bootstrap and Font Awesome Free for UI conventions and icons.
- Vercel for deployment and serverless API routes.
- NASA APOD and NeoWs are proxied through `/api/apod` and `/api/neo`.
- NASA API keys stay server-side via `NASA_API_KEY`.
- NASA proxy responses scrub `api_key` values from NASA-provided links before returning data to the browser.
- Other public APIs remain browser-side for MVP simplicity.
- Dark visual direction is inspired by a dense finance-style dashboard while preserving Apollo's space-data product scope.

## Roadmap

Recommended next steps:

1. Rotate the NASA API key in Vercel after the early key exposure issue.
2. Run final production QA after key rotation.
3. Add basic monitoring/error visibility if Apollo gets shared more broadly.
4. Add schema validation for API responses.
5. Consider light mode support once the current dark design is approved.

Future enhancements only if requested:

- ISS map
- Asteroid or launch charts
- Data filters
- Auth
- Saved preferences
- Supabase-backed workflows

## Known Limitations

- NASA data depends on the configured Vercel `NASA_API_KEY`.
- Vercel in-memory cache is per warm serverless function instance and may reset.
- Third-party public APIs can fail or change response formats.
- SpaceX official API can be unavailable; Launch Library is used as a fallback.
- Current UI is dark-first and does not yet fully support light mode.
- No automated end-to-end test suite yet.
