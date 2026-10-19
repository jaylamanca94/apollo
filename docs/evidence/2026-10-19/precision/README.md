# Consistent launch uncertainty — 19 October 2026

Apollo 1.4.1. User outcome: source-day/month/year targets keep their uncertainty from Dashboard brief/snapshot/activity/diagnostics through Launches and calendar eligibility. The original phone/desktop UI reproduced false exact time/countdowns for a day-only target; shared source-period rules now prevent them. Held/unknown/elapsed targets have no running countdown. An elapsed target says “Target time passed”, not lift-off. Day/month recommendations remain eligible through their UTC source period. The experimental sighting checker does not compare held/imprecise targets as exact timing evidence.

No new provider, account, storage, dependency or operating cost. Existing Acadia 0.9.2 CSS remains byte-pinned. The local metric grid minimum increases from 8rem to 10rem after tablet inspection found mid-word values; the “No time” metric retains full source-date context beneath it.

## Evidence

- `npm run check`: 167 passing checks. New coverage includes source-period boundaries, status-aware countdowns, timezone-safe source dates, malformed/mixed/duplicate pages, explicit verified empty pages, bounded pagination and actual-handler failure → retry → cached recovery preserving original check time. Existing calendar, crewed-feature, source trust and focus tests pass.
- `observations.json`: controlled UI scenarios for month/year/unknown/held/past/malformed/empty; malformed is unavailable while explicit empty remains empty. Space retry on malformed Launches retains its recovery-button focus. Day-only Launches/calendar remains disabled with a precise reason. Text enlarged to 200% at 320px has no horizontal page overflow; wording remains readable. Browser emulation, not physical accessibility acceptance.
- Equivalent 1280×720 and 390×844 day-target comparisons: `before-1280.png` / `after-1280.png`, `before-390.png` / `after-390.png`; dark phone `after-dark-390.png`. The independent 834px dark tablet layout comparison is `before-layout-month-dark-834.png` / `month-dark-834.png`. Enlarged timing copy: `text200-320.png`. Recovery: `malformed-retry-390.png`; day-only detail: `detail-day-390.png`.
- One direct request to the existing [Launch Library upcoming endpoint](https://ll.thespacedevs.com/2.3.0/launches/upcoming/?search=SpaceX&limit=5) returned 5 of 137 results with a next page. Its first mission carried Minute precision, Go for Launch status and a 20 October 2026 10:30 UTC target. This is a dated schedule, not evidence of eventual lift-off. API validation accepts the page without claiming global completeness.
- Actual local handlers: 5/6 Dashboard sources loaded; local NeoWs has no key. The briefing's Bandwagon 5 target matched Launches, and keyboard Enter downloaded its tentative calendar snapshot. File checks retained `DTSTART:20261020T103000Z`, transparent/tentative status and Apollo return link. `live-brief-390.png` / `live-detail-390.png`. No browser errors on the detail/download path. No native calendar write or import.

The source responses and fixture scenarios establish implementation behaviour. They do not establish reader comprehension, voluntary return, native-calendar import, physical touch/Safari/Home Screen or VoiceOver acceptance. The existing participant trial remains unrun. The source-check age/calendar safeguards remain unchanged; an open Dashboard's time-aware refresh behaviour is a candidate for the next independent outcome.

## Delivery

Pending exact-revision Git-linked CI/Production verification. Recovery baseline: prior production/main `63b6e6859ff762456cdfd6b50b373395d3fda95a`. Revert this implementation through the ordinary Git workflow if necessary; no schema or persistent-data migration.
