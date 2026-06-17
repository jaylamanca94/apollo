# Design README

Use this file as the visual and interaction source of truth for Apollo. Keep this document updated as Apollo evolves.

This file is intentionally separate because design standards and utilities will grow over time.

## Product Feel

The interface should feel quiet, practical, and easy to scan. Apollo should follow Acadia's Apple-like product system: calm gray app background, translucent elevated surfaces, compact controls, 8px repeated surfaces, and responsive spacing. Apollo's primary differentiator is its warm red accent for brand, primary action, and live space-data context.

- Prefer Bootstrap conventions before custom UI patterns.
- Keep visual decisions simple enough for a solo product builder to maintain.
- Prefer evergreen design patterns and utilities that can scale with the product without becoming fragile or overly custom.
- Use familiar, predictable interface patterns.
- Prioritize clarity, speed, and maintainability over visual novelty.
- Avoid adding decorative complexity unless it directly improves the product experience.
- Keep the product name visible as the first-screen anchor. Avoid internal labels like "public dashboard" when a user-facing live-data signal is clearer.

## UI Foundation

Use this file as the visual source of truth for `Apollo`. Update it whenever spacing, color, typography, icon sizing, form layout, interaction feel, accessibility, or reusable utilities change.

### Acadia Adapter

Apollo now treats `../Acadia` as the shared design-system baseline. Before adding a local UI style, check Acadia's live docs, operating model, adoption playbook, foundations, templates, patterns, and CSS primitives for the needed layout, control, surface, state, icon, dashboard, overlay, or responsive behavior.

- Use Acadia primitives for shared product language: controls, card padding, raised rows, focus rings, state surfaces, motion, table/form patterns, and Font Awesome Free icon sizing.
- Keep Apollo-specific choices local when they express space-data semantics, live-source context, map behavior, media behavior, or the red product accent.
- Map Apollo variables onto Acadia-style adapter variables in `styles.css` before creating a new one-off component rule.
- Apollo markup should compose Acadia primitive classes first (`acadia-app`, `acadia-chrome`, `acadia-nav`, `acadia-shell`, `acadia-surface`, `acadia-panel`, `acadia-button`, `acadia-icon`) and keep `apollo-*` classes as product adapters for data, media, map, and layout semantics.
- Keep the adapter self-contained until Acadia is published as a shared package. Do not use a fragile local `../Acadia` stylesheet link in deployed Apollo pages.
- Repeated surfaces should use Acadia anatomy first: page header panel, chrome, card, row, state message, pill, control, and focus ring. Avoid decorative local accent bars or custom elevation when color, icon, copy, or data semantics can carry Apollo identity.
- Keep adapter-owned hover and focus motion covered by Apollo's `prefers-reduced-motion` override.
- If an Apollo pattern becomes useful for another product, graduate the neutral part into Acadia and keep Apollo's wording/data treatment here.

## Color

### Light Mode

- Page background: `#E8EAED`
- Content surface: translucent `#FCFCFD`
- Raised surface: translucent `#FFFFFF`
- Accent: `#D9233B`

### Dark Mode

- Page background: `#1F2427`
- Top navigation: translucent `#1F2427` material
- Content surface: translucent `#1F2327`
- Raised surface: translucent `#2B3035`
- Border: translucent white at Acadia strength
- Accent: `#FF4056`

Default first-time visitors to the user's operating system theme setting and provide a compact header toggle for switching between Light and Dark.
Browser theme chrome should follow Apollo's active Light or Dark theme, including manual theme toggles, so installed and mobile browser surfaces do not retain the wrong chrome color.

### Data Accents

Use one shared red accent for dashboard icons, the primary refresh action, map overlays, and progressive disclosure affordances. Avoid giving every data family a separate hue while this design direction is active.

Use green success styling for clearly positive safety/status messages. For example, the asteroid message `No listed objects are flagged as potentially hazardous today.` should read as a green success alert, not a red or warning state. Keep the NASA potentially hazardous asteroid criteria and Sentry monitoring context as subdued secondary text inside that same context block so they improve trust without turning the card into an education panel.

### Maps

Use Leaflet for spatial dashboard views. Keep map frames inside the related data card, match the existing `8px` radius, and mute map tiles in Dark Mode so the panel does not overpower nearby operational data.

## Layout Grid

Dashboard pages should lead with Apollo as the product identity, then the APOD feature, then a compact two-column operational grid:

