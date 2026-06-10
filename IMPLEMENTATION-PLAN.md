# Apollo Implementation Plan

This document translates the current product feedback into implementation-ready work. It should guide the next Apollo UI pass before new scope is added.

## Current Implementation Status

The June 10 dashboard pass implements the first wave of this plan: user-facing launch source language has been simplified, People in Space uses a responsive two-column grid, decorative section-header icons have been removed, the zero-hazard asteroid message uses green success styling, NOAA SWPC space weather has been added as the first additional data source, and `launches.html` now provides a dedicated launch detail view.

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

### Remove Internal Source Language

Problem:
Technical source names such as "Launch Library 2" are useful to developers but feel noisy and implementation-specific in the UI.

Implementation:
- Replace user-facing language like "Launch Library 2" with plain product language such as "Launch schedule," "Launch data," or "Upcoming launches."
- Keep technical source names in code comments, README/API documentation, or a quiet source note only when needed for transparency.
- If attribution is shown, use readable source language such as "Source: The Space Devs launch data" instead of versioned API naming.

Acceptance Criteria:
- No visible UI copy says "Launch Library 2."
- Users can understand the data category without needing to know API vendor names.
- Developer documentation can still identify the underlying API/version.

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

### Two-Column People In Space Grid

Problem:
The people-in-space list can become tall and visually heavier than its importance on the dashboard.

Implementation:
- Render crew members in a two-column grid on desktop and tablet.
- Collapse to one column on mobile.
- Keep each person row compact: name first, craft label only when available.
- Avoid oversized icons or repeated person icons for every row.

Naming Guidance:
- Prefer "People in Space" or "Crew in Space" over "Astronauts" for the main UI.
- Reason: "Astronauts" is familiar, but "people in space" is more accurate across astronauts, cosmonauts, taikonauts, and commercial/private crew.
- If the product wants a warmer label, use "Crew in Space" as the best compromise.

Acceptance Criteria:
- Crew list uses two columns where space allows.
- Mobile remains one column and readable.
- The label does not incorrectly narrow the group to only astronauts.

### Remove Redundant Section Icons

Problem:
Icons are useful in summary cards, but repeated section icons can make the page feel busy when the section titles already communicate the content.

Implementation:
- Keep icons only where they help scanning, such as compact stat chips or empty/error states.
- Remove decorative icons from section headers if they repeat the same idea as the title.
- Do not use an icon for every repeated list item unless it provides distinct meaning.

Acceptance Criteria:
- Section headers feel quieter.
- Icons are used intentionally and sparingly.
- No section relies on icons alone to communicate meaning.

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

### Use Positive Alert Styling For Safe Asteroid Status

Problem:
"No listed objects are flagged as potentially hazardous today" is good news, so warning or danger styling creates the wrong emotional signal.

Implementation:
- When the hazardous asteroid count is zero, show the message as a green/success alert.
- Suggested copy: "No listed objects are flagged as potentially hazardous today."
- Use warning/danger styling only when the data indicates a condition that needs attention or when the data failed to load.
- Keep the tone factual and calm.

Acceptance Criteria:
- Zero hazardous objects renders with success/green styling.
- Error states still use warning styling.
- The color language matches the meaning of the message.

## New Features

### Additional APIs For Dashboard Data

Opportunity:
Apollo can become more useful by adding a small number of adjacent space, weather, and technology signals. These should be selected for dashboard value, reliability, and low maintenance cost.

Recommended API Candidates:

1. NOAA Space Weather Prediction Center
   - Use for current space weather conditions, aurora, geomagnetic activity, solar wind, and alerts.
   - Good dashboard fit because it explains whether space weather is calm, elevated, or worth noticing.
   - Primary source reference: `https://www.swpc.noaa.gov/products-and-data`

2. Open-Meteo Forecast API
   - Use for local viewing conditions if Apollo adds a user-selected location.
   - Relevant variables include cloud cover, visibility, precipitation, and weather code.
   - Good fit for "Can I see the sky tonight?" style features.
   - Primary source reference: `https://open-meteo.com/en/docs`

3. NASA CCMC DONKI
   - Use for recent solar flares, coronal mass ejections, geomagnetic storms, and related space weather events.
   - Better suited for a detail panel than a small summary tile because the data is technical.
   - Keep language careful and non-alarmist.
   - Primary source reference: `https://ccmc.gsfc.nasa.gov/tools/DONKI/`

