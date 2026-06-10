# Design README

Use this file as the visual and interaction source of truth for Apollo. Keep this document updated as Apollo evolves.

This file is intentionally separate because design standards and utilities will grow over time.

## Product Feel

The interface should feel quiet, personal, practical, and easy to scan. The current visual direction is a dark operational dashboard: broad content width, charcoal surfaces, thin borders, compact controls, and a single warm red accent.

- Prefer Bootstrap conventions before custom UI patterns.
- Keep visual decisions simple enough for a solo product builder to maintain.
- Prefer evergreen design patterns and utilities that can scale with the product without becoming fragile or overly custom.
- Use familiar, predictable interface patterns.
- Prioritize clarity, speed, and maintainability over visual novelty.
- Avoid adding decorative complexity unless it directly improves the product experience.

## UI Foundation

Use this file as the visual source of truth for `Apollo`. Update it whenever spacing, color, typography, icon sizing, form layout, interaction feel, accessibility, or reusable utilities change.

## Color

### Light Mode

- Page background: `#F3F5F7`
- Content surface: `#FFFFFF`
- Raised surface: `#EEF1F4`
- Accent: `#E83149`

### Dark Mode

- Page background: `#292E31`
- Top navigation and content surface: `#1F2427`
- Raised surface: `#292E31`
- Border: `#434C52`
- Accent: `#FF4056`

Default first-time visitors to Dark Mode and provide a compact header toggle for switching between Light and Dark.

### Data Accents

Use one shared red accent for dashboard icons, outline actions, map overlays, and progressive disclosure affordances. Avoid giving every data family a separate hue while this design direction is active.

Use green success styling for clearly positive safety/status messages. For example, the asteroid message `No listed objects are flagged as potentially hazardous today.` should read as a green success alert, not a red or warning state.

### Maps

Use Leaflet for spatial dashboard views. Keep map frames inside the related data card, match the existing `8px` radius, and mute map tiles in Dark Mode so the panel does not overpower nearby operational data.

## Layout Grid

Dashboard pages should lead with the APOD feature, then use a compact two-column operational grid:

- APOD split feature: image or media on the left, source/date/title/credit/summary links on the right.
- ISS current position and people in space as paired operational cards.
- Launches as a taller list card with three visible launch rows and a link to the launches detail page.
- Asteroids as a summary card with risk context and nearby object rows.
- Space weather as a compact status card under asteroid context, with current K-index first and a small 3-day outlook below it.

Use one global refresh timestamp near the page title. Avoid repeated per-card timestamps and section jump navigation on single-page dashboard views.

Use inline disclosure details for richer dashboard context, then graduate to separate static pages only when a card needs materially more space. The launches detail page is the first example of this pattern.

### Desktop

- 12-column grid
- Page margin: `24px`
- Max content width: about `1232px`
- Column gap: `24px`
- Content padding: `24px`
- Form sections: `48px` padding
- Form field rows span the section and use 4 columns with `24px` gaps

### Tablet

- 8-column grid
- Page margin: `16px`
- Column gap: `16px`
- Content padding: `16px`

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
| Display | `48px` | `56px` |
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

Use `8px` or less for normal cards and repeated list items unless a larger container treatment is explicitly requested.

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
- User navigation should use a compact icon/name control when account actions are needed.
- Add buttons should add a new row below the current section or item type.
- Remove buttons are destructive, clearly labeled, and use red styling.
- Reorder handles should have generous tap targets and feel easy to grab.
- Interactive elements should feel obvious without adding unnecessary instructional text.
- Source links and inline details should use compact text links with clear focus states, not large secondary buttons.

## Accessibility And Responsiveness

- Support keyboard navigation for interactive controls.
- Preserve visible focus states.
- Use semantic HTML whenever practical.
- Dynamic dashboard panels should expose loading and refresh changes with `aria-live` and `aria-busy`; refresh controls should point to a concise live status message.
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
