# Product Lab Progress

## Goal

Deliver Apollo as a focused, trustworthy space-activity dashboard through bounded, validated milestones. This is the durable record for current delivery decisions and evidence.

## Current milestone

**Milestone 10 — Make the Dashboard's partial state unambiguous.** Completed locally: the linked Vercel runtime showed four usable sources alongside two unavailable NASA sources; the Dashboard now describes that condition as partial at both its header and its Space Brief while preserving the source-qualified calm summary.

## Fixed

- Added an explicit, keyboard-reachable retry in Apollo's unavailable-source state. It rechecks the relevant shared dashboard data on Gallery, Weather, and Asteroids, and the launch schedule on Launches.
- Extended that recovery state to the core ISS flow: position and crew failures now name the affected source, avoid stale orbital or roster data, and provide the same retry, upstream-source, and Dashboard options.
- Verified the remaining recovery paths against the current local shell: Launches, Weather, Asteroids, and Gallery each retain the affected page, accessible source context, and an enabled retry after an unsuccessful recheck.
- Preserved source honesty: users still see the checked source, a source-specific upstream link, and a route back to the Dashboard. No stale data is presented as live.
- Versioned the page script references so browsers receive the new recovery behaviour rather than an older cached script.
- Updated `FLOW-REGISTRY.md` and `DESIGN-STATUS.md` with the verified eight-flow inventory, affected states, QA limits, and ranked design opportunities. Weather and Asteroids are now separate user goals rather than one combined implementation bucket.
- Corrected Sky Anomalies so a seconds-long sighting no longer receives an ISS explanation that says “over minutes”; the result now says that current position alone cannot link that observation to the ISS.
- `npm run check` passed: 105 tests, including source-specific failure fixtures for the ISS position and crew roster and trait-aware anomaly-result copy.
- Verified the Vercel serverless runtime from a temporary copied checkout without CloudDocs path spaces: Launches and Weather returned current upstream data, Launches refresh worked, and mobile Watch navigation reached Weather at 390px.
- Added the documented `npm run dev` entry point and a project-local Vercel runner. It creates an isolated temporary copy, carries local environment configuration, avoids Vercel's path and recursive-development-command limitations, and cleans up after shutdown.
- Extended browser-side source requests from 10 to 15 seconds. The previous client deadline could abort an APOD request before Apollo's serverless route completed its own 10-second upstream timeout and returned an honest result; all shared-page script references now carry the updated cache version.
- Verified Gallery and Asteroids against current NASA data through the linked local Vercel runtime. Both desktop flows rendered loaded data, and their header Refresh control preserved the loaded state with pointer and Enter activation.
- Corrected the Dashboard's partial-state hierarchy. When a core source is unavailable, the hero now says `Space Activity: Partial` instead of `Mostly Calm`; the Space Brief still names what is calm only where sources are available.

## Validation evidence

