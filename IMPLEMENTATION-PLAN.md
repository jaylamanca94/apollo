# Apollo Implementation Plan

This document translates the current product feedback into implementation-ready work. It should guide the next Apollo UI pass before new scope is added.

## Objective

Make Apollo feel more focused, less repetitive, and more useful at a glance.

The next version should present NASA's image of the day as the primary feature, organize live space data into clearer groups, reduce duplicated metadata, and prepare the product for a small number of high-value detail pages.

## Guiding Principles

- Keep Apollo simple, calm, and easy to scan.
- Do not add controls or navigation that imply unsupported workflows.
- Prefer fewer, stronger sections over many repeated cards.
- Treat APOD as the visual anchor of the experience.
- Show timestamps once in a predictable place instead of repeating them across every card.
- Keep the MVP static and framework-free unless detail pages create a clear routing need.

## Fixes

### Remove "Spacecraft unknown"

Problem:
Crew rows currently show fallback copy when a craft value is missing. The phrase "Spacecraft unknown" reads like a data problem and adds visual noise.

Implementation:
- In the crew list, only render the spacecraft/craft label when a value exists.
- If no craft is provided, show the crew member name by itself.
- Do not replace the missing value with another fallback unless there is a user-facing reason.

Acceptance Criteria:
- No user-facing text says "Spacecraft unknown."
- Crew rows remain aligned and readable when some rows have craft labels and others do not.
- Empty or malformed crew records do not break rendering.

### Remove Redundant Information

Problem:
Several sections repeat source labels, updated timestamps, and summary values already shown elsewhere. This makes the dashboard feel heavier than the amount of information warrants.

Implementation:
- Audit all dashboard labels, section subtitles, stat cards, and detail cards.
- Remove repeated source labels when the section title already makes the source clear.
- Avoid showing the same metric in both a stat card and the adjacent detail section unless the detail section adds meaningful context.
- Keep source attribution where it builds trust, but consolidate it into quieter placement.

Acceptance Criteria:
- No metric or timestamp is repeated without adding context.
- Every remaining label helps the user understand the data.
- The page feels lighter while preserving trust in the data sources.

## Enhancements

### Balance And Categorize Relevant Information

Problem:
The dashboard currently presents several data types with similar visual weight. This makes it harder to know what matters most.

Implementation:
- Group the dashboard into clear categories:
  - Featured: NASA Astronomy Picture of the Day
  - Live Orbit: ISS position and crew
  - Upcoming Missions: launch data
  - Near-Earth Objects: asteroid summary
- Use section hierarchy to communicate importance.
- Keep related data physically close together, especially ISS position and people currently in space.
- Reduce the number of equal-weight cards where possible.

Acceptance Criteria:
- A first-time visitor can understand the page structure within a few seconds.
- Related data appears together.
- APOD is visually dominant, while operational data remains easy to scan.

### Make NASA Image Of The Day The Main Feature

Problem:
APOD is one of the most visually compelling parts of Apollo, but it currently competes with smaller stat cards and other dashboard content.

Implementation:
- Move APOD to the top of the main page content.
- Give APOD a larger image treatment and more generous layout.
- Keep the APOD title, date, and explanation, but avoid overwhelming the first screen with long text.
- Consider truncating the explanation with a natural "Read more" detail path only if a detail page is introduced.

Acceptance Criteria:
- APOD is the first major content feature after the page shell.
- The image is large, responsive, and visually stable while loading.
- The rest of the dashboard feels secondary but still accessible.

### Show Updated Date/Time In A Single Location

Problem:
Updated timestamps are currently repeated across many cards. This creates clutter and makes the page feel more complex than it is.

Implementation:
- Add one global "Last updated" line near the refresh action or page title.
- Update that timestamp after the dashboard refresh completes.
- Remove per-card updated timestamps unless a specific data source has a materially different update time that users need to know.
- If individual source failures occur, show errors inside the relevant section without adding extra timestamps.

Acceptance Criteria:
- The dashboard has one primary updated timestamp.
- Refresh updates the global timestamp after loading completes.
- Per-section errors remain visible and understandable.

### Remove Header Nav If The Page Only Scrolls Down

