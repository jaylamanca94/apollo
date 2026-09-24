# APOD 1.1.2 migration evidence

The intended outcome is the Gallery daily exploration journey: image → readable explanation and credit → full media/original source, without dependence on the retiring API gateway. Product rationale and operating limits are in PRODUCT-README.md.

Provider evidence read 2026-09-24 UTC:
- https://api.nasa.gov/assets/json/apis.json announces the 1 December retirement.
- https://github.com/nasa/apod-api documents the already-rewired backend and fields; its application.py forwards `science.nasa.gov/wp-json/wp/v2/apod-basic/YYMMDD`.
- A keyless live GET of `/260923` returned date 2026-09-23, title “A New Lunar Crater: McGetchin”, article `permalink`/`url`, image `hdurl`, HTML explanation, credit and descriptive alt text. A ten-day sample returned images only. Alternate media verification below is synthetic, not proof of a live video entry. The linked Notion guide could not be fetched; no replacement quota/SLA is claimed.

## Browser evidence

An isolated localhost server invoked the actual APOD handler; no NASA credential was used. For controlled cases its upstream fetch returned a malformed body or a video-shaped copy of the captured image metadata. Local mode switches required the visible Refresh control; opening the same URL alone retained the existing page. Captures were inspected, not merely generated.

- `apod-before-390.png` / `apod-after-390.png`: same 23 September payload, 390 × 844, dark appearance. Before: broken image because article permalink was treated as media; HTML appeared in the summary. After: 925px natural-width image loads, source alt text retained and summary readable. The existing Acadia composition is unchanged.
- `apod-after-1440.png`: live loaded Gallery at 1440 × 1000; explanation, credit and disclosure inspected.
- `apod-after-320-200.png`: 320 × 900 with root text doubled; document width 320 and no nested Gallery element with horizontal overflow.
- `apod-failure-390.png`: malformed HTTP 200 rejected by actual handler; unavailable state, no stale picture. Space retry retained “Try NASA APOD again” focus and width 390.
- `apod-recovered-390.png`: Enter retry after restoring live upstream data; recovered image and focus on persistent Refresh.
- `apod-video-handoff-390.png`: synthetic video metadata; stable preview fallback, one NASA source action, no iframe and no fabricated direct video/image action.
- `apod-dashboard-390.png`: live APOD Recent Activity link and dated Data Sources row within deliberately partial Dashboard (other providers not connected in this isolated preview). Confirmed 1/6 source status, then followed Recent Activity into Gallery. This is not full live-dashboard acceptance. The original NASA article returned HTTP 200.

Contract coverage includes strict date/source/image metadata, readable entities, escaped hostile text, legacy known-host video compatibility, new alternate-media hand-off, invalid-success retry/cache recovery, Eastern date selection, previous-day fallback only for 404, rate limits without retry, safe error bodies and timeouts. `npm run check`: 137 passing tests. Runtime-only npm audit: zero advisories. Installation reports existing development-tool advisories; they were not changed by this focused migration.

Hosted runtime, screen-reader and physical-device acceptance remain separate. No manual deployment or protection setting change is part of this work. Git-linked publication is checked after pushing. Recovery is a normal revert of the release commit; the prior APOD provider contract is already degraded, so a rollback restores the preceding code, not provider compatibility.
