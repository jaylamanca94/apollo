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

## Limits

- Original recovery steps 18–24 are current desktop Vercel-preview and pointer evidence. They do not prove production deployment, real-browser keyboard focus order, touch targets, contrast, or screen-reader announcements.
- The 390px follow-up establishes only the Dashboard partial state and Asteroids unavailable recovery state in controlled desktop-browser emulation. It does not prove touch hardware, safe-area, orientation, full-product mobile coverage, or mobile keyboard behaviour.
- The 390px Sky Anomalies follow-up establishes the initial form and pointer-submitted result only. It does not prove hardware touch ergonomics, safe-area, orientation, keyboard-only form submission, contrast, or assistive-technology behaviour.
- The 390px ISS follow-up establishes only its loaded state in controlled desktop-browser emulation. It does not prove mobile source-failure recovery, touch hardware, safe-area, orientation, keyboard, contrast, or assistive-technology behaviour.
- The no-stale-data policy remains intact. A resilience decision about visibly aged last-known-good data is still a founder decision, not silently introduced behaviour.
- The current browser controller focused the native retry control, but both its CUA and DOM key channels left Enter and Space inactive. This is a tooling limit, not a claim that keyboard activation succeeds or fails for real users.
