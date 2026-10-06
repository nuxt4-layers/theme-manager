# Interactive State Design Colour Palette Guide

Oct 5, 2026 · @Steve Lewis

## Purpose and scope

Every interactive component uses one shared set of twelve states, styled through four channels: Fill, Pen, Edge and Shadow. This guide defines those states, how each one looks, which wins when several apply, and the procedures for building and reviewing components against them.

| Item | In scope | Out of scope |
| --- | --- | --- |
| Components | Links, buttons, toggle buttons, tabs, options, nav items, form inputs, cards, menus, dialogs | Charts, illustrations, body text styling |
| Properties | Background, text and icon colour, border and outline, box shadow, state transitions | Layout, spacing, typography scale |
| Audience | Designers defining palettes; developers implementing components; reviewers checking them | End users |

Colour values are not set here. The palette supplies them as tokens; this guide says which token each state uses and the rules those values must satisfy.

## Principles and vocabulary

A state changes the channels of one surface together, and no state is ever shown by colour or shadow alone.

### Channels

| Channel | Controls | CSS properties |
| --- | --- | --- |
| Fill | The surface behind content | `background-color` |
| Pen | Text and meaningful icons on that surface | `color`, `fill`, `stroke` |
| Edge | Borders, dividers, focus rings, state markers | `border-color`, `outline`, zero-blur `box-shadow` rings |
| Shadow | Elevation: how raised the surface sits | blurred `box-shadow` |

### Principles

| # | Principle | Why |
| --- | --- | --- |
| P1 | Fill, Pen and Edge of one surface share the same role and state. Any other pairing is a deliberate exception and is documented. | Contrast is checked per pairing; unplanned pairings go unchecked. |
| P2 | Never signal a state by colour alone. Pair it with shape, weight, an icon, an underline or text. | Colour-blind users and forced-colours mode lose colour cues. |
| P3 | Focus is always visible and never reuses the hover treatment. | Keyboard users must know where they are, whatever else applies. |
| P4 | Shadow expresses elevation, not state. A state may move elevation but must also change something else. | Blurred shadows are low-contrast and vanish in forced colours. |
| P5 | Component states map to platform semantics (CSS pseudo-classes or ARIA attributes), never to styling-only classes. | Assistive technology reads the same state the eye sees. |
| P6 | Every value comes from a token. No raw colours or one-off shadows in components. | Themes and dark mode change in one place. |

### Naming

The design names below avoid clashing with CSS and ARIA terms that mean something different.

| Design term | Means | Platform term | Earlier working name |
| --- | --- | --- | --- |
| default | Resting, enabled, unvisited | `:link` or no state | default |
| pressed | Momentary, while the pointer or key is down | `:active` | (none) |
| on | A toggle that is persistently engaged | `aria-pressed="true"` | selected |
| selected | The chosen item within a set | `aria-selected="true"` | active |
| active | The current location: page, step or section | `aria-current` | (none) |
| disabled | Present but unavailable until constraints are met | `disabled` or `aria-disabled="true"` | disabled |

Note that the design term `active` is not CSS `:active` (that is `pressed`).

## Runtime customisation

A stored theme overrides `theme-default.css` at runtime, so every token is either settable now, waiting on the engine, or fixed at build time.

The theme manager's engine (`createThemeApplication` in `shared/theme-runtime.ts`) writes a theme's values as `--ui-*` variables on `<html>`; `theme-api.css` and `tailwind-config.css` pass them to the utilities. Token names must be lowercase segments joined by single hyphens: the engine rejects a `--` inside a name, which is why line heights are `--ui-text-sm-line-height`.

| Token group | Status | How a theme sets it |
| --- | --- | --- |
| Colours (fill, pen, edge × role × state × mode) | Settable | `modes.<mode>.<channel-role>.<state>`; the six base states are required, the other six optional |
| Fonts, text sizes and line heights, type roles, weights | Settable | `presentation.typography` (`families`, `sizes`, `weights`) |
| Spacing steps, content widths | Settable | `presentation.spacing`, `presentation.responsive.containers` |
| Radius sizes and roles | Settable | `presentation.radii`; `DEFAULT` writes the bare `--ui-radius` (plain `rounded`) |
| Shadow shapes and elevation roles (box, inset, drop, text) | Settable | `presentation.effects`; colour via `modes` (`fill-base` / `pen-base`, state `shadow`) |
| Border, focus outline and ring widths | Settable | `presentation.borders` (optional): `widths` DEFAULT and xs–xl, `focusRing` width and offset, `ring` width; DEFAULT writes the bare --ui-border-width |
| Letter spacing, line heights, blur, perspective and tilt, aspect, easing, durations, animation timing | Settable | Optional groups: `typography.tracking`, `typography.leading`; `effects.blur`, `.perspective`, `.tilt`, `.aspect`; `motion.ease`, `motion.duration` (with `-exit` keys), `motion.animate`. An omitted group keeps the defaults |
| Breakpoints | Build-time only | Compiled into media queries; change `theme-default.css` and `tailwind-config.css`, then rebuild |
| Animation keyframes | Build-time only | Live in `tailwind-config.css`; a theme can only ever change timing |
| Base spacing unit | Not settable | By design: `spacing.DEFAULT` writes `--ui-spacing-DEFAULT`, never `--ui-spacing` |

