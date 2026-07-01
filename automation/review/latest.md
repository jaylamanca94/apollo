# Review Report: Apollo UX Recommendations

Date: 2026-07-01
Automation ID: 02-review
Input: `automation/research/latest.md`
Product: Apollo

## Review Position

Apollo's mission is to help people understand what is happening in space right now through a focused, source-backed, easy-to-demo public dashboard. The current product docs prioritize trust, demo clarity, source quality, maintainability, and tight MVP scope over feature volume.

The July 1 research recommendations are mostly aligned with that mission. They do not ask for new data sources, accounts, persistence, charts, filters, geocoding, reporting, or broader science content. The strongest work closes state-coherence gaps that make Apollo look unfinished when upstream sources fail. The Design automation should keep the detail-page degraded states and the ISS detail flow largely intact, and should focus on finishing partial states consistently across dashboard, mobile navigation, and Sky Anomalies.

## Decision Summary

Approved for Design input:

- R1. Make dashboard partial states finish consistently.
- R2. Give Recent Activity and Watch Items partial-state content.
- R3. Keep the mobile dock clear of content and form controls.
- R4. Make the mobile Watch menu feel like navigation, not an overlay collision.
- R5. Reframe Sky Anomalies source readiness when sources are degraded.
- R6. Rank checked evidence above planned source gaps in Anomalies results.
- R7. Clarify Anomalies assumptions before submission.
- R8. Improve mobile navigation recognizability and assistive-technology confidence, with scope limits.

No recommendation is rejected outright. R4 and R8 are approved only as focused navigation clarity and accessibility work; they should not become a larger mobile-navigation redesign.

Recommended sequencing:

1. Dashboard completion under degraded data: R1, R2.
2. Mobile usability and menu separation: R3, R4.
3. Sky Anomalies source truthfulness: R5, R6, R7.
4. Mobile navigation accessibility verification: R8.

## Product Constraints For Approved Work

- Keep Apollo static, vanilla, Bootstrap/Acadia-aligned, and framework-free.
- Do not add new upstream APIs, geocoding, user accounts, saved locations, persistence, search, notifications, charts, or reporting workflows.
- Do not show sample, fallback, stale, inferred, or planned-source data as live source-backed activity.
- Use existing source families, existing loader results, `latestSourceStatuses`, and current source-state copy wherever practical.
- Prefer concise state, source, and recovery language over diagnostic detail.
- Preserve the dashboard as a compact state-at-a-glance surface; do not move detail-page density back onto the homepage.
- Preserve the current successful detail-page unavailable states and ISS detail flow unless a small consistency adjustment is needed.
- Static tests are not enough for this pass. Approved work should include browser verification in a degraded run because the current failure is a runtime state-coherence gap.

## Decisions

### R1. Make dashboard partial states finish consistently

Decision: Approved.

Rationale: This is the highest-value recommendation because it directly protects Apollo's trust promise. The July 1 screenshot shows a completed source-status summary and "Space Activity: Partial" while the global chip still says "Checking data", the freshness label still says "Last updated: Standing by", and the refresh button remains disabled as "Refreshing data". That contradiction makes a source outage look like a broken app. Fixing it uses state Apollo already computes and does not expand scope.

Acceptance criteria:

- When dashboard source checks finish with at least one loaded source and at least one unavailable source, the header chip, page subtitle, freshness label, refresh button, live region, quick stats, Space Brief, Recent Activity, Watch Items, and Source availability card all show a final partial state.
- After source checks finish, no visible dashboard control remains stuck on "Checking data", "Standing by", "Refreshing data", "Checking recent activity", or "Checking watch items".
- The refresh button is re-enabled and restored to "Refresh data" after partial or unavailable checks, not only after all-loaded checks.
- `aria-busy` is set to `false` for every dynamic dashboard region included in `aria-controls` after the check finishes.
- "Last updated" is used only for all-loaded successful states; partial and unavailable states use "Last checked".
- Browser verification covers a degraded dashboard run where the Source availability card has completed while most sources are unavailable.

### R2. Give Recent Activity and Watch Items partial-state content

