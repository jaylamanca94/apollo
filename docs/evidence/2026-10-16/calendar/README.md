# Apollo 1.4.0 — Keep a launch target

Reviewed 16 October 2026. Extends the two-minute briefing into a practical return cue: Launches → calendar file → matching mission/source. This is an implemented experiment, not evidence of reader demand or retention.

## Behaviour and decisions

- Save to calendar downloads one tentative, non-blocking `.ics` event. UTC target, consistent source window end, source/check time and Apollo mission return link stay attached. No alarm, account, calendar permission, persistence, additional provider request or new product dependency.
- Only a future Second/Minute target with an identity/source, Go for Launch or To Be Confirmed status and an original proxy check within 30 minutes can export. Recheck at activation. Explain disabled saves for missing/imprecise/stale/past/held/unknown data. Failed refresh removes exportable data.
- Say explicitly that saved entries will not update. File preparation does not claim calendar import. Re-imports may duplicate depending on client. The source date remains visible for day/month precision; no precise countdown is invented.
- Return links open the matching mission disclosure after data loads and focus its heading. A missing mission is explained; a failed source cannot establish absence.
- Compose unchanged Acadia actions/help/status. Before/after review removed a redundant outer launch card and placed row actions outside nested disclosures. At 320px/200% text, the calendar label now fits whole words. No shared CSS was changed.

The file follows [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), including CRLF, escaped text and UTF-8-aware 75-octet line folding. The stable UID identifies the source launch; it does not promise synchronised client updates.

## Verification

| Gate | Evidence |
| --- | --- |
| Project checks | `npm run check`: 161 pass, including eight calendar cases |
| File correctness | UTC across DST, status/precision/freshness gates, missing/reversed/unrelated windows, stable identity after postponement, unsafe URLs/identities, control and component injection, multibyte folding |
| Independent parsing | Both fixture and actual-handler downloads parsed as one tentative event with a timezone-aware target using a disposable Python `icalendar` parser; no product dependency added |
| Browser | `results.json`: 22 observations; eight light/dark × 1440/834/390/320 layouts, keyboard download/focus, preparation error, return identity/absence, five ineligible states, failure/empty/retry, 200% text, dwell staleness, failed refresh and actual-handler download |
| Reading width | No page or checked nested-action overflow; visible controls at least 44px high; 320px/200% calendar labels can retain whole words |
| Live local handler | At approximately 19:18 UTC, the source listed Bandwagon 5 with a 19 October 10:30 UTC target, Minute precision and Go for Launch status. Download retains its actual one-hour window and 19:11 UTC schedule check. This is schedule evidence, never a guarantee of lift-off |
| Hosted baseline | Production alias returned HTTP 200 health, version 1.3.1, runtime ok and configured NASA key; the prior hosting-access gap is not current for this alias |

Selected captures: [before phone](before-390.png), [after phone](after-light-390.png), [dark phone](after-dark-390.png), [before desktop](before-1440.png), [after desktop](after-light-1440.png), [enlarged text](text200-320.png), [imprecise target](imprecise-390.png), [actual local handler](live-390.png). Samples: `fixture-launch.ics` (synthetic), `live-launch.ics` (dated public source snapshot with a local return URL).

## Reproduce and acceptance limits

Run `npm run preview:fixtures -- 4183`, then open `launches.html`. Use `?calendar=imprecise|held|unknown|past|stale|empty`, `?fixture=failure`, or `?text=200`. Tab to Save to calendar and press Enter; inspect/import the file in a test calendar of your choosing. A return URL ending `#launch-fixture-launch` opens its mission; `#launch-removed` explains absence. Fixtures remain explicitly synthetic.

`npm run preview -- --port 4184` runs the actual local handlers; provider status and quotas apply. The samples and browser runs establish formatting/download/return behaviour. They do not establish native-calendar import, Safari/physical touch/VoiceOver acceptance, reader comprehension or actual return. The existing `docs/briefing-trial.md` now includes an optional calendar task, still unrun. No participants contacted and no calendar written.

## Delivery

Normal Git-linked delivery is being completed after project and browser checks. The previous production revision is `18038653d77a51bea185ad680f6ee47d778630d2`; recovery is an ordinary revert through the existing workflow. No manual deployment, access-control change or secret operation is needed. Exact implementation/hosted receipt is appended after verification.
