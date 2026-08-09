# Apollo — Design Status

**Last reviewed:** 2026-08-08
**Canonical sources:** `FLOW-REGISTRY.md`, `PRODUCT-README.md`, `DESIGN-README.md`, `product-review-2026-08-08/PRODUCT-REVIEW.md`

## Signals

| Signal | Current status |
| --- | --- |
| User flows | 7 canonical flows inventoried; 2 core, 3 supporting/core information paths, 1 experimental flow |
| Screens / views | 7 public routes reviewed across desktop; dashboard, Watch menu, and anomaly results reviewed on a 390px phone viewport |
| Flow gaps | Reliable content is inconsistent across the live-data paths; an unavailable source can consume an entire destination |
| Design debt | Dashboard still supports two similar activity panels, now conditionally consolidated for a steady-state ISS-only condition |
| Complexity hotspots | Sky Anomalies combines a form, multiple source families, explanation logic, and planned-data disclaimers |
| Dead ends | Launches, Weather, Asteroids, and Gallery become source-unavailable endpoints when their only feed fails |
| Duplicate patterns | ISS status appeared in both Recent Activity and Watch Items; refined in the reviewed partial-data state |
| Empty / error / loading gaps | Error states are honest and readable; they need a deliberate freshness/resilience strategy, not more UI treatment |
| Responsive gaps | Primary mobile dock and Watch menu are sound; full-height captured review must be repeated with live source content before declaring full responsive coverage |
| Accessibility gaps | Static landmark/live-region/navigation coverage exists; keyboard-only, contrast, screen-reader, and zoom testing remain unverified |
| Acadia exceptions | No material exception identified in reviewed surfaces |
| Acadia graduation candidates | Conditional command-panel consolidation could be a shared dashboard pattern after a second product validates it |
| Unvalidated features | Real-data launch, weather, asteroid, and gallery states were not available in this run; anomaly matching remains intentionally limited |

## Next Design Opportunities

1. **P1 — Make partial availability feel useful, not broken.** Decide on a transparent stale-data/resilience approach for the four primary external data families.
2. **P1 — Decide Apollo’s primary moment.** Choose whether the dashboard is chiefly a concise “what matters now” brief or a collection of browseable feeds, then remove the secondary structure that does not serve that choice.
3. **P2 — Reposition Sky Anomalies.** Keep it as a clearly bounded experiment or separate pilot until location-aware and reported-sighting evidence is connected.
