# Research Report: Apollo Product UX Review

Date: 2026-07-01
Automation ID: research
Product: Apollo

## Summary

Apollo is moving in the right direction. The failed detail pages now feel intentional instead of empty, the source-status card is visible on the dashboard, the ISS detail page is a strong source-backed experience, and the Sky Anomalies result no longer uses false-precision scores.

The current product risk is state coherence. In a degraded desktop run, the dashboard source-status card finishes with a clear partial-data summary, but the global chip, refresh button, Recent Activity, and Watch Items remain in loading states. On mobile, the fixed bottom dock still covers scannable content and form controls, which turns a clean product shell into a usability and accessibility problem.

## Audit Scope

Primary flows reviewed:

1. Dashboard comprehension, partial-data state, refresh state, Recent Activity, Watch Items, and source-status card.
2. Primary navigation and Watch menu on desktop and mobile.
3. ISS detail page.
4. Launches, Weather, Asteroids, and Gallery unavailable states.
5. Sky Anomalies form, source-readiness state, and submitted result.
6. Mobile dashboard and mobile Sky Anomalies form behavior.

Accepted current-run evidence is saved in `automation/research/screenshots/2026-07-01/`:

- `03-watch-menu-desktop.png`
- `04-iss-detail.png`
- `05-launches-detail.png`
- `06-weather-detail.png`
- `07-asteroids-detail.png`
- `08-gallery-detail.png`
- `09-anomalies-initial.png`
- `10-anomalies-initial-after-wait.png`
- `11-anomalies-submitted.png`
- `12-anomalies-submitted-lower.png`
- `13-dashboard-mobile.png`
- `14-watch-menu-mobile.png`
- `16-anomalies-mobile-after-wait.png`
- `17-dashboard-desktop-after-long-wait.png`

## Evidence Limits

- Vercel CLI could not be used for this run because the approval was rejected after it attempted to contact Vercel and write outside the workspace. I used a localhost-only static server instead.
- Because the static server does not execute the Vercel API proxy routes, APOD, Launches, NeoWs, and Space Weather appeared unavailable in this local run. The recommendations are about user-facing degraded states, not a claim that production feeds are down.
- Direct browser-side ISS and crew sources did load in some flows and fail in others. This is useful evidence for resilience and state clarity, but not a source-availability diagnosis.
- This was a product-flow and screenshot audit, not a full WCAG audit. Keyboard order, screen reader output, reduced motion, and contrast need deeper verification.

## Flow Notes

1. Dashboard: The source-status card now explains partial availability, but the top-level live chip can still say "Checking data," the timestamp can remain "Standing by," and the refresh button can remain disabled while the source card is already final.
2. Recent Activity and Watch Items: These are primary decision panels, but on degraded desktop they stayed in "Checking..." states even after the dashboard knew only 1 of 6 sources loaded.
3. Navigation and Watch menu: Desktop navigation is understandable. On mobile, the Watch menu opens over dashboard cards and competes with the fixed dock.
4. ISS detail: This is the healthiest flow. It gives status, map, position fix, current-position context, source link, and crew roster in a coherent order.
5. Launches, Weather, Asteroids, Gallery: The unavailable states are now consistent and useful. They explain the source, avoid stale/sample data, and offer refresh, source, Dashboard, and ISS paths.
6. Sky Anomalies: The submitted result is cautious and labels planned source gaps clearly. Before submission, however, the summary says "Sources ready" even when most sources are unavailable.
7. Mobile dashboard and forms: The bottom dock covers lower quick-stat content and overlaps Sky Anomalies radio controls, making scanning and selection harder.

## Recommendations

### R1. Make dashboard partial states finish consistently

Priority: P1
Estimated implementation complexity: Medium

User problem: A user can see "Space Activity: Partial" and a completed source-status card while the header still says "Checking data," the timestamp says "Last updated: Standing by," and the refresh button remains disabled as "Refreshing data."

Expected user benefit: Users can trust that the dashboard has finished checking sources and can decide what is usable without interpreting contradictory status labels.

Recommendation: Align the dashboard's global chip, freshness label, refresh control, and source-status summary around one final partial-data state when source checks are done.

Evidence: `17-dashboard-desktop-after-long-wait.png`.

### R2. Give Recent Activity and Watch Items partial-state content

