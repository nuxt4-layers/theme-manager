# TM-3 — New Repository Foundation

## Purpose and Status

TM-3 establishes the package-ready Nuxt 4 Layer repository foundation required before legacy presentation or runtime behaviour is migrated.

It implements repository structure and public-boundary scaffolding only. It does not perform TM-4 Presentation Engine Migration, TM-5 Runtime Engine Migration, persistence-provider implementation, management UI implementation or later integration work.

## Governing Architecture

TM-3 is governed by:

- the accepted TM-2 target architecture and contracts;
- the platform Layer Repository Standard;
- the platform Layer Interface Standard;
- the Capability Manifest standard;
- the Compatibility and Versioning Standard.

Where sibling repositories contain historical Theme responsibilities that conflict with TM-2, TM-2 and the platform architecture remain authoritative.

## Repository Foundation

TM-3 establishes:

```text
/
├── .github/workflows/quality.yml
├── contracts/
│   └── index.ts
├── docs/
│   ├── contracts.md
│   └── migration_plan/
├── playground/
│   ├── app/app.vue
│   └── nuxt.config.ts
├── tests/
│   └── foundation.test.ts
├── capability.json
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

Directories such as `app/`, `server/` and `shared/` are created only when their implementation stages require them; empty directories are not architectural artefacts.

## Package Contract

The package identity is:

```text
@nuxt4-layers/theme-manager
```

TM-3 begins pre-1.0 development at package version `0.1.0`.

The deliberate package exports are:

- `.` — Nuxt Layer entry point;
- `./contracts` — supported public TypeScript contracts;
- `./capability` — machine-readable capability manifest.

The repository is package-ready while remaining private/unpublished during this stage.

## Capability Manifest

The manifest uses schema version `1`, classifies Theme Manager as a `foundation` capability and declares contract version `1` for:

- `ThemeManagement`;
- `SemanticPresentationTheme`.

TM-3 declares no mandatory cross-capability requirement. Identity, Authorization, Asset/Resource and persistence integrations remain external boundaries, but concrete manifest dependencies are added only when an actual integration contract is established.

Tailwind CSS is not represented as a capability dependency merely because it is part of Theme Manager's presentation implementation.

## Public Contract Foundation

TM-3 establishes foundational public domain vocabulary for Theme ownership, visibility, lifecycle, presentation, modes, semantic asset references, Theme summaries, Theme actions and the provider-independent `ThemeRepository` port.

The persistence port accepts and returns JSON-compatible values rather than database/provider SDK types.

TM-3 intentionally does not freeze the detailed recovered token grammar or implement runtime Theme Definition validation. Those belong to the migration stages that bring the recovered presentation/runtime systems into the new foundation.

## Nuxt Composition Fixture

A minimal playground extends the repository root as a Nuxt Layer. Its purpose is to provide a composition target for foundation and later integration verification without introducing application-specific behaviour into Theme Manager.

## Quality Gate

The repository provides:

- Nuxt type checking;
- Vitest foundation tests;
- a combined `pnpm check` command;
- GitHub Actions quality execution on pull requests and pushes to `master`.

Foundation tests verify package/manifest identity and version agreement, deliberate export-map shape and the absence of fabricated mandatory capability dependencies.

The bootstrap workflow uses `pnpm install --no-frozen-lockfile` because no repository lockfile existed before TM-3. A generated lockfile should be committed once dependency installation is performed and then CI should move to frozen-lockfile installation.

## TM-3 Boundary

TM-3 does not:

- migrate legacy CSS or semantic token values;
- implement Tailwind presentation mapping;
- implement runtime Theme application/switching;
- implement Theme persistence adapters or CRUD endpoints;
- implement the Theme Administration GUI;
- implement Identity or Authorization;
- implement physical asset storage;
- implement Theme import/export behaviour.

Those remain assigned to subsequent authorised work packages.

## TM-3 Gate Conclusion

TM-3 establishes a package-ready, independently testable Nuxt 4 Layer foundation with an explicit public contract entry point, machine-readable capability metadata, provider-independent persistence boundary, composition fixture and automated quality gate.

The repository is therefore structurally ready for **TM-4 — Presentation Engine Migration** without pre-empting later migration stages.
