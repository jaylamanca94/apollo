# Product Lab Progress

## Goal

Deliver Apollo as a focused, trustworthy space-activity dashboard through bounded, validated milestones. This is the durable record for current delivery decisions and evidence.

## Current milestone

**Milestone 4 — Complete source-specific recovery on the ISS core flow.** Completed locally: an unavailable ISS position or crew roster no longer leaves its affected region as a bare alert.

## Fixed

- Added an explicit, keyboard-reachable retry in Apollo's unavailable-source state. It rechecks the relevant shared dashboard data on Gallery, Weather, and Asteroids, and the launch schedule on Launches.
- Extended that recovery state to the core ISS flow: position and crew failures now name the affected source, avoid stale orbital or roster data, and provide the same retry, upstream-source, and Dashboard options.
- Preserved source honesty: users still see the checked source, a source-specific upstream link, and a route back to the Dashboard. No stale data is presented as live.
- Versioned the page script references so browsers receive the new recovery behaviour rather than an older cached script.
- Updated `FLOW-REGISTRY.md` and `DESIGN-STATUS.md` with the verified seven-flow inventory, affected states, QA limits, and ranked design opportunities.
- `npm run check` passed: 104 tests, including source-specific failure fixtures for the ISS position and crew roster.

## Validation evidence

- 2026-08-10: static local preview returned an unavailable Launches state; the retry control was visible and enabled in the accessible DOM.
- 2026-08-10: activating `Try The Space Devs again` issued a fresh `/api/launches?limit=20` request while preserving the user on the same page and returning to the honest unavailable state when the local static server could not provide that route.
- 2026-08-10: the shared `Try NASA APOD again` control was visible and enabled on Gallery and issued a fresh `/api/apod` request without navigation.
- 2026-08-10: `npm run check` completed successfully with 104 passing tests.
- 2026-08-10: fixture coverage confirms ISS position and crew-source failures render their source-specific recovery controls.
- 2026-08-10: accepted desktop evidence in `product-review-2026-08-10/03-iss-live-loaded.png` shows current ISS position, map, freshness, and crew roster together; keyboard Refresh also completed at a 390px viewport.

## Deferred

- A 390px browser screenshot did not match its visible DOM and was discarded. Do not treat mobile visual QA as complete; desktop ISS evidence is accepted.
- A Vercel local preview could not start because it needed network access; the safer static preview cannot validate Vercel routes or live-source success states.
- Production and live-source QA, keyboard-only navigation, touch targets, zoom/reflow, contrast, and screen-reader announcements remain open for all seven flows.

## Founder decision needed

1. **Source resilience policy:** approve either bounded, visibly aged last-known-good data or the existing no-stale-data policy with the newly improved recovery state.
2. **Primary moment:** confirm whether Apollo should be a concise Space Brief or a broader data browser.
3. **Sky Anomalies:** keep it deliberately experimental and lower prominence, or fund a narrowly scoped location-aware evidence set.

## Next coherent milestone

Run a browser-backed QA pass against functioning Vercel routes, beginning with the four source-dependent flows. Capture the loaded and unavailable states, test the in-state retry with keyboard and touch, then fix only concrete findings.
