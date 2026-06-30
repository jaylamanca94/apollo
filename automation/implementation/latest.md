# Implementation Report: Apollo Source-State UX

Date: 2026-06-30
Automation ID: 03-design
Input: `automation/review/latest.md`
Branch: `main`

## Completed Implementation

- Restored the dashboard Data Sources closing section and wired `sourceStatusBody` into the existing source-status renderer and refresh `aria-controls`.
- Replaced the initial global "Live data" claim with a loading state, then update the header chip to live, partial, or unavailable from connected source results.
- Added shared degraded-state markup for Gallery, Asteroids, and Weather, plus a matching Launches-page failure state with recovery copy, upstream source links, and Dashboard/ISS navigation.
- Aligned freshness language so successful loads use "Last updated" and partial or failed checks use "Last checked."
- Reordered Watch Items so loaded ISS, crew, launch, asteroid, and weather signals appear before rows labeled as source limitations.
- Removed numeric Sky Anomalies `/100 fit` presentation and replaced it with qualitative evidence labels such as connected source match, partial source context, trait-only possibility, source unavailable, and planned source gap.
- Added Sky Anomalies result copy for browser-local time interpretation and descriptive-only free-form location handling.
- Increased phone-width bottom content clearance so dashboard content and the Watch menu can scroll above the fixed mobile dock.
- Updated product/design docs and static tests for the new source-state, degraded-state, anomaly-language, freshness, and mobile-clearance contracts.

## Validation

- `npm run check` passed.
- Node test suite passed: 91 tests.
- Browser verification at 390x844 using local static server:
  - Dashboard settled to `Partial data` and `Last checked` with source limitations listed.
  - Watch menu opened above the fixed dock.
  - Bottom-scroll measurement confirmed the last dashboard card clears the fixed dock.
- Screenshots:
  - `automation/implementation/screenshots/dashboard-mobile-390x844.png`
  - `automation/implementation/screenshots/watch-menu-mobile-390x844.png`

## Notes

- `vercel dev` could not be used for browser verification because the configured Vercel token is invalid. A local static server was used for visual verification; API routes intentionally returned unavailable responses to exercise degraded states.
- No new APIs, geocoding, persistence, accounts, filters, charts, notifications, reports, or unapproved R9/R10 affordance changes were added.