- APOD split feature: a larger cinematic image or media panel on the left, source/date/title/credit/summary links on the right. For video APOD entries, use a safe embedded preview only when the normalized source provides a known embeddable host; otherwise keep the media panel stable with a concise fallback and a direct video link. Unknown APOD media types should not be embedded in arbitrary iframes; provide a direct media link and NASA source instead.
- ISS current position and people in space as paired operational cards. Keep ISS orbital context compact and calculated from the same live position response when possible. Show the ISS feed's source observation time as a subdued "Position fix" line near the map so users can judge freshness without adding repeated card timestamps. Source-provided ISS visibility and footprint fields may sit in the same orbital context block as compact operational facts, not as a separate education panel. Keep People in Space scannable with a compact source roster count, ISS expedition label, and spacecraft/location occupancy summary from the roster feed before the individual crew list.
- Launches as a taller list card with three visible launch rows, compact launch-window length context, and a link to the launches detail page.
- Asteroids as a summary card with closest approach time/distance, hazard and Sentry monitoring context, and nearby object rows. Keep per-object approach details behind compact inline disclosure controls so the card remains scannable.
- Space weather as a compact status card under asteroid context, with current K-index first, a compact NOAA geomagnetic scale context row, a small 3-day outlook below it, and compact labels plus scale cues for recent NOAA alert/watch/warning notices.
- Data Sources as a full-width closing card that reports whether each upstream source loaded, needs attention, or is unavailable.

Use one global refresh timestamp near the page title. Avoid repeated per-card timestamps and section jump navigation on single-page dashboard views.
Use compact primary header links once Apollo has multiple meaningful pages. Keep page links next to the brand, use pill-shaped active state with `aria-current="page"`, use a simple live-data chip for the public data state, and preserve the theme toggle as a utility control instead of mixing it into page navigation.
Use the data-source status card for operational trust, not diagnostics. Keep labels short, tie each row to an existing dashboard source, include a compact upstream source link, and show concise timing context when a source has a meaningful observation, launch, or query date. Avoid exposing implementation details that do not help a viewer understand dashboard freshness.

Use compact uppercase pills for NOAA space-weather notice types. They should aid scanning while leaving the headline and issued time as the primary content. If a notice includes a NOAA R/S/G scale or clear storm-level K-index text, show the scale as a subdued secondary cue under the headline rather than adding a long explainer.
Use a compact NOAA geomagnetic scale row when K-index data is available. It should translate the current Kp value into a G-scale severity label without adding a long educational explainer or new chart.

Use muted compact launch-window summaries near launch titles. They should help viewers distinguish target-only times from wider launch windows while leaving mission name, countdown, status, and source-window details as the primary content.

Use minute-level launch countdown labels inside the final hour so near-term launches remain informative instead of collapsing to `T-0h`.

Use inline disclosure details for richer dashboard context, then graduate to separate static pages only when a card needs materially more space. The launches detail page is the first example of this pattern.

Use compact raised row surfaces inside dense operational cards for metadata cells, crew rows, launch rows, asteroid rows, source rows, and short status/context blocks. These inner rows should be visually quieter than the parent card, keep the same `8px` radius, use thin borders, and use the shared low inset highlight plus soft row shadow so repeated data groups feel deliberately layered without looking decorative. They may use subtle hover or disclosure polish when an element already exposes interaction. Avoid making non-clickable rows look like primary buttons.

Use compact fact cells for dense detail lists inside launch and disclosure panels. Each cell should use the same `8px` radius, thin border, low inset highlight, and quiet raised surface as operational rows, while preserving the label/value hierarchy. This keeps technical details scannable without making them compete with primary mission titles, countdowns, source links, or card summaries.

Use compact raised notice rows for source and space-weather status details. Status icons may shift between success, warning, and accent tones when the row state already communicates loaded, attention, or unavailable, but keep the row surface neutral so the dashboard does not feel alarmist. Count summaries can use small pill-like raised surfaces when they introduce a dense list.

### Desktop

- 12-column grid
- Page margin: `128px`
- Content spans the available viewport inside the Acadia margin contract unless a specific data surface needs a local width cap
- Column gap: `24px`
- Content padding: `24px`
- Spacious sections: `48px` padding
- Dense cards and operational sections: `24px` padding
- Form field rows span the section and use 4 columns with `24px` gaps

### Tablet

- 8-column grid
- Page margin: `32px`
- Column gap: `16px`
- Content padding: `24px` where space allows, collapsing to `16px` for dense or narrow surfaces

### Mobile

- 4-column grid
- Page margin: `16px`
- Column gap: `16px`
- Content padding: `16px`

## Spacing Scale

Use 8px spacing increments whenever possible.

- XS: `8px`
- SM: `16px`
- MD: `24px`
- LG: `32px`
- XL: `40px`
- XXL: `48px`
- XXXL: `64px`

## Typography

Typography values are defined as font size and line height.

| Style | Font Size | Line Height |
| --- | ---: | ---: |
| Display | `76px` | `73px` |
| Page Title | `40px` | `48px` |
| Large Heading | `32px` | `40px` |
| Heading | `24px` | `32px` |
| Lead | `20px` | `24px` |
| Body | `16px` | `24px` |
| Small | `14px` | `16px` |
| Caption | `12px` | `16px` |

## Radius