Decision: Approved.

Rationale: Recent Activity and Watch Items are primary decision panels. Leaving them in loading states after Apollo already knows the final source status weakens the dashboard's core job: quickly answering what is happening and what deserves attention. The work should reuse loaded source results and source limitation rows rather than inventing content.

Acceptance criteria:

- Recent Activity renders final content in partial states using only loaded sources; examples may include crew roster, ISS position, APOD, launch, asteroid, or space-weather events when those sources actually loaded.
- If no recent-activity event can be built from loaded data, the panel shows a completed empty or limitation state rather than "Checking recent activity...".
- Watch Items show available live signals first and source limitations second.
- Source limitations are clearly labeled as unavailable source context, not as live activity.
- Both panels set `aria-busy="false"` when the dashboard source check finishes.
- Tests or browser checks cover a partial state where one source loads and the remaining primary dashboard sources fail.

### R3. Keep the mobile dock clear of content and form controls

Decision: Approved.

Rationale: The fixed mobile dock is an accepted Acadia-style navigation pattern, but the screenshots show it covering dashboard cards and Sky Anomalies radio controls. That is a direct usability and accessibility problem on a core responsive surface. This is a layout correction, not a feature expansion.

Acceptance criteria:

- Phone-width pages reserve bottom clearance for the fixed dock height, the dock gap, and `env(safe-area-inset-bottom)`.
- The last dashboard card, Source availability rows, Watch-menu content, Sky Anomalies radio groups, and form submit controls can scroll fully above the dock.
- Focused form controls and keyboard focus targets are not hidden behind the dock when scrolled into view.
- The mobile dock remains fixed, visually consistent, and limited to the documented five primary destinations.
- Browser verification includes dashboard, Watch menu, and Sky Anomalies form screenshots at 390x844 and at one shorter phone viewport such as 375x667.

### R4. Make the mobile Watch menu feel like navigation, not an overlay collision

Decision: Approved with scope limits.

Rationale: Weather, Asteroids, and Anomalies are in-scope Watch destinations. On mobile, the menu currently opens over quick-stat cards while the dock remains in the same visual layer, which makes the menu feel cramped and temporary. Improving separation helps navigation confidence without adding destinations or changing the information architecture.

Acceptance criteria:

- On phone-width viewports, opening Watch presents Weather, Asteroids, and Anomalies as a clear navigation surface above or apart from underlying page cards.
- The open menu does not visually merge with, obscure, or look like part of the card beneath it.
- The menu clears the fixed dock and safe-area inset.
- The active Watch destination remains marked with `aria-current="page"` on the Watch trigger and the matching menu item.
- The solution uses the existing Bootstrap/Acadia dropdown pattern or a small local adaptation; it must not introduce a new drawer/modal framework.
- No additional destinations, report actions, settings, filters, or saved-location controls are added.

### R5. Reframe Sky Anomalies source readiness when sources are degraded

Decision: Approved.

Rationale: Sky Anomalies is explicitly trust-first. The pre-submit overview saying "Sources ready" while ISS, Launches, Space Weather, and Asteroids are unavailable overstates what Apollo can check. Correcting this copy improves source quality and user trust without adding any source or matching capability.

Acceptance criteria:

- The pre-submit Sky Anomalies overview uses source-state-aware language: "Sources ready" only when the connected context sources loaded, "Partial source context" when some loaded, and "Sources unavailable" or equivalent when none loaded.
- Each context cell keeps its current source-specific state visible, but the headline no longer contradicts the cells.
- The overview explains that unavailable connected sources and planned source gaps limit the check before submission.
- The page uses "Last checked" when the connected context is partial or unavailable.
- Tests cover all-loaded, partial, and all-unavailable overview states.

### R6. Rank checked evidence above planned source gaps in Anomalies results

Decision: Approved.

Rationale: The submitted result already uses cautious qualitative labels, which should be preserved. The remaining issue is hierarchy: planned gaps such as satellite visibility, fireball reports, and planet positions can appear above connected-but-unavailable source context. That makes unchecked possibilities feel more persuasive than Apollo's actual evidence. Reordering and grouping the result strengthens the trust-first posture without expanding scope.

