# Research Report: Apollo Product UX Review

Date: 2026-07-07
Automation ID: research
Product: Apollo

## Summary

Apollo continues to feel focused and source-honest overall. The dashboard now reaches a useful partially live state, the Weather page is clearer about current quiet conditions, unavailable NASA-backed pages avoid guessed content, dark mode is readable, and the mobile Watch menu opens above the dock with labeled destinations.

The main remaining user risks are trust calibration and mobile readability. Launches currently frames a launch that already succeeded at 3:12 AM EDT on July 7, 2026 as the "Next SpaceX launch" and includes it under "20 upcoming SpaceX launches." Sky Anomalies can still label a same-day launch about six hours before a Brooklyn sighting as a "Strong known-context match" even while Apollo says it is not doing location-aware overhead matching. On phones, the bottom dock overlaps active cards and result content during scroll-heavy flows.

## Audit Scope

Primary flows reviewed:

1. Dashboard first load, settled state, Space Brief, Recent Activity, Watch Items, source-status card, refresh state, and dark mode.
2. Desktop navigation, desktop Watch menu, mobile bottom dock, and mobile Watch menu.
3. Launches detail page, next-launch spotlight, upcoming-launch list, and mobile launch layout.
4. Weather detail page with current K-index, 72-hour trend, NOAA notices, and source link.
5. ISS detail page with unavailable map state and live crew roster.
6. Asteroids and Gallery unavailable states.
7. Sky Anomalies pre-submit form, submitted desktop result, submitted mobile result, and source-context hierarchy.
8. Desktop keyboard focus attempts and Watch menu close behavior.

Accepted current-run evidence is saved in `automation/research/screenshots/2026-07-07/`:

- `01-dashboard-initial-viewport.png`
- `02-dashboard-settled-full.png`
- `03-watch-menu-desktop.png`
- `04-launches-top-viewport.png`
- `04b-launches-list-viewport.png`
- `05-weather-detail-full.png`
- `06-iss-detail-full.png`
- `07-asteroids-unavailable-viewport.png`
- `08-gallery-unavailable-viewport.png`
- `09-anomalies-initial-full.png`
- `10-anomalies-submitted-top-viewport.png`
- `10b-anomalies-submitted-result-viewport.png`
- `10c-anomalies-submitted-result-header.png`
- `11-dashboard-mobile-top.png`
- `12-dashboard-mobile-bottom.png`
- `13-watch-menu-mobile-open.png`
- `14-launches-mobile-top.png`
- `15-launches-mobile-list.png`
- `16-anomalies-mobile-initial.png`
- `17-anomalies-mobile-after-submit.png`
- `18-anomalies-mobile-result-top.png`
- `19-anomalies-mobile-result-mid.png`
- `20-keyboard-focus-dashboard.png`
- `21-dashboard-dark-mode.png`

## Evidence Limits

- I used a temporary local review server at `http://127.0.0.1:8797/` that served Apollo's current static files and delegated `/api/*` to the existing local handlers. No production code was changed.
- The local health endpoint reported `NASA_API_KEY` missing, so NASA APOD and NASA NeoWs appeared unavailable by local environment configuration. Recommendations do not claim a production NASA outage.
- The Space Devs launch data and NOAA SWPC space-weather data loaded through the local handlers. People in Space loaded. Where the ISS At was intermittent during the browser run, which is reflected as a source-consistency risk rather than a confirmed upstream outage.
- The in-app browser DOM snapshot API failed with `incrementalAriaSnapshot is not a function`; I used targeted read-only page evaluation and screenshots instead.
- Some full-page screenshots had browser stitching artifacts. They were replaced with viewport captures and are not used as primary evidence.
- Keyboard Tab attempts did not move focus beyond the body in this automation environment. Static accessibility tests passed, but real browser focus order and screen-reader announcements remain unverified.
- `npm test` passed 97 tests.

## Flow Notes

