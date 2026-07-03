# Implementation Report: Apollo July 3 Design Recommendations

Date: 2026-07-03
Automation ID: 03-design
Input: `automation/review/latest.md`
Branch: `main`

## Completed Implementation

- Implemented source-aware first-load and refresh progress from the shared source-state model. Data Sources now starts with `Checking` rows, then updates to `Loaded`, `Needs attention`, or `Source unavailable` as each family resolves without waiting for slower sources.
- Updated dashboard freshness and status copy so checking, partial, unavailable, and fully loaded states use one vocabulary across the public-data chip, Space Brief, Recent Activity, Watch Items, and Data Sources.
- Streamlined unavailable detail-page states for Gallery, Launches, Asteroids, and Weather to one primary `Data unavailable` status, one plain explanation, the checked source, and one recovery path using `Last checked`.
- Reordered submitted Sky Anomalies results so the conclusion and checked connected-source state appear before the observation recap and planned gaps on mobile and desktop.
- Moved planned satellite, aircraft, planet, fireball, and UAP/reporting categories into a separate `Planned source gaps` section labeled as not checked evidence.
- Made the mobile Watch menu dismiss on underlying page scroll and menu-item selection while preserving Bootstrap outside-tap and Escape dismissal, focus order, `aria-expanded`, and the existing five mobile destinations.
- Updated `DESIGN-README.md`, `PRODUCT-README.md`, and `tests/accessibility-structure.test.js` for the new source-state, unavailable-copy, Anomalies hierarchy, and Watch menu contracts.

## Validation

- `npm run check` passed.
- Node test suite passed: 96 tests.
- Browser verification passed using local mocked source responses and Playwright Chromium:
  - Dashboard at 390x844 showed a mixed slow/degraded first-load state with `Checking`, `Loaded`, and `Source unavailable` visible together.
  - Source status `aria-busy` transitioned from `true` during the slow source to `false` after completion.
  - Mobile Watch menu dismissed on page scroll and after Escape; `aria-expanded` returned to `false`.
  - Phone width exposed 5 mobile dock destinations and 0 visible desktop navigation links.
  - ISS page exposed the map region as `Interactive map showing the current ISS position above Earth`.
  - Sky Anomalies submitted results at 390x844 and 375x667 ordered checked sources before possible explanations, observation recap, and planned source gaps.
  - Reduced-motion emulation was active for the browser run.

## Screenshots

- `automation/implementation/screenshots/dashboard-progressive-source-state-390x844.png`
- `automation/implementation/screenshots/watch-menu-dismissed-after-scroll-390x844.png`
- `automation/implementation/screenshots/anomalies-submitted-source-first-390x844.png`
- `automation/implementation/screenshots/anomalies-submitted-source-first-375x667.png`

## Follow-Up Items

- None for the approved July 3 scope.
