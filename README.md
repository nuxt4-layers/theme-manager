# Theme Manager

Theme Manager is the Nuxt 4 platform capability responsible for defining, validating, resolving, applying and managing semantic presentation themes.

It provides a stable presentation contract between theme definitions and consuming UI while keeping application components independent of concrete theme values. Tailwind CSS is the presentation mechanism through which the semantic theme vocabulary is exposed.

> **Status:** The Theme Manager re-baselining programme **TM-0 through TM-10 is complete**. This repository is the implementation baseline for future composition. The legacy Theme Manager remains unchanged as immutable migration evidence.

## Architecture

The core presentation pipeline is:

```text
Theme Definition
      ↓
Raw runtime representation
      ↓
Semantic Theme API
      ↓
Tailwind CSS presentation vocabulary
      ↓
UI-owned component composition
```

A consuming UI works with semantic presentation meaning rather than hard-coded theme values. Runtime theme changes therefore do not require UI components to understand how a theme is stored, selected or constructed.

The resolved **Effective Theme** is the canonical runtime result. It may originate from the bundled default, an accessible selected theme, preference resolution or deterministic fallback.

## What Theme Manager Owns

Theme Manager owns the Theme domain and presentation contract, including:

- versioned Theme Definitions and runtime validation;
- semantic colour, typography, spacing, radius and effects/shadow values;
- responsive breakpoint and container values;
- presentation modes;
- semantic theme-asset references and bindings;
- theme resolution, fallback, runtime application and switching;
- theme preference semantics;
- Theme resource ownership, visibility, sharing and lifecycle semantics;
- the Theme Manager action/resource vocabulary used by external Authorization;
- provider-agnostic persistence contracts and canonical Theme Definition JSON;
- Theme Definition import and export;
- Theme Library, Theme Editor, live preview and other Theme administration workflows.

The Theme Manager remains one bounded Nuxt 4 Layer. Internal separation between its kernel, contracts, server integration and optional management projection does not create separate capabilities.

## Capability Boundaries

Theme Manager deliberately does **not** own:

- reusable application UI components or component-specific styling;
- authentication;
- identity implementation or membership semantics;
- authorization policy, role assignment or permission assignment;
- application-specific route/layout policy;
- database or storage-provider technology;
- physical image/asset storage, upload or binary processing;
- consuming application or UI repository topology.

Identity supplies opaque actor, user, group or organisation references where required. Theme Manager records Theme-domain ownership and sharing semantics against those references without owning the external identity model.

Theme Manager defines operations such as `theme.read`, `theme.create`, `theme.edit`, `theme.delete`, `theme.use`, `theme.publish`, `theme.share`, `theme.import`, `theme.export` and `theme.assign`. An external Authorization capability determines whether an actor may perform those actions.

## Theme Administration

Theme Manager includes an **optional self-contained administration projection** for Theme-specific workflows.

The management experience may provide:

- Theme Library and discovery;
- colour editing;
- typography editing;
- spacing, radius and effects editing;
- responsive-value editing;
- semantic asset management;
- raw Theme Definition editing;
- import/export;
- live preview;
- ownership, visibility and publishing operations.

This projection may use Vue/Nuxt and Theme Manager's own semantic Tailwind presentation contract, but it does not depend on the platform UI capability.

The consuming composition application decides where Theme administration views are routed and exposed. It is not required to reconstruct Theme Manager workflows from individual buttons or controls.

## Ownership, Visibility and Theme Libraries

Theme ownership, visibility, authorization and selection are distinct concepts:

- **ownership** identifies who controls a Theme resource;
- **visibility** identifies who may discover or access it;
- **authorization** determines what an actor may do with it;
- **selection** identifies which accessible theme an actor or context wants applied.

Theme Manager supports private, group, organisation, explicitly shared, public and protected system visibility semantics.

Theme libraries are projections over the same Theme resources rather than separate storage systems. Depending on actor context and authorization, projections can include **My Themes**, **Group Themes**, **Organisation Themes**, **Shared With Me**, **Public Themes** and **System Themes**.

Public and system themes may be made available to anonymous consumers without transferring ownership.

## Persistence

Theme persistence is provider agnostic.

Theme Manager defines the repository contract and owns the canonical, versioned JSON representation crossing that boundary. A composition application supplies the persistence adapter, which may use PostgreSQL, a filesystem, a remote service, in-memory storage or another compatible provider.