1. Dashboard desktop: The first settled desktop state showed 3 of 6 sources loaded, with APOD, NeoWs, and ISS unavailable. Later mobile dashboard passes reached 4 of 6 loaded when ISS resolved, showing that source state can change across attempts.
2. Watch navigation: Desktop and mobile Watch menus are understandable. The grouped Watch destination remains active on Anomalies, and Escape closed the desktop menu in the check.
3. Launches: The page has strong source-backed content and useful launch details, but the primary "Next SpaceX launch" object was already marked `Launch Successful` and still appeared under upcoming-launch framing.
4. Weather: The Weather page is one of the clearest current flows. It separates current quiet K-index, the 72-hour trend, recent notices, and source attribution.
5. ISS: The crew roster is useful and scannable. When position fails, the map state is concise, but users can later see ISS loaded elsewhere, which makes source state feel inconsistent.
6. Unavailable NASA pages: Asteroids and Gallery explain why Apollo is not showing guessed data. Their fallback actions are still generic.
7. Sky Anomalies desktop: The submitted result now puts checked sources before planned gaps, but the evidence strength still overstates a launch-time relationship for a location-unaware sighting check.
8. Sky Anomalies mobile: After submit, the user still remains near the form and must scroll through a long source/result stack while the bottom dock covers lower cards.
9. Mobile navigation: The dock is compact and stable, but it overlaps active content in the dashboard, Launches, and Anomalies flows.
10. Accessibility: Static landmark, skip-link, reduced-motion, nav, and theme tests pass. Browser-level focus movement and live-region announcements were not verifiable in this run.

## Recommendations

### R1. Stop presenting completed launches as upcoming or next

Priority: P1
Estimated implementation complexity: Medium

User problem: On July 7 at about 9:07 AM EDT, the Launches page framed Transporter 17 as the "Next SpaceX launch" and counted it under "20 upcoming SpaceX launches," even though the same page labeled it `Launch Successful` with a 3:12 AM EDT liftoff.

Expected user benefit: Users can trust Apollo's time-sensitive launch status and quickly distinguish completed events from future missions.

Recommendation: Make completed, in-window, and future launch states read as distinct user-facing states across the dashboard, Launches spotlight, and launch list.

Evidence: `04-launches-top-viewport.png`, `04b-launches-list-viewport.png`, `14-launches-mobile-top.png`, `15-launches-mobile-list.png`.

### R2. Recalibrate Sky Anomalies evidence strength

Priority: P1
Estimated implementation complexity: Medium

User problem: Sky Anomalies labeled a Brooklyn sighting at 9:07-9:10 AM EDT as a "Strong known-context match" because a Falcon 9 launch occurred about six hours earlier, while the page also says Apollo is not doing location-aware overhead, aircraft, planet, fireball, satellite, or UAP matching.

Expected user benefit: Users get a more trustworthy sighting explanation and are less likely to interpret nearby source context as an identification.

Recommendation: Reserve strongest result language for evidence that can plausibly explain the entered time and location. Treat broad timing proximity as contextual, not as a strong match by itself.

Evidence: `10c-anomalies-submitted-result-header.png`, `17-anomalies-mobile-after-submit.png`, `18-anomalies-mobile-result-top.png`, `19-anomalies-mobile-result-mid.png`.

### R3. Make source state consistent across repeated checks and surfaces

Priority: P2
Estimated implementation complexity: Medium

User problem: During the same walkthrough, ISS appeared unavailable on desktop dashboard and ISS detail, loaded in later dashboard and Anomalies checks, and unavailable again in the mobile Anomalies result. Users can reasonably read those as conflicting truths rather than per-check volatility.

Expected user benefit: Users understand whether a source is loaded, unavailable, recently recovered, or simply different because a new check ran.

Recommendation: Keep source-health language and freshness cues consistent across dashboard cards, detail pages, source-status rows, and Sky Anomalies result cards.

Evidence: `02-dashboard-settled-full.png`, `06-iss-detail-full.png`, `10c-anomalies-submitted-result-header.png`, `11-dashboard-mobile-top.png`, `17-anomalies-mobile-after-submit.png`.

### R4. Improve mobile clearance around the bottom dock

Priority: P2
Estimated implementation complexity: Low

User problem: On mobile, the bottom dock covers active dashboard cards, Launches details, and Anomalies result content while the user scrolls. The user can read around it, but the product feels cramped and important content is partially hidden.

