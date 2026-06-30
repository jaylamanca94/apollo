# Review Report: Apollo UX Recommendations

Date: 2026-06-30
Automation ID: 02-review
Input: `automation/research/latest.md`
Product: Apollo

## Review Position

Apollo's mission is to help people understand what is happening in space right now through a focused, source-backed, easy-to-demo public dashboard. The product docs explicitly prioritize tight MVP scope, demo clarity, source quality, maintainability, and trust over feature volume.

The research recommendations are mostly aligned with that mission because they do not add new data sources, accounts, persistence, filters, charts, or reporting workflows. The strongest approved work improves trust when live sources fail and reduces overclaiming in Sky Anomalies. The next Design automation should avoid expanding Apollo beyond its current live and near-live space context job.

## Decision Summary

Approved for Design input:

- R1. Reconcile "Live data" with partial or failed source states.
- R2. Restore or expose a source-status summary where users need it most.
- R3. Make unavailable detail pages feel intentionally degraded, not empty.
- R4. Reduce false precision in Sky Anomalies results.
- R5. Clarify location and time assumptions in the anomaly check.
- R6. Prioritize useful partial results over unavailable watch items.
- R7. Align refresh and freshness language across pages.
- R8. Keep the mobile dock from covering scannable content.

Not approved for the next Design pass:

- R9. Make card affordance match interactivity on dashboard metrics.
- R10. Make the theme toggle visually self-explanatory.

Recommended sequencing:

1. Trust and degraded states: R1, R2, R3, R7.
2. Sky Anomalies caution and context: R4, R5.
3. Partial dashboard usefulness and mobile clearance: R6, R8.

## Product Constraints For Approved Work

- Keep Apollo static, vanilla, Bootstrap/Acadia-aligned, and framework-free.
- Do not add new upstream APIs, geocoding, user accounts, saved locations, persistence, search, notifications, charts, or reporting workflows.
- Do not show sample, fallback, or inferred data as live source-backed activity.
- Use existing source families and existing loaders wherever possible.
- Prefer concise state, source, and recovery language over diagnostic detail.
- Preserve the dashboard as a compact state-at-a-glance surface; do not reintroduce full detail-page content on the homepage.

## Decisions

### R1. Reconcile "Live data" with partial or failed source states

Decision: Approved.

Rationale: This directly supports Apollo's core promise. A global "Live data" claim conflicts with a partial or failed source state and weakens trust. The work is low complexity and should use state Apollo already computes for Space Brief and source statuses.

Acceptance criteria:

- The dashboard header status no longer says "Live data" when multiple primary sources are unavailable.
- The visible status and accessible label use the same state family as the dashboard: live/loaded when sources load, partial/degraded when some fail, and unavailable when the page cannot load any relevant source.
- Planned Sky Anomalies gaps are not counted as live-source failures.
- The state updates after refresh and remains correct on initial load, manual refresh, and failed refresh.
- Tests cover all-loaded and partial-source states.

### R2. Restore or expose a source-status summary where users need it most

Decision: Approved with scope limits.

Rationale: The product and design docs already define a dashboard source-status summary, and `app.js` already contains `renderSourceStatus`, but the dashboard markup does not expose `sourceStatusBody`. Restoring this is an alignment and trust fix, not feature expansion. Detail pages also need a compact source state when their single source fails.

Acceptance criteria:

- The dashboard exposes a compact Data Sources closing section with `sourceStatusBody` or an equivalent target wired to the existing source-status renderer.
- The section reports loaded, attention, and unavailable states for existing Apollo source families only.
- Detail pages with a failed primary source show concise source status, recovery, and source-link context instead of only a one-line alert.
- The summary explains source availability in user terms and does not expose stack traces, function errors, API internals, or implementation diagnostics.
- Dashboard tests are updated so the compact source-status section is allowed without reopening full ISS, people, launch, asteroid, weather, APOD, or anomaly dashboard detail regions.
- Refresh `aria-controls` includes any newly exposed status region.

### R3. Make unavailable detail pages feel intentionally degraded, not empty

Decision: Approved.

Rationale: Launches, Weather, Asteroids, and Gallery are in scope and should remain composed when their source fails. A full-page empty state improves demo clarity and maintainability because each detail page can share the same degraded-state pattern instead of custom blank/error fragments.

Acceptance criteria:

- Launches, Weather, Asteroids, and Gallery render a complete unavailable state when their primary source fails.
- The state includes what did not load, what the user can try next, the relevant upstream source link when useful, and at least one still-useful navigation path such as Dashboard or ISS.
- Failed pages do not show a large empty content area below a short alert.
- No unavailable page renders fake, sample, stale, or guessed data as current activity.
- The pattern remains compact and page-specific; it does not become a diagnostics dashboard.
- Tests or static checks cover the shared degraded-state markup for at least one shared `app.js` page and the separate `launches.js` page.

### R4. Reduce false precision in Sky Anomalies results

Decision: Approved.

Rationale: Sky Anomalies is explicitly trust-first. Numeric "fit" scores imply precision that Apollo does not have while satellite visibility, flight tracking, planet-position, fireball, and UAP feeds are planned gaps. Removing numeric precision strengthens the product without adding scope.

