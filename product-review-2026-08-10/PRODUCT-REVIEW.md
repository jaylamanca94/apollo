# Apollo Product Review — 2026-08-10

## Scope and evidence

This targeted review covers Apollo's core **Follow the ISS and current crew** flow after adding source-specific recovery for its position and roster regions. It used the local static shell with current browser-side ISS and crew sources available at the time of capture.

## Verdict

The loaded ISS flow is healthy on desktop: position, freshness, map, operational interpretation, and crew roster form a coherent answer to one user question. The new failure treatment is covered by fixtures and preserves that trust posture when either source does not answer. Mobile interaction was checked semantically, but the browser's mobile screenshot was invalid and is deliberately excluded from visual evidence.

## Steps

| Step | Evidence | Health |
| --- | --- | --- |
| 1 | `03-iss-live-loaded.png` | Healthy — desktop presents the live map, timestamp, orbital context, and crew roster in one clear hierarchy. |
| 2 | Fixture: `ISS source failures keep recovery with the affected data` | Healthy in code — each unavailable region names its source and offers retry, upstream source, and Dashboard recovery. |
| 3 | Browser DOM at 390px | Semantically healthy — Refresh data, the map region, and crew heading remained reachable; the refresh completed by keyboard. |

## Findings

- **Fixed:** A failed position or roster source no longer leaves the ISS user on a generic alert with only the distant header refresh control.
- **Deferred:** The 390px screenshot output did not match the browser DOM, so mobile visual layout, touch target size, and full reflow remain unproven.
- **Founder decision needed:** The no-stale-data policy still governs all source-dependent flows. The new recovery state makes that policy usable, but it does not replace a resilience decision.

## Verification limits

- This captures one current loaded ISS/crew state, not long-term source reliability.
- Screenshot and DOM checks do not prove screen-reader announcements, contrast, or complete keyboard focus order.
