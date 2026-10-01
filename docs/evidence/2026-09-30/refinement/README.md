# Apollo 1.3.0 UX refinement

Reviewed 30 September 2026. Scope: all seven public routes, the supplied Dashboard reference and the founder-selected **brief + snapshot + activity** composition. Existing eight canonical goals, source contracts and recovery paths are retained.

## Result

- Adopt unchanged Acadia 0.9.2 static source `a3509fb6e8ae4498aa3a0c71651575253583373f`. Integrity manifest verifies all 24 supplied CSS/font/asset files. Shared palette, title hierarchy, Metric, linked card, Button and divided Accordion replace the earlier composition; no new component skin or dependency.
- Use one unframed title/freshness/secondary-refresh header across the product. Dark browser chrome follows Acadia's `#0B0B0B` canvas; light remains `#F5F5F5`.
- Dashboard: one primary brief action, five direct topic links, up to three activity cards, no repeated Watch Items panel. Source coverage stays visible while diagnostics are disclosed. Recovery links and source-status hashes open the disclosure. Refresh preserves its open/closed choice; progressive source responses preserve source/activity link focus.
- Gallery: original item title/date/credit, shorter explanation preview, disclosed full description and original media/source actions. Remove inferred category/type and repeated explanation. Safe video/fallback handling remains intact.
- ISS: one reported position/metric/map summary with source time; disclosed orbital estimates and coordinates. Remove repeated metrics and unsupported normal-operations claims. The map remains a position tool, with no visible-pass prediction.

## Validation

| Gate | Evidence | Result |
| --- | --- | --- |
| Source and project checks | `npm run check`: syntax, API contracts, accessibility structure, source integrity, theme and recovery tests | 143 passed |
| Responsive layout | `geometry-results.json`: 108 observations | Passed |
| Navigation and keyboard | `interaction-results.json`: 28 assertions | Passed |
| Visual review | Before/after Dashboard at matching 1280px; desktop, phone, light/dark Gallery/ISS and source/detail captures | Reviewed locally |
| Git delivery | Validated changes on `main`; final SHA and remote verification are recorded in the chat handoff | Required separately from hosted acceptance |

The initial 84-observation sweep covers seven routes × light/dark × 1440/834/390/320px, then all seven at 320px for 200% root text and empty/partial/failure fixtures. The final 24 observations cover all routes at 320px during delayed loading and at 834px with the final Watch spacing; Gallery at 1440/390px in both themes; and expanded Dashboard/ISS detail at 1440/834/320px.

Page and visible nested-content widths stay within their available layout. Each base loaded route has meaningful content, its correct single navigation presentation, no page errors and no broken content images. Deliberately wider Leaflet tile/panning content is excluded from generic nested-overflow assertions: its container is independently verified as `overflow: hidden`, with visible attribution and usable controls. Native input editing and visually hidden labels are also excluded; this does not establish simultaneous visibility of every native date/time segment.

Interaction assertions cover source-disclosure Enter opening; open and closed state preservation through Refresh; all-source recovery opening and heading focus; direct source hash; all five snapshot destinations, including Crew section; Watch Enter/first-link focus/Escape/viewport containment at 1440/834/390px; enlarged-text orbital and full-NASA-description disclosures; alternate-media safe fallback; recommendation/source/activity focus through delayed responses; and cross-route appearance persistence. Snapshot clicks explicitly scroll below-fold targets clear of the fixed dock. Browser focus independently moved the launch snapshot above the dock without product changes.

## Reproduce

Run `npm run preview:fixtures -- 4183`. Open any public route at the widths above. `?fixture=loaded|empty|partial|failure|loading` selects the labelled synthetic state; `&text=200` doubles root text. `?brief=launch|progressive` selects briefing/focus scenarios. Gallery `?media=fallback&text=200` provides a long explanation and source-media fallback. Open source availability and orbital details with Enter, refresh, and follow the snapshot destinations. All captures visibly identify synthetic data.

## Limits and next acceptance

These are controlled local browser results, not live NASA/NOAA correctness or deployed-production evidence. Existing hosting protection, physical touch/safe-area/orientation, VoiceOver, OS accessibility preference acceptance and the real-reader comprehension/return trial remain separate. No participant contact, new feed, account, persistence, paid service or manual production publication was performed. The refinement is a reversible implementation of the founder's design request, not proof of S-tier quality or demand.

## Delivery hold — 30 September

Validated application commit: `01e0c9f94796353a9c3498eb5658d5256650f443` on local `main`, with a clean working tree after commit. The automatic approval reviewer rejected `git push origin main`: it classified the push as external code/data egress and mutation of a shared default branch, and said trusted user content had not explicitly authorised the destination. No push succeeded and no alternate route was attempted.

Original pending decision (resolved below): founder approval to push the validated UX commit and this receipt to `https://github.com/jaylamanca94/apollo.git`, branch `main`. Recommendation: approve that normal delivery step. Responsible: founder supplies destination-specific approval; Apollo agent then retries the normal push, verifies remote main and CI, and closes the goal. Resume trigger: an explicit user message approving that push. Implementation, local checks and local review evidence are complete; hosted/device/reader acceptance remains separate.

## Delivery resolved — 30 September

The founder explicitly approved the destination-specific push. Normal Git delivery then succeeded to `https://github.com/jaylamanca94/apollo.git`, branch `main`; remote main matched `d13aaf8317b20813f55585fb43b04265e8452796` and the checkout was clean. [GitHub CI run 36799163528](https://github.com/jaylamanca94/apollo/actions/runs/36799163528) completed successfully for that exact revision. This receipt-only update records resolution; its final delivered revision is recorded in the chat handoff. The local UX refinement and normal Git delivery are complete. Hosted, physical-device accessibility and real-reader acceptance remain separate.