Acceptance criteria:

- Submitted anomaly results no longer show numeric `/100 fit` scores while key comparison sources are unavailable.
- Possible explanations use qualitative evidence labels such as connected source match, partial source context, trait-only possibility, or planned source gap.
- Planned sources are clearly labeled as not connected and are not presented as checked evidence.
- Result ordering can remain, but the language must not imply identity, verification, probability, or extraterrestrial origin.
- Tests assert that numeric fit-score copy is absent and planned source gaps remain visible.

### R5. Clarify location and time assumptions in the anomaly check

Decision: Approved.

Rationale: The current form collects location, date, and time, but Apollo does not yet perform location-aware pass matching or geocoding. Clarifying interpretation prevents the beta check from overstating precision and fits the existing future-roadmap boundary.

Acceptance criteria:

- Submitted results state how Apollo interpreted the sighting time, including browser/local timezone handling when available.
- The location recap makes clear that the typed location is descriptive context unless/until location-aware matching is added.
- Copy avoids implying exact overhead ISS, satellite, aircraft, planet, fireball, or UAP matching from the free-form location field.
- Empty or partial date/time inputs produce clear fallback language rather than hidden assumptions.
- Tests cover the displayed time-assumption copy.

### R6. Prioritize useful partial results over unavailable watch items

Decision: Approved.

Rationale: In partial states, Apollo should still answer "what should I pay attention to?" with the strongest available live signals. This improves the dashboard's primary purpose without adding content or sources.

Acceptance criteria:

- Watch Items show available live signals before unavailable source rows when the dashboard is partially loaded.
- If a data family is unavailable, it is grouped or labeled as a source limitation rather than presented as the lead watch item.
- ISS, crew, launch, asteroid, and weather watch rows continue to use existing loaded data only.
- The dashboard still exposes outage context through the source-status summary.
- Tests cover a partial state where ISS/crew are available and asteroid/weather/launch data are unavailable.

### R7. Align refresh and freshness language across pages

Decision: Approved.

Rationale: Apollo already uses a global freshness pattern, but failed pages mix "Last updated", "Signal lost", and normal-looking timestamps. A consistent convention improves trust and reduces content drift across `app.js` and `launches.js`.

Acceptance criteria:

- "Last updated" is used only when page data successfully loads.
- Failed source attempts use consistent wording such as "Last checked" or "Source unavailable" instead of a normal successful freshness label.
- Source observation times remain separately labeled as observations, fixes, windows, or source dates where relevant.
- Dashboard, Launches, Weather, Asteroids, Gallery, and Anomalies follow the same convention.
- Shared tests cover success and failure freshness copy in both `app.js` pages and `launches.js`.

### R8. Keep the mobile dock from covering scannable content

Decision: Approved.

Rationale: Mobile dashboard scanning is core to demo quality. The fixed dock is an accepted navigation pattern, but content must have enough clear space around it. This is a small CSS/layout correction, not a product expansion.

Acceptance criteria:

- On phone-width viewports, content bottom clearance accounts for the fixed dock height, the intended gap, and safe-area inset.
- The last visible dashboard card, watch menu content, and focus targets can scroll fully above the dock.
- The mobile dock remains fixed, accessible, and consistent with the documented Acadia-style mobile navigation.
- Browser verification includes dashboard and Watch menu screenshots at a phone viewport such as 390x844 or 375x667.

### R9. Make card affordance match interactivity on dashboard metrics

Decision: Not approved for the next Design pass.

Rationale: The dashboard already provides primary navigation and command-panel links for deeper actions. Making quick-stat metrics clickable would duplicate existing navigation, while a standalone visual affordance pass is lower value than the trust and degraded-state work. Quick stats can remain status-only as long as they do not gain pointer, hover, or focus behavior that implies clickability.

No acceptance criteria because no work is approved from this recommendation.

### R10. Make the theme toggle visually self-explanatory

Decision: Not approved for the next Design pass.

Rationale: The design docs explicitly call for a compact light/dark icon toggle preserved as a utility control. The existing control has an accessible label and title. Adding visible explanatory text would consume scarce header space, especially on mobile, without improving Apollo's primary space-data mission.

No acceptance criteria because no work is approved from this recommendation.

## Design Automation Instructions

The next Design automation should produce a focused UX/design plan for the approved recommendations only. It should treat trust under partial data as the main design problem.

Design should not:

- Add new pages, source integrations, charts, filters, saved settings, report submission, notifications, accounts, or geocoding.
- Turn Sky Anomalies into an identity or reporting workflow.
- Add educational panels that compete with source status and current activity.
- Spend time on R9 or R10 unless those areas are already being touched by an approved header or dashboard-state change.

Design should focus on:

- A global source-state language model that handles live, partial, degraded, and unavailable states.
- A compact source-status card or page-state pattern that works on dashboard and failed detail pages.
- Sky Anomalies result language that separates connected evidence from planned source gaps.
- Mobile spacing rules that keep fixed navigation clear of content.
