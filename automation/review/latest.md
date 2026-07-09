# Review Report: Apollo UX Recommendations

Date: 2026-07-07
Automation ID: 02-review
Input: `automation/research/latest.md`
Research date: 2026-07-07
Product: Apollo

## Review Position

Apollo's mission is to help people understand what is happening in space right now through a focused, source-backed, easy-to-demo public dashboard. The July 7 research recommendations are strongest where they protect user trust in time-sensitive source data and keep mobile reading paths clear. Those areas directly support the product mission, current scope, and roadmap.

This review approves work that improves source honesty, launch-currentness framing, Sky Anomalies interpretation, mobile readability, and small trust-sensitive copy. It rejects broad launch-list feature expansion as standalone work, while allowing a narrow hierarchy adjustment only where it supports the approved launch-currentness fix.

Current implementation context:

- `api/launches.js`, `app.js`, and `launches.js` normalize and render launches from the existing The Space Devs upcoming launch endpoint, then present the first row as `Next launch` or `Next SpaceX launch`.
- `app.js` currently treats any past launch within six hours of a Sky Anomalies sighting as a `strong` timing match, even without location-aware overhead matching.
- Existing mobile dock CSS already reserves bottom padding and focus scroll margin, but the current research screenshots show real phone flows still losing readable content behind the fixed dock.
- `unavailableStateMarkup` and `renderLaunchesUnavailable` still include generic Dashboard and ISS recovery links across unavailable states.
- Sky Anomalies source-count copy correctly switches `is` and `are`, but still uses singular `source` for plural counts.

Evidence limits from research still apply: local NASA APOD and NeoWs unavailability was caused by the local `NASA_API_KEY` state and should not be treated as a production outage. The Space Devs and NOAA flows did load through local handlers. Browser-level keyboard and assistive-technology verification remains incomplete because the automation environment could not move focus beyond the body.

## Decision Summary

Approved for the next Design pass:

- R1. Stop presenting completed launches as upcoming or next.
- R2. Recalibrate Sky Anomalies evidence strength.
- R3. Make source state consistent across repeated checks and surfaces.
- R4. Improve mobile clearance around the bottom dock.
- R5. Make submitted Anomalies results easier to reach on mobile.
- R7. Make unavailable-page recovery actions match the page intent.
- R8. Fix Anomalies source-count grammar.

Approved only as a validation gate:

- R9. Complete browser-level accessibility verification.

Not approved as standalone work:

- R6. Reduce Launches long-tail schedule overload.

Allowed R6 overlap: when implementing R1, Design may make low-certainty long-tail launch rows visually secondary if that is the simplest way to keep completed, active-window, and future launches distinct. Do not add filters, saved views, new launch APIs, custom sorting controls, or another launch workflow for R6.

## Product Constraints For Follow-Up

- Keep Apollo static, vanilla, Bootstrap/Acadia-aligned, and framework-free.
- Use the existing launch source fields first: `dateUtc`, `status`, `windowStart`, `windowEnd`, provider, mission, source URL, and source freshness.
- Do not add a historical launches API, geocoding, location-aware launch matching, satellite matching, aircraft matching, planet matching, fireball imports, UAP imports, accounts, saved reports, filters, charts, notifications, or persistence for this pass.
- Do not show sample, fallback, stale, inferred, planned-source, or completed data as live upcoming activity.
- Preserve the five mobile destinations: Dashboard, ISS, Launches, Watch, and Gallery.
- Preserve the compact mobile dock and Watch menu model; do not use bottom-clearance work to redesign navigation.
- Treat localhost degraded-source evidence as UX evidence only, not as production reliability proof.

## Decisions

### R1. Stop presenting completed launches as upcoming or next

Decision: Approved.

Rationale: This is the highest-value recommendation in the research file. Apollo is a live and near-live dashboard, so calling a completed same-day launch the `Next SpaceX launch` directly harms trust in the product's core job. The fix is mission-aligned and maintainable if it classifies launch rows from the existing source fields rather than adding a new provider or workflow.

Acceptance criteria:

- Dashboard launch card, Launches spotlight, Launches timeline, Space Brief, Recent Activity, Watch Items, source-status copy, and quick stat do not call a completed launch `next`, `upcoming`, or `T-` unless the launch is actually in the future.
- A launch with a past `dateUtc` and a completed/success/failure status is labeled as a recent or completed launch state, not as the next launch.
- If the provider returns a completed row ahead of future rows, Apollo chooses the next future row for `Next SpaceX launch` and places the completed row in a secondary recent/completed position if it remains useful.
- If no future launch is available but a recent completed row is returned, Apollo presents that as recent launch context and says no upcoming launch is currently available from the source.
- Active or in-window launches have their own state, such as launch window open or in progress, and are not reduced to either completed or future.
- Counts distinguish future/upcoming launches from completed or recent rows. Copy such as `20 upcoming SpaceX launches` is not shown when the count includes completed launches.
- The fix uses existing normalized launch fields and source URLs. It does not add a new launch source, filters, saved views, user settings, or a historical launch archive.
- Regression coverage includes a same-day `Launch Successful` row with a past timestamp followed by a future launch.

