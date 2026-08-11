# Product Lab Progress

## Goal

Deliver Apollo as a focused, trustworthy space-activity dashboard through bounded, validated milestones. This is the durable record for current delivery decisions and evidence.

## Current milestone

**Milestone 3 — Remove the source-unavailable retry dead end.** Completed locally: users can retry the affected source without first finding the header-level Refresh control.

## Fixed

- Added an explicit, keyboard-reachable retry in Apollo's unavailable-source state. It rechecks the relevant shared dashboard data on Gallery, Weather, and Asteroids, and the launch schedule on Launches.
- Preserved source honesty: users still see the checked source, a source-specific upstream link, and a route back to the Dashboard. No stale data is presented as live.
- Versioned the page script references so browsers receive the new recovery behaviour rather than an older cached script.
- Updated `FLOW-REGISTRY.md` and `DESIGN-STATUS.md` with the verified seven-flow inventory, affected states, QA limits, and ranked design opportunities.
- `npm run check` passed: 103 tests, including the new static regression assertions for both retry controls.

## Validation evidence

- 2026-08-10: static local preview returned an unavailable Launches state; the retry control was visible and enabled in the accessible DOM.
- 2026-08-10: activating `Try The Space Devs again` issued a fresh `/api/launches?limit=20` request while preserving the user on the same page and returning to the honest unavailable state when the local static server could not provide that route.
- 2026-08-10: the shared `Try NASA APOD again` control was visible and enabled on Gallery and issued a fresh `/api/apod` request without navigation.
- 2026-08-10: `npm run check` completed successfully with 103 passing tests.

## Deferred

- Fresh visual screenshots are not accepted evidence: the in-app browser's image capture did not match its visible DOM. Do not treat the saved captures as UI QA.
- A Vercel local preview could not start because it needed network access; the safer static preview cannot validate Vercel routes or live-source success states.
- Production and live-source QA, keyboard-only navigation, touch targets, zoom/reflow, contrast, and screen-reader announcements remain open for all seven flows.

## Founder decision needed

1. **Source resilience policy:** approve either bounded, visibly aged last-known-good data or the existing no-stale-data policy with the newly improved recovery state.
2. **Primary moment:** confirm whether Apollo should be a concise Space Brief or a broader data browser.
3. **Sky Anomalies:** keep it deliberately experimental and lower prominence, or fund a narrowly scoped location-aware evidence set.

## Next coherent milestone

Run a browser-backed QA pass against functioning Vercel routes, beginning with the four source-dependent flows. Capture the loaded and unavailable states, test the in-state retry with keyboard and touch, then fix only concrete findings.
