# Apollo Product Review — 2026-08-11

## Scope and verdict

This bounded review covers the core **Understand space activity now** flow when a source is unavailable. The Dashboard already made the partial state honest, but its cards offered only an upstream exit. This milestone adds an explicit local `Open details` route for every non-loaded source, so people can reach Apollo's existing source-specific retry without first having to infer the relevant page.

## Steps

| Step | Evidence | Health |
| --- | --- | --- |
| 18 | `18-dashboard-partial-keyboard-start.png` | Healthy baseline — Dashboard identifies partial data and distinguishes useful current signals from the missing asteroid source. |
| 20 | `20-dashboard-source-recovery-links.png` | Healthy after change — unavailable APOD and NeoWs cards present separate `Open details` and `Open source` actions, avoiding a false choice between leaving Apollo and doing nothing. |
| 21 | `21-asteroids-recovery-destination.png` | Healthy — NeoWs `Open details` reaches the precise Apollo recovery state, which names the source, explains that no asteroid activity is guessed, and provides retry, source, and Dashboard actions. |
| 22 | `22-asteroids-retry-complete.png` | Healthy — retry completed and retained the honest unavailable state with refreshed check time and an enabled retry. |
| 23 | `23-asteroids-keyboard-retry-start.png` | Healthy baseline — source-specific recovery remains visible, legible, and available before focus moves to the action. |
| 24 | `24-asteroids-retry-focus.png` | Healthy focus treatment — `Try NASA NeoWs again` has a clearly visible focus ring in the live unavailable state. |

## Mobile Dashboard and recovery follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. The page reported `innerWidth`, `clientWidth`, and `scrollWidth` of 390, so these captures are accepted as genuine narrow-viewport evidence rather than the earlier discarded viewport attempt.

| Step | Evidence | Health |
| --- | --- | --- |
| 25 | `25-dashboard-partial-mobile-390x844.png` | Healthy — the partial Dashboard hierarchy stacks without horizontal overflow; its fixed dock remains available. |
| 28 | `28-asteroids-recovery-mobile-390x844.png` | Context — the NeoWs `Open details` route resolves to Apollo’s source-specific mobile recovery state. |
| 29 | `29-asteroids-recovery-mobile-bottom.png` | Healthy — at the page’s actual maximum scroll position, retry, upstream-source, and Dashboard actions all sit above the fixed dock. |

## Mobile Sky Anomalies follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. The page reported `innerWidth`, `clientWidth`, and `scrollWidth` of 390. It covers the user goal **Check a sky sighting against available context**, from entering a description through an honest source-aware result.

| Step | Evidence | Health |
| --- | --- | --- |
| 30 | `30-anomalies-mobile-start-390x844.png` | Healthy — the mobile form opens in the partial-source state with clear location, date, time, and sighting-trait controls. |
| 31 | `31-anomalies-mobile-submitted-top-390x844.png` | Healthy — pointer submission preserves the supplied traits and leads with the result, its source count, and the checked-source list; the view has no horizontal overflow. |
| 33 | `33-anomalies-mobile-bottom-390x844.png` | Healthy — the planned source gaps remain explicitly unverified, and the lower Source context disclosure clears the fixed dock at maximum scroll. |

## Mobile ISS and crew follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. The ISS page reported `innerWidth`, `clientWidth`, and `scrollWidth` of 390. It covers the user goal **Follow the ISS and current crew** in its loaded state.

| Step | Evidence | Health |
| --- | --- | --- |
| 34 | `34-iss-mobile-loaded-390x844.png` | Healthy — live freshness, normal-operations context, orbital metrics, and the map stack cleanly without horizontal overflow. |
| 36 | `36-iss-mobile-crew-detail-390x844.png` | Healthy — the Crew Roster clearly groups 10 people across three spacecraft assignments. |
| 37 | `37-iss-mobile-crew-bottom-390x844.png` | Healthy — every listed crew member and the source-declared roster count remain readable above the fixed dock. |

## Mobile Watch destination follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. It covers the user goal **Navigate secondary monitoring pages on phone**, from the dock menu to each intended monitoring destination.

