# Apollo Product Review — 2026-08-10

## Scope and evidence

This targeted review covers Apollo's core **Follow the ISS and current crew** flow after adding source-specific recovery for its position and roster regions. It used the local static shell with current browser-side ISS and crew sources available at the time of capture.

## Verdict

The loaded ISS flow is healthy on desktop: position, freshness, map, operational interpretation, and crew roster form a coherent answer to one user question. The new failure treatment is covered by fixtures and preserves that trust posture when either source does not answer. Mobile interaction was checked semantically, but the browser's mobile screenshot was invalid and is deliberately excluded from visual evidence.

## Steps

| Step | Evidence | Health |
| --- | --- | --- |
| 1 | `03-iss-live-loaded.png` | Healthy — desktop presents the live map, timestamp, orbital context, and crew roster in one clear hierarchy. |
| 2 | Fixture: `ISS source failures keep recovery with the affected data` | Healthy in code — each unavailable region names its source and offers retry, upstream source, and Dashboard recovery. |
| 3 | Browser DOM at 390px | Semantically healthy — Refresh data, the map region, and crew heading remained reachable; the refresh completed by keyboard. |

## Findings

- **Fixed:** A failed position or roster source no longer leaves the ISS user on a generic alert with only the distant header refresh control.
- **Deferred:** The 390px screenshot output did not match the browser DOM, so mobile visual layout, touch target size, and full reflow remain unproven.
- **Founder decision needed:** The no-stale-data policy still governs all source-dependent flows. The new recovery state makes that policy usable, but it does not replace a resilience decision.

## Verification limits

- This captures one current loaded ISS/crew state, not long-term source reliability.
- Screenshot and DOM checks do not prove screen-reader announcements, contrast, or complete keyboard focus order.

## Sky Anomalies follow-up

This bounded follow-up covers the experimental **Check a sky sighting against available context** flow in the same local shell. At capture time the browser could load the direct ISS source, while the static shell could not serve the three Vercel-backed connected sources. That produced a useful, but deliberately partial, source context.

| Step | Evidence | Health |
| --- | --- | --- |
| 4 | `04-sky-anomalies-start.png` | Healthy — the pre-submit screen names partial context, identifies the one loaded source, and makes the scope limits visible before the user submits. |
| 5 | `05-sky-anomalies-submitted-pre-fix.png` | Defect found — a seconds-long sighting still received generic ISS copy about movement “over minutes”, contradicting the submitted observation. |
| 6 | `06-sky-anomalies-submitted.png` | Healthy after fix — the submitted traits remain visible; the ISS candidate now says that current position alone cannot link the seconds-long sighting, and the unavailable/planned sources remain visibly separated. |

### Follow-up limits

- Browser click submission was verified. Keyboard-only submission, mobile reflow, touch target size, screen-reader announcements, and production serverless source success remain open.
- This result is context only, not an identity claim. Apollo still has no location-aware overhead, fireball, aircraft, satellite, planet, or reported-sighting matching.

## Vercel runtime and mobile Watch follow-up

This bounded follow-up ran the linked Vercel development runtime from a temporary copied checkout. Vercel's function worker cannot run directly from the CloudDocs workspace path because it contains spaces. The copied runtime served current launch and NOAA weather data; it had no local NASA key, so health correctly reported degraded and asteroid/APOD success could not be assessed.

| Step | Evidence | Health |
| --- | --- | --- |
| 7 | `07-launches-loaded.png` | Healthy — current serverless launch data renders a clear next-mission answer with countdown, launch window, location, source, and status. |
| 8 | `08-launches-details.png` | Healthy — a mission-detail disclosure expands in place and preserves the schedule's context. Header Refresh reloaded current data successfully. |
| 9 | `09-launches-mobile-loaded.png` | Healthy at 390px — the mobile dock and loaded launch spotlight fit without horizontal clipping in the captured viewport. |
| 10 | `10-mobile-watch-menu.png` | Healthy — Watch opens above the dock with Weather, Asteroids, and Anomalies as separate destinations. |
| 11 | `11-weather-mobile-loaded.png` | Healthy — selecting Weather reaches a loaded, legible 390px space-weather summary rather than a generic intermediary page. |

### Runtime limits

- `/api/health` returned `503 degraded` and `/api/neo` returned `NASA_API_KEY_MISSING`; this accurately reflects the local environment and does not establish deployed production configuration.
- Click interaction and the 390px browser viewport were verified. Keyboard-only, touch hardware, full reflow, screen-reader, and production deployment checks remain open.

## NASA-backed flow follow-up

This bounded follow-up used NASA's public, rate-limited `DEMO_KEY` only as a process-local value for the linked Vercel development runtime; no credential was saved to the project. `/api/health` returned `200 ok`, APOD returned current normalized media, and the NeoWs route returned seven current normalized records. A first APOD response took 10.93 seconds, which exposed a product defect: the browser previously aborted at 10 seconds before a serverless route could complete its own 10-second upstream timeout. The browser allowance now has a 15-second ceiling, and every shared page references the updated script version.

| Step | Evidence | Health |
| --- | --- | --- |
| 12 | `12-gallery-loaded.png` | Healthy — current APOD image, title, credit, concise context, facts, full-media action, and NASA source form one loaded Gallery answer. Pointer and Enter activation of Refresh kept this loaded state. |
| 13 | `13-asteroids-loaded.png` | Healthy — current NeoWs data clearly separates the potential-hazard flag from an impact prediction, leads with the closest approach, and keeps supporting objects subordinate. Pointer and Enter activation of Refresh kept this loaded state. |

### Follow-up limits

- This proves a bounded local runtime session with NASA's shared exploration key, not a repeatable or deployed production credential configuration. A final direct NASA query returned `OVER_RATE_LIMIT`, confirming the expected limit rather than a product outage.
- A requested 390px browser viewport still reported a 1280px layout; no new mobile visual, touch-hardware, or reflow conclusion is accepted from this follow-up.

## Dashboard partial-state follow-up

This bounded check ran the linked Vercel development runtime without a NASA key. Four sources still produced a useful current picture—ISS position, crew, Launches, and NOAA weather—while APOD and NeoWs stayed explicitly unavailable. That is the intended partial state, not a claim that all source data is live.

| Step | Evidence | Health |
| --- | --- | --- |
| 14 | `14-dashboard-partial-pre-fix.png` | Defect found — the header chip correctly said `Partial data`, but the hero subtitle said `Mostly Calm`; the two level-setting messages conflicted. |
| 15 | `15-dashboard-partial-loaded.png` | Healthy after fix — hero, status chip, Space Brief, unavailable asteroid metric, and the 4-of-6 source matrix now tell one consistent partial-data story. Enter Refresh retained this state. |

### Follow-up limits

- This is accepted desktop partial-state evidence only; it does not establish a full-live Dashboard, production deployment, mobile/reflow, or assistive-technology result.