| # | Rule |
| --- | --- |
| T1 | Every new token gets an `@RUNTIME` note in `theme-default.css` stating its status. |
| T2 | Never set breakpoints from a stored theme: media queries keep the build-time values while `--ui-container-screen-*` would move. |
| T3 | `theme-default.css` is the single source of the vocabulary. `theme-api.css` and `tailwind-config.css` are generated from it by `scripts/generate-theme-api.mjs`; the engine, `shared/canonical-theme.ts` and its tests are updated to match. |

## Pipeline and mode handling

Three CSS files carry every token from source to utility, and only the first is edited by hand.

| Step | File | Holds | Edited by |
| --- | --- | --- | --- |
| 1 | `assets/css/theme/theme-default.css` | Source values `--ui-*`, with `-light` / `-dark` suffixes where modes differ, in one `:root` block | Hand |
| 2 | `assets/css/theme/theme-api.css` | Stable `--api-*` names: light in `:root`, dark in `html.dark`, mode-free in a second `:root`; sets `color-scheme` | Generator |
| 3 | `assets/css/tailwindcss/tailwind-config.css` | `@theme inline` mapping Tailwind namespaces to `--api-*`; literal breakpoints; plain `@keyframes` after the block | Generator |

| # | Rule |
| --- | --- |
| P1 | Hand-written CSS reads `--api-*` only, never `--ui-*`: `--ui-*` values have not been through mode selection. |
| P2 | After any change to `theme-default.css`, run `node scripts/generate-theme-api.mjs`; `--check` fails CI when either generated file is stale. The generator keeps each file's hand-written header. |
| P3 | Token names are lowercase segments joined by single hyphens. Tailwind's partner properties (`--text-sm--line-height`, `--font-mono--font-feature-settings`) are written only in `tailwind-config.css`. |
| P4 | `@keyframes` sit outside `@theme`: Tailwind drops theme keyframes it cannot see named in an `--animate-*` value, and ours are `var()` references. |
| P5 | Tailwind's default theme, including its colour palette, stays available underneath (`main.css` imports `tailwindcss` first). Decided: the palette is kept. Components still use only the theme's tokens (principle P6). |

### Light, dark and system

Dark mode is on exactly when `<html>` has the `dark` class. The Theme Manager layer owns that class and, being standalone, contributes everything itself at build time; a host only extends the layer.

| Piece | Where | Does |
| --- | --- | --- |
| Mode cookie | Layer runtime, beside `active-theme-id` | Stores `light`, `dark` or `system` (default `system`) |
| Server render | Layer server plugin | Renders `<html class="dark">` for `dark`, no class for `light`, so the first paint is right |
| Head script | Layer `app.head`, inline, before first paint | For `system`: reads `prefers-color-scheme`, sets the class, follows device changes |
| `color-scheme` | `theme-api.css` | Browser controls (scrollbars, inputs, pickers) match the mode |
| Editor preview | Theme editor | Toggles a scoped container, never `<html>` |

With JavaScript disabled, `system` falls back to light; covering that would mean repeating the dark mappings under `prefers-color-scheme` (not done).

## Surface roles and layers

Every Fill, Pen and Edge token belongs to one of fourteen roles: five layer roles stack page areas, four purpose roles serve particular components, and five status roles report outcomes.

### Layer roles

Layers stack from `floor` upward. A surface placed on another takes the next layer up, so nested areas stay distinguishable without extra borders. Each layer is more specific than the one beneath: broad page areas sit low, focused content sits high.

| Order | Role | Purpose | Elevation level | Typical surfaces |
| --- | --- | --- | --- | --- |
| 1 (bottom) | `floor` | The very bottom layer, behind `base` | Below 0 | Viewport background, gutters, area showing around a framed app |
| 2 | `base` | Main background fill | 0 | Page body, main content area |
| 3 | `primary` | First layer on `base` | 1 | Cards, panels, sidebars, raised buttons |
| 4 | `secondary` | Layer on `primary` | 2 | Nested panels, menus, dropdowns |
| 5 (top) | `tertiary` | Layer on `secondary` | 3 | Dialogs, popovers, tooltips |

### Purpose roles

| Role | Purpose | Channels used | Sits on |
| --- | --- | --- | --- |
| `accent` | Special highlights and the `on` and `selected` component states | Fill, Pen, Edge | Any layer |
| `muted` | Placeholder fills and the disabled state | Fill, Pen, Edge | Any layer |
| `input` | Form inputs, textareas, selects | Fill, Pen, Edge | Any layer; its Fill must differ from the layer beneath |
| `link` | Link text and icons | Pen, Edge (underline, focus) | Any layer |

### Status roles

Status roles colour messages, badges and validation. Each also needs a non-colour cue such as an icon or label.

| Role | Meaning | Typical components |
| --- | --- | --- |
| `success` | An action completed | Toasts, banners, badges, valid inputs |
| `info` | Neutral information | Banners, hints |
| `warning` | Caution; action may be needed | Banners, inline warnings |
| `error` | Failure or invalid input; drives the `error` state | Validation messages, error Edges |
| `notification` | New or unread activity | Count badges, dots |

### Which states each role carries

Every role defines all twelve states in the theme. This table shows which states each role's components are expected to use (Y); the rest exist so a stored theme can change them, but components should not rely on them.

