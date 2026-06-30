# Research Report: Apollo Product UX Review

Date: 2026-06-30
Automation ID: research
Product: Apollo

## Summary

Apollo's strongest experience is the focused dashboard idea: a user can quickly understand that some live space signals are available while others are not. The app also has a clear multi-page structure and a useful anomaly-check concept.

The main product risk is trust. In the current local run, most API-backed surfaces render as unavailable, but the interface still says "Live data" and offers limited explanation of what failed, what still works, and what the user can do next. The Sky Anomalies flow also presents quantitative-looking "fit" scores even when several underlying sources are marked as planned or unavailable, which can feel more precise than the evidence supports.

## Audit Scope

Primary flows reviewed:

- Dashboard comprehension and refresh state.
- Primary navigation and Watch menu.
- ISS detail page.
- Launches, Weather, Asteroids, and Gallery unavailable states.
- Sky Anomalies form and submitted-result flow.
- Theme toggle.
- Mobile dashboard and Watch menu.

Evidence captured in `automation/research/screenshots/`:

- `02-watch-menu-desktop.png`
- `04-iss-detail.png`
- `05-launches-detail.png`
- `06-weather-detail.png`
- `07-asteroids-detail.png`
- `08-gallery-detail.png`
- `09-anomalies-initial.png`
- `10-anomalies-submitted.png`
- `16-dashboard-desktop-after-wait.png`
- `20-dashboard-mobile-viewport.png`
- `21-watch-mobile-viewport.png`

## Evidence Limits

- The local Vercel dev server started only after network approval and then the API routes for APOD, Launches, NeoWs, and Space Weather failed in this workspace with repeated function errors. The user-facing outage states are valid evidence, but this run does not prove the same feeds fail in production.
- Full-page mobile screenshots produced capture artifacts that did not match viewport hit testing. Mobile recommendations rely on the valid viewport captures.
- This was a product-flow review, not a full WCAG audit. Keyboard, screen reader, reduced motion, and contrast need deeper verification before making compliance claims.

## Flow Notes

1. Dashboard: The page communicates the core product promise well, but partial data creates mixed signals. Users see "Space Activity: Partial" and unavailable cards, while the header still says "Live data."
2. Navigation and Watch menu: The top-level structure is understandable. Watch is a useful grouping for Weather, Asteroids, and Anomalies, though grouped pages need stronger active and recovery context when their data fails.
3. ISS detail: This is the healthiest flow in the run. It gives status, location, altitude, crew, map context, and source timing in a way that supports the product goal.
4. Launches, Weather, Asteroids, Gallery: When the primary source fails, each page becomes mostly blank with one short error line. The pages feel broken rather than gracefully degraded.
5. Sky Anomalies: The form is approachable, but submitted results include precise-looking fit scores and likely explanations even while naming major source gaps.
6. Mobile dashboard: The layout is readable in the valid viewport capture, but the fixed bottom dock covers the lower portion of visible content while the user scans quick stats.

## Recommendations

### R1. Reconcile "Live data" with partial or failed source states

Priority: P1
Complexity: Low

User problem: A user sees "Live data" in the header while the dashboard says "Space Activity: Partial" and multiple cards say "Unavailable." This weakens confidence because the product appears to contradict itself.

Expected user benefit: Users can immediately tell whether Apollo is live, partially live, or degraded without needing to inspect every card.

Recommendation: Make the global live-state language match the actual source state. When several sources fail, the top-level status should communicate partial availability rather than a blanket live-data claim.

Evidence: `16-dashboard-desktop-after-wait.png`, `20-dashboard-mobile-viewport.png`.

### R2. Restore or expose a source-status summary where users need it most

Priority: P1
Complexity: Medium

User problem: When Launches, Asteroids, Weather, and Gallery fail, users get scattered one-line messages but no central explanation of which sources loaded, which failed, and whether the product itself is still usable.

Expected user benefit: Users can distinguish a source outage from a broken app and can keep using the working parts of Apollo.

Recommendation: Provide a concise source-status summary in the dashboard and failed detail pages, focused on user trust rather than diagnostics.

Evidence: `05-launches-detail.png`, `06-weather-detail.png`, `07-asteroids-detail.png`, `08-gallery-detail.png`; product docs describe a dashboard source-status card, but the current dashboard markup does not expose it.

### R3. Make unavailable detail pages feel intentionally degraded, not empty

Priority: P1
Complexity: Low

User problem: Failed detail pages have a page title, refresh button, and one alert, followed by a large empty area. A user who lands on these pages has no useful fallback context or next step.