Problem:
The header nav suggests a multi-section app or deeper navigation, but the current experience is a single scrolling dashboard.

Implementation:
- Remove the section nav links from the header.
- Keep the Apollo brand and refresh action.
- If detail pages are added later, reintroduce navigation only when it supports meaningful movement between pages.
- On mobile, the header should be compact and avoid horizontal scrolling navigation.

Acceptance Criteria:
- Header contains only essential controls for the single-page dashboard.
- No nav links jump to sections on the same page.
- The header remains clean on mobile and desktop.

## New Features

### Detail Pages For The Most Valuable Data

Opportunity:
Apollo may benefit from a small number of detail pages, but only for data that is interesting enough to reward a deeper view. Avoid adding detail pages for every card.

Recommended Detail Pages:

1. APOD Detail
   - Best candidate because it has rich media, title, date, and explanation.
   - Could support full-size image viewing, full explanation text, media credit/copyright when available, and a link to the NASA source.

2. Launch Detail
   - Strong candidate because launch data often has meaningful status, provider, mission, vehicle, window, pad, and countdown context.
   - Should use Launch Library as the normalized source if Apollo expands beyond SpaceX.

3. Near-Earth Object Detail
   - Useful if Apollo adds clearer context such as size range, miss distance, velocity, lunar-distance comparison, and hazard explanation.
   - Should avoid alarmist language.

Lower Priority:
- ISS detail is useful only if paired with a map, pass predictions, or location-aware visibility. A coordinate-only detail page is not worthwhile.
- Crew detail is lower priority unless richer astronaut/craft metadata is added.

Implementation Options:

Option A: Static Single-Page Expansion
- Keep the site as one static page.
- Use expandable sections or modal-like detail panels.
- Lowest complexity and best fit for current architecture.

Option B: Lightweight Static Pages
- Add simple static HTML pages such as `apod.html`, `launches.html`, and `asteroids.html`.
- Share CSS and JavaScript utilities.
- Good if Apollo needs browser-friendly URLs without adopting a framework.

Option C: Framework Routing Later
- Move to a framework only if Apollo needs dynamic routes, saved state, auth, user preferences, or a larger component system.
- Not recommended for the immediate pass.

Recommended Approach:
Start with Option A for APOD and launch details. Move to Option B only after the product proves the detail views are useful enough to deserve dedicated URLs.

Current Decision:
Apollo now starts with inline detail paths for APOD, launches, and asteroid context. APOD exposes credit, full media, NASA source, and full description. Launches expose mission details, vehicle, pad, location, launch window, and source. Asteroids expose lunar-distance, velocity, and hazard-context cues. Dedicated URLs remain deferred.

Reliability Update:
APOD and Near-Earth Object API responses are now normalized server-side before reaching the browser, matching the Launch Library proxy pattern. Frontend normalizers still accept older raw NASA shapes as a compatibility fallback. The remaining reliability follow-up is automated fixture coverage for the normalized API contracts.

Acceptance Criteria:
- Only 2-3 detail experiences are introduced.
- Each detail page or panel adds information that is not already useful on the main dashboard.
- Detail experiences do not make the main dashboard harder to scan.

## Suggested Work Sequence

1. Remove noisy fallback copy and redundant labels.
2. Consolidate timestamps into one global updated state.
3. Remove header section navigation.
4. Rebalance the dashboard layout around APOD as the main feature.
5. Group ISS and crew into Live Orbit.
6. Group launches into Upcoming Missions.
7. Group asteroid data into Near-Earth Objects.
8. Decide whether APOD and launch detail should be expandable panels or separate static pages.
9. Update `PRODUCT-README.md` and `DESIGN-README.md` after final UX decisions are implemented.

## Out Of Scope For This Pass

- User accounts
- Saved preferences
- Notifications
- Search
- Export
- Database-backed workflows
- A full framework migration
- Detail pages for every data card

## Open Product Questions

- Should Apollo remain SpaceX-focused, or should launches become all upcoming launches?
- Should APOD explanation text be shown fully on the dashboard, or shortened with a detail path?
- Should detail views be inline panels first, or should the product immediately introduce separate URLs?
- Is the long-term brand "Apollo" or "Apollo Space" if the domain becomes `apollospace.app`?
