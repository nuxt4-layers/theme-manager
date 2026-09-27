# TM-4 — Presentation Engine Migration

## Purpose and Status

TM-4 migrates the recovered Theme Manager presentation engine from immutable legacy evidence into the new bounded Nuxt 4 Layer.

The migration preserves the proven raw-theme → semantic-API → Tailwind vocabulary architecture and removes the historical build-time coupling that crossed Theme Manager's capability boundary.

Legacy source baseline:

```text
nuxt4-layers/legacy-theme-manager
8847e6b1d8ebbca83f00d17b0cddb18522219c6e
```

The legacy repository was read only and was not modified.

## Migrated Presentation Pipeline

```text
Bundled Default Theme
raw --ui-* values
        ↓
Semantic Theme API
--api-* contract
        ↓
Tailwind CSS v4 theme vocabulary
--color-* and non-colour presentation vocabulary
        ↓
semantic Tailwind utilities consumed by UI
```

The three recovered presentation assets are migrated into the new repository:

```text
assets/css/
├── main.css
├── theme/
│   ├── theme-default.css
│   └── theme-api.css
└── tailwindcss/
    └── tailwind-config.css
```

The recovered default, semantic API and Tailwind configuration are preserved as migration evidence-compatible presentation definitions. Runtime application is not introduced by TM-4.

## Colour Equivalence Gate

Automated tests protect the recovered colour system:

- **560** raw mode-specific `--ui-*` colour values;
- **280** unique semantic `--api-*` properties, projected for both light and dark mode;
- **280** Tailwind `--color-*` mappings;
- every Tailwind colour mapping targets a defined semantic API property;
- every semantic light/dark mapping resolves to a bundled raw default value.

The legacy `shadow` suffix retained in fill/pen colour names is treated as the colour input used by the effects/shadow system, not as a seventh UI interaction state. The target interaction model therefore remains the six states established by TM-2.

## Non-colour Vocabulary

TM-4 also preserves the recovered non-colour Tailwind vocabulary:

| Family | Recovered cardinality |
|---|---:|
| Font families | 3 |
| Text sizes | 7 |
| Font weights | 7 |
| Breakpoints | 8 |
| Containers | 2 |
| Spacing | 31 |
| Radius | 6 |
| Standard shadows | 56 |
| Inset shadows | 60 |
| Drop shadows | 56 |
| Text shadows | 56 |

Shadow utilities already resolve through semantic fill/pen shadow colours and therefore participate in Theme colour changes without duplicating colour ownership.

TM-2 additionally requires Theme Definitions to extend into typography, spacing, radii, effects, responsive values and assets. TM-4 preserves the recovered presentation vocabulary on which that extension operates; it does not pre-empt TM-5's runtime application engine by introducing runtime mutation here. Responsive runtime behaviour in particular must be proven against the Tailwind/CSS mechanism before a runtime contract is claimed.

## Boundary Corrections

The legacy `main.css` is not copied wholesale because it contained architecture explicitly rejected by TM-0/TM-2.

Removed from Theme Manager:

- hard-coded `@source` knowledge of host-application files;
- hard-coded source knowledge of the legacy UI Library;
- hard-coded source knowledge of Authentication;
- import of Theme Manager-local reusable component CSS.

The new `main.css` imports only Tailwind CSS and Theme Manager's own presentation definitions, plus the recovered generic scrollbar utility.

Reusable component styling belongs to the UI capability. Consumer source discovery belongs to the consuming build/composition context.

## Nuxt and Tailwind Integration

The Theme Manager Nuxt Layer registers its presentation entry point as global CSS and installs the Tailwind CSS v4 Vite integration.

Tailwind packages are implementation/package dependencies of Theme Manager. They are not platform capability dependencies and therefore do not appear in `capability.json.requires`.

## Quality Gate

`tests/presentation-engine.test.ts` verifies:

- raw, semantic and Tailwind colour cardinality;
- uniqueness where required;
- raw → semantic mapping completeness;
- semantic → Tailwind mapping completeness;
- recovered non-colour vocabulary cardinality;
- absence of consumer/UI/Auth source-topology coupling in Theme Manager's CSS entry point.

The existing TM-3 foundation tests and Nuxt typecheck remain part of the same `pnpm check` gate.

## TM-4 Boundary

TM-4 does not implement:

- persisted Theme loading;
- active-theme selection;
- runtime application or switching;
- preview application;
- Theme persistence adapters or CRUD;
- Theme management UI;
- Identity/Authorization integration;
- physical asset storage;
- import/export behaviour.

These remain assigned to TM-5 and later work packages.

## TM-4 Gate Conclusion

TM-4 migrates the recovered presentation engine into the new repository while preserving its established semantic contract and cardinality, integrating Tailwind CSS v4 at the Theme Manager boundary, and removing the legacy cross-capability CSS/source coupling.

The presentation foundation is therefore ready for **TM-5 — Runtime Engine Migration**.