- XS: `2px`
- SM: `4px`
- MD: `8px`
- LG: `16px`
- XL: `24px`

Use `8px` or less for repeated list items. Main dashboard and feature cards may use `10px` radius when they are acting as broad material surfaces.

## Icons

- Use Font Awesome Free for icons when needed.
- Header navigation and account utility icons: `16px`
- Card and list summary icons: `24px`
- Media artwork icons and thumbnails should follow the media artwork treatment, not utility icon sizing.
- Standard spacing between utility icons and text: `8px`
- Caption-sized or very small UI may use tighter spacing when needed.
- Avoid decorative section-header icons when the heading already communicates the section. Prefer icons in brand marks, compact metric chips, empty/error states, and links where they aid scanning.

Current icon mapping:

- Brand and launch placeholders: rocket
- APOD: image
- People in Space metric: astronaut
- Space Weather metric: sun

## Favicon And App Icon

- Apollo uses supplied 512px PNG app icons at `assets/apollo-app-icon-dark.png` and `assets/apollo-app-icon-light.png`.
- The Dark Mode icon uses a red rocket mark on a charcoal gradient background.
- The Light Mode icon uses a white rocket mark on a red gradient background.
- HTML should expose both icons with media-specific favicon links, while the web manifest and Apple touch icon should use the light icon as the default install/touch artwork.
- Every web or mobile product should eventually have a simple recognizable favicon/app icon.
- Use a Font Awesome Free icon as the preferred starting point when it fits the product.
- Pick an icon that represents the product mission, not a generic decoration.
- Keep the icon simple enough to work at small sizes.
- Include standard browser favicon support when the product has a web app scaffold.
- Add mobile/app touch icon support when the product is ready for mobile polish.
- Document the icon choice in `DESIGN-README.md` or `README.md`.

## Forms

- Form sections use `48px` padding on desktop.
- Form rows should span the available section width.
- Desktop form rows use 4 columns with `24px` gaps.
- Two related lookup or input fields may span 2 of 4 desktop columns.
- Add/remove buttons should span 1 desktop column when placed in a form row.
- Keep field labels close to their fields.
- Avoid crowding action buttons into data-entry space.

## Interaction Feel

- Clickable cards and list rows should have clear pointer, hover, and keyboard focus states.
- The global refresh action should read as the primary action, use the red accent fill, and show a compact spinner while data is refreshing.
- Loading, unavailable, and error states should use the shared state-message surface with a small icon so the page feels composed before live data arrives.
- User navigation should use a compact icon/name control when account actions are needed.
- Add buttons should add a new row below the current section or item type.
- Remove buttons are destructive, clearly labeled, and use red styling.
- Reorder handles should have generous tap targets and feel easy to grab.
- Interactive elements should feel obvious without adding unnecessary instructional text.
- Source links and inline details should use compact text links with clear focus states, not large secondary buttons. Use `source` in public-facing labels and reserve `feed` for implementation or API documentation. When repeated rows share visible link text such as `Launch source` or `NASA object source`, each link needs an accessible label that names the specific mission, source, or object.

## Accessibility And Responsiveness

- Support keyboard navigation for interactive controls.
- Provide a hidden skip link on every page so keyboard users can move directly to the main content.
- Preserve visible focus states.
- Use semantic HTML whenever practical.
- Dynamic dashboard panels should expose loading and refresh changes with `aria-live` and `aria-busy`; refresh controls should point to a concise live status message and list the regions they refresh with `aria-controls`.
- Interactive embedded maps should be exposed as named regions, not static images, so map controls remain reachable to assistive technology.
- Nonessential hover, focus, and disclosure motion should respect `prefers-reduced-motion`.
- Keep text readable in both light and dark mode.
- Ensure layouts work across desktop, tablet, and mobile.
- Avoid text overflow, cramped controls, and overlapping UI.

## Utility Guidance

Add reusable utilities here when a pattern is reusable across this product.

Good utility candidates:

- Layout wrappers
- Spacing helpers
- Responsive grid helpers
- Form row patterns
- Empty, loading, success, and error state patterns
- Reusable icon treatments
- Focus and hover state patterns
- Light and dark mode helpers

Avoid utilities for:

- One-off product-specific components
- Temporary workarounds
- Visual treatments that only make sense for one product
- Custom patterns that Bootstrap already handles well

## Maintenance Rule

This file is the living design standards README for Apollo.

When a UX detail, UI pattern, visual utility, component behavior, accessibility expectation, responsive rule, or product-specific design convention changes, update this file in the same work.

Keep making this file more relevant to the product as design choices, utilities, UI conventions, and quality expectations become clearer.

Do not update it just for the sake of changing it. Update it when there is meaningful new design context, a confirmed convention, a recurring UI pattern, or a clearer way to preserve product design intent.

This file should remain the source of truth for baseline UX/UI decisions and reusable design utilities.