| Role | hover | focus | pressed | on | selected | disabled | visited | error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `floor`, `base` |  |  |  |  |  |  |  |  |
| `primary`, `secondary`, `tertiary` | Y | Y | Y |  | Y | Y |  |  |
| `accent` | Y | Y | Y | Y | Y |  |  |  |
| `muted` |  |  |  |  |  | Y |  |  |
| `input` | Y | Y |  |  |  | Y |  | Y |
| `link` | Y | Y | Y |  | Y | Y | Y |  |
| Status roles | Y (when interactive) | Y (when interactive) |  |  |  |  |  |  |

### Layering rules

| # | Rule |
| --- | --- |
| L1 | A surface uses the Fill of its own layer and the Pen and Edge of the same layer (principle P1). |
| L2 | A surface placed on layer N uses layer N+1. Beyond `tertiary`, reuse `tertiary` and separate with an Edge. |
| L3 | Adjacent layers must differ visibly: a Fill step, or an Edge with 3:1 non-text contrast where the boundary matters. |
| L4 | Purpose and status roles keep their own Fill on any layer, and their Pen must meet contrast against that Fill, not the layer beneath. |
| L5 | A `link` or status Pen placed directly on a layer must meet 4.5:1 against every layer it can appear on. |
| L6 | Layer roles map to the elevation scale; in dark themes the higher layer is lighter instead of shadowed. |

## Default palette: Calm Sky

The default theme (`theme-default.css` v5.1.0) uses light blues, blue-greys and greens; only warning (amber) and error (red) keep conventional hues. The table gives each role's default state; other states are steps from these, and the theme file holds every value.

| Role | Light fill / pen / edge | Dark fill / pen / edge |
| --- | --- | --- |
| `floor` | `#edf0f4` / `#292e35` / `#747b83` | `#090b0e` / `#dadee5` / `#81878d` |
| `base` | `#fcfdff` / `#22272e` / `#747b83` | `#131519` / `#e8ebf1` / `#81878d` |
| `primary` | `#eef7ff` / `#0f304a` / `#567896` | `#151f28` / `#dbeaf8` / `#7390a9` |
| `secondary` | `#ebf8f0` / `#113623` / `#567f67` | `#18271e` / `#d8eee0` / `#769d85` |
| `tertiary` | `#e5f1f6` / `#122f3a` / `#587783` | `#1f2c32` / `#deeef5` / `#829da9` |
| `accent` | `#0668a4` / `#ffffff` / `#83c5fc` | `#72b8f2` / `#06131e` / `#495d6f` |
| `muted` | `#e8ebef` / `#5e646c` / `#81878d` | `#24272a` / `#a6abb2` / `#70757c` |
| `input` | `#ffffff` / `#1d2229` / `#6d7580` | `#191c20` / `#ebeff4` / `#8a939f` |
| `link` | `#fcfeff` / `#0a5f96` / `#0a5f96` | `#121518` / `#7fbef3` / `#7fbef3` |
| `success` | `#e2f9e6` / `#154f27` / `#3b834e` | `#152d1a` / `#b2e7bc` / `#69b27a` |
| `info` | `#e3f4fe` / `#064865` / `#177ba8` | `#112937` / `#b2dffa` / `#69aed5` |
| `warning` | `#fff1e0` / `#684506` / `#a36e09` | `#342611` / `#fed7a3` / `#daa24f` |
| `error` | `#feecea` / `#8d1a1e` / `#ba3535` | `#3b1c1a` / `#ffc8c3` / `#ed756e` |
| `notification` | `#d6f8f7` / `#084c4d` / `#128282` | `#0a2e2e` / `#b0ebea` / `#57b6b6` |

Shared edge colours apply to every role: focus `#0c60a3` light / `#71bfff` dark, error `#ba2b2e` / `#f47b74`, on `#04598e` / `#86c5fa`.

- **State steps:** light-mode fills darken by one step per level of emphasis (hover 1, active and selected 2, pressed 3); dark-mode fills lighten. Disabled fills turn neutral grey.
- **Contrast:** every pen meets 4.5:1 and every edge 3:1 on its own role's fill, in every state except disabled (about 2.5:1, exempt). The focus ring is the exception: it sits outside the control, so it meets 3:1 against every page layer (floor to tertiary) instead. Accent edges are drawn on a saturated fill, so they run light in light mode and dark in dark mode.
- **Shadows:** shadow definitions never hard-code colours. Box, inset and drop shadows use `--ui-fill-<role>-shadow-<mode>`; text shadows use `--ui-pen-<role>-shadow-<mode>`; unrolled shadows use `base`.

## State definitions

Twelve states cover every component: eleven interaction states plus `shadow`, the colour a role's shadows are cast in. The theme defines all twelve for every role.