4. CelesTrak GP Data
   - Use for satellite/orbital context if Apollo later adds an ISS map, orbital path, or satellite-detail view.
   - Supports JSON output for general perturbation data.
   - Better as infrastructure for a map/detail feature than a standalone dashboard card.
   - Primary source reference: `https://celestrak.org/NORAD/documentation/gp-data-formats.php`

Implementation Guidance:
- Do not add all APIs at once.
- Prioritize NOAA SWPC first because it expands Apollo beyond static facts into current conditions.
- Add Open-Meteo only when Apollo has a location input or saved location.
- Proxy new APIs through serverless routes when caching, rate limits, response normalization, or CORS reliability matter.
- Normalize every external response before rendering it in the UI.

Acceptance Criteria:
- Any added API has a clear dashboard purpose.
- New data is grouped into the existing information architecture instead of creating unrelated cards.
- Each API has a loading, empty, error, and stale-data state.

### Launches Detail Page

Opportunity:
Launches are one of the strongest candidates for a dedicated detail page because users may want more than the dashboard can comfortably show.

Recommended Route:
- Add a lightweight static page at `launches.html`.
- If deployed on Vercel, it can be surfaced as `/launches` later with routing or rewrites if desired.

Dashboard Behavior:
- Keep the main dashboard launch section compact.
- Show only the next 3-5 launches with date, mission name, provider, and status.
- Add a clear "View all launches" action that opens the launches detail page.

Detail Page Content:
- Full upcoming launch list.
- Mission name.
- Launch provider.
- Vehicle/rocket if available.
- Launch date/time and countdown when available.
- Launch status/window status.
- Pad/location when available.
- Mission description.
- Watch link or official link only when available and validated as a safe URL.

Filtering And Sorting:
- Start simple with chronological sorting.
- Consider filters later for provider, launch status, crewed/uncrewed, and date range.
- Do not add filters until there is enough launch volume to justify them.

Data Guidance:
- Prefer normalized launch data from the chosen launch source.
- If Apollo expands beyond SpaceX, avoid SpaceX-specific naming in UI and data models.
- Use plain labels such as "Provider," "Vehicle," "Launch window," and "Status."

Acceptance Criteria:
- Dashboard remains compact after adding the detail page.
- The launches page adds meaningful detail, not just a longer copy of the dashboard card.
- The page works without a framework migration.
- Empty and error states are specific to launch data.

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

Design Direction Update:
Apollo is moving toward a darker operational dashboard reference: split APOD media and copy, compact two-column data cards, red accent actions and icons, and a three-item launch preview with a show-all control.

Reliability Update:
APOD and Near-Earth Object API responses are now normalized server-side before reaching the browser, matching the Launch Library proxy pattern. Frontend normalizers still accept older raw NASA shapes as a compatibility fallback. Fixture tests now cover the normalized APOD, launch, and Near-Earth Object contracts. Apollo also exposes `/api/health` so uptime checks can confirm the server runtime and NASA key configuration without exposing secrets. GitHub Actions now runs the same project checks on pushes to `main` and pull requests.

Acceptance Criteria:
- Only 2-3 detail experiences are introduced.
- Each detail page or panel adds information that is not already useful on the main dashboard.
- Detail experiences do not make the main dashboard harder to scan.

## Suggested Work Sequence

1. Remove noisy fallback copy and redundant labels.
2. Consolidate timestamps into one global updated state.
3. Remove header section navigation.
4. Remove internal API/version language from user-facing copy.
5. Reduce redundant section icon usage.
6. Convert the crew list to a responsive two-column layout.
7. Rebalance the dashboard layout around APOD as the main feature.
8. Group ISS and crew into Live Orbit.
9. Group launches into Upcoming Missions.
10. Group asteroid data into Near-Earth Objects.
11. Add success styling for safe asteroid status.
12. Add the launches detail page.
13. Decide which additional API, if any, should be added first.
14. Update `PRODUCT-README.md` and `DESIGN-README.md` after final UX decisions are implemented.

## Out Of Scope For This Pass

- User accounts
- Saved preferences
- Notifications
- Search
- Export
- Database-backed workflows
- A full framework migration
- Detail pages for every data card
- Adding multiple new external APIs in one pass

## Open Product Questions

- Should Apollo remain SpaceX-focused, or should launches become all upcoming launches?
- Should APOD explanation text be shown fully on the dashboard, or shortened with a detail path?
- Should detail views be inline panels first, or should the product immediately introduce separate URLs?
- Is the long-term brand "Apollo" or "Apollo Space" if the domain becomes `apollospace.app`?
- Should the crew section use "People in Space" for precision or "Crew in Space" for tone?
- Should the first new API be space-weather-focused, or should Apollo add local sky-viewing weather first?
