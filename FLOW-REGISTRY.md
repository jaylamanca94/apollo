# Apollo Flow Registry

**Registry status:** Initial inventory complete; live-source reliability remains under review.
**Last reviewed:** 2026-08-08

This is Apollo's authoritative record of canonical end-to-end user flows. The inventory is grounded in the product brief, current routes, public-page checks, and the captured 2026-08-08 review run.

| Flow | Product status | Entry point | Primary screens | Major states / branches | Design | Test | Complexity | References |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Understand space activity now | Core | Dashboard | Dashboard → Space Brief → Watch Items → Data Sources | Loading; live; partial; source unavailable; no meaningful recent event | Reviewed: Space Brief gives the main synthesis; duplicate steady-state ISS activity is suppressed | Static accessibility structure; manual desktop/mobile capture | Medium | `index.html`, `app.js`, `tests/accessibility-structure.test.js` |
| Follow the ISS and current crew | Core | Dashboard or ISS nav | ISS page → live map → orbital context → crew roster | Position loaded; people loaded; source unavailable | Reviewed: strong source-backed detail and scan hierarchy | Static accessibility structure; manual desktop capture | Medium | `iss.html`, `app.js` |
| Check an upcoming launch | Core | Dashboard, Launches nav, Watch Items | Launches page → next-launch spotlight → upcoming schedule | Loading; schedule loaded; source unavailable | Reviewed: valuable when live, but a full page is a dead end when the source is unavailable | Contract and static accessibility tests; manual unavailable-state capture | Medium | `launches.html`, `launches.js`, `api/launches.js` |
| Monitor weather or near-Earth objects | Core | Watch menu or Watch Items | Weather/Asteroids page → current status or closest approach | Loading; calm/elevated or no-hazard; source unavailable | Reviewed: clear intent, source reliability has outsized impact | Contract and static accessibility tests; manual unavailable-state capture | Medium | `weather.html`, `asteroids.html`, `app.js`, `api/space-weather.js`, `api/neo.js` |
| Explore NASA’s daily image | Supporting | Gallery nav | Gallery → APOD media → source or full description | Image; video; preview fallback; source unavailable | Reviewed: good dedicated media treatment; no dashboard visual entry when APOD fails | Contract and static accessibility tests; manual unavailable-state capture | Low | `gallery.html`, `app.js`, `api/apod.js` |
| Navigate secondary monitoring pages on phone | Supporting | Mobile dock | Watch → Weather/Asteroids/Anomalies | Menu opened; current destination; dismissal | Reviewed: menu is clear and bottom reachable | Static navigation/accessibility checks; manual mobile capture | Low | `index.html`, `styles.css`, `app.js` |
| Check a sky sighting against available context | Experimental | Watch → Anomalies | Sighting form → submitted context → source/gap explanation | Partial context; connected source unavailable; submitted result | Reviewed: careful claims, but it is a deep side workflow with limited matching capability | Static accessibility structure; manual desktop/mobile submission capture | High | `anomalies.html`, `app.js` |

## Update rule

Before implementation, record the flows added or changed, major new states, and required design and QA coverage. Update this registry whenever behavior changes and report its headline after meaningful work.
