# TM-2 — Target Architecture and Contracts

## Purpose and Status

TM-2 reconciled the recovered Theme Manager architecture established by TM-0 and TM-1 against the current `nuxt4-layers/platform-architecture` normative baseline.

The resulting target is an **evolution and formalisation of the recovered Theme Manager**, not a replacement architecture.

Theme Manager remains a single independently maintained Nuxt 4 Layer and is classified as a **foundation presentation capability**.

Its central architecture remains:

```text
Theme Definition
      ↓
Raw runtime representation
      ↓
Semantic Theme API
      ↓
TailwindCSS presentation vocabulary
      ↓
UI-owned component composition
```

TailwindCSS is a deliberate foundational mechanism of Theme Manager. The architectural separation is between Theme Manager and **UI implementation**, not between Theme Manager and TailwindCSS.

---

## Capability Boundary

Theme Manager owns:

- Theme Definition, schema and versioning;
- semantic presentation values and roles;
- TailwindCSS semantic presentation integration;
- colour, typography, spacing, radii and effects/shadows;
- responsive breakpoint and container values;
- presentation modes;
- semantic theme-asset bindings;
- validation and accessibility constraints;
- theme resolution and deterministic fallback;
- runtime application and switching;
- theme preference resolution;
- persistence contracts and CRUD capability;
- Theme Library, Theme Editor and live preview.

Theme Manager does **not** own:

- reusable application UI components or component-specific styling;
- authentication, identity or authorization policy;
- application-specific routes or layouts;
- database/storage technology;
- physical asset storage;
- consumer source directories or repository topology.

Cross-capability interaction occurs only through declared contracts.

---

## Target Runtime Architecture

```text
                  Theme Management UI
                 Library / Editor / Preview
                           │
                           ▼
                   Theme Manager API
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Theme Definition             Theme Repository
      validation/schema                 Port
             │                           │
             │                     Storage Adapter
             └─────────────┬─────────────┘
                           ▼
                    Theme Resolution
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 bundled default     selected theme      preferences /
                                          user/group
       └───────────────────┼───────────────────┘
                           ▼
                    Effective Theme
                           │
                           ▼
               Theme Application Engine
                           │
                           ▼
                  Raw theme variables
                           │
                           ▼
                  Semantic Theme API
                           │
                           ▼
                TailwindCSS vocabulary
                           │
                           ▼
                          UI
```

The **Effective Theme** is the canonical runtime result. Consumers do not need to know whether its values originated from the bundled default, persisted selection, preference resolution or fallback.

Theme application and live preview use the **same Theme Application Engine**; preview supplies temporary state without changing the persisted effective-theme preference.

---

## Theme Definition

The Theme Definition becomes an explicit, versioned and runtime-validatable contract:

```text
ThemeDefinition
├── identity / metadata
│   ├── id
│   ├── name
│   ├── description
│   ├── version / schemaVersion
│   └── created / updated
│
├── presentation
│   ├── colour
│   │   ├── fill
│   │   ├── pen
│   │   └── edge
│   ├── typography
│   │   ├── families
│   │   ├── sizes
│   │   └── weights
│   ├── spacing
│   ├── radii
│   ├── effects
│   │   ├── shadow
│   │   ├── inset-shadow
│   │   ├── drop-shadow
│   │   └── text-shadow
│   ├── responsive
│   │   ├── breakpoints
│   │   └── containers
│   └── semantic asset bindings
│
└── modes
    ├── light
    ├── dark
    └── extensible presentation modes
```

The recovered six interaction states remain:

`default`, `hover`, `active`, `selected`, `visited`, `disabled`.

The legacy Fill/Pen `shadow` inconsistency is resolved by treating shadow colour as part of the **effects model**, not as a seventh interaction state.

Breakpoints and containers become theme-controlled responsive values while UI retains ownership of responsive component composition.

---

## UI and Presentation Contract

Theme Manager publishes the semantic presentation vocabulary; UI consumes it:

```text
Theme Manager ───── semantic presentation contract ─────► UI
```

UI components locally compose their presentation using semantic Tailwind utilities such as colour, typography, spacing, radius, shadow and responsive primitives.

Theme Manager must never require knowledge of `Button.vue`, `Card.vue`, `Sidebar.vue`, `Hero.vue`, component-specific classes, UI source paths or UI repository structure.

Accordingly, the legacy Theme Manager `assets/css/components/` responsibility moves to UI.

Theme Manager's own management interface remains legitimate Theme Manager functionality but must not create a circular Theme Manager ↔ UI architectural dependency.

