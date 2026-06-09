# Design README

Use this file as the visual and interaction source of truth for Apollo. Keep this document updated as Apollo evolves.

This file is intentionally separate because design standards and utilities will grow over time.

## Product Feel

The interface should feel quiet, personal, practical, and easy to scan.

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

- Page background: `#E2E3E5`
- Content surface: `#FCFCFD`

### Dark Mode

- Page background: `#2B2F32`
- Content surface: `#212529`

Default to the user's system OS theme setting.

## Layout Grid

### Desktop

- 12-column grid
- Page margin: `24px`
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
- Card and list summary icons: `20px`
- Media artwork icons and thumbnails should follow the media artwork treatment, not utility icon sizing.
- Standard spacing between utility icons and text: `8px`
- Caption-sized or very small UI may use tighter spacing when needed.

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

## Accessibility And Responsiveness

- Support keyboard navigation for interactive controls.
- Preserve visible focus states.
- Use semantic HTML whenever practical.
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
