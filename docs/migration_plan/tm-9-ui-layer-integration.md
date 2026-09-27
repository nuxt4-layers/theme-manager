# TM-9 — UI-Layer Integration

## Purpose and Status

TM-9 completes the Theme Manager side of integration with presentation consumers.

The corrected capability boundary is intentionally asymmetric: UI consumes Theme Manager's semantic presentation contract; Theme Manager does not depend on, inspect or require the UI capability.

## Live Repository Audit

TM-9 verified the live `nuxt4-layers/ui` repository rather than assuming a historical UI-Library topology.

The current UI foundation declares itself responsible for reusable presentation primitives and design-token consumption, but its initial implementation also contains a provisional independent token grammar and theme validation/application helper.

Those facilities predate completion of the recovered Theme Manager contract and represent downstream UI migration work.

They are not copied into Theme Manager and TM-9 does not edit the UI repository.

## Public Presentation Entry Point

Theme Manager now deliberately exports:

```text
@nuxt4-layers/theme-manager/presentation.css
```

This packages the Theme Manager-owned presentation pipeline without requiring a consumer to import private repository paths.

The package also continues to expose:

```text
@nuxt4-layers/theme-manager
@nuxt4-layers/theme-manager/contracts
@nuxt4-layers/theme-manager/capability
```

## Dependency Direction

```text
Theme Manager
    provides
SemanticPresentationTheme v1
        │
        ▼
UI / presentation consumer
```

Theme Manager's capability manifest retains no required UI dependency.

No `@nuxt4-layers/ui` package dependency is introduced.

## Composition

The host application selects compatible Theme Manager and UI versions through the package manager and Nuxt layer composition.

The host remains responsible for composed-system verification.

Theme Manager does not use `@source` directives to scan a UI repository and does not know component paths. This removes the recovered legacy build-time coupling.

## Styling Boundary

Theme Manager owns:

- Theme Definition semantics;
- effective Theme resolution;
- runtime Theme application;
- raw Theme values;
- semantic Theme API;
- Tailwind semantic vocabulary;
- semantic Theme-to-asset bindings.

A UI consumer owns:

- reusable presentation primitives;
- reusable components;
- component-level accessibility behaviour;
- semantic-token consumption.

Reusable component CSS does not return to Theme Manager.

## Runtime Authority

There must be one effective Theme authority.

A consumer may style itself from Theme Manager's semantic contract, but must not establish a parallel effective-Theme engine that competes with Theme Manager.

The current UI repository's provisional `validateUiTheme/applyUiTheme/resetUiTheme` facilities therefore require reconciliation in the separate UI migration.

TM-9 records that obligation but does not create a Theme Manager → UI dependency to solve it.

## Accessibility

UI consumption of Theme values remains subject to the platform WCAG 2.2 AA engineering target. Theme Manager supplies semantic values and validation boundaries; component-level accessible behaviour remains UI responsibility.

## Quality Gate

TM-9 tests verify:

- the deliberate public presentation stylesheet export;
- `SemanticPresentationTheme` contract version 1 remains provided;
- Theme Manager has no UI capability/package dependency;
- Theme Manager has no consuming-source topology knowledge;
- component styling remains outside Theme Manager;
- the live UI divergence is explicitly recorded as downstream migration work.

All TM-3 through TM-8 tests and Nuxt typecheck remain mandatory.

## TM-9 Boundary

TM-9 does not:

- migrate or redesign the separate UI repository;
- import UI components;
- copy UI token definitions;
- restore legacy component CSS;
- introduce UI source scanning;
- change Theme Manager runtime authority;
- define host-application composition routes.

## TM-9 Gate Conclusion

Theme Manager now exposes a stable, versioned, package-consumable semantic presentation boundary while remaining independent of UI implementation.

Its side of UI-layer integration is complete. The separate UI capability can now be migrated to consume this contract without requiring further Theme Manager knowledge of UI internals.

Theme Manager is therefore ready for **TM-10 — Composition and Legacy Retirement**.
