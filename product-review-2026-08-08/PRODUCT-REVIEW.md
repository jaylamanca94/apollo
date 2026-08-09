# Apollo Product Review — 2026-08-08

## Scope and evidence

Apollo’s intended job is to help a public visitor understand what is happening in space right now. This review covered the dashboard, ISS, Launches, Weather, Asteroids, Gallery, the desktop and mobile Watch navigation, and the Sky Anomalies input/result flow.

Captured evidence is in this folder. The review run had live ISS and crew data, while APOD, launch, asteroid, and space-weather sources were unavailable. Findings about those unavailable states are based on that observed behavior; findings about their loaded detail treatments remain limited to the implementation and existing automated contracts.

## Verdict

Apollo has a strong, focused core: its dashboard summarizes changing public space data in plain language, and the ISS detail page turns a raw feed into an understandable operational story. The product loses clarity when source health is poor: four primary information areas turn into separate unavailable destinations, and the dashboard shifts from a useful brief to an outage report. Its largest scope risk is Sky Anomalies, which is thoughtfully worded but much more complex and less capable than the core space-briefing experience.

## What is working

- **Clear trust posture.** Partial and unavailable states are named plainly; Apollo does not invent activity when a source cannot be reached.
- **Strong ISS path.** The ISS page combines current position, map, sunlight, velocity, freshness, and crew into one understandable story.
- **Good information hierarchy on the dashboard.** Snapshot → Space Brief → actions → source status matches the core “what matters now?” question.
- **Useful mobile navigation.** The five-item dock and labelled Watch menu keep secondary destinations discoverable without a generic overflow menu.
- **Careful anomaly language.** The result distinguishes checked context from planned data gaps and avoids identity or certainty claims.

## Prioritized findings

### P1 — A partial source outage removes most of Apollo’s core value

**Evidence:** `01-dashboard-desktop.png`, `03-launches-desktop.png`, `04-weather-desktop.png`, `05-asteroids-desktop.png`, and `06-gallery-desktop.png`.

With four of six sources unavailable, the dashboard’s Brief is useful and honest, but Launches, Weather, Asteroids, and Gallery each become a destination whose primary result is “Data unavailable.” The product then asks a visitor to navigate into separate dead ends instead of preserving useful, clearly dated context.

**Founder decision:** Choose a trust-preserving resilience policy: for example, show the most recent validated result with an explicit age/source label, or deliberately keep the current no-stale-data policy and collapse unavailable destinations into a single dashboard-level status. Do not implement stale data until its source, maximum age, and wording are agreed.

### P1 — The product needs one declared primary moment

**Evidence:** `01-dashboard-desktop.png`, `02-iss-desktop.png`, and product scope.

Apollo currently acts as both a “what matters now?” briefing and a browseable catalog of feeds. The dashboard and ISS path support the briefing particularly well; large detail destinations imply a broader monitoring product. Without a clear priority, the dashboard gives similar structural weight to live operations, scheduled events, data availability, and experimental exploration.

**Founder decision:** Make the main promise explicit: either (a) a concise space-status brief with only details that change the brief, or (b) a dependable public data browser. The review recommends (a); it is closer to the current mission and makes the Space Brief the product’s differentiator.

### P1 — Sky Anomalies is a scope and trust outlier

**Evidence:** `07-anomalies-start-desktop.png`, `10-anomalies-result-mobile.png`.

The flow is careful, but it has a high input-to-answer complexity ratio: the user supplies a location, date, time, movement, brightness, and duration, while the result currently cannot use location for actual overhead, aircraft, planet, fireball, satellite, or UAP matching. It therefore creates a highly specific expectation beside an intentionally limited response.

**Founder decision:** Keep it as an explicitly labelled experiment outside the core monitoring route, or pause it until a small, reliable location-aware source set can produce genuinely differentiated results. It should not receive more feature depth before this decision.

### P2 — Dashboard activity repeated steady-state ISS information

**Evidence:** `01-dashboard-desktop.png` showed the same ISS condition in the snapshot, Recent Activity, and Watch Items.

**Safe refinement implemented:** When the only Recent Activity item is the continuous ISS position update already represented in Watch Items, Recent Activity is hidden and Watch Items takes the full row. Meaningful launch, APOD, or weather activity continues to restore Recent Activity.

### P2 — Navigation treats experimental and core monitoring destinations alike

**Evidence:** `09-watch-menu-mobile.png`, `07-anomalies-start-desktop.png`.

Weather, Asteroids, and Anomalies live under the same Watch label. The grouping is understandable, but it implies that the anomaly checker has the same operational maturity as the primary feeds.

**Recommendation for founder review:** If Sky Anomalies remains, label it Beta/Experimental and reduce its navigation prominence. This is a product-direction choice, so it was not changed.

### P2 — Gallery has no graceful dashboard value when APOD is unavailable

**Evidence:** `01-dashboard-desktop.png`, `06-gallery-desktop.png`.

APOD is a source-backed visual entry point, but when unavailable it disappears from the dashboard and the Gallery becomes a dead end. This makes the information architecture feel inconsistent: some unavailable feeds remain in Watch Items, while the Gallery signal vanishes.

**Recommendation for founder review:** Resolve through the broader source-resilience decision, rather than adding another unavailable card to the dashboard.

### P3 — Accessibility verification needs behavioral coverage

**Evidence:** static public-page checks cover landmarks, skip links, live regions, navigation state, and refresh relationships. The review did not prove keyboard focus order, screen-reader announcements, contrast, zoom/reflow, or pointer target sizes under real loaded data.

**Recommendation:** Add a lightweight browser accessibility pass and keyboard smoke test after source-resilience work; do not claim full accessibility conformance yet.

## High-confidence product advances for founder review

1. **Make the Space Brief the commitment.** Treat it as the durable answer and let cards earn their place only when they change the answer, provide a next action, or substantiate trust.
2. **Invest in source resilience before expanding feeds.** A transparent, bounded stale-data strategy would increase value on more visits than another new API or new page.
3. **Consider a location-aware ISS viewing moment only after the core feed path is reliable.** “Can I see the ISS from here?” is a focused user question that builds on Apollo’s strongest live asset, but it is out of current MVP scope and requires founder approval.

## Evidence files

| Step | Screenshot | Health |
| --- | --- | --- |
| 1 | `01-dashboard-desktop.png` | Mixed — clear brief, but outage-heavy content and duplicated ISS state before refinement |
| 2 | `02-iss-desktop.png` | Healthy — cohesive, useful operational detail |
| 3 | `03-launches-desktop.png` | At risk — source failure produces a dead-end destination |
| 4 | `04-weather-desktop.png` | At risk — source failure produces a dead-end destination |
| 5 | `05-asteroids-desktop.png` | At risk — source failure produces a dead-end destination |
| 6 | `06-gallery-desktop.png` | At risk — source failure removes the visual payoff |
| 7 | `07-anomalies-start-desktop.png` | Mixed — careful framing, high complexity for current capability |
| 8 | `08-dashboard-mobile.png` | Healthy layout structure; content-state review is limited by unavailable sources |
| 9 | `09-watch-menu-mobile.png` | Healthy — clear, accessible-looking secondary navigation surface |
| 10 | `10-anomalies-result-mobile.png` | Mixed — transparent result but long, complex evidence path |

## Verification limits

- The unavailable sources may reflect upstream availability or the local preview environment; this review did not establish a production reliability rate.
- Screenshots and static checks cannot prove full accessibility conformance.
- Loaded launches, weather, asteroids, and APOD states need a second visual pass when those sources are available.