| State | Trigger | Applies to | Duration | Meaning |
| --- | --- | --- | --- | --- |
| default | `:link`, or no state attribute | All | Resting | Enabled and idle. Every other state is defined relative to this one. |
| visited | `:visited` | Links only | Persistent | The destination has been opened before. |
| hover | `:hover` | All enabled | While pointer is over | The pointer could act on this. An affordance only. |
| focus | `:focus-visible` | All enabled, and `aria-disabled` controls | While focused | The keyboard is here. Layers on top of every other state. |
| pressed | `:active` | Buttons, tabs, options, links | Momentary | Being activated right now. Reverts on release. |
| on | `aria-pressed="true"` | Toggle buttons | Persistent | The toggle is engaged. |
| selected | `aria-selected="true"` | Tabs, options, list items | Persistent | The chosen item within a set. |
| active | `aria-current` (`page`, `step`, `location`, `true`) | Nav links, steppers, breadcrumbs | Persistent | Where the user is now. Same strength as selected; pair it with a marker. |
| disabled | `disabled` or `aria-disabled="true"` | Buttons, inputs | Until constraints are met | Present but unavailable. |
| error | `aria-invalid="true"` | Inputs | Until corrected | The value fails validation. |
| loading | `aria-busy="true"` | Async buttons and regions | While work runs | An action is in progress. |
| shadow | (not an interaction) | Every role | — | The colour the role's shadows are cast in; used by the shadow tokens, never as a fill. |

### Choosing between `disabled` and `aria-disabled`

| Use | When | Effect |
| --- | --- | --- |
| `aria-disabled="true"` (preferred) | Users need to discover the control and learn why it is unavailable | Stays in the tab order and is announced as unavailable. The component must block activation itself. |
| `disabled` | The control is irrelevant until something else changes, and hiding it from the tab order is acceptable | Removed from the tab order; the browser blocks activation. |

## Colour treatment

Each state is a step away from the default role colours, and each step also changes something other than hue.

| State | Fill | Pen | Edge | Non-colour cue |
| --- | --- | --- | --- | --- |
| default | Role base | Role base, contrast partner of the Fill | Role base, or none | (baseline) |
| visited | Unchanged | Shifted toward a teal-blue | Unchanged | Underline kept |
| hover | One step stronger | Unchanged, or one step to keep contrast | One step stronger | Pointer cursor; optional elevation lift |
| focus | Unchanged | Unchanged | Focus colour (`edge-<role>-focus`), 2px ring, offset from the surface | The ring itself |
| pressed | Three steps stronger than default | Contrast partner of that Fill | Three steps stronger | Elevation drops or goes inset |
| on | Emphasis Fill | Contrast partner of the emphasis Fill | `edge-<role>-on` (accent blue) | Inset elevation, or a check or filled icon |
| selected | Two steps stronger, more saturated | Selected Pen | Selected marker (underline bar, side bar or full border) | The marker's shape and position |
| active | Same as selected | Same as selected | Current-location marker | The marker, plus `aria-current` for assistive technology |
| disabled | Muted grey | Muted, still legible (about 2.5:1) | Muted, or none | No hover or pressed response; `not-allowed` cursor |
| error | Unchanged | Error Pen for helper text | `edge-<role>-error` (red) | Icon and message text |
| loading | Unchanged | Unchanged | Unchanged | Spinner or progress text; label kept |
| shadow | — | Text-shadow colour | — | Shadow colour only (see Shadow and elevation) |

### Token pattern

Colour tokens are named `--ui-{channel}-{role}-{state}-{mode}` in the theme and `--api-{channel}-{role}-{state}` after mode selection, for example `--api-fill-primary-hover` or `--api-edge-accent-selected`. Every role defines all twelve states in both modes, so the runtime engine can change any one of them; a state that looks like default still has its own token.

| Channel | States per role | Notes |
| --- | --- | --- |
| Fill | all 12 | `shadow` is the box, inset and drop shadow colour |
| Pen | all 12 | `shadow` is the text-shadow colour |
| Edge | 11 (no `shadow`) | `focus`, `error` and `on` use one system colour each (blue, red, accent blue), defined per role so a theme can still change one role |

### Border width and style

Width changes are limited to states where shape carries meaning; drawing rings with `outline` or a zero-blur `box-shadow` keeps layout from shifting.

| State | Width | Style | Drawn with |
| --- | --- | --- | --- |
| default | `--ui-border-width` (1px), or none on flat controls | solid | `border` |
| visited | Unchanged | Link underline kept | `text-decoration` |
| hover | Unchanged | solid | `border` |
| focus | `--ui-focus-ring-width` (2px), `--ui-focus-ring-offset` (2px): `outline-focus outline-offset-focus` | solid | `outline` |
| pressed | Unchanged | solid | `border` |
| on | `--ui-ring-width` (2px, inner, no size change): `inset-ring-focus` | solid | inset zero-blur `box-shadow` |
| selected | `--ui-border-width-lg` (3px) marker on one side, or `--ui-border-width-md` (2px) full border | solid | `border-bottom`/`border-left`, or inset ring |
| active | `--ui-border-width-lg` (3px) current-location marker | solid | `border-b-lg` / `border-l-lg` |
| disabled | `--ui-border-width-sm` (1px), or none | solid or dashed | `border` |
| error | `--ui-ring-width` (2px): `inset-ring-focus` | solid | inset zero-blur `box-shadow` |
| loading | Unchanged | solid | `border` |

Border widths follow the usual size scale: `--ui-border-width-xs` 0.5px (hairline; about 1px on standard-density screens), `-sm` 1px, `-md` 2px, `-lg` 3px, `-xl` 4px (strong emphasis), with `--ui-border-width` (1px) as the plain `border`. Use the named widths (`border`, `border-xs` to `border-xl`, side forms such as `border-b-lg`, `divide-y-xs`, `outline-focus`, `ring-focus`) so a theme can change them. Numbered widths such as `border-2` stay literal and ignore the theme.

### Applying Edge: border, outline and ring

