# Implementation Report: Apollo July 1 Design Recommendations

Date: 2026-07-01
Automation ID: 03-design
Input: `automation/review/latest.md`
Branch: `main`

## Completed Implementation

- Implemented the approved R1/R2 partial-state fix found during browser verification: dashboard Recent Activity and Watch Items now require a real ISS object before reading coordinates, so degraded checks finish instead of throwing when ISS is unavailable.
- Made the Sky Anomalies overview source-state aware. It now renders `Sources ready`, `Partial source context`, or `Sources unavailable` from connected ISS, launch, asteroid, and space-weather context instead of always claiming readiness.
- Added connected-source labels inside the Anomalies overview cells so each context source says whether it loaded or is unavailable.
- Reordered Anomalies result candidates so connected checked evidence comes first, connected source unavailability comes next, and planned source gaps follow.
- Added pre-submit Anomalies assumption copy for browser-local time and descriptive-only typed location handling, matching the submitted result recap.
- Tightened the mobile Watch dropdown so it opens as a distinct navigation surface above the fixed dock.
- Added mobile scroll-padding and focus scroll-margin so form controls and focused targets can be scrolled above the fixed dock and safe-area inset.
- Updated `DESIGN-README.md`, `PRODUCT-README.md`, and `tests/accessibility-structure.test.js` for the new source-readiness, evidence-ordering, mobile Watch, focus-clearance, and accessibility contracts.

## Validation

- `npm run check` passed.
- Node test suite passed: 96 tests.
- Browser verification used a local static server plus Playwright Chromium with controlled degraded source responses.
- Degraded dashboard at 390x844:
  - Header chip: `Partial data`.
  - Freshness label: `Last checked`.
  - Refresh button re-enabled.
  - Recent Activity used loaded APOD content.
  - Watch Items listed unavailable source limitations.
  - Dynamic dashboard regions reported `aria-busy="false"`.
  - Watch menu measured above the fixed dock.
- Sky Anomalies at 390x844:
  - Partial connected context rendered `Partial source context`.
  - Assumption copy was visible before submission.
  - Submit control measured clear of the fixed dock.
- Sky Anomalies at 375x667:
  - All-unavailable context rendered `Sources unavailable`.
  - Submitted result ordered `Source unavailable` rows before `Planned source gap` rows.
  - Result recap retained the descriptive-location assumption.
- Mobile accessibility inspection at 390x844:
  - Mobile dock names: Dashboard, ISS, Launches, Watch, Gallery.
  - Hidden desktop navigation was not displayed at phone width.
  - Mobile nav icons remained `aria-hidden="true"`.

## Screenshots

- `automation/implementation/screenshots/dashboard-mobile-390x844.png`
- `automation/implementation/screenshots/dashboard-mobile-375x667.png`
- `automation/implementation/screenshots/watch-menu-mobile-390x844.png`
- `automation/implementation/screenshots/anomalies-mobile-390x844.png`
- `automation/implementation/screenshots/anomalies-mobile-375x667.png`

## Notes

- Browser verification intentionally generated 503 responses for degraded sources and one 404 for the dummy APOD image; those console messages were expected for the controlled degraded run.
- Playwright Chromium was installed into the user Playwright cache to complete the required browser verification.
- No new APIs, geocoding, persistence, accounts, filters, charts, notifications, reports, or new navigation destinations were added.