Expected user benefit: Mobile users can read and act without content disappearing behind navigation.

Recommendation: Increase mobile reading clearance for scroll-heavy surfaces so cards, controls, and result sections remain fully visible above the dock.

Evidence: `11-dashboard-mobile-top.png`, `12-dashboard-mobile-bottom.png`, `15-launches-mobile-list.png`, `16-anomalies-mobile-initial.png`, `18-anomalies-mobile-result-top.png`, `19-anomalies-mobile-result-mid.png`.

### R5. Make submitted Anomalies results easier to reach on mobile

Priority: P2
Estimated implementation complexity: Medium

User problem: After submitting a mobile Anomalies check, the form and submit button remain visually dominant above the result. The user must keep scrolling to read the explanation, source checks, limitations, recap, and planned gaps.

Expected user benefit: Mobile users get to the answer and its limits faster after taking the main action.

Recommendation: Treat the submitted result as the active mobile object after submit while keeping the original form context available.

Evidence: `16-anomalies-mobile-initial.png`, `17-anomalies-mobile-after-submit.png`, `18-anomalies-mobile-result-top.png`, `19-anomalies-mobile-result-mid.png`.

### R6. Reduce Launches long-tail schedule overload

Priority: P3
Estimated implementation complexity: Medium

User problem: The Launches list quickly becomes a long schedule with many rows, including lower-certainty `To Be Determined` items and repeated placeholder-like dates. High-confidence near-term missions compete with distant speculative entries.

Expected user benefit: Users can scan the next meaningful launches faster and avoid treating low-certainty schedule items as equally actionable.

Recommendation: Make near-term, higher-confidence launch rows the primary reading path and make lower-certainty long-tail rows feel secondary.

Evidence: `04b-launches-list-viewport.png`, `15-launches-mobile-list.png`.

### R7. Make unavailable-page recovery actions match the page intent

Priority: P3
Estimated implementation complexity: Low

User problem: Asteroids and Gallery unavailable states clearly explain missing NASA data, but their fallback links point to generic destinations like Dashboard and ISS. Those actions do not always match the user's intent to recover asteroid or image context.

Expected user benefit: Users have a clearer next step when a source is unavailable and are less likely to bounce to an unrelated page.

Recommendation: Keep unavailable states concise, but make fallback actions feel tied to the current page and the closest still-useful source-backed Apollo surface.

Evidence: `07-asteroids-unavailable-viewport.png`, `08-gallery-unavailable-viewport.png`.

### R8. Fix Anomalies source-count grammar

Priority: P3
Estimated implementation complexity: Low

User problem: The mobile submitted Anomalies result said "2 source are unavailable." The message is understandable, but the grammar error weakens polish in a trust-sensitive result.

Expected user benefit: Users see a more credible, careful explanation in the product's most interpretive workflow.

Recommendation: Make source-count copy read naturally for singular and plural states.

Evidence: `17-anomalies-mobile-after-submit.png`, `18-anomalies-mobile-result-top.png`.

### R9. Complete browser-level accessibility verification

Priority: P2
Estimated implementation complexity: Medium

User problem: Apollo relies on dynamic refreshes, live source-status regions, menus, fixed mobile navigation, maps, and post-submit results. Static tests passed, but this run could not verify actual Tab movement or screen-reader announcements in the browser.

Expected user benefit: Keyboard and assistive-technology users get the same source-state, navigation, and result-discovery clarity as pointer users.

Recommendation: Verify focus order, visible focus, menu open/close behavior, live-region announcements, mobile dock traversal, and post-submit result discovery in a browser environment that can exercise real keyboard and assistive-technology behavior.

Evidence: `20-keyboard-focus-dashboard.png`; `npm test` passed 97 static and helper tests.

## Suggested Review Focus

The Review automation should focus first on launch-currentness framing and Sky Anomalies evidence strength because both directly affect trust. Next, review mobile dock clearance, mobile Anomalies result discovery, and source-state consistency. After those, consider the smaller polish and hierarchy items: launch schedule overload, unavailable-page recovery actions, Anomalies source-count grammar, and browser-level accessibility verification.
