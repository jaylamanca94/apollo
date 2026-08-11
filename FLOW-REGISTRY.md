# Apollo Flow Registry

**Registry status:** Seven canonical user goals verified in code. The unavailable-source recovery state now includes an in-context retry for the three affected source-dependent goals; fresh loaded-state, visual, keyboard, zoom, and assistive-technology QA remain incomplete.
**Last reviewed:** 2026-08-10

## Active-flow headline

**Understand space activity now** remains Apollo's strongest and most central flow: the Dashboard can continue to synthesize independently loaded sources, but its value still depends on a clear resilience decision for absent upstream data.

| Flow | Product status | Entry point → successful outcome | Primary states | Design coverage | QA coverage | Complexity | References |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Understand space activity now | Core, incomplete | Dashboard → Space Brief, Watch Items, and Data Sources → understand the current picture and which sources are available | Loading; live; partial; source unavailable; no meaningful recent event | Acadia shell and source-status anatomy reviewed in code; fresh visual loaded/partial capture pending | Static landmark/live-region tests pass; fresh browser interaction, visual, keyboard, zoom, and reader checks pending | Medium | `index.html`, `app.js`, `tests/accessibility-structure.test.js` |
| Follow the ISS and current crew | Core, incomplete | Dashboard or ISS navigation → live map, orbital context, crew roster → follow current station status | Position loaded; roster loaded; either source unavailable | Existing hierarchy reviewed; fresh visual loaded-state capture pending | Static structure tests pass; live browser and keyboard QA pending | Medium | `iss.html`, `app.js`, `tests/accessibility-structure.test.js` |
| Check an upcoming launch | Core, recovery improved | Dashboard, Launches navigation, or Watch Items → next-launch spotlight and schedule → know the next mission | Loading; schedule loaded; source unavailable with retry, upstream source, and Dashboard recovery | Acadia state pattern and explicit in-context retry reviewed in code; screenshot capture was invalid and is not accepted evidence | Contract/static tests pass; local unavailable-state retry invoked a second request; live loaded-state and visual QA pending | Medium | `launches.html`, `launches.js`, `api/launches.js`, `tests/accessibility-structure.test.js` |
| Monitor weather or near-Earth objects | Core, recovery improved | Watch menu or Watch Items → Weather/Asteroids detail → understand current weather or closest approach | Loading; calm/elevated or no-hazard; source unavailable with retry, upstream source, and Dashboard recovery | Shared Acadia state pattern reviewed in code; fresh visual loaded-state capture pending | Contract/static tests pass; browser verification of shared retry behaviour pending for each detail page | Medium | `weather.html`, `asteroids.html`, `app.js`, `api/space-weather.js`, `api/neo.js` |
| Explore NASA's daily image | Supporting, recovery improved | Gallery navigation → APOD media and explanation → view the day's image or video | Image; video; preview fallback; source unavailable with retry, upstream source, and Dashboard recovery | Shared Acadia state pattern reviewed in code; fresh visual media-state capture pending | Contract/static tests pass; browser verification of APOD media and retry pending | Low | `gallery.html`, `app.js`, `api/apod.js` |
| Navigate secondary monitoring pages on phone | Supporting, incomplete | Mobile dock → Watch menu → selected Weather, Asteroids, or Anomalies destination → reach the selected monitoring task | Menu opened; current destination; dismissal | Existing mobile dock reviewed; no fresh 390px capture in this milestone | Static navigation/accessibility checks pass; touch target, keyboard, and reflow QA pending | Low | `index.html`, `styles.css`, `app.js` |
| Check a sky sighting against available context | Experimental, incomplete | Watch → Anomalies form → submitted source-aware context → understand available evidence and limits | Partial context; connected source unavailable; submitted result; planned-source gap | Trust-first content and state separation reviewed in code; fresh result-state capture pending | Static structure tests pass; live browser, keyboard, and mobile QA pending | High | `anomalies.html`, `app.js`, `tests/accessibility-structure.test.js` |

## Incomplete flows and missing states

- All seven flows lack current browser-backed visual, keyboard-only, zoom/reflow, and screen-reader evidence.
- Launches, Weather/Asteroids, and Gallery still lack current loaded-state evidence from their live upstream sources; the retry reduces a dead end but does not create a resilience policy.
- The Dashboard intentionally has no retained-data state. Whether to add clearly aged last-known-good data is a founder decision, not an implementation gap to guess at.
- Sky Anomalies remains intentionally limited: it has no location-aware visibility, fireball, aircraft, planetary, satellite, or reported-sighting matching.

## Update rule

Before implementation, record flows added or changed, major states introduced, and required design and QA coverage. Keep each row as a distinct user goal from a meaningful entry point to a successful outcome; do not collapse flows merely to make the registry shorter.