| Step | Evidence | Health |
| --- | --- | --- |
| 38 | `38-mobile-watch-menu-all-destinations-390x844.png` | Healthy — the dock's named Watch menu presents Weather, Asteroids, and Anomalies in one predictable overlay. |
| 39 | `39-mobile-watch-anomalies-destination-390x844.png` | Healthy — selecting Anomalies dismisses the menu and reaches the Sky Anomalies context form. |
| 40 | `40-mobile-watch-weather-destination-390x844.png` | Healthy — selection reaches live Weather data with the menu dismissed; the same current interaction also reached Asteroids, where the honest unavailable state remained intact because NASA's public key was rate-limited. |

## Mobile Gallery recovery follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels without a NASA key. It covers the unavailable branch of the user goal **Explore NASA's daily image**.

| Step | Evidence | Health |
| --- | --- | --- |
| 41 | `41-gallery-mobile-recovery-390x844.png` | Healthy — Gallery identifies the missing APOD source, explains the no-sample-media policy, and presents retry, source, and Dashboard actions above the dock. Pointer retry retained that honest unavailable state. |

## Mobile Launches follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. It covers the loaded branch of the user goal **Check an upcoming launch**, from the next-launch answer into a source-backed schedule detail.

| Step | Evidence | Health |
| --- | --- | --- |
| 45 | `45-launches-mobile-overview-improved-390x844.png` | Healthy after change — the 160px phone image keeps the next mission and full Liftoff fact clear of the fixed dock; there is no horizontal overflow. |
| 46 | `46-launches-mobile-mission-details-390x844.png` | Healthy — pointer opening the first disclosure shows the mission description plus window, pad, and location without losing the selected schedule context. |
| 47 | `47-launches-mobile-mission-source-390x844.png` | Healthy — the lower disclosure retains vehicle, provider, and a visible upstream source action above the dock. |

## Mobile Weather follow-up

This controlled review used the linked Vercel preview at 390 × 844 CSS pixels. It covers the loaded branch of the user goal **Monitor space weather**, from current conditions through the NOAA source context.

| Step | Evidence | Health |
| --- | --- | --- |
| 48 | `48-weather-mobile-overview-390x844.png` | Healthy — Current K-index, the plain-English Space Weather Brief, and the next-72-hours Kp threshold are readable without horizontal overflow. |
| 49 | `49-weather-mobile-source-390x844.png` | Healthy — the NOAA scale, recent notices, and visible NOAA source action remain above the fixed dock at the lower source context. |

## Narrow-phone Sky Anomalies result handoff

This controlled review used the linked Vercel preview at 320 × 844 CSS pixels. It covers the narrow-phone Dashboard partial state and the user goal **Check a sky sighting against available context**, from the initial form to a visible, focused submitted result.

| Step | Evidence | Health |
| --- | --- | --- |
| 50 | `50-dashboard-partial-mobile-320x844.png` | Healthy — the partial Dashboard hierarchy remains legible at 320px with no horizontal overflow or dock collision. |
| 51 | `51-anomalies-mobile-start-320x844.png` | Healthy — the Sky Anomalies start form retains its title, source limits, and concise input hierarchy at 320px. |
| 52 | `52-anomalies-mobile-result-focused-320x844.png` | Healthy after change — pointer submission preserves the observation and lands focus on `Sighting context` 86px below the sticky header; the partial-source result begins immediately, with no horizontal overflow. |

## Mobile Launches recovery follow-up

This controlled review used Apollo's API-free local static shell at 390 × 844 CSS pixels. It covers the unavailable branch of the user goal **Check an upcoming launch**. The missing local API route is a controlled recovery trigger, not evidence about upstream availability or deployment.

| Step | Evidence | Health |
| --- | --- | --- |
| 53 | `53-launches-mobile-recovery-390x844.png` | Healthy — Apollo names the unavailable The Space Devs schedule, explains the no-stale-data consequence, and presents retry, source, and Dashboard recovery actions. |
| 54 | `54-launches-mobile-recovery-actions-390x844.png` | Healthy — at the true scroll limit, all recovery actions remain fully visible above the fixed dock; pointer retry retained the same page and honest unavailable state. |

## Mobile Weather recovery follow-up

This controlled review used Apollo's API-free local static shell at 390 × 844 CSS pixels. It covers the unavailable branch of the user goal **Monitor space weather**. The missing local API route is a controlled recovery trigger, not evidence about NOAA SWPC availability or deployment.

| Step | Evidence | Health |
| --- | --- | --- |
| 55 | `55-weather-mobile-recovery-390x844.png` | Healthy — Apollo names NOAA SWPC, states that it is not showing stale or inferred conditions, and presents retry, source, and Dashboard recovery actions. |
| 56 | `56-weather-mobile-recovery-actions-390x844.png` | Healthy — at the true scroll limit, all recovery actions remain fully visible above the fixed dock; pointer retry retained the same page and honest unavailable state. |

