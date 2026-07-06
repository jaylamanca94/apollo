# Implementation Report: Apollo July 6 Design Regression

Date: 2026-07-06
Automation ID: 03-design
Input: `automation/review/latest.md`
Branch: `main`

## Completed Implementation

- Treated the July 6 review as a regression-focused handoff. R1-R5 and R7 were already represented in the product, design, implementation, and static tests; R8 was used as the validation gate.
- Fixed the observed Sky Anomalies launch-timing regression: future scheduled launches now render as `Upcoming launch context` and are explicitly described as upcoming context, not explanatory matches for earlier sightings. Close past launches can still produce strong known-context language.
- Fixed the reduced-motion skip-link regression: the skip link remains hidden until focused when `prefers-reduced-motion: reduce` is active, while still removing nonessential motion.
- Updated `DESIGN-README.md` and `PRODUCT-README.md` to document that future scheduled launches are context only for earlier Sky Anomalies sightings.
- Added static regression coverage in `tests/accessibility-structure.test.js` for future-launch context-only behavior and reduced-motion skip-link focus behavior.

## Validation

- `npm run check` passed.
- Node test suite passed: 96 tests.
- Browser regression verification passed with local static preview, mocked source responses, and cached Playwright Chromium:
  - Slow mixed dashboard first-load state showed `Loaded`, `Source unavailable`, and `Checking` together.
  - Dashboard dynamic regions settled with `aria-busy="false"` and final partial-source status copy.
  - Reduced-motion skip link stayed hidden until focus, then appeared at the top of the viewport.
  - Phone width exposed 5 mobile dock destinations and 0 visible desktop navigation links.
  - Mobile Watch menu dismissed on underlying page scroll and returned `aria-expanded` from `true` to `false`.
  - ISS page exposed the map region as `Interactive map showing the current ISS position above Earth`.
  - Sky Anomalies submitted result at 390x844 and 375x667 kept sources checked before evidence context, observation recap, and planned source gaps.
  - Future launch six hours after the submitted sighting showed `No strong known-space match` and `Upcoming launch context`; a past launch five hours before the sighting still showed `Strong known-context match`.

## Screenshots

- `automation/implementation/screenshots/2026-07-06/dashboard-regression-390x844.png`
- `automation/implementation/screenshots/2026-07-06/watch-menu-dismissal-regression-390x844.png`
- `automation/implementation/screenshots/2026-07-06/anomalies-future-launch-390x844.png`
- `automation/implementation/screenshots/2026-07-06/anomalies-future-launch-375x667.png`

## Follow-Up Items

- Local commit `9a5b70c` is complete. Pushing `main` to `origin` is blocked pending explicit user approval after the external GitHub disclosure warning.
