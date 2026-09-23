# Apollo Acadia adoption audit

Reviewed 2026-09-23 for Apollo 1.1.0. Scope: every public route, generated renderer, stylesheet, component, pattern and UI utility. Baseline: `c4c4e43`, seven routes/eight canonical goals, 4,540 lines of local CSS and no shared stylesheet dependency.

## Source and ownership

Apollo consumes Acadia **0.4.10**, source commit **4801afc0d1106fb1497946c8ca7db23114cee03b**, through the static workflow in Acadia's `utilities/implementation/README.md`. `vendor/acadia/source.json` pins all 24 shared files and SHA-256 hashes. CSS, fonts, assets and supplied licence notices are unchanged. The integrity test rejects missing, modified or additional vendor assets and checks relative CSS asset references. `scripts/sync-acadia.js` requires clean, correctly identified Acadia source, prepares a complete snapshot before replacing the previous one, and removes stale assets on update.

Shared ownership:

- Foundations: semantic neutrals/status colours, Geist typography, Syncopate wordmark role, spacing, radii, elevations, glass, focus, targets, reduced-motion and appearance adaptations.
- Components: Buttons, icon actions/theme toggle, Badges, Cards/Panels, linked cards, fields, compact native Choices, native Accordion disclosures, Thumbnails, Activity Indicator, alerts and skeletons.
- Patterns/utilities: Shell, Page header, Section header, copy stacks/clusters, responsive desktop/tablet/phone navigation, skip links, visually hidden labels, dock clearance and text hierarchy. `class-map.json` maps product roles to their shared primitives. Integrity/coverage checks ensure every named Acadia class exists in the pinned source.

Local ownership is deliberately limited to Apollo's red identity, provider interpretation, data grouping/grid geometry, map/media proportions, route destinations and navigation dismissal. Leaflet/OpenStreetMap remains the existing specialised map integration; it is not claimed as an Acadia Map adoption. Its attribution backdrop and dark tile filter are explicit third-party legibility adaptations. No new source, credential, account, persistence or paid service was introduced.

Composition exceptions are explicit: header slots wrap by content width; desktop/tablet navigation permits wrapping and visible disclosure overflow; phone Watch nests a native disclosure around a shared mobile tab; narrow nested data panels opt into shared 8px spacing roles. No shared stylesheet was patched. Bootstrap CSS/JavaScript, Bootstrap theme attributes and local copies of shared focus/motion/font primitives were removed. Local CSS fell to approximately 2,200 lines, primarily domain geometry and semantic token use.

## Acceptance results

| Area | Evidence | Result |
| --- | --- | --- |
| Source integrity | Manifest hashes and relative assets; all seven pages load vendor CSS before the adapter | Passed |
| Foundations/components | All referenced shared classes resolve; no undefined adapter tokens; Geist and 700-weight Syncopate load; theme state/chrome tests | Passed |
| Navigation | One visible presentation per viewport; current Watch destination; Enter focuses first link; Escape restores trigger at phone, tablet and desktop; unclipped menus | Passed in browser |
| All routes | Dashboard, ISS/Crew, Launches, Weather, Asteroids, Gallery and Anomalies | Passed controlled fixtures |
| Responsive | 154 combinations: seven routes × two themes × eight normal-text widths plus three doubled-text widths | Passed; `geometry-results.json` |
| Source states | 21 route/state observations covering empty collections, partial NASA failure and all-source failure; labelled delayed loading | Passed; `state-results.json` |
| Recovery/details | ISS and launch keyboard retry complete repeated failure with focus retained; native mission/APOD disclosure exposes details/source; APOD video frame/fallback reflows; sighting choices/submit focus results | Passed controlled fixtures |
| Checks | `npm run check`: 124 tests; JavaScript syntax checks; `git diff --check` | Passed |
| Delivery | Main commit, remote, CI and deployment | See release receipt below |

Normal-text widths: 1728, 1512, 1280, 1032, 834, 744, 393 and 320px. Doubled root text: 1280, 834 and 320px. Measurements include visible nested scroll widths, not only document width. Map tile panes and native input editing are excluded from generic nested-overflow assertions. Native date/time fields retain internal segment scrolling at the smallest enlarged setting; their values are preserved and keyboard editable. This is not a claim that every date segment remains simultaneously visible.

Product-owned contrast, calculated against the relevant opaque colours: white/action 5.59:1, white/hover 6.51:1, light action ink/page 5.82:1, dark action ink/page 8.73:1. Other colour roles and preference rules remain upstream-owned; physical contrast and OS-preference acceptance are not inferred from source reuse.

## Reproduction and evidence limits

Run `npm run preview:fixtures -- 4183`, then open any of the seven page paths. `?fixture=loaded|empty|partial|failure|loading` selects a state; `&text=200` doubles root text. `&media=video|fallback` exercises APOD frame, media recovery and long-description disclosure. The video frame uses a local SVG, so this checks layout rather than external playback. A visible banner identifies synthetic data. Empty mode applies to meaningful collection branches; APOD and ISS retain loaded fixtures. This is not a NASA key or live-feed substitute.

Representative reviewed captures: `dashboard-desktop-light.png`, all seven `*-phone-dark.png` images, `launches-disclosure-phone-dark.png` and `iss-recovery-phone-dark.png`. `01-dashboard-before.png` is the pre-migration baseline. A malformed full-page browser capture was discarded and replaced by a normal viewport capture.

Physical touch/safe-area/orientation, VoiceOver, forced colours and OS preference testing remain open. Provider correctness, successful live recovery and authenticated production runtime are separate from fixture acceptance. Existing domain wording is preserved; NeoWs response integrity and hazard interpretations are the next useful product review, not a claim of scientific acceptance here.

## Release receipt

Apollo 1.1.0 is a minor release for the complete shared-component adoption and navigation improvement. Provider API contracts remain unchanged. Recovery is to revert the focused migration commit through normal Git delivery; no database migration or service change is involved.

Local validation passed. A reproduced launch-retry focus loss was fixed and covered for repeated failure, success, background loads and user-moved focus. Remote and deployment receipt will be verified against the exact pushed revision and reported with the delivery result.
