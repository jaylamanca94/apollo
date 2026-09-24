# Briefing 1.2.0 evidence

Outcome: Dashboard → one dated next action → relevant detail → original source. The brief now precedes metrics, separates source coverage from activity, and removes unsupported global calm/active/normal-orbit claims. Acadia 0.4.10 remains pinned and unchanged; existing panel, typography, button, focus and state primitives suffice, with no new CSS or runtime dependency.

## Controlled browser evidence

The labelled fixture preview exercises UI behaviour, not live scientific accuracy. Before and after use the same loaded storm/launch/flagged-asteroid scenario, light appearance and viewport; fixture observation/launch clock times advance between captures, with source values and hierarchy otherwise equivalent.

- `before-390.png` (full page) / `after-390.png` (first screen): the original brief is below five stacked metrics with no action; the revised brief/action precede those metrics. `before-1440.png` / `after-1440.png`: equivalent desktop comparison.
- `launch-390.png`: quiet weather selects the future launch, with a target date/time/time zone, source, schedule-change caveat and detail action. Followed into the synthetic Launches page; original-source action present.
- `partial-390.png`: 4/6 loaded, NASA APOD and NeoWs explicitly unavailable; the available weather action remains usable.
- `unavailable-390.png`: all sources unavailable, no quiet/safety inference; Enter on the recovery link navigates and focuses `sourceStatusTitle`.
- `gallery-768-dark.png`: no upcoming launches, APOD publication date and source, Gallery action, empty launch coverage labelled Limited. Keyboard Enter reaches loaded Gallery.
- `partial-320-200.png`: 320 × 900, 200% root text, dark appearance. No document or nested briefing horizontal overflow; action fits and can be scrolled/focused clear of the fixed dock. Visual inspection caught mid-word action wrapping from an unnecessary arrow; removing it restored whole-word wrapping without a custom primitive.
- Delayed NOAA response: focused launch action → weather headline when the destination changes → Tab/Enter opens Weather. A second final render initially removed headline focus; fixed and rechecked with the actual `aria-busy=false` completion boundary. Same-destination updates retain action focus; unrelated focus is not stolen. `networkidle` alone returned before source completion and is not used as completion evidence.

## Actual-handler live evidence

At approximately 19:13 UTC, the local function preview loaded 5/6 sources; NeoWs was unavailable because no local NASA key was configured. The brief selected Falcon 9 Block 5 / USSF-385, with The Space Devs target 26 September 2026, 07:56 EDT and “Go for Launch”. Enter reached the matching Launches detail, three-hour window and original launch-source link. `live-390.png` records the partial brief and Last checked time. This is a point-in-time provider response and local runtime check, not a promise the schedule will hold or proof of Vercel execution. No credentials were sought or changed.

## Checks and limits

`npm run check`: 145 tests pass, including old/future/missing/invalid weather dates, chronological future/non-completed launch selection, APOD publication date, all-source failure despite retained data, empty approach scope, pending/limited/APOD coverage, escaped provider text and incremental-render focus. `git diff --check` passes. No provider contract, cache, dependency or shared stylesheet changed.

Hosted runtime acceptance still needs authorised authenticated access if deployment protection remains enabled. Physical-device and screen-reader acceptance are unverified. The five-person comprehension/return trial is prepared in `docs/briefing-trial.md` and unrun. UI tests and live provider data are not user validation.

Publication uses the existing Git integration after verified main push, with exact CI/deployment receipts recorded in automation continuation memory. Recovery is a normal revert of the 1.2.0 change; the APOD 1.1.2 migration remains intact.