Persisted data is validated in both directions:

```text
Theme Definition
      ↓
validate + normalise
      ↓
canonical JSON
      ↓
Theme Repository
      ↓
Storage Provider
```

Data read from storage is treated as untrusted persisted input and must be parsed, schema-validated and semantically validated before becoming a Theme domain object.

Storage providers store and retrieve the representation; they do not define Theme semantics.

## Theme Assets

Theme Definitions contain **semantic asset references**, not embedded image binaries.

Theme Manager owns the semantic role, association, validation, resolution and fallback of an asset reference. An external Asset/Resource provider may own physical upload, storage, MIME/type checks, size controls, processing, retrieval and binary lifecycle.

Semantic roles describe presentation purpose rather than UI component names, for example:

- `background-page`;
- `background-surface`;
- `background-feature`;
- `background-prominent`.

## Import and Export

Theme import/export is a Theme Manager kernel capability.

Imported JSON is untrusted input. Before persistence it is subject to safe parsing, schema/version validation, semantic validation, asset-reference validation, authorization and ownership checks, normalisation and identifier/collision handling.

Ownership, visibility or privileged lifecycle metadata supplied by an imported file is not automatically trusted. Trusted Theme Manager operations assign or constrain security-sensitive resource metadata according to actor context and external authorization decisions.

Export produces a valid versioned Theme Definition representation suitable for validation and later import.

## Default and Fallback

Theme Manager provides a canonical protected default theme that is always available, complete and schema-valid.

The default cannot be modified through normal CRUD operations. If a selected theme cannot be resolved or safely applied, Theme Manager falls back deterministically to the bundled default presentation.

## Documentation and Architecture Authority

The platform-wide architectural authority is maintained in the `nuxt4-layers/platform-architecture` repository.

Theme Manager migration and target-architecture records are maintained under:

```text
docs/migration_plan/
├── tm-0-legacy-assets-architecture-audit.md
├── ...
└── tm-10-composition-legacy-retirement.md
```

TM-0 and TM-1 record the recovered presentation and functional surface. TM-2 defines the target architecture and explicit migration dispositions. TM-3 through TM-9 implement the staged capability. TM-10 records final composition and legacy-retirement reconciliation.

## Semantic Presentation Guide

Consumers and maintainers should read the [Semantic Presentation Guide](docs/semantic-presentation-guide.md) before composing Theme Manager presentation tokens.

It defines the Fill/Pen/Edge/Effects grammar, semantic role and state pairing, palette responsibilities, WCAG/accessibility review order, shadow treatment, and the distinction between semantic-application and palette defects.

## Installation and Composition

The package identity is:

```text
@nuxt4-layers/theme-manager
```

During early independent development, a consuming application may install the repository as a pinned Git-backed package dependency. Stable releases are intended to be consumed as versioned packages.

The Nuxt Layer is the package root export and is composed using Nuxt `extends` after installation. Production applications must pin and integration-test the exact dependency revision rather than follow a changing default branch.

The host application is the composition root. It supplies persistence and external access-control adapters, chooses compatible peer capabilities and integration-tests the composed system. See `docs/composition-contract.md`.

## Public Exports

The capability exposes four deliberate package entry points:

```text
@nuxt4-layers/theme-manager
@nuxt4-layers/theme-manager/contracts
@nuxt4-layers/theme-manager/capability
@nuxt4-layers/theme-manager/presentation.css
```

The root is the Nuxt Layer entry point, `/contracts` is the supported TypeScript contract surface, `/capability` exposes machine-readable capability metadata, and `/presentation.css` is the supported semantic presentation stylesheet. Undocumented internal paths are not public contracts.

## Development and Testing

The repository uses pnpm.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` runs the complete Theme Manager quality gate. Pull requests and pushes to `master` run the same quality checks in GitHub Actions.

A minimal `playground/` application extends the repository root as a local capability fixture. Final composed applications remain responsible for testing their selected external adapters and peer capabilities.

## Development Status

**TM-10 — Composition and Legacy Retirement is complete.** The TM-0/TM-1 recovered surface has been reconciled against the implemented dispositions, the final composition contract is documented, and the legacy repository is retired from future implementation use while remaining unchanged as immutable evidence.

Future work occurs through normal capability evolution and downstream composition, including the separate UI migration to consume `SemanticPresentationTheme`.