Acceptance criteria:

- Submitted Anomalies results show connected checked evidence and connected source status before planned source gaps.
- Strong or possible matches from connected Apollo sources may rank first when they are actually checked.
- When connected sources are unavailable, the result should say so before listing trait-only possibilities or planned imports.
- Planned gaps remain visible but are grouped or ordered after checked context and unavailable connected-source status.
- Result language does not imply identity, verification, probability, extraterrestrial origin, exact overhead matching, aircraft matching, planet matching, fireball matching, or UAP matching.
- Numeric fit-score copy remains absent.
- Tests cover a degraded result where connected sources are unavailable and planned gaps do not occupy the top evidence ranks.

### R7. Clarify Anomalies assumptions before submission

Decision: Approved with scope limits.

Rationale: The form asks for location, date, and time before the user sees the strongest limitations. Because Apollo does not yet perform geocoding, location-aware ISS pass matching, satellite visibility, aircraft matching, planet-position checks, fireball imports, or UAP report matching, the key assumptions should be visible before the user submits. This aligns with the roadmap boundary and prevents overclaiming.

Acceptance criteria:

- Before the user taps "Check sighting", the Anomalies page concisely states that time is interpreted in browser-local terms unless otherwise specified.
- Before submission, the page states that the typed location is descriptive context until location-aware matching is added.
- Pre-submit copy names the main unavailable matching categories carefully and briefly, without turning the form into a long explainer.
- The same assumptions remain present in the submitted result recap.
- The copy avoids implying exact overhead, aircraft, planet, fireball, satellite, or UAP matching from the free-form location field.
- The pre-submit assumption text remains readable on mobile and is not covered by the dock.

### R8. Improve mobile navigation recognizability and assistive-technology confidence

Decision: Approved with scope limits.

Rationale: This is lower priority than R1 through R7, but it is still aligned with Apollo's responsive demo quality. The mobile dock visually hides labels, and duplicated desktop/mobile navigation structures can create assistive-technology risk if hidden controls are exposed incorrectly. The useful work is verification and minimal state/name clarity, not a larger redesign.

Acceptance criteria:

- Every mobile dock destination has a clear accessible name: Dashboard, ISS, Launches, Watch, and Gallery.
- Icons in navigation remain `aria-hidden="true"` so assistive technology reads destination names rather than icon glyphs.
- At a phone viewport, the hidden desktop navigation is not exposed as an extra usable navigation set in browser accessibility inspection.
- The current top-level destination is visually clear and exposed with `aria-current="page"` where appropriate.
- For Watch pages, the Watch trigger and the active menu item both expose the current state.
- Any visible-label treatment must preserve the compact icon-first Acadia mobile pattern, keep five destinations, avoid increasing dock collision, and pass the R3 clearance criteria.
- Static accessibility checks are updated, and at least one mobile accessibility snapshot or manual browser accessibility inspection is documented.

## Design Automation Instructions

The next Design automation should produce a focused UX/design plan for the approved recommendations only. Treat "partial state must complete everywhere" as the main design problem.

Design should not:

- Add new pages, source integrations, charts, filters, saved settings, report submission, notifications, accounts, geocoding, or location-aware matching.
- Turn Sky Anomalies into an identity, certainty, probability, or reporting workflow.
- Add educational panels that compete with source status and current activity.
- Redesign the whole navigation system or add a new mobile drawer framework.
- Reopen the completed unavailable detail-page pattern unless a small consistency fix is necessary.

Design should focus on:

- A final dashboard state model for live, partial, and unavailable checks that drives header, freshness, buttons, command panels, source status, and ARIA state together.
- Partial-state content rules for Recent Activity and Watch Items.
- Mobile spacing rules that keep fixed navigation clear of content, forms, menus, and focus targets.
- A mobile Watch menu presentation that reads as navigation.
- Sky Anomalies source-readiness and result hierarchy that separates checked evidence, unavailable connected sources, trait-only possibilities, and planned source gaps.
- Minimal mobile navigation accessibility verification and current-state clarity.
