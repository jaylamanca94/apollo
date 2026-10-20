# An open briefing that stays honest — 20 October 2026

Apollo 1.4.2. Controlled Chromium/clock evidence reproduced a passed target still leading the brief with `T-<1m` in 1.4.1. The ordinary Dashboard now re-evaluates existing data each visible minute and on return, retires elapsed launch/weather prominence, updates activity ages and asks for a new check after 30 minutes. It never infers lift-off or advances the original source-check timestamp. Earlier values are explicitly identified; a failed explicit refresh discards them. No new ordinary provider fetch, dependency, CSS, account or service. The crewed schedule retains its independent existing cache/refresh policy.

- `npm run check`: 172 passing checks, including five focused clock/expiry regressions and existing source/calendar/crew/focus contracts.
- `before-390.png` / `after-390.png` and `before-1280.png` / `after-1280.png`: equivalent synthetic target, viewport and 61-second clock advance. Baseline uses committed `02a0036` app.js; after falls back to NASA and labels the passed target.
- `stale-390.png` / `stale-1280.png`: original dated check time, Refresh briefing and explicitly earlier coverage/snapshot. Existing crewed unavailable cue in these synthetic captures reflects its separate source-check clock.
- `weather-aged-dark-834.png`: older Kp observation no longer displaces the launch. `stale-text200-320.png`: enlarged briefing content; no page overflow.
- `observations.json`: phone/desktop expiry; unchanged action DOM and focus; 30-minute cue without routine feed requests; Enter refresh through the full existing refresh path; headline focus after completion; hidden return; focus outside the briefing preserved; failed refresh clears previous observations. No browser errors. Clock-only stats/activity updates are not live announcements; briefing/status remain polite. This is structural/browser evidence, not physical screen-reader acceptance.

No participant, demand, retention, native-calendar import or physical touch/Safari/Home Screen/VoiceOver acceptance is claimed. The existing reader trial remains unrun and awaits consenting participants from the founder.

## Delivery

Implementation `40a3e301bf62916bf8704a21ef337c53727997ba` is on remote `main`. [Exact-revision CI](https://github.com/jaylamanca94/apollo/actions/runs/39481283489) passed. Git-linked Production deployment 7208717563 succeeded at 19:11:27 UTC ([deployment](https://apollo-c32shwj2n-jayson-lamanca-s-projects.vercel.app)). At 19:11 UTC the [public alias](https://apollo-eight-mu.vercel.app/) returned healthy 1.4.2 with configured NASA key; app.js matched committed bytes and all six changed HTML pages loaded its new cache version.

`production.json`, `production-brief-390.png` and `production-stale-390.png` record six loaded ordinary sources, the Starlink Group 15-15 recommendation, retained dated check after a controlled 31-minute browser-clock advance, Enter refresh with focus on the new headline, and Enter hand-off to loaded Launches without browser errors. This combines current public sources with a controlled clock; it is not a real-time 31-minute observation or physical/reader acceptance. The separate crewed schedule can show unavailable in that deliberately advanced clock because it retains its original source-check time. No Vercel settings, credentials or calendar changed.

This documentation-only receipt follows the verified implementation. Recovery baseline: `02a003671f1b374249cdb52ebbc5b649767d0141`; revert the focused implementation through the same checked workflow. No schema or persistent-data migration.