## Mobile ISS and crew recovery follow-up

This controlled review used Apollo's API-free local static shell at 390 × 844 CSS pixels. It covers the unavailable branch of **Follow the ISS and current crew** when both primary sources fail. `/api/iss` and `/api/people` are intentional local 404s here, so this proves Apollo’s recovery boundary rather than source availability or deployment.

| Step | Evidence | Health |
| --- | --- | --- |
| 57 | `57-iss-mobile-recovery-390x844.png` | Healthy — the position card names the affected source, pauses map and orbital context rather than showing an old location, and retains its retry and upstream route. |
| 58 | `58-iss-mobile-recovery-actions-390x844.png` | Healthy — the crew card withholds an old manifest; its retry, source, and Dashboard actions end at 636px above the dock. Pointer retry retained the ISS page and both honest unavailable states. |

## Local function-preview ISS proxy follow-up

This controlled review used Apollo's authentication-free local function preview at 390 × 844 CSS pixels. It covers the loaded branch of **Follow the ISS and current crew** through the new `/api/iss` and `/api/people` routes. It validates Apollo's own handlers against the live public sources, not Vercel deployment behaviour.

| Step | Evidence | Health |
| --- | --- | --- |
| 59 | `59-iss-mobile-proxy-loaded-390x844.png` | Healthy — current ISS status, map, position, and the live crew summary render through Apollo's proxy boundary without horizontal overflow. Pointer Refresh remained on ISS and retained the current loaded state. |

## Mobile Watch keyboard follow-up

This controlled review used Apollo's authentication-free local function preview at 390 × 844 CSS pixels. It covers **Navigate secondary monitoring pages on phone** from keyboard opening through each Watch destination. It validates the product's explicit keyboard handlers and browser result, not physical-device ergonomics or Vercel deployment behaviour.

| Step | Evidence | Health |
| --- | --- | --- |
| 60 | `60-mobile-watch-keyboard-enter-open-390x844.png` | Healthy — Enter opens the named Watch menu and moves focus to Weather, exposing all three destinations in a predictable order. |
| 61 | `61-mobile-watch-keyboard-weather-390x844.png` | Healthy — Enter reaches the Weather detail view and dismisses Watch. |
| 62 | `62-mobile-watch-keyboard-asteroids-390x844.png` | Healthy — Space reaches Asteroids and preserves the honest NASA NeoWs unavailable state with Watch dismissed. |
| 63 | `63-mobile-watch-keyboard-anomalies-390x844.png` | Healthy — Enter reaches the Sky Anomalies context form with Watch dismissed. |

## Sky Anomalies keyboard follow-up

This controlled review used Apollo's authentication-free local function preview at 390 × 844 CSS pixels. It covers **Check a sky sighting against available context** from keyboard trait selection through the focused, source-limited result.

| Step | Evidence | Health |
| --- | --- | --- |
| 64 | `64-anomalies-mobile-keyboard-result-390x844.png` | Healthy — Space/Enter selection preserves Straight line, Bright, and Seconds; Enter submits and moves focus to Sighting context with the source limits visible. |

## Asteroids recovery keyboard follow-up

This controlled review used Apollo's authentication-free local function preview at 390 × 844 CSS pixels. It covers **Track near-Earth objects** when NASA NeoWs is unavailable.

| Step | Evidence | Health |
| --- | --- | --- |
| 65 | `65-asteroids-mobile-keyboard-retry-390x844.png` | Healthy — Enter rechecks NeoWs, refreshes the check time, and retains the honest source-specific recovery state above the dock. |

## Dashboard Refresh keyboard follow-up

| Step | Evidence | Health |
| --- | --- | --- |
| 66 | `66-dashboard-mobile-keyboard-refresh-390x844.png` | Healthy — Space completes a fresh Dashboard check and preserves the clear partial-data state. |

## Launches Refresh keyboard follow-up

| Step | Evidence | Health |
| --- | --- | --- |
| 67 | `67-launches-mobile-keyboard-refresh-390x844.png` | Healthy — Space completes a fresh loaded-schedule check and preserves the visible mission context. |

## Launches recovery keyboard follow-up

