# An open briefing that stays honest — 20 October 2026

Apollo 1.4.2. Controlled Chromium/clock evidence reproduced a passed target still leading the brief with `T-<1m` in 1.4.1. The ordinary Dashboard now re-evaluates existing data each visible minute and on return, retires elapsed launch/weather prominence, updates activity ages and asks for a new check after 30 minutes. It never infers lift-off or advances the original source-check timestamp. Earlier values are explicitly identified; a failed explicit refresh discards them. No new ordinary provider fetch, dependency, CSS, account or service. The crewed schedule retains its independent existing cache/refresh policy.

- `npm run check`: 172 passing checks, including five focused clock/expiry regressions and existing source/calendar/crew/focus contracts.
- `before-390.png` / `after-390.png` and `before-1280.png` / `after-1280.png`: equivalent synthetic target, viewport and 61-second clock advance. Baseline uses committed `02a0036` app.js; after falls back to NASA and labels the passed target.
- `stale-390.png` / `stale-1280.png`: original dated check time, Refresh briefing and explicitly earlier coverage/snapshot. Existing crewed unavailable cue in these synthetic captures reflects its separate source-check clock.
- `weather-aged-dark-834.png`: older Kp observation no longer displaces the launch. `stale-text200-320.png`: enlarged briefing content; no page overflow.
- `observations.json`: phone/desktop expiry; unchanged action DOM and focus; 30-minute cue without routine feed requests; Enter refresh through the full existing refresh path; headline focus after completion; hidden return; focus outside the briefing preserved; failed refresh clears previous observations. No browser errors. Clock-only stats/activity updates are not live announcements; briefing/status remain polite. This is structural/browser evidence, not physical screen-reader acceptance.

No participant, demand, retention, native-calendar import or physical touch/Safari/Home Screen/VoiceOver acceptance is claimed. The existing reader trial remains unrun and awaits consenting participants from the founder.

## Delivery

Pending final commit, exact-revision CI and Git-linked production verification. Recovery baseline: `02a003671f1b374249cdb52ebbc5b649767d0141`; revert the focused implementation through the same checked workflow. No schema or persistent-data migration.
