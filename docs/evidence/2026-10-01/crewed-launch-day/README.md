# Apollo 1.3.1 — Crewed launch-day homepage feature

Reviewed 1 October 2026. Founder request: give missions carrying people prominent homepage placement on launch day, across operators, destinations and purposes.

## Delivered behaviour

- A launch-day human-spaceflight hero precedes the ordinary brief. Each eligible same-local-day crewed flight is featured; the brief avoids repeating the same mission. Non-launch days retain the existing homepage.
- Provider status, local target time/timezone, destination and launch crew stay attached to coverage and mission-update actions. Unknown fields are omitted. Mission artwork retains its source description, credit and licence link and is not described as a live pad image.
- An elapsed target never establishes lift-off. Scrubs/holds use Previous target and a clear limitation; reported outcomes stay visible through launch day. A schedule moved to tomorrow removes the feature. Cancelled flights and dates less precise than a day do not qualify.
- A separate existing-provider query uses `is_crewed=true`, `include_suborbital=true`, detailed mode and a three-UTC-day range. The general SpaceX schedule is unchanged. Complete response count/identities/required records are checked; malformed or paginated results fail closed. A 15-minute per-instance and CDN cache limits requests. Browser snapshots older than 30 minutes become unavailable; the visible page re-evaluates date boundaries every minute and refreshes automatically no more often than every 15 minutes. Manual refresh and source-specific retry remain available.
- UI reuses unchanged Acadia Card, Surface, Panel, Stack, Cluster, Display, Badge, Button, Thumbnail and Alert anatomy. Mission/image proportions are Apollo-owned composition. No new dependency, paid service, persistent store or model call.

## Evidence

| Gate | Result |
| --- | --- |
| Syntax and project tests | `npm run check`: 153 passed, including ten new crewed-launch contract/date/status tests |
| Response and query contracts | Other operators/destinations, declared-count and paging failure, duplicate/malformed records, unsafe URL/text handling, no invented provider/crew, multi-provider/suborbital filter and valid-only cache |
| Calendar and status | New York, UTC+14 and UTC−10 date boundaries; upcoming/tomorrow/uncrewed/cancelled/vague dates; elapsed targets, completed launches, scrubs and stale data |
| Local live API/browser | Crew-13 renders from Apollo's actual proxy with ISS destination, four launch crew, 11:10 AM EDT target, NASA coverage and SpaceX mission link |
| Geometry | `geometry-results.json`: eight 1440/834/390/320px light/dark observations and one 320px/200% text observation, no page or visible nested feature overflow |
| Keyboard recovery | Retry with Enter → recovered feature heading; focused coverage link survives refresh; postponement removes feature and focuses the ordinary brief heading |
| Browser states | Scrubbed, completed, source failure/stale failure, no-image and non-launch-day layouts checked with labelled fixtures; no browser errors in the reviewed live/loaded runs |
| Visual | Live desktop light and phone light/dark captures reviewed; fixture desktop/phone and 320px/200% text reviewed locally |

Captures: [desktop light](crew13-desktop-light.png), [phone light](crew13-phone-light.png), [phone dark](crew13-phone-dark.png). The captured mission-image licence link was subsequently shortened from Image source and licence to Image licence for precision; layout and destination are unchanged.

The live review took place around 10:24–10:29 AM EDT, before the target. Its source status was Go for Launch. This is a point-in-time schedule observation, not confirmation of launch success. Other routine feeds were partially unavailable in the keyless local preview; those failures did not suppress the independently fetched crewed mission or become false zero/quiet claims.

## Reproduce

Start `npm run preview:fixtures -- 4185` and open `/?crewed=today|tomorrow|completed|scrubbed|empty|failure|stale|no-image`. Add `&text=200` for enlarged text. Fixtures are visibly synthetic, never production mission claims. `npm run preview -- --port 4186` invokes the actual local API handlers for a live check; provider rate limits and current schedule apply.

## Delivery and acceptance boundary

Source, automated checks and local live/fixture browser acceptance are complete. Git delivery is recorded in the chat handoff. No manual production deployment was performed. Hosted runtime, physical touch/VoiceOver and reader comprehension/return acceptance remain separate. Source imagery, provider completeness and status freshness remain limited by the upstream public feed.

## Git publication hold — 1 October 2026

Validated implementation commit: `ee5cc8b` on local `main`. The automatic approval reviewer rejected `git push origin main`: it classified the operation as repository-content export to `https://github.com/jaylamanca94/apollo.git` and mutation of the shared default branch, stating that implementation had been authorised but this specific publication had not. The push did not execute; no alternate publication route was attempted.

Pending decision: founder approval to push this verified feature and its delivery receipt from local `main` to that repository's `origin/main`. Recommendation: approve normal Git publication of the completed feature. Resume trigger: explicit approval naming this Apollo push; then push without rewriting history and verify remote SHA equality and a clean local `main`. No manual production deployment is included; hosted runtime verification remains separate.
