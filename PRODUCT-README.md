# Apollo Project Notes

## Product Identity

Apollo helps people understand what is happening in space right now.

## Goals

- Create a public space-intelligence dashboard that is simple to understand and easy to demo.
- Keep the product deployable, maintainable, and portable across machines.
- Use managed services and environment variables for public deployment.
- Preserve a tight MVP scope while making the app feel polished.

## Product Discipline

Apollo must stay focused on its core job: making live and near-live space activity simple to understand and easy to demo.

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
- Sky Anomalies sighting context check beta
- Dedicated launches detail page
- Dedicated ISS, asteroid, weather, gallery, and anomaly pages
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

- Responsive Apollo dashboard and detail-page shell that follows Acadia with a red Apollo accent and defaults to the user's operating system theme.
- Compact dashboard summary layer for ISS, crew, launches, asteroids, weather, APOD, and Sky Anomalies.
- APOD detail treatment on the Gallery page.
- APOD credit, safe image/video media handling, full-media link, NASA source link, and inline full-description detail.
- ISS latitude, longitude, altitude, velocity, current-position map, source observation time, live orbital context, sunlight state, signal footprint, and source link.
- Crew count, source-declared roster count, ISS expedition context, current craft/location summary, and responsive People in Space grid.
- Upcoming SpaceX launch summary through a server-side launch-data proxy with inline mission details and launch-window length context.
- Dedicated launches page with a next-launch spotlight plus fuller upcoming list, status, vehicle, provider, window length, window times, pad, location, and source links.
- Near-Earth asteroid summary for the current day with closest-approach time, lunar-distance, velocity, exact approach details, source links, NASA hazard-flag context cues, and NASA Sentry monitoring context.
- NOAA SWPC space-weather status with current K-index observation time, NOAA geomagnetic scale context, 3-day K-index outlook, and typed recent notices with compact NOAA R/S/G scale cues when the source text provides them.
- Sky Anomalies page that lets a user enter a sighting location/date/time and compares the moment against Apollo's known launch, ISS, asteroid, and space-weather context with source-aware readiness copy, qualitative evidence labels, explicit time/location assumptions, and clearly named source gaps for planned imports.
- Dashboard-level data-source status summary for APOD, ISS position, crew, launches, asteroids, and space weather, with compact upstream source links and source timing context for demo verification.
- Keyboard skip links, named landmarks, and refresh-control relationships backed by automated accessibility structure checks.
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
- NASA APOD and NeoWs are proxied through `/api/apod` and `/api/neo`, then normalized into dashboard-ready response contracts. APOD video links should keep the original source media URL while exposing an embeddable preview URL only for known video hosts.
- NASA API keys stay server-side via `NASA_API_KEY`.
- APOD tries NASA's default response first, then Eastern-date fallbacks to avoid UTC publish-window failures.
- NASA proxy responses scrub `api_key` values from NASA-provided links before returning data to the browser.
- SpaceX launch listings use The Space Devs launch data through `/api/launches`, with a normalized response shape before data reaches the dashboard and launches page.
- Launch listings should summarize the launch window length from the existing launch-data feed when start/end times are available, while preserving exact source window times in details.
- NOAA SWPC space weather uses `/api/space-weather`, with current K-index, forecast, and alert/watch/warning notice data normalized before rendering.
- Current space-weather cards should interpret NOAA geomagnetic storm scale context from the existing K-index feed before adding deeper space-weather charts or new NOAA products.
- Space-weather notices should keep NOAA's alert/watch/warning distinction visible with compact labels instead of flattening every message into an undifferentiated headline. When the existing notice text includes NOAA R/S/G scale values or clear K-index storm text, Apollo should surface that scale as a compact impact cue rather than adding a broader education panel.
- Sky Anomalies should stay trust-first: use neutral terms such as sighting, anomaly, report, and observation; compare known sky activity and connected source availability before reported-sighting feeds or planned-source gaps; and never infer extraterrestrial origin or verification from an unverified report.
- Server-side normalizers provide stable APOD, launch, Near-Earth Object, and space-weather shapes so third-party response changes are less likely to break card rendering.
- Frontend rendering escapes API-provided text before inserting it into the page.
- Frontend data loaders retain compatibility fallbacks for older raw NASA payload shapes.
- Launch details can graduate to dedicated static pages when the dashboard card would become too dense.
- Other public APIs remain browser-side for MVP simplicity.
- Visual direction now follows Acadia: calm gray page background, compact top navigation, red accent actions, split APOD feature, simple bordered cards, 8px repeated surfaces, and standardized responsive spacing.
- Apollo now uses a multi-page information architecture. The Dashboard is a compact state-at-a-glance surface; ISS, Launches, Asteroids, Weather, Gallery, and Anomalies hold richer detail.
- Dashboard content uses compact summary cards with detail links instead of embedding full maps, full APOD media, full crew rosters, or long source narratives on the homepage.
- ISS context should interpret the already-loaded position source before adding any new ISS source. Current orbital context is calculated from live altitude and velocity rather than stored as separate static data. The position source's timestamp should remain visible as compact freshness context for the current map fix, and source-provided visibility/footprint fields should be surfaced as lightweight operational context when available.
- People in Space should summarize current spacecraft or station occupancy from the existing roster feed before adding richer astronaut sources. The dashboard should preserve the feed's current `spacecraft` field, while retaining compatibility with older `craft` payloads. When the feed provides a declared `number` or `iss_expedition`, Apollo should surface that source context and treat count mismatches as a source-attention state instead of silently trusting the rendered list.
- The asteroid summary should surface the closest object's approach time and distance before the object list, then use compact NASA CNEOS hazard-flag and Sentry monitoring context plus disclosure details for approach time, miss distance, speed, estimated diameter, NASA tracking flags, and object source links rather than expanding the dashboard card by default. Potentially hazardous asteroid copy should make clear that the flag reflects size and orbital-distance criteria, not an impact prediction. Sentry copy should make clear that it is NASA/JPL impact monitoring context, not a certainty of future impact.
- The dashboard ends with a compact data-source status card so public demos can distinguish a source outage from a broken product, see the timing or date behind key sources, and quickly open each upstream source.
- The header avoids section jump navigation and uses compact primary page links only for meaningful detail pages such as Launches.
- Refresh state uses one global freshness label: "Last updated" after successful source loads and "Last checked" when a page is partial, degraded, or unavailable.
- Dashboard data families use neutral cards, sparse icons, red action accents, and positive green styling for safe/good status messages.
- Theme choice is stored locally in the browser; first-time visitors start from the operating system theme.
- Unsupported controls such as export, search, notifications, settings, and new observations are omitted until those workflows are requested.
- UAP and fireball feeds are not yet connected. Until NUFORC, American Meteor Society, AARO, FAA, planet-position, or satellite-visibility sources are imported, Apollo should label those checks as planned source gaps rather than fabricating report data, and order them after connected evidence or connected-source unavailability.

## Roadmap

Recommended next steps:

1. Rotate the NASA API key in Vercel after the early key exposure issue.
2. Run final production QA after key rotation.
3. Wire external monitoring/error logging to `/api/health` if Apollo gets shared more broadly.
4. Expand browser-level interaction coverage before a broader public launch.
5. Decide whether APOD or asteroid details deserve dedicated URLs after the launches page pattern is tested.

Future enhancements only if requested:

- Location-based ISS pass times
- Location-aware sky sighting checks with ISS pass, satellite visibility, Starlink, fireball, aurora, and reported-sighting matching
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
- Static accessibility structure checks are automated; no automated end-to-end browser suite yet.
