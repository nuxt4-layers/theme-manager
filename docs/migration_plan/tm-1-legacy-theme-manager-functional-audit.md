# TM-1 — Legacy Theme Manager Functional Audit

## Purpose and Status

TM-1 completed the read-only functional audit of the recovered legacy Theme Manager baseline:

`8847e6b1d8ebbca83f00d17b0cddb18522219c6e`

The audit covered **all non-asset files in the recovered repository**, complementing the presentation-system analysis completed under TM-0. No legacy repository content was modified.

**Result:** the combined TM-0/TM-1 discovery work provides a sufficiently complete understanding of the recovered Theme Manager to proceed to **TM-2 — Target Architecture and Contracts** without beginning implementation prematurely.

## Recovered Functional Architecture

The legacy capability implements four principal functional areas:

```text
Theme Management UI
        │
        ▼
Theme CRUD API
        │
        ▼
IThemeRepository
        │
        ▼
Persistence Provider
[implementation absent from recovered repository]

Persisted Theme Selection
        │
        ▼
Pinia Theme Store
        │
        ▼
Runtime Theme Loader
        │
        ▼
--ui-* runtime properties
        │
        ▼
TM-0 semantic presentation pipeline
```

The underlying architecture is coherent: persisted Theme Definitions are resolved into runtime state and injected into the same CSS-variable contract used by the bundled fallback theme.

## Theme Definition and Runtime State

The recovered `ThemeProfile` defines identity and metadata plus separate light/dark colour definitions using the Fill/Pen/Edge semantic grammar.

The active theme is managed through a Pinia store containing the active theme ID, resolved Theme Definition, loading/error state and derived active-theme information. The selected theme ID is persisted in a one-year cookie.

A particularly important legacy behaviour is:

```text
activeThemeData === null
        ↓
remove runtime --ui-* overrides
        ↓
theme-default.css becomes effective
```

Consequently, the bundled CSS theme acts as the deterministic default and failure fallback without requiring a duplicate runtime representation.

This mechanism should be preserved conceptually.

TM-1 also confirms the TM-0 model discrepancy: TypeScript defines six interaction states—`default`, `hover`, `active`, `selected`, `visited`, `disabled`—while the CSS contract additionally defines `shadow` for Fill and Pen. This must receive an explicit TM-2 disposition.

## Theme Resolution and Runtime Application

Global route middleware initializes Theme Manager from the persisted theme ID before route rendering. If the theme has already been hydrated, unnecessary retrieval is avoided.

Missing themes or retrieval failures cause Theme Manager to clear the active selection and fall back to the bundled default.

The client runtime loader observes the resolved Theme Definition and writes properties using:

```text
--ui-{key}-{state}-{mode}
```

When switching themes, properties belonging to the previous theme are removed before the new definition is applied.

This confirms the TM-0 finding that persisted themes and the static fallback theme feed the **same downstream semantic presentation system**. Runtime switching therefore requires no Tailwind recompilation.

The mechanism should be retained but strengthened with explicit validation and a common application engine shared by normal theme application and live preview.

## Persistence and API

The legacy capability defines a storage-independent `IThemeRepository` with four operations:

```text
findThemeById()
listThemes()
saveTheme()
deleteTheme()
```

Five API endpoints provide the corresponding CRUD lifecycle:

```text
GET    /api/themes
POST   /api/themes
GET    /api/themes/:id
PUT    /api/themes/:id
DELETE /api/themes/:id
```

The abstraction is architecturally valuable and should be preserved.

However, the recovered repository contains **no implementation or registration mechanism for `getThemeRepository()`**, despite every API handler depending upon it. Persistence provisioning is therefore an implicit/incomplete external dependency.

TM-2 must make repository/provider registration explicit while keeping Theme Manager independent of any particular database or persistence technology.

API validation is also weak. The recovered implementation principally checks identity, name, duplicate IDs and path/body ID consistency rather than validating the complete Theme Definition. The CRUD semantics should survive, but validation and error contracts require strengthening.

## Theme Management UI

The recovered Theme Manager contains a substantial management interface rather than merely runtime infrastructure.

The Theme Library provides:

- default and custom theme listing;
- active-theme indication;
- theme application and return to default;
- create/edit navigation;
- loading and empty states.

The Theme Editor provides:

- create, edit and delete;
- name and description editing;
- light/dark editing contexts;
- Fill/Pen/Edge navigation;
- visual colour pickers and direct value editing;
- immediate live preview;
- raw JSON editing and formatting;
- persistence through the Theme API;
- active-theme refresh after editing.

New themes are created by deep-cloning the default Theme Definition, providing a complete initial token structure.

These behaviours constitute genuine legacy functionality and must be preserved or explicitly superseded.

The editor should become the foundation for the expanded Theme Definition established after TM-0:

```text
Theme Definition
├── colour
├── typography
├── spacing
├── radii
├── shadows/effects
├── breakpoints
├── containers
├── modes
└── theme assets
```

## Boundary and Coupling Findings

The management pages currently depend directly upon an `account` layout and `authentication` middleware. These are historical composition dependencies, not intrinsic Theme Manager responsibilities.

Theme Manager may expose protected theme-management resources, but authentication, identity and authorization remain external capabilities.

