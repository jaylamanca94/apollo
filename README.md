# Apollo

Apollo is a small Bootstrap MVP dashboard that pulls public space data into an APOD-first, sectioned card layout. It includes NASA Astronomy Picture of the Day, ISS position, people currently in space, upcoming SpaceX launches, and a NASA Near-Earth Object summary with calm detail paths for richer context.

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

- NASA Astronomy Picture of the Day, proxied through `/api/apod`
- NASA NeoWs Near-Earth Object Feed, proxied through `/api/neo`
- Launch Library 2 SpaceX launch search, proxied through `/api/launches`
- Where the ISS At
- OpenStreetMap tiles for the ISS map
- People in Space JSON

## File Overview

- `AGENT-README.md` - Apollo product-agent workflow, approval rules, work modes, and output format
- `PRODUCT-README.md` - Apollo mission, goals, scope, decisions, roadmap, and known limitations
- `DESIGN-README.md` - Apollo design standards, UI utilities, and interaction guidance
- `index.html` - dashboard markup
- `styles.css` - minimal Bootstrap-aligned styling
- `app.js` - frontend data loading and rendering
- `api/_nasa.js` - shared NASA proxy helper and in-memory cache
- `api/apod.js` - serverless NASA APOD endpoint
- `api/neo.js` - serverless NASA NeoWs endpoint
- `api/launches.js` - serverless Launch Library endpoint for upcoming SpaceX launches and launch detail fields
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

## Caching

The NASA proxy includes lightweight caching:

- APOD: 6 hours
- NeoWs daily feed: 30 minutes
- Launch Library SpaceX launch search: 15 minutes

This reduces rate-limit pressure and keeps the dashboard usable during normal traffic. It is intentionally simple and does not add persistence.

## Known Limitations

- NASA data depends on the server-side `NASA_API_KEY` being configured.
- Serverless in-memory cache is per warm function instance and may reset.
- Public APIs can fail, timeout, or change response formats.
- Launch listings depend on Launch Library availability and the current SpaceX search result format.
- This MVP does not include charts, filters, auth, saved settings, or persistence.
- Export, search, notifications, and observation-creation workflows are intentionally not included yet.

## Production Notes

For a larger public launch, consider:

- External cache or edge cache strategy
- API response schema validation
- Monitoring and error logging
- Accessibility audit
- CI checks
- CSP/security header review
