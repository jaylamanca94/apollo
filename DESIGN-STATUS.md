# Apollo — Design Status

**Last reviewed:** 2026-08-10
**Canonical sources:** `FLOW-REGISTRY.md`, `PRODUCT-README.md`, `DESIGN-README.md`, `docs/product-lab-progress.md`

## Active-flow headline

Apollo's dashboard is the clearest expression of its purpose—plain-English understanding of space activity now—but the experience is incomplete whenever an upstream source does not answer.

## Signals

| Signal | Verified status |
| --- | --- |
| Canonical flows | 7 distinct user-goal flows retained; 4 core, 2 supporting, 1 experimental |
| Recovery coverage | Launches, Weather, Asteroids, and Gallery show source-specific unavailable states; each affected detail page now offers an in-context retry plus source and Dashboard routes |
| Design-system alignment | The recovery control reuses Acadia button and state anatomy; Apollo-specific red identity and source semantics remain local |
| Incomplete flows | All flows await current browser-backed visual, keyboard, zoom/reflow, and screen-reader QA; live loaded states remain unverified for Launches, Weather, Asteroids, and Gallery |
| Missing states | No adopted aged-data/last-known-good state; source outages stay honest rather than appearing live. Sky Anomalies has explicit planned-source gaps, not fabricated matching. |
| Evidence limit | Local static preview proved the Launches unavailable-state retry triggers a fresh request, but its screenshot output did not match the visible DOM and was rejected as visual evidence. Production Vercel routes were not started because the local preview required unavailable network access. |

## Highest-leverage design opportunities

1. **P1 — Decide an explicit resilience policy for unavailable sources.** Either retain validated, visibly aged data with a maximum age or commit to the current no-stale-data experience; this affects the Dashboard, Launches, Weather, Asteroids, and Gallery flows.
2. **P1 — Make the Dashboard's Space Brief the unambiguous primary moment.** Resolve whether it is a concise decision surface or a broad feed browser, then remove secondary structure that does not serve that choice; this affects the Dashboard, ISS, Launches, Weather/Asteroids, and Gallery flows.
3. **P2 — Keep Sky Anomalies deliberately bounded until its evidence improves.** Lower its prominence or define a focused pilot only after a small location-aware source set is ready; this affects the Anomalies flow and the Dashboard/Watch entry paths.