### R2. Recalibrate Sky Anomalies evidence strength

Decision: Approved.

Rationale: Sky Anomalies is Apollo's most interpretive workflow, so overstating evidence strength is a product-trust issue. A launch about six hours before a Brooklyn sighting can be useful source context, but Apollo does not yet perform location-aware overhead, aircraft, planet, fireball, satellite, or UAP matching. Strong match language should be reserved for evidence that can plausibly explain the entered time and location, not broad timing proximity alone.

Acceptance criteria:

- A past launch timing match by itself does not produce `Strong known-context match` unless Apollo has source-backed evidence that can plausibly explain the entered time and location.
- While Apollo lacks location-aware matching, broad launch timing proximity is labeled as context or possible context, not as an identification or strong explanation.
- `getLaunchMatchLevel` and result-summary logic cannot upgrade the overall Sky Anomalies result to strong solely because one connected launch occurred within a broad time window.
- The result keeps source context useful by explaining the launch timing and the location-aware matching limitation together.
- Future launches remain upcoming context only and are never explanatory matches for earlier sightings.
- The UI avoids identity, verification, probability, confidence, extraterrestrial-origin, exact overhead, satellite, aircraft, planet, fireball, or UAP matching claims.
- Regression coverage includes a past launch roughly six hours before a sighting and verifies that the result does not use strongest-match language without stronger evidence.

### R3. Make source state consistent across repeated checks and surfaces

Decision: Approved.

Rationale: Source volatility is normal for public APIs, but Apollo needs to explain it consistently so users do not interpret per-check differences as contradictory truths. This supports the existing roadmap item to expand browser interaction coverage and uses the current source-state model rather than adding polling, history, or diagnostics.

Acceptance criteria:

- Dashboard cards, detail pages, source-status rows, Watch Items, and Sky Anomalies result cards use the same source vocabulary for the same state: `Loaded`, `Needs attention`, `Partial data`, `Source unavailable`, `Data unavailable`, and `Checking`.
- Source-dependent detail copy says `for this check` or otherwise makes per-check state clear where a source can recover or fail between attempts.
- Freshness labels continue to use `Last updated` only for successful loaded data and `Last checked` for partial, degraded, checking, or unavailable states.
- ISS, launch, asteroid, APOD, crew, and space-weather source rows do not present conflicting loaded/unavailable messages for the same check.
- A recovered source can be shown as loaded on a later check without implying earlier unavailable states were wrong.
- The work does not add retry histories, toasts, countdowns, monitoring dashboards, persistent cache state, or new source categories.
- Browser or fixture verification covers at least one volatile-source sequence where a source is unavailable in one check and loaded in a later check.

### R4. Improve mobile clearance around the bottom dock

Decision: Approved.

Rationale: The fixed mobile dock is an approved navigation model, but it must not obscure active cards, launch rows, or Sky Anomalies results. This is a readability and usability fix, not a navigation redesign. It supports Apollo's mobile standard that phone screens should answer one space-data question without hidden content.

Acceptance criteria:

- At 375x667 and 390x844 viewports, dashboard cards, Launches rows/details, Anomalies form fields, submitted result cards, and source rows remain readable above the dock at normal scroll positions and at the bottom of the page.
- Bottom padding, scroll padding, and focus scroll margins account for dock height, dock gap, and safe-area inset.
- Focused links, buttons, inputs, summaries, and result sections do not land behind the fixed dock.
- The Watch menu still opens above the dock and dismisses on destination selection, outside tap, Escape, and underlying page scroll.
- The fix does not increase dock height, add persistent visible dock labels, add destinations, introduce a drawer/modal nav, or hide core content to make space.
- Browser verification captures the affected phone viewports after the change.

### R5. Make submitted Anomalies results easier to reach on mobile

Decision: Approved.

Rationale: After submit, the user's primary task changes from entering a sighting to reading Apollo's answer and limitations. The current mobile screenshots show the form still dominating the path to the result. This is a focused interaction-ordering issue in a core workflow and can be solved without adding a route, modal, wizard, saved report, or account flow.

Acceptance criteria:

- After submitting a Sky Anomalies check on phone widths, the submitted result becomes the active object through scroll position, focus movement, layout order, or another simple existing-page treatment.
- The first post-submit mobile viewport exposes the result heading, overall result label, and source-limit summary or source-checked state.
- The original form remains available for editing and resubmission without forcing the user through every field before seeing the result.
- Observation recap, time/location assumptions, source context, and planned gaps remain available and clearly ordered after the main answer.
- Planned source gaps remain labeled as not checked evidence.
- The implementation does not add a modal, wizard, route change, saved report, account flow, or new source integration.
- Browser verification covers submitted results at 375x667 and 390x844 with the dock visible.

