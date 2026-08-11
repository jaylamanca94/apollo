# Product Lab Progress

## Goal

Deliver Apollo as a focused, trustworthy space-activity dashboard through bounded, validated milestones. This is the durable record for current delivery decisions and evidence.

## Current milestone

**Milestone 7 — Verify serverless loaded states and mobile Watch navigation.** Completed locally: the linked Vercel runtime served current Launches and Weather data, and the 390px Watch menu opened and reached Weather without losing the selected task.

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

## Deferred

- A 390px browser screenshot did not match its visible DOM and was discarded. Do not treat mobile visual QA as complete; desktop ISS evidence is accepted.
- A Vercel local preview works only from a temporary copied checkout because the direct CloudDocs workspace path contains spaces; the safer static preview still cannot validate Vercel routes or live-source success states.
- The current local static shell intentionally returns 404 for serverless `/api` routes. Its unavailable-state evidence verifies recovery behaviour, not production source availability.
- Vercel's function worker cannot run directly from the CloudDocs workspace because its path contains spaces; a temporary copied checkout was required for this local serverless QA. This is a tooling/environment constraint, not a shipped Apollo failure.
- NASA-dependent APOD and asteroid loaded states remain unverified in Vercel local development until a non-production `NASA_API_KEY` is configured. Production and live-source QA, keyboard-only navigation (including Sky Anomalies submission), touch targets, zoom/reflow, contrast, and screen-reader announcements remain open for all eight flows.

## Founder decision needed

1. **Source resilience policy:** approve either bounded, visibly aged last-known-good data or the existing no-stale-data policy with the newly improved recovery state.
2. **Primary moment:** confirm whether Apollo should be a concise Space Brief or a broader data browser.
3. **Sky Anomalies:** keep it deliberately experimental and lower prominence, or fund a narrowly scoped location-aware evidence set.

## Next coherent milestone

Configure a non-production NASA key for local Vercel development, then capture the Asteroids and Gallery loaded states and test their in-state recovery with keyboard and touch. Keep deployed production verification, assistive-technology checks, and the resilience-policy decision separate.
