# Apollo

Apollo is a small Bootstrap MVP dashboard for live and near-live public space data. It leads with NASA's Astronomy Picture of the Day, then summarizes the ISS position, crew in space, SpaceX launches, NOAA space weather, near-Earth asteroid approaches, and upstream source status.

The app is designed to be easy to demo: each card favors source-backed context, plain labels, source timing, and quick links to the original feeds.

## Recommended Architecture

Use a static frontend with serverless API routes.

- Frontend: vanilla HTML, CSS, and JavaScript
- UI: Bootstrap CDN, Leaflet, and OpenStreetMap tiles
- Theme: dark-first Light/Dark mode toggle
- API proxies: Vercel serverless functions in `/api`
- Hosting: Vercel
- Secrets: `NASA_API_KEY` stored as a server-side environment variable

The app should stay vanilla/static for now. A framework such as Next.js is not needed unless the product later needs routing, server-rendered pages, authenticated user flows, persistent settings, or a larger component system.

## APIs Used

- NASA Astronomy Picture of the Day, proxied and normalized through `/api/apod`
- NASA NeoWs Near-Earth Object Feed, proxied and normalized through `/api/neo`
- The Space Devs SpaceX launch data, proxied and normalized through `/api/launches`
- NOAA Space Weather Prediction Center K-index, forecast, and alert feeds, proxied and normalized through `/api/space-weather`
- Apollo server health check through `/api/health`
- Where the ISS At
- OpenStreetMap tiles for the ISS map
- People in Space JSON

## File Overview

- `AGENT-README.md` - Apollo product-agent workflow, approval rules, work modes, and output format
- `PRODUCT-README.md` - Apollo mission, goals, scope, decisions, roadmap, and known limitations
- `DESIGN-README.md` - Apollo design standards, UI utilities, and interaction guidance
- `index.html` - dashboard markup
- `launches.html` - dedicated launches detail page markup
- `styles.css` - minimal Bootstrap-aligned styling
- `assets/apollo-app-icon-light.png` and `assets/apollo-app-icon-dark.png` - Apollo 512px app icons for light and dark browser schemes
- `site.webmanifest` - browser app manifest pointing to the PNG app icons
- `app.js` - frontend data loading and rendering
- `launches.js` - launches detail page data loading and rendering
- `api/_cache.js` - shared in-memory cache helpers for serverless API routes
- `api/_nasa.js` - shared NASA proxy helper and in-memory cache
- `api/_space_data.js` - shared APOD, Near-Earth Object, and NOAA space weather response normalizers
- `api/apod.js` - serverless NASA APOD endpoint with a normalized dashboard contract
- `api/neo.js` - serverless NASA NeoWs endpoint with a normalized dashboard contract
- `api/launches.js` - serverless Launch Library endpoint for upcoming SpaceX launches, launch-window context, and launch detail fields
- `api/space-weather.js` - serverless NOAA SWPC endpoint for current space weather status
- `api/health.js` - serverless health endpoint for uptime checks and server configuration status
- `tests/api-contracts.test.js` - fixture tests for normalized API response contracts
- `tests/accessibility-structure.test.js` - static accessibility contract checks for page landmarks, live regions, skip links, and refresh controls
- `package.json` - local development/check scripts
- `vercel.json` - Vercel deployment configuration

## Environment Variables

Create a NASA API key at:

```text
https://api.nasa.gov/
```

Set this environment variable:

```text
NASA_API_KEY=your_key_here
```

The key is read only by the serverless API routes. It is not exposed in `app.js` or sent to the browser.

## Run Locally

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your NASA key to `.env.local`:

```text
NASA_API_KEY=your_key_here
```

Start the Vercel local dev server:

```bash
npm run dev
```

If the Vercel CLI prompts for authentication on a new machine, sign in with:

```bash
npx vercel login
```

Open the local URL printed by Vercel, usually:

```text
http://localhost:3000
```

## Deploy

Recommended target: Vercel.

1. Import the project into Vercel.
2. Add `NASA_API_KEY` in the Vercel project environment variables.
3. Deploy.

The static dashboard and `/api` serverless routes deploy together.

When `app.js`, `launches.js`, or `styles.css` changes, bump the matching query-string version in the HTML that loads it so deployed browsers do not keep stale static assets.

## Caching

The NASA proxy includes lightweight caching:

- APOD: 6 hours
- NeoWs daily feed: 30 minutes
- The Space Devs SpaceX launch data: 15 minutes
- NOAA SWPC space weather: 5 minutes

This reduces rate-limit pressure and keeps the dashboard usable during normal traffic. It is intentionally simple and does not add persistence.

## Checks

Run the project checks with:

```bash
npm run check
```

This validates JavaScript syntax and runs fixture tests for the normalized APOD, Near-Earth Object, launch, and space-weather contracts plus static accessibility structure checks.

GitHub Actions runs the same checks on pushes to `main` and on pull requests.

## Health Check

Apollo exposes a small server health endpoint at:

```text
/api/health
```

It returns the app version, timestamp, runtime status, and whether the server-side NASA API key is configured. The key value is never returned.

## Known Limitations

- NASA data depends on the server-side `NASA_API_KEY` being configured.
- Serverless in-memory cache is per warm function instance and may reset.
- Public APIs can fail, timeout, or change response formats; Apollo normalizes key payloads before rendering, but source outages can still affect the dashboard.
- Launch listings depend on The Space Devs launch data availability and the current SpaceX search result format.
- Space weather depends on NOAA SWPC public feeds.
- Static accessibility structure is covered by tests, but full browser-level accessibility and interaction coverage is not automated yet.
- This MVP does not include charts, filters, auth, saved settings, or persistence.
- Export, search, notifications, and observation-creation workflows are intentionally not included yet.

## Production Notes

For a larger public launch, consider:

- External cache or edge cache strategy
- External monitoring and error logging wired to `/api/health`
- Accessibility audit
- CSP/security header review