Priority: P1
Estimated implementation complexity: Medium

User problem: Recent Activity and Watch Items can stay stuck on "Checking..." even after the dashboard has enough information to say which sources loaded and failed.

Expected user benefit: Users still get a useful "what should I pay attention to?" answer in degraded conditions instead of two primary panels that look unfinished.

Recommendation: Treat these panels as part of the final degraded dashboard state. Show available live signals first and source limitations second when complete activity cannot be built.

Evidence: `17-dashboard-desktop-after-long-wait.png`, `13-dashboard-mobile.png`.

### R3. Keep the mobile dock clear of content and form controls

Priority: P1
Estimated implementation complexity: Low

User problem: The mobile dock covers dashboard cards and Sky Anomalies radio controls. A user has to work around the navigation while scanning status or choosing form options.

Expected user benefit: Mobile users can read dashboard status and complete the sighting form without content sitting underneath navigation.

Recommendation: Ensure mobile content, menus, and form controls always have clear space above the dock.

Evidence: `13-dashboard-mobile.png`, `14-watch-menu-mobile.png`, `16-anomalies-mobile-after-wait.png`.

### R4. Make the mobile Watch menu feel like navigation, not an overlay collision

Priority: P2
Estimated implementation complexity: Low

User problem: The Watch menu opens over quick-stat cards while the bottom dock remains in the same visual layer, making the menu feel cramped and temporary.

Expected user benefit: Users can confidently choose Weather, Asteroids, or Anomalies on a phone without the menu competing with page content.

Recommendation: Rework the mobile Watch menu presentation so the destination choices are visually separated from underlying cards and the dock.

Evidence: `14-watch-menu-mobile.png`.

### R5. Reframe Sky Anomalies source readiness when sources are degraded

Priority: P2
Estimated implementation complexity: Low

User problem: The pre-submit Anomalies context says "Sources ready" while Launches, Space Weather, and Asteroids are unavailable. That overstates readiness before the user checks a sighting.

Expected user benefit: Users understand the quality of the current context before relying on the result.

Recommendation: Make the pre-submit source summary match the actual source state, especially when only some context is available.

Evidence: `10-anomalies-initial-after-wait.png`, `16-anomalies-mobile-after-wait.png`.

### R6. Rank checked evidence above planned source gaps in Anomalies results

Priority: P2
Estimated implementation complexity: Medium

User problem: After submission, the result can lead with possible explanations tied to planned imports, such as satellite visibility, meteor reports, and planet positions, before showing connected-but-unavailable sources. This may make unconnected evidence feel more persuasive than it is.

Expected user benefit: Users get a more cautious explanation that distinguishes checked context from plausible-but-unchecked categories.

Recommendation: Make the result hierarchy privilege connected evidence and source status before planned source gaps.

Evidence: `11-anomalies-submitted.png`, `12-anomalies-submitted-lower.png`.

### R7. Clarify Anomalies assumptions before submission

Priority: P2
Estimated implementation complexity: Low

User problem: The form asks for location, date, and time, but the clearest explanation that location is descriptive and time is browser-local appears after submission.

Expected user benefit: Users understand what Apollo can and cannot compare before they invest effort in the form.

Recommendation: Surface the beta limitations and time/location assumptions before the user taps "Check sighting," using the same careful tone already present in the result.

Evidence: `09-anomalies-initial.png`, `11-anomalies-submitted.png`.

### R8. Improve mobile navigation recognizability and assistive-technology confidence

Priority: P3
Estimated implementation complexity: Low

User problem: The mobile dock is icon-only visually, and DOM snapshots show duplicated desktop/mobile navigation structures. Users who do not recognize the icons, or users navigating with assistive technology, may have to work harder to understand the available destinations.

Expected user benefit: Navigation is easier to identify, and accessibility verification has fewer risks around duplicate controls or icon-glyph noise.

Recommendation: Make mobile destination names and current location clearer, and verify that hidden duplicate navigation does not add confusing output for assistive technology.

Evidence: `13-dashboard-mobile.png`, `14-watch-menu-mobile.png`; DOM snapshots from current run.

## Suggested Review Focus

The Review automation should focus on dashboard state completion first, then mobile dock clearance, then Sky Anomalies source-readiness copy and result hierarchy. The detail-page unavailable states and ISS detail flow should mostly be preserved.
