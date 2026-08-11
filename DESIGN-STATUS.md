# Apollo — Design Status

**Last reviewed:** 2026-08-10
**Canonical sources:** `FLOW-REGISTRY.md`, `PRODUCT-README.md`, `DESIGN-README.md`, `docs/product-lab-progress.md`, `product-review-2026-08-10/PRODUCT-REVIEW.md`

## Active-flow headline

Apollo's dashboard is the clearest expression of its purpose—plain-English understanding of space activity now—but the experience is incomplete whenever an upstream source does not answer.

## Signals

| Signal | Verified status |
| --- | --- |
| Canonical flows | 8 distinct user-goal flows retained; 5 core, 2 supporting, 1 experimental. Weather and Asteroids are tracked separately because they answer different user questions. |
| Recovery coverage | ISS/Crew, Launches, Weather, Asteroids, and Gallery show source-specific unavailable states; each affected detail page now offers an in-context retry plus source and Dashboard routes, and current local retries reissue their requests without navigation |
| Design-system alignment | The recovery control reuses Acadia button and state anatomy; Apollo-specific red identity and source semantics remain local |
| Incomplete flows | ISS/Crew has an accepted desktop loaded-state capture and 390px keyboard-refresh check; Launches and Weather have accepted Vercel-runtime loaded-state captures, with Weather reached through the 390px Watch menu; Sky Anomalies has accepted desktop start and submitted-result captures. All flows still need complete keyboard, zoom/reflow, screen-reader, and deployed-production QA; Asteroids and Gallery also lack NASA-key-backed loaded-state evidence. |
| Missing states | No adopted aged-data/last-known-good state; source outages stay honest rather than appearing live. Sky Anomalies has explicit planned-source gaps rather than fabricated matching, and its submitted explanation now reflects the selected observation duration. |
| Evidence limit | A temporary copied checkout was needed because Vercel's worker cannot interpret the CloudDocs path with spaces. That runtime confirmed Launches and Weather, but is not deployed-production proof. Its missing local NASA key correctly produced health degradation and an explicit asteroid error; APOD/Asteroids loaded states therefore remain unverified. Unavailable-state screenshot output that did not match the visible DOM remains rejected as visual evidence. |

## Highest-leverage design opportunities

1. **P1 — Decide an explicit resilience policy for unavailable sources.** Either retain validated, visibly aged data with a maximum age or commit to the current no-stale-data experience; this affects the Dashboard, Launches, Weather, Asteroids, and Gallery flows.
2. **P1 — Make the Dashboard's Space Brief the unambiguous primary moment.** Resolve whether it is a concise decision surface or a broad feed browser, then remove secondary structure that does not serve that choice; this affects the Dashboard, ISS, Launches, Weather, Asteroids, and Gallery flows.
3. **P2 — Keep Sky Anomalies deliberately bounded until its evidence improves.** Lower its prominence or define a focused pilot only after a small location-aware source set is ready; this affects the Anomalies flow and the Dashboard/Watch entry paths.
