# Product Overhaul Progress

## Goal

Bring Apollo to a verified, cohesive, maintainable, release-ready state while preserving its focused role: a trustworthy, plain-English view of what is happening in space now.

## Current Milestone

Milestone 2 — Validate live-source resilience and make only safe, source-honest recovery improvements. The primary product risk is not a local rendering failure: it is that four core destinations can become dead ends when their upstream feeds are unavailable.

## Completed

- [x] Milestone 1 — Established the durable overhaul record, inspected the product, source, prior review evidence, flow registry, design status, and Acadia adapter guidance.
- [x] Assessed applicable review areas: product, scope, design, flows, technical quality, responsiveness, UXQA, release readiness, and Acadia alignment. iOS and tvOS are not applicable to the current static-web product; their relevant touch, safe-area, keyboard, and distance-readability concerns remain part of responsive and accessibility validation.
- [x] Confirmed the existing seven canonical flows remain the correct inventory; no flow behavior changed in this milestone.
- [x] Verified the current automated baseline: `npm run check` passes (102 tests; JavaScript syntax and public-page accessibility/API/frontend fixtures).
- [x] Confirmed the current interface is an Acadia adapter rather than a competing local system; Apollo's red identity, space-data semantics, maps, media, and anomaly workflow are legitimate local concerns.
- [x] Made unavailable-detail recovery actions source-specific (`NASA APOD`, `NASA NeoWs`, `NOAA SWPC`, and `The Space Devs`) and removed unrelated ISS recovery links. Static coverage now protects this intent; the change preserves the no-stale-data policy.
- [x] Added baseline Vercel browser hardening headers: frame-embedding, plugin-object, referrer, MIME-sniffing, and unused-device-permission protections. The policy deliberately does not yet restrict Apollo's external map, media, CDN, and data origins.

## Next

1. Run a fresh browser-backed source-state and keyboard/mobile QA pass for the seven canonical flows, using live data where available and clearly identifying source-unavailable limitations.
2. Fix only concrete, safe findings in existing unavailable/recovery states; keep stale-data policy and broader information-architecture changes pending founder direction.
3. Update the flow registry and design status only if observed behaviour changes; document captured evidence and rerun the relevant checks.

## Deferred / Founder Decisions

- **P1 — Source resilience policy:** Choose either a bounded, explicitly aged validated-data policy or the current no-stale-data policy with a consolidated unavailable-state experience. Do not show stale content as live without a source, maximum age, and user-facing wording decision.
- **P1 — Primary product moment:** Confirm whether Apollo is principally a concise “what matters now?” Space Brief or a broader public data browser. Evidence favours the Space Brief because it best matches the stated mission and current strongest path.
- **P1 — Sky Anomalies scope:** Keep it clearly experimental and lower prominence, or pause further investment until a small location-aware source set can make the check meaningfully differentiated.
- **P2 — Accessibility assurance:** Static coverage is strong, but full keyboard order, assistive-technology announcements, contrast, zoom/reflow, and loaded-data pointer-target verification still need browser evidence before any conformance claim.

## Evidence

- 2026-08-09: repository inspection, `PRODUCT-README.md`, `DESIGN-README.md`, `FLOW-REGISTRY.md`, `DESIGN-STATUS.md`, and Acadia adapter/foundation guidance reviewed.
- 2026-08-09: `npm run check` passed — 102/102 tests.
- 2026-08-09: after source-recovery action refinement, `npm run check` passed again — 102/102 tests.
- 2026-08-09: after release-header hardening, `npm run check` passed — 103/103 tests; production dependency audit found 0 known vulnerabilities.
- 2026-08-08: prior captured product review covers all seven routes on desktop, dashboard/Watch/anomaly result on a 390px phone viewport, and identifies source-unavailable dead ends as the main release risk: `product-review-2026-08-08/PRODUCT-REVIEW.md`.
- Limits: existing screenshots did not validate loaded launch, weather, asteroid, or APOD states; localhost source availability is not evidence of production reliability. The in-app browser controller is unavailable in this session, so fresh screenshot, keyboard, touch, zoom/reflow, and assistive-technology evidence remains outstanding.