Likewise, Theme Manager legitimately owns the UI required to manage themes, but it does **not** thereby own the reusable application UI component library. The component-styling coupling identified during TM-0 remains a UI/Theme Manager integration concern for later reconciliation.

Default-theme identity is also inconsistent: both `default-fresh` and the opaque identifier `dJKnu457dh387dgasdjgysaH` occur in the management implementation. TM-2 should establish one canonical default-theme identity/resolution contract.

## Migration Action Matrix

| Area | Action |
|---|---|
| Raw → semantic → Tailwind architecture | **KEEP** — core Theme Manager architecture |
| Static/runtime themes using same variable contract | **KEEP** |
| Runtime mutation without Tailwind recompilation | **KEEP** |
| Default-theme CSS fallback | **KEEP + HARDEN** |
| Existing colour roles/states/modes | **KEEP + HARDEN** |
| 560 raw / 280 semantic / 280 Tailwind colour mapping | **KEEP + TEST** cardinality and equivalence |
| Fill/pen `shadow` vs TypeScript state-model mismatch | **FIX** |
| Misleading historical `--ui-*` / `--api-*` documentation | **FIX** in new implementation |
| Theme Definition schema | **HARDEN** — explicit, validated and versioned |
| Semantic presentation interface | **HARDEN** as public Theme Manager contract |
| Runtime loader/property generation | **HARDEN** through validated theme definitions |
| Failure/malformed/missing-theme handling | **HARDEN** |
| Persistence | **HARDEN** behind storage-independent repository contracts |
| Authentication/authorization | **DECOUPLE** — external capabilities |
| UI source-directory knowledge / Tailwind `@source` coupling | **REMOVE** from Theme Manager responsibility |
| Authentication source-directory knowledge | **REMOVE** |
| UI component CSS in Theme Manager | **REMOVE / MOVE TO UI** |
| UI component-specific concepts (`card`, `sidebar`, `hero`, etc.) | **REMOVE** from Theme Manager domain |
| `main.css` cross-capability aggregation | **FIX / SEPARATE** |
| Unimplemented/comment-only historical token families | **REMOVE or explicitly define** |
| Legacy repository | **KEEP IMMUTABLE** throughout migration |

## Theme Manager Extension Matrix

The legacy architecture should be extended rather than replaced. The existing non-colour Tailwind vocabulary becomes the starting point for a broader runtime-theme model.

| Family | Target |
|---|---|
| Colour | **KEEP + HARDEN** existing runtime theme capability |
| Font families | **EXTEND** into theme variables |
| Text sizes | **EXTEND** into theme variables |
| Font weights | **EXTEND** into theme variables |
| Spacing | **EXTEND** into theme variables |
| Radius | **EXTEND** into theme variables |
| Standard shadows | **EXTEND** into theme variables |
| Inset shadows | **EXTEND** into theme variables |
| Drop shadows | **EXTEND** into theme variables |
| Text shadows | **EXTEND** into theme variables |
| Breakpoints | **EXTEND** to runtime/theme specification |
| Containers | **EXTEND** to runtime/theme specification |
| Background/theme imagery | **ADD** semantic theme-asset support |

The intended evolution is therefore:

```text
Theme Definition
├── Colour
├── Typography
├── Spacing
├── Radius
├── Shadows
├── Breakpoints
├── Containers
├── Modes
└── Theme assets / imagery
        ↓
Semantic Theme API
        ↓
TailwindCSS presentation vocabulary
        ↓
UI-owned component composition
```

## Migration Disposition

The principal legacy capabilities have the following consolidated disposition:

| Capability | Disposition |
|---|---|
| Theme Definition | **Extend and validate** |
| Active-theme state/resolution | **Preserve and harden** |
| Default CSS fallback | **Preserve** |
| Runtime theme application | **Preserve and extend** |
| `useTheme()` consumer facade | **Preserve concept; formalise contract** |
| Repository abstraction | **Preserve and formalise provisioning** |
| CRUD API | **Preserve and strengthen** |
| Theme Library | **Preserve** |
| Theme Editor | **Preserve and extend** |
| Live preview | **Preserve; share runtime engine** |
| Raw JSON editing | **Preserve** |
| Default-theme magic IDs | **Replace with canonical identity** |
| Authentication/account-layout coupling | **Decouple** |
| Reusable component styling | **UI responsibility** |

## TM-1 Gate Conclusion

TM-1 found no additional unidentified functional subsystem in the recovered legacy Theme Manager.

Together, TM-0 and TM-1 now account for the recovered presentation architecture, Theme Definition, runtime resolution and switching, fallback behaviour, state management, persistence abstraction, API lifecycle, management GUI and historical cross-capability dependencies.

The **TM-0/TM-1 zero-functional-loss discovery gate is satisfied**: legacy behaviour is sufficiently identified and classified that subsequent architectural decisions can be explicit rather than accidental.

The next authorised objective is:

**TM-2 — Target Architecture and Contracts**

TM-2 should reconcile these recovered behaviours against the current Platform Architecture and formally establish the new Theme Manager boundary, Theme Definition, public interfaces, persistence/provider contracts, runtime resolution/application model, UI integration boundary and external authentication/authorization relationships before implementation begins.