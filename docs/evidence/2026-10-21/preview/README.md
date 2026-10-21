# Local-preview public-file boundary — 21 October 2026

Apollo remains 1.4.2. This closes the existing development-tool security candidate, preserving the two-minute briefing and all nine canonical goals. There is no user-facing design change, new service, dependency or recurring provider cost.

Baseline `b45e901` returned internal `scripts/local-preview.js` with HTTP 200 via the actual request handler. Actual loopback HTTP comparisons using a temporary synthetic checkout then reproduced direct `.env.local` and symlinked image access with 200 responses. No real environment file, credential or private user data was requested, read or saved as evidence. Four focused regressions failed before implementation.

The preview now serves an explicit set of public pages/browser scripts/styles/manifest, images under the two public asset directories and Acadia fonts. Other checkout files return 404/no-store. Reject symlinked files and directory components, decode URL paths once, reject malformed request targets with 400, and route the existing API handlers separately. Font/image MIME types are explicit. Loopback remains the default. The fixture server delegates static assets to the same boundary. This assumes a trusted checkout and public asset contents; it is not an authenticated server or an isolation mechanism against concurrent hostile filesystem mutation.

- `npm run check`: 177 checks pass. Five added checks cover all seven pages and their referenced local resources, synthetic private files, encoded/malformed paths, traversal, symlinked files/directories, GET/HEAD/static method handling and separate API/query forwarding.
- `observations.json`: real loopback HTTP before/after private-file and symlink status 200 → 404; seven denied real-checkout non-secret paths; malformed-target 400; static POST 405; empty HEAD body; synthetic API query forwarding. The actual local health handler reports 1.4.2/degraded because its NASA configuration is absent; no key was sought or changed.
- `loaded-390.png` / `loaded-1280.png`: viewed controlled Chromium smoke captures. Existing briefing hierarchy renders with loaded fonts and synthetic source coverage; Enter on the primary action reaches Launches. No browser errors or failed local resources. This verifies the development asset boundary and navigation, not live upstream data, physical accessibility, native-calendar import, reader comprehension or retention.

## Delivery

Implementation `3ec24fee9eb969560e2312b787e888bbed16c6ca` is on remote `main`. [Exact-revision CI](https://github.com/jaylamanca94/apollo/actions/runs/39658525972) passed. Git-linked Production deployment 7234807493 succeeded at 19:05:30 UTC ([deployment](https://apollo-c9xvvn6bd-jayson-lamanca-s-projects.vercel.app)). At 19:06 UTC the [public alias](https://apollo-eight-mu.vercel.app/) returned healthy 1.4.2; seven HTML routes, app.js, styles.css and the delivered preview script matched committed bytes. `production.json` records the hashes. This verifies revision delivery; Vercel does not execute the development preview server, whose restriction is verified locally above.

This documentation-only receipt follows the verified implementation. Recovery: revert the focused implementation through the same checked workflow to baseline `b45e901`; that would also restore the old preview exposure. No schema or persistent-data migration.

The existing Vercel connector project lookup still returns 404 for the verified local project/team link. No settings, protection, credentials or external service changed. Public production delivery is verified separately through GitHub's deployment receipt and the existing public alias.