### R6. Reduce Launches long-tail schedule overload

Decision: Not approved as standalone work.

Rationale: The concern is valid but lower priority than launch-currentness, and the dedicated Launches page exists to show a fuller schedule. Adding filters, new grouping controls, or a richer schedule-management experience would expand the MVP without enough primary-purpose value. The useful part can be handled narrowly while implementing R1: make future, active-window, completed, and low-certainty rows visually clear so users do not treat every returned provider row as equally actionable.

Preservation criteria:

- Keep the Launches page as one focused source-backed detail page, not a schedule-management tool.
- Do not add filters, search, saved views, custom sorting controls, user preferences, new launch providers, or a historical launch archive.
- Do not hide source-backed launch rows solely because they are low certainty; instead make certainty and currentness clear when rows are shown.
- If R1 touches launch hierarchy, Design may demote low-certainty long-tail rows with simple labels or grouping, but only as a clarity support for the approved currentness fix.

### R7. Make unavailable-page recovery actions match the page intent

Decision: Approved.

Rationale: The unavailable states are already appropriately concise and source-honest, but generic fallback links such as Dashboard and ISS can feel unrelated on Asteroids or Gallery. A small recovery-action cleanup improves clarity without adding content, APIs, or workflows.

Acceptance criteria:

- Asteroids, Gallery, Launches, and Weather unavailable states keep one primary status, one explanation, one checked-source line, and concise recovery actions.
- Recovery actions prioritize the relevant upstream source and a page-appropriate Apollo destination. Generic ISS links are not shown on unrelated unavailable pages unless ISS is actually relevant to the page's task.
- Source action labels are specific enough to be meaningful, such as `Open NASA APOD source`, `Open NASA NeoWs source`, `Open NOAA source`, or `Open launch source`.
- The Dashboard link can remain as a general fallback, but it should not crowd out the page-specific recovery action.
- The change reuses `unavailableStateMarkup` or a similarly small existing helper and does not create a new recovery workflow.
- Static tests cover the absence of unrelated generic recovery links in APOD and NeoWs unavailable states.

### R8. Fix Anomalies source-count grammar

Decision: Approved.

Rationale: This is small but worthwhile because Sky Anomalies is a trust-sensitive interpretation surface. A grammar error in source-limit copy makes the product feel less careful exactly where carefulness matters.

Acceptance criteria:

- Source-limit copy reads `1 source is unavailable` for singular counts.
- Source-limit copy reads `2 sources are unavailable` and equivalent plural phrasing for plural counts.
- The fix applies anywhere the same source-count sentence is reused.
- A focused test or static assertion covers singular and plural source-count copy.

### R9. Complete browser-level accessibility verification

Decision: Approved as a validation gate only.

Rationale: Apollo relies on dynamic refresh, live regions, menus, fixed mobile navigation, maps, and post-submit result discovery. Static tests are useful but cannot fully prove keyboard order, visible focus, announcements, or mobile dock behavior. This aligns with the roadmap, but it should create implementation work only when verification finds concrete defects.

Acceptance criteria:

- Browser accessibility verification covers dashboard refresh, slow/degraded source completion, Launches currentness states, mobile Watch menu open/dismissal, ISS map reachability, and Sky Anomalies submission.
- Verify keyboard order, visible focus, `aria-busy` transitions, live-region announcements where practical, post-submit result discovery, mobile dock accessible names, and hidden desktop navigation at phone width.
- Verify focused elements and submitted result sections are not obscured by the mobile dock.
- Verify reduced-motion behavior for nonessential loading, hover, focus, and disclosure motion where practical.
- Document browser, viewport sizes, data/source states, limitations, and findings in the Design or Implementation report.
- Create implementation work only for observed accessibility defects. Do not use this validation gate to justify new workflows or navigation redesign.

## Design Automation Instructions

The next Design automation should treat this as a focused trust and mobile-readability handoff. Start with R1 and R2 because they directly affect whether Apollo's live source interpretation is believable. Then address R4 and R5 because the phone experience is currently hiding active work behind navigation and form dominance. R3, R7, and R8 are small consistency and polish work that should be handled through existing source-state and unavailable-state helpers.

Do not broaden the pass into new data products, matching systems, navigation models, launch filters, educational panels, reports, or account-backed features. If a recommendation requires adding one of those, stop and reduce the treatment to source-honest copy, existing fields, existing pages, and browser verification.

## Open Work

Approved implementation/design work exists for R1, R2, R3, R4, R5, R7, and R8. R9 is a validation gate. R6 is rejected as standalone scope, with only the limited R1 overlap allowed.