| Step | Evidence | Health |
| --- | --- | --- |
| 68 | `68-launches-mobile-keyboard-retry-focus-390x844.png` | Healthy focus treatment — Space reaches the native recovery control, whose focus ring is visible and clear of the fixed dock. This does not itself prove a complete keyboard-only recovery action. |

## Launches 320px recovery follow-up

| Step | Evidence | Health |
| --- | --- | --- |
| 69 | `69-launches-mobile-recovery-320x844.png` | Healthy — the real unavailable state has no horizontal overflow and wraps the recovery control without truncation. |
| 70 | `70-launches-mobile-recovery-actions-320x844.png` | Healthy — at the true scroll limit, all recovery actions remain 90px above the fixed dock. |

## Shared 320px recovery sweep

| Step | Evidence | Health |
| --- | --- | --- |
| 71 | `71-weather-mobile-recovery-actions-320x844.png` | Healthy — Weather's honest NOAA recovery has no horizontal overflow; all actions end 54px above the dock. |
| 72 | `72-asteroids-mobile-recovery-actions-320x844.png` | Healthy — Asteroids' honest NeoWs recovery has no horizontal overflow; all actions end 58px above the dock. |
| 73 | `73-gallery-mobile-recovery-actions-320x844.png` | Healthy — Gallery's honest APOD recovery has no horizontal overflow; all actions end 107px above the dock. |

## Limits

- Original recovery steps 18–24 are current desktop Vercel-preview and pointer evidence. They do not prove production deployment, real-browser keyboard focus order, touch targets, contrast, or screen-reader announcements.
- The 390px follow-up establishes only the Dashboard partial state and Asteroids unavailable recovery state in controlled desktop-browser emulation. It does not prove touch hardware, safe-area, orientation, full-product mobile coverage, or mobile keyboard behaviour.
- The 390px Gallery follow-up establishes its unavailable APOD branch and pointer retry only. It does not prove loaded image/video media, alternate-media handling, hardware touch ergonomics, keyboard, safe-area, orientation, contrast, or assistive-technology behaviour.
- The 390px Sky Anomalies follow-up establishes keyboard trait selection, Enter submission, and focused result handoff. It does not prove hardware touch ergonomics, safe-area, orientation, contrast, or assistive-technology behaviour.
- The 390px ISS follow-up establishes its loaded state plus the API-free static-shell simultaneous position-and-crew unavailable branch with pointer retry only. It does not prove live-source availability, deployment, hardware touch ergonomics, keyboard, safe-area, orientation, zoom, contrast, or assistive-technology behaviour.
- The 390px Watch follow-up establishes controlled browser Enter/Space opening, focus handoff, routes, and destination dismissal. It does not prove hardware keyboard or touch ergonomics, safe-area, orientation, zoom, contrast, or assistive-technology behaviour.
- The 390px Launches follow-up establishes the loaded overview, pointer disclosure, and source action only. It does not prove mobile source failure, hardware touch, keyboard, safe-area, orientation, zoom, contrast, or assistive-technology behaviour.
- The 390px Weather follow-up establishes the loaded decision view, lower source context, and API-free static-shell unavailable branch with pointer retry only. It does not prove live-source availability, deployment, hardware touch ergonomics, keyboard, safe-area, orientation, zoom, contrast, or assistive-technology behaviour.
- The 320px Dashboard and Sky Anomalies follow-up establishes a narrower partial Dashboard, Sky Anomalies start form, and pointer-result focus handoff only. It does not prove hardware touch ergonomics, keyboard-only submission, safe-area, orientation, contrast, or assistive-technology announcement behaviour.
- The 390px Launches recovery follow-up establishes the API-free static-shell unavailable branch and pointer retry only. It does not prove live-source availability, deployment, hardware touch ergonomics, keyboard, safe-area, orientation, zoom, contrast, or assistive-technology behaviour.
- The new ISS and crew proxy routes have contract coverage, but the current local Vercel-compatible preview could not start because its configured token is invalid. Their live serverless source-success branch remains unverified.
- `npm run preview` now validates the same ISS and crew handlers against live public sources without Vercel authentication. It is not a Vercel-platform or deployed-production substitute.
- The no-stale-data policy remains intact. A resilience decision about visibly aged last-known-good data is still a founder decision, not silently introduced behaviour.
- The current browser controller focused the native retry control, but both its CUA and DOM key channels left Enter and Space inactive. This is a tooling limit, not a claim that keyboard activation succeeds or fails for real users.