- 2026-08-10: static local preview returned an unavailable Launches state; the retry control was visible and enabled in the accessible DOM.
- 2026-08-10: activating `Try The Space Devs again` issued a fresh `/api/launches?limit=20` request while preserving the user on the same page and returning to the honest unavailable state when the local static server could not provide that route.
- 2026-08-10: the shared `Try NASA APOD again` control was visible and enabled on Gallery and issued a fresh `/api/apod` request without navigation.
- 2026-08-10: `npm run check` completed successfully with 104 passing tests.
- 2026-08-10: fixture coverage confirms ISS position and crew-source failures render their source-specific recovery controls.
- 2026-08-10: accepted desktop evidence in `product-review-2026-08-10/03-iss-live-loaded.png` shows current ISS position, map, freshness, and crew roster together; keyboard Refresh also completed at a 390px viewport.
- 2026-08-10: current browser DOM verified the source-specific unavailable states and retry controls for Launches, Weather, Asteroids, and Gallery. Click activation issued a fresh local request for each source route and preserved the user on the same page.
- 2026-08-10: accepted desktop captures show Sky Anomalies before submission with one connected source and three unavailable sources (`04-sky-anomalies-start.png`), plus the submitted result with source limits and planned gaps (`06-sky-anomalies-submitted.png`).
- 2026-08-10: browser interaction confirmed a Cape Canaveral, straight-line, bright, seconds-long sighting preserves each submitted trait and renders the corrected ISS limitation; `npm run check` passed with 105 tests.
- 2026-08-10: the linked local Vercel runtime returned `200` for Launches and Space Weather. Accepted captures show the loaded desktop launch overview (`07-launches-loaded.png`), an expanded mission detail (`08-launches-details.png`), the loaded mobile launch overview (`09-launches-mobile-loaded.png`), Watch menu (`10-mobile-watch-menu.png`), and selected loaded Weather destination (`11-weather-mobile-loaded.png`).
- 2026-08-10: in the same runtime, `/api/health` accurately reported `503 degraded` because `NASA_API_KEY` was absent and `/api/neo` returned the corresponding explicit missing-key error. These are local configuration limits, not evidence that the deployed product lacks its key.
- 2026-08-10: `npm run dev -- --listen 127.0.0.1:4181` started successfully from the CloudDocs checkout. `/api/health` reported runtime `ok` and the expected missing-key degradation; stopping the command removed its temporary runtime directory. `bash -n scripts/vercel-dev.sh` and `npm run check` passed with 106 tests.
- 2026-08-10: with NASA's public, rate-limited `DEMO_KEY` supplied only to the local process, `/api/health` returned `200 ok`; `/api/apod` returned current normalized APOD data and `/api/neo?date=2026-08-10` returned seven normalized asteroid records. No key was written to the workspace.
- 2026-08-10: a first APOD response took 10.93 seconds, exceeding the former browser 10-second deadline. After extending the browser deadline to 15 seconds and versioning the shared script references, accepted desktop captures show the Gallery loaded state (`12-gallery-loaded.png`) and the Asteroids loaded state (`13-asteroids-loaded.png`). Pointer and Enter activation of each header Refresh completed while retaining loaded data. `npm run check` passed with 107 tests.
- 2026-08-10: a final direct query with the same public exploration key returned NASA's explicit `OVER_RATE_LIMIT` response. This confirms the local screenshots are valid bounded evidence, while also confirming that `DEMO_KEY` is not suitable for repeatable QA or deployment.
- 2026-08-10: without a NASA key, the linked local Vercel Dashboard settled at four of six sources loaded: ISS position, crew, Launches, and NOAA weather remained useful while APOD and NeoWs were explicitly unavailable. The pre-fix capture (`14-dashboard-partial-pre-fix.png`) exposed a conflicting `Mostly Calm` hero subtitle; the corrected capture (`15-dashboard-partial-loaded.png`) shows the aligned `Partial` subtitle, source-qualified Space Brief, and explicit source matrix. Enter activation of Refresh returned to the same honest state. `npm run check` passed with 108 tests.

## Deferred

- A 390px browser screenshot did not match its visible DOM and was discarded. Do not treat mobile visual QA as complete; desktop ISS evidence is accepted.
- `npm run dev` now handles the temporary copied checkout required by Vercel's path limitation. The safer static preview still cannot validate Vercel routes or live-source success states.
- The current local static shell intentionally returns 404 for serverless `/api` routes. Its unavailable-state evidence verifies recovery behaviour, not production source availability.
- Vercel's function worker cannot run directly from the CloudDocs workspace because its path contains spaces; a temporary copied checkout was required for this local serverless QA. This is a tooling/environment constraint, not a shipped Apollo failure.
- NASA-dependent Gallery and Asteroids desktop loaded states are now verified locally with the public exploration key, but they still need a dedicated non-production key for repeatable QA. Production and live-source QA, keyboard-only navigation (including Sky Anomalies submission), touch targets, zoom/reflow, contrast, and screen-reader announcements remain open for all eight flows.
- The current browser controller did not open the native mobile Watch disclosure with Enter or Space, so keyboard activation remains unverified rather than assumed broken or working. A real-browser keyboard pass is still required.
- NASA's public `DEMO_KEY` is suitable only for bounded exploration and has a limited shared quota; it supplied this local evidence but must not become Apollo's configured deployment credential.
- The current browser viewport override still reported a 1280px layout after a requested 390px size, so this milestone adds no new mobile visual or touch-hardware evidence.

## Founder decision needed

1. **Source resilience policy:** approve either bounded, visibly aged last-known-good data or the existing no-stale-data policy with the newly improved recovery state.
2. **Primary moment:** confirm whether Apollo should be a concise Space Brief or a broader data browser.
3. **Sky Anomalies:** keep it deliberately experimental and lower prominence, or fund a narrowly scoped location-aware evidence set.

## Next coherent milestone

Use a dedicated non-production NASA key to repeat the NASA-backed flows without a shared demo quota, then complete real-browser mobile/reflow and assistive-technology checks. Keep deployed production verification and the resilience-policy decision separate.