Expected user benefit: Users stay oriented and understand what remains available even when a source is down.

Recommendation: Treat source failure as a complete page state with clear recovery, available alternatives, and source context. Avoid leaving the main content area visually empty.

Evidence: `05-launches-detail.png`, `06-weather-detail.png`, `07-asteroids-detail.png`, `08-gallery-detail.png`.

### R4. Reduce false precision in Sky Anomalies results

Priority: P1
Complexity: Medium

User problem: The anomaly result shows ranked explanations with numeric "fit" scores even when the app states that satellite visibility, flight tracking, planet-position, fireball, and UAP feeds are not connected. The numbers imply evidence quality the product does not currently have.

Expected user benefit: Users are less likely to overtrust speculative output and more likely to understand Apollo as a cautious context checker.

Recommendation: Reframe anomaly results around evidence categories and known gaps instead of precise-looking scores when the supporting sources are missing.

Evidence: `10-anomalies-submitted.png`.

### R5. Clarify location and time assumptions in the anomaly check

Priority: P2
Complexity: Low

User problem: The form asks for location, date, and time, then reports a timezone-specific result. Users outside the browser's current timezone may not know how their sighting time was interpreted.

Expected user benefit: Users can trust that the sighting context matches the place and moment they intended.

Recommendation: Make the time interpretation explicit in the result and avoid implying precise location-aware matching when Apollo is using only partial context.

Evidence: `09-anomalies-initial.png`, `10-anomalies-submitted.png`.

### R6. Prioritize useful partial results over unavailable watch items

Priority: P2
Complexity: Low

User problem: In a partial-data state, Watch Items leads with unavailable asteroid context while a working ISS and crew signal is available. The dashboard makes the outage more prominent than the usable insight.

Expected user benefit: Users get a more helpful "what should I pay attention to?" answer even when some feeds fail.

Recommendation: In partial states, emphasize the best available live signals first and group unavailable signals as source limitations.

Evidence: Dashboard state captured after refresh: ISS and Crew loaded, Launches/Asteroids/Weather unavailable; `16-dashboard-desktop-after-wait.png`.

### R7. Align refresh and freshness language across pages

Priority: P2
Complexity: Low

User problem: Some failed pages show a normal-looking "Last updated" time while the page content says the source did not load. Other pages use "Signal lost." The inconsistency makes freshness hard to interpret.

Expected user benefit: Users can tell whether the timestamp means data was loaded, a check was attempted, or a source failed.

Recommendation: Use one freshness/status convention across dashboard and detail pages, especially in error states.

Evidence: `05-launches-detail.png`, `06-weather-detail.png`, `07-asteroids-detail.png`, `08-gallery-detail.png`.

### R8. Keep the mobile dock from covering scannable content

Priority: P2
Complexity: Low

User problem: On mobile, the fixed bottom dock sits over the lower quick-stat card while the user is scanning the dashboard. It makes the page feel cramped and can hide status text.

Expected user benefit: Users can scan the dashboard without important content sitting underneath navigation.

Recommendation: Give mobile content enough clear space around the dock or adjust the dock behavior so it does not obscure active reading areas.

Evidence: `20-dashboard-mobile-viewport.png`, `21-watch-mobile-viewport.png`.

### R9. Make card affordance match interactivity on dashboard metrics

Priority: P3
Complexity: Low

User problem: Quick-stat cards look like tappable summary cards, but the main next actions live elsewhere in navigation and command panels. This can create small hesitation for users trying to drill into a metric.

Expected user benefit: Users know where to click next without testing non-interactive surfaces.

Recommendation: Either make dashboard metrics clearly actionable or visually reduce their affordance so they read as status only.

Evidence: `16-dashboard-desktop-after-wait.png`, `20-dashboard-mobile-viewport.png`.

### R10. Make the theme toggle visually self-explanatory

Priority: P3
Complexity: Low

User problem: The theme control is accessible by label, but visually it appears as a small toggle icon without context. Users may not immediately understand it changes light/dark mode.

Expected user benefit: Users can confidently use the control without guessing.

Recommendation: Clarify the visible affordance for the theme action while preserving the compact utility treatment.

Evidence: `02-watch-menu-desktop.png`, `20-dashboard-mobile-viewport.png`.

## Suggested Review Focus

The Review automation should focus first on trust and degraded states: global source status, failed detail pages, anomaly result claims, and mobile dock overlap. These improvements make Apollo better without expanding scope.