---

## Theme Assets

Themes may bind semantic presentation roles to externally managed assets, for example:

```text
background-page
background-surface
background-feature
background-prominent
```

Theme Manager owns the **semantic association, validation, resolution and fallback**, while physical asset storage may be supplied by an external Asset/Resource capability.

Component-specific names such as `hero-background` are avoided because they introduce UI-domain concepts into Theme Manager.

---

## Persistence, Preferences and External Capabilities

The recovered `IThemeRepository` becomes an explicit storage-independent repository port. The composition root supplies the implementation, allowing PostgreSQL, filesystem, remote-service, in-memory or other adapters without changing Theme Manager's public domain contract.

The legacy implicit `getThemeRepository()` provider is removed.

Theme Manager owns theme preference and resolution semantics but does not own identity. User/group context is supplied externally, while authorization determines whether an actor may create, edit, delete or assign themes.

The bundled default theme becomes a **canonical protected Theme Manager resource**: always available, schema-valid, immutable through normal CRUD and used whenever no alternative theme successfully resolves.

---

## Validation and Public Contracts

Theme Definitions crossing trust boundaries require runtime validation; TypeScript typing alone is insufficient.

Validation covers structural completeness, schema/version, semantic roles, supported values, responsive values, assets and modes. User customisation must also remain within mandatory accessibility constraints for contrast, readability, focus, reflow and usable interaction.

The deliberate public contract should include, as applicable:

- `ThemeDefinition` and `ThemeSummary`;
- theme identity/reference and semantic presentation types;
- theme asset references;
- `ThemeRepository`;
- Theme Manager commands, queries and services;
- configuration and contract/schema versions;
- documented public errors.

Internal Pinia stores, DOM manipulation, Nitro handlers, persistence adapters and provider SDKs remain private implementation.

The existing CRUD lifecycle, Theme Library, Theme Editor, visual editing, raw Theme Definition editing, live preview, apply/default behaviour and theme creation are retained and extended to the complete Theme Definition.

---

## TM-2 Gate Conclusion

TM-2 establishes Theme Manager as:

> **A bounded Nuxt 4 foundation capability that owns the definition, validation, resolution, persistence contracts, runtime application and management of semantic presentation themes, using TailwindCSS as its presentation mechanism while exposing a stable semantic vocabulary to UI consumers and remaining independent of UI implementation, identity, authorization, persistence technology and physical asset storage.**

The recovered architecture is therefore preserved where strong, its historical coupling is removed, and its semantic presentation system is extended beyond colour without changing its fundamental design.

The **TM-2 architecture and contract gate is satisfied**.

The next authorised objective is **TM-3 — New Repository Foundation**.

---

# TM-2 Decisions

> **The following decision table is supplementary to the two-page summary and is excluded from the two-page A4 limitation.**

| Decision | TM-2 Disposition |
|---|---|
| Three-stage raw → semantic → Tailwind architecture | **ADOPT** |
| TailwindCSS as Theme Manager foundation | **ADOPT** |
| Existing colour semantics | **ADOPT + HARDEN** |
| Typography/spacing/radius/effects | **EXTEND** |
| Breakpoints/containers | **EXTEND as theme-controlled values** |
| Theme assets | **ADD semantic asset binding** |
| Six interaction states | **ADOPT** |
| `shadow` as seventh interaction state | **REJECT** — model under effects |
| Canonical bundled default | **ADOPT** |
| CSS fallback | **ADOPT** |
| Effective-theme runtime model | **ADOPT** |
| Common application/preview engine | **ADOPT** |
| Storage-independent repository | **ADOPT** |
| Implicit `getThemeRepository()` provider | **REPLACE** |
| CRUD lifecycle | **ADOPT + HARDEN** |
| Runtime Theme Definition validation | **REQUIRE** |
| Theme Library/Editor | **ADOPT + EXTEND** |
| Raw editor | **ADOPT** |
| Component CSS inside Theme Manager | **REMOVE** |
| Theme Manager knowledge of UI topology | **PROHIBIT** |
| Authentication implementation dependency | **REMOVE** |
| Identity/group ownership | **EXTERNAL** |
| Authorization policy/enforcement service | **EXTERNAL CONTRACT** |
| Physical asset storage | **EXTERNAL/ADAPTER** |
| Application-specific routing/layout | **COMPOSITION ROOT** |

I have kept the main narrative deliberately compact; the decisions table then preserves the complete TM-2 disposition record without consuming the two-page allowance.