Edge is a colour, not a property: the theme defines one \`--ui-edge-\*\` channel, with no separate border, outline or ring colours. The same `edge-*` token can be drawn three ways, and the choice depends on whether the line is part of the shape or a state laid over it.

- **Border** is part of the box. It takes up space, so changing its width shifts layout. Use it for the resting outline of a control, dividers between items, and one-sided markers such as a selected tab's underline. Tailwind: `border-edge-*`, `divide-edge-*`.
- **Outline** is drawn outside the box and takes no space. It can be offset from the surface, follows border radius in current browsers, and survives forced-colours mode. Use it for the focus ring. Tailwind: `outline-focus outline-offset-focus outline-edge-*`.
- **Ring** is a zero-blur box-shadow that looks like a border but takes no space and can sit inside (inset) or outside the box. Use it to thicken an edge for a state (on, error) without changing size. Forced-colours mode removes it, so pair it with a real border or outline there. Tailwind: `inset-ring-focus inset-ring-edge-*` (or `ring-focus` outside). Plain `inset-ring` is a fixed 1px and ignores the theme.

| Need | Use | Why |
| --- | --- | --- |
| Resting edge of a control or card | Border | It is the shape itself |
| Divider between list items | Border (divide) | Belongs to the layout |
| Keyboard focus | Outline | Outside the box, offsettable, kept in forced colours |
| Thicker edge for `on` or error | Inset ring | No layout shift |
| Selected marker | One-sided border | Shape and position carry the meaning |
| Elevation | Shadow (not Edge) | Blurred shadow is a separate channel |

Whichever method draws it, the colour still follows principle P1: an Edge matches the role and state of the Fill it sits on.

## Shadow and elevation

Shadows come only from a four-level elevation scale, and a state moves a surface between levels rather than defining its own shadow.

### Elevation scale

| Level | Token | Shape | Used for | Dark theme |
| --- | --- | --- | --- | --- |
| 0 | none | — | Flat controls: links, tabs, inputs, flat buttons | No shadow |
| 1 | `shadow-raised` | sm | Raised buttons, cards at rest | Fill one step lighter |
| 2 | `shadow-lifted` | md | Hovered raised controls | Fill two steps lighter |
| 2 | `shadow-overlay` | lg | Menus, popovers | Fill two steps lighter |
| 3 | `shadow-modal` | xl | Dialogs | Fill three steps lighter, plus a faint Edge |
| inset | `inset-shadow-sm` / `-md` | inset | Pressed / toggled-on controls; `-lg`/`-xl` for wells and recessed panels; `-xs` for sunken fields | Fill one step darker |

All four shadow types (box, inset, drop, text) share one size scale, `xs` to `xl`. Every shadow shape exists per role and per mode (`--ui-shadow-md-accent-light`, `--ui-shadow-md-accent-dark`), coloured by that role's shadow colour: neutral roles cast tinted grey shadows; accent, link and status roles cast coloured shadows in light mode and glows in dark mode, so they stay visible on dark surfaces. The default sizes and elevation roles point at the `base` set. Like colours, `theme-default.css` holds both modes in `:root`, and `theme-api.css` selects the light or dark set (`:root` / `html.dark`).

Shadow colour is a translucent tint of the background hue, not pure black. In dark themes shadows barely show, so elevation is carried by a lighter Fill instead.

### Shadow by state

| State | Raised component | Flat component |
| --- | --- | --- |
| default | Its base level (usually 1) | 0 |
| visited | Unchanged | 0 |
| hover | Base + 1 | 0 |
| focus | Unchanged; ring drawn outside the shadow | 0; ring only |
| pressed | Base, or inset | 0 |
| on | Inset | 0 |
| selected | Base | 0 |
| disabled | 0 | 0 |
| error | Unchanged | 0 |
| loading | Unchanged | 0 |

### Transitions

| Property | Duration | Easing | Reduced motion |
| --- | --- | --- | --- |
| `background-color`, `color`, `border-color` | `duration-fast` 100ms (exit 75ms) | `ease-standard` | No transition |
| `box-shadow`, small movement | `duration-base` 150ms (exit 100ms) | `ease-standard` | No transition |
| Focus ring | None (appears immediately) | — | None |

A plain `transition` utility already uses `duration-base` and `ease-standard`.

## Spacing and widths

Spacing and content widths are separate rem-based scales, so both grow with the user's font size and each name means one thing.

| Step | Token | Value | Use |
| --- | --- | --- | --- |
| 3xs | `--ui-spacing-step-3xs` | 0.125rem (2px) | Hairline gaps, icon nudges |
| 2xs | `--ui-spacing-step-2xs` | 0.25rem (4px) | Tight inline gaps |
| xs | `--ui-spacing-step-xs` | 0.5rem (8px) | Gaps inside controls |
| sm | `--ui-spacing-step-sm` | 0.75rem (12px) | Compact padding |
| md | `--ui-spacing-step-md` | 1rem (16px) | Default padding and gutters |
| lg | `--ui-spacing-step-lg` | 1.5rem (24px) | Card padding, gaps between groups |
| xl | `--ui-spacing-step-xl` | 2rem (32px) | Gaps between sections |
| 2xl | `--ui-spacing-step-2xl` | 3rem (48px) | Major section gaps |
| 3xl | `--ui-spacing-step-3xl` | 4rem (64px) | Page-level breathing room |

| Scale | Tokens | Utilities | Rule |
| --- | --- | --- | --- |
| Spacing steps | `--ui-spacing-step-*` | `p-step-md`, `gap-step-lg`, `m-step-xs` | Components use named steps, never raw numbers |
| Base unit | `--ui-spacing` (0.25rem) | `p-4` = 1rem | Kept for Tailwind compatibility only |
| Content widths | `--ui-container-xs` to `-7xl` (20–80rem) | `max-w-md`, `w-lg` | Widths never live in the spacing scale |
| Screen widths | `--ui-container-screen-*` | `max-w-screen-lg` | Reference `--ui-breakpoint-*`; never copy the numbers |

The `step-` prefix is required: Tailwind v4 looks up width utilities in `--spacing-*` before `--container-*`, so a spacing token named `md` would turn `max-w-md` into 1rem.

## Corner radii

Components take their corners from six role tokens, which point at a rem size scale matching Tailwind v4's values.

| Role | Token | Size | Used for |
| --- | --- | --- | --- |
| tooltip | `--ui-radius-tooltip` | sm (0.25rem, 4px) | Tooltips, tags, inline code |
| control | `--ui-radius-control` | md (0.375rem, 6px) | Buttons, inputs, selects, tabs, options |
| card | `--ui-radius-card` | lg (0.5rem, 8px) | Cards, banners, list groups |
| panel | `--ui-radius-panel` | xl (0.75rem, 12px) | Page panels, sidebars, sheets |
| dialog | `--ui-radius-dialog` | 2xl (1rem, 16px) | Dialogs, popovers, menus |
| pill | `--ui-radius-pill` | full | Badges, chips, toggles, avatars |

The size scale is `none` 0, `xs` 2px, `sm` 4px, `md` 6px, `lg` 8px, `xl` 12px, `2xl` 16px, `3xl` 24px and `full`; `--ui-radius` (md) sets bare `rounded`.

| # | Rule |
| --- | --- |
| R1 | Components use role tokens (`rounded-card`), not sizes, so a role changes in one place. |
| R2 | Radius grows with surface size: control < card < panel < dialog. |
| R3 | A nested surface uses a smaller radius: inner = outer − padding, rounded down to a step. |
| R4 | Focus rings drawn with `outline` follow the radius; inset rings follow it too. |

## Typography

Components set text through five type roles; every size carries its own line height, and weights are limited to 400–700.

| Role | Token | Size / line height | Used for |
| --- | --- | --- | --- |
| body | `--ui-text-body` | base: 1rem / 1.5rem | Running text |
| label | `--ui-text-label` | sm: 0.875rem / 1.25rem | Form labels, controls, secondary text |
| caption | `--ui-text-caption` | xs: 0.75rem / 1rem | Captions, badges, timestamps |
| heading | `--ui-text-heading` | 2xl: 1.5rem / 2rem | Section headings |
| title | `--ui-text-title` | 3xl: 1.875rem / 2.25rem | Page titles |

The size scale runs `xs` to `5xl` (0.75–3rem) and matches Tailwind's defaults.

| Scale | Tokens | Rule |
| --- | --- | --- |
| Families | `--ui-font-sans` (Inter), `-serif` (Merriweather), `-mono` (Fira Code) | Every stack ends in system fonts; load the web fonts where the theme is used |
| Weights | normal 400, medium 500, semibold 600, bold 700 | No other weights; Inter's variable file covers all four |
| Letter spacing | `tight` −0.015em, `normal` 0, `wide` 0.025em, `caps` 0.06em | `caps` for uppercase labels, `tight` for large headings |
| Line height | `leading-none` 1 to `leading-relaxed` 1.625 | Overrides only; sizes already carry one |
| Code | `--ui-font-mono-feature-settings` | Ligatures off, so codes and tokens show every character as typed |

## Breakpoints

Seven mobile-first breakpoints in rem, matching Tailwind v4: a variant such as `md:` applies from that width up.

| Name | Token | Width | Typical device |
| --- | --- | --- | --- |
| xs | `--ui-breakpoint-xs` | 30rem (480px) | Large phones, landscape |
| sm | `--ui-breakpoint-sm` | 40rem (640px) | Small tablets |
| md | `--ui-breakpoint-md` | 48rem (768px) | Tablets |
| lg | `--ui-breakpoint-lg` | 64rem (1024px) | Laptops |
| xl | `--ui-breakpoint-xl` | 80rem (1280px) | Desktops |
| 2xl | `--ui-breakpoint-2xl` | 96rem (1536px) | Large desktops |
| 3xl | `--ui-breakpoint-3xl` | 120rem (1920px) | Wide screens |

| # | Rule |
| --- | --- |
| B1 | Design for the smallest screen first; add `xs:` to `3xl:` variants to change layout upward, and `max-*:` only for exceptions. |
| B2 | All breakpoints use rem. Mixing px and rem makes Tailwind sort them wrongly, so a smaller breakpoint can override a larger one. |
| B3 | Map breakpoints into Tailwind's `@theme` as literal values, never `var()`: media queries cannot read custom properties, so `md:` would silently do nothing. |
| B4 | Full-page widths (`--ui-container-screen-*`) reference these tokens instead of repeating the numbers. |

## Motion and effects

State changes animate briefly with one standard curve, and every animation stops under reduced motion.

| Group | Tokens | Use |
| --- | --- | --- |
| Easing | `ease-in`, `ease-out`, `ease-in-out` (Tailwind's names, kept); roles `ease-standard`, `ease-enter` (= out), `ease-exit` (= in), `ease-spring` | State changes; appearing; leaving; playful pops on toggles and badge counts (never large surfaces) |
| Duration | `fast` 100ms / exit 75ms, `base` 150 / 100, `slow` 250 / 200, `slower` 400 / 300 (`--ui-duration-<step>` and `-<step>-exit`) | Colour, border, focus; shadow, small movement, hover lift; menus, popovers, dialogs; sheets, page transitions |
| Looping animation | `animate-spin`, `animate-ping`, `animate-pulse`, `animate-skeleton` | Spinners; new notification; live status; loading placeholders |
| Entrance animation | `animate-fade-in`, `animate-slide-up`, `animate-scale-in` (slow, ease-enter) | Backdrops; toasts and sheets; dialogs and menus, when added to the page |
| Blur | `blur-xs` 2px, `sm` 4px, `md` 8px, `lg` 16px, `xl` 32px (each step doubles) | Softening; light frost on headers; frosted panels and menus; dialog backdrops; heavy backdrops and glows |
| Aspect | `aspect-video` 16/9, `aspect-photo` 4/3, `aspect-square` 1/1, `aspect-portrait` 3/4, `aspect-tall` 9/16 | Landscape media; avatars and icons; profile photos and cards; phone screens and stories |
| Perspective | `near` 300px, `normal` 600px, `distant` 1200px; tilt xs 4°, sm 10°, md 25°, lg 45°, xl 65° | Flips and tilts; view direction via `perspective-origin-*` and the rotation sign |

| # | Rule |
| --- | --- |
| M1 | Interactive state changes use `ease-standard` with `duration-fast` or `duration-base`; nothing in a control animates longer than 150ms. |
| M2 | Under `prefers-reduced-motion: reduce`, entrances, ping, pulse and skeleton are switched off (`motion-safe:animate-*`); spinners keep turning, slowed to 2.4s, because a stopped spinner no longer shows that work is happening. Exits always use the `-exit` duration of their entrance step. |
| M3 | Animations need their `@keyframes` (`spin`, `pulse`, `skeleton`) defined in the Tailwind config; the theme only names them. Placeholders use `animate-skeleton` on the `muted` pressed fill, never `animate-pulse`: fading a muted fill to half opacity leaves it at about 1.1:1, close to invisible. |

## Precedence and combinations

When states overlap, the higher-ranked state sets Fill, Pen and Shadow, while focus always adds its ring on top.

### Precedence

| Rank | State | Overrides | Notes |
| --- | --- | --- | --- |
| 1 | disabled | Everything below | Suppresses hover and pressed. With `aria-disabled`, focus ring still shows. |
| 2 | error | pressed, hover, on, selected, visited, default (Edge only) | Fill and Pen follow the lower state; Edge turns to error. |
| 3 | pressed | hover, on, selected, visited, default | Momentary. |
| 4 | focus | Nothing (it layers) | Ring added to whichever state wins. |
| 5 | hover | on, selected, visited, default | Applied as a step from the winning base state. |
| 6 | on / selected / active | visited, default | Persistent base states. |
| 7 | visited | default | Links only. |
| 8 | default | (none) | Baseline. |

### Combination matrix

Rows are persistent base states; columns are transient states laid on top.

| Base | + hover | + focus | + pressed |
| --- | --- | --- | --- |
| default | One step from default | Default + ring | Two steps from default |
| on | One step from the `on` Fill | `on` + ring | Two steps from the `on` Fill |
| selected / active | One step from the selected colours; marker unchanged | Selected + ring | Not applicable; pressing a selected item does not change it |
| disabled (`disabled`) | None | Not focusable | None |
| disabled (`aria-disabled`) | None | Disabled + ring | None |
| error | Default hover; error Edge kept | Error + ring, ring outside the error Edge | Default pressed; error Edge kept |

### CSS order

Within one specificity level, write rules in this order so later states win: `:link`, `:visited`, `:hover`, `:focus-visible`, `:active`, then the ARIA attribute selectors for on, selected, active (`aria-current`), error and disabled.

## Accessibility requirements

Every state except disabled meets WCAG 2.2 AA contrast, and every state survives forced-colours mode and reduced motion.

| Requirement | Applies to | Threshold | WCAG reference |
| --- | --- | --- | --- |
| Text contrast | Pen on Fill, all states except disabled | 4.5:1; 3:1 for large text (24px, or 18.66px bold) | 1.4.3 |
| Non-text contrast | Edges that identify a control or state, meaningful icons, selected markers | 3:1 against adjacent colours | 1.4.11 |
| Focus visible | All focusable controls | Ring at least 2px, 3:1 against both the surface and the background | 2.4.7, 2.4.13 (AAA guidance) |
| Focus not obscured | All focusable controls | Ring not hidden by sticky headers, overlays or shadows | 2.4.11 |
| Use of colour | All states | A second, non-colour cue for every state | 1.4.1 |
| Disabled | disabled | Exempt from contrast, but still recognisable as the same control | 1.4.3 exception |
| Forced colours | All states | Edges and rings use real `border` or `outline`; shadow-only states get a `forced-colors` fallback | 1.4.11 |
| Reduced motion | Transitions | No animated transitions under `prefers-reduced-motion: reduce` | 2.3.3 |
| Target size | Buttons, links in controls | 24 × 24 CSS px minimum | 2.5.8 |
| State exposed | on, selected, active, disabled, error, loading | Set through ARIA or native attributes, not class names alone | 4.1.2 |

### Forced-colours fallbacks

| State | Fallback in `@media (forced-colors: active)` |
| --- | --- |
| focus | `outline: 2px solid CanvasText` |
| on | `border: 2px solid Highlight` or a visible check icon |
| selected | Marker drawn as a border so it remains (selected and active) |
| disabled | `color: GrayText` |
| error | Error icon remains; border uses `CanvasText` |

## Standard operating procedures

Four procedures cover the lifecycle: defining a palette, implementing a component, reviewing it, and changing the system.

### SOP-1: Define or extend a palette

| Step | Action | Output | Done when |
| --- | --- | --- | --- |
| 1 | Confirm the roles needed from Surface roles and layers | Role list | Each role has a stated purpose |
| 2 | Pick the default Fill, Pen and Edge for each role, light and dark | Default tokens | Pen on Fill meets 4.5:1 in both modes |
| 3 | Derive all twelve states for each channel | State tokens per role | Every step passes the contrast rows in Accessibility requirements |
| 4 | Set the focus, error and `on` edge colours (`edge-<role>-focus` and so on) | Edge state tokens | Focus reaches 3:1 against every Fill and background it can sit on |
| 5 | Set each role's shadow colours and check the shadow scale in both modes | `fill-` / `pen-<role>-shadow` tokens; `shadow-raised`, `lifted`, `overlay`, `modal`; `inset-shadow-*` | Each size visibly differs from the next in both themes |
| 6 | Record any cross-role pairing | Entry in the deliberate-pairings register | Pairing has its own contrast check |
| 7 | Regenerate the pipeline and publish | `node scripts/generate-theme-api.mjs`; changelog entry | `--check` passes and Tailwind builds without errors |

### SOP-2: Implement a component

| Step | Action | Check |
| --- | --- | --- |
| 1 | Identify which of the twelve states apply, using State definitions | State list in the component's docs |
| 2 | Choose the native element (`a`, `button`, `input`) or ARIA role | No `div` with click handlers |
| 3 | Wire each state to its platform trigger, never a styling-only class | State visible in the accessibility tree |
| 4 | Apply tokens per state for Fill, Pen, Edge and Shadow | No raw colours or shadows in the component |
| 5 | Add the non-colour cue for each state | Every row of Colour treatment satisfied |
| 6 | Order rules per the CSS order and precedence | Combination matrix renders as specified |
| 7 | Add forced-colours and reduced-motion rules | Both media queries present |
| 8 | Write tests: automated accessibility (e.g. axe) and contrast per state | Tests pass |

### SOP-3: Review a component

| Step | Reviewer action | Pass criterion |
| --- | --- | --- |
| 1 | Walk every state with mouse, keyboard and touch | Each state appears and reverts as defined |
| 2 | Walk every cell of the combination matrix | Focus ring visible on every base state |
| 3 | Check contrast in light and dark themes | All thresholds met |
| 4 | Turn on forced colours | Every state still distinguishable |
| 5 | Turn on reduced motion | No animated transitions |
| 6 | Use a screen reader on each state | on, selected, active (current), disabled, error and loading are announced |
| 7 | Inspect the code for raw values and styling-only state classes | None found |

### SOP-4: Change the system

| Step | Action | Rule |
| --- | --- | --- |
| 1 | Propose the change with the reason and affected states | Written in a change request |
| 2 | Assess impact on every component using those tokens | Impact list attached |
| 3 | If the change lowers a threshold or removes a cue, record a risk treatment | No loosening without a documented treatment |
| 4 | Fix palette defects in the palette source, never by overriding tokens in a component | One source of truth |
| 5 | Never weaken an automated accessibility or contrast test to get green | Fix the composition instead |
| 6 | Update this guide, the token changelog and affected component docs | Docs match code |

## Release checklist and glossary

A component ships only when every item below is ticked.

- [ ] Applicable states listed and wired to platform triggers
- [ ] Tokens used for every Fill, Pen, Edge and Shadow value
- [ ] Non-colour cue present for every state
- [ ] Focus ring visible on every base state, distinct from hover
- [ ] Contrast thresholds met in light and dark themes
- [ ] Forced-colours and reduced-motion rules present
- [ ] `disabled` vs `aria-disabled` choice recorded with its reason
- [ ] Automated accessibility and contrast tests pass
- [ ] Component docs and token changelog updated; `node scripts/generate-theme-api.mjs --check` passes

### Glossary

| Term | Definition |
| --- | --- |
| Role | A named colour family with one purpose: a layer (floor to tertiary), a purpose role (accent, muted, input, link) or a status |
| Channel | One styled property group: Fill, Pen, Edge or Shadow |
| Step | One position along a role's scale, lighter or darker |
| Elevation | How raised a surface appears, from level 0 (flat) to 3 |
| Persistent state | A state that remains until something changes it: visited, on, selected, active, disabled, error |
| Transient state | A state tied to an interaction in progress: hover, focus, pressed, loading |
| Deliberate pairing | A documented exception where channels of one surface use different roles |
| Forced colours | Operating-system high-contrast modes that replace author colours |
