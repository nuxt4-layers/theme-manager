# Theme Manager Public Contract

## Purpose

Theme Manager is a Nuxt 4 foundation presentation capability. Its supported cross-layer surface is deliberately exposed through the package root and `@nuxt4-layers/theme-manager/contracts`.

Consumers MUST NOT depend on undocumented implementation paths.

## Provided capabilities

The capability manifest currently declares:

- `ThemeManagement` contract version `1`;
- `SemanticPresentationTheme` contract version `1`.

These contracts define the supported capability boundary for Theme management and semantic presentation.

## Theme domain data

The public contract establishes foundational types for:

- Theme identity and metadata;
- ownership using opaque external identity references;
- visibility;
- lifecycle;
- presentation families;
- presentation modes;
- semantic asset references;
- Theme summaries;
- Theme Manager authorization action names.

The concrete presentation grammar and runtime-validatable Theme Definition schema are implemented behind this public boundary. Consumers must use the declared contracts rather than infer contracts from internal implementation details.

## Persistence port

`ThemeRepository` is provider agnostic and crosses the persistence boundary using JSON-compatible values.

The repository provider does not define Theme semantics. Theme Manager remains responsible for serialization, schema validation, semantic validation and normalisation before persisted values become trusted Theme domain objects.

No database, ORM or provider SDK type is part of the public contract.

## External integration boundaries

Theme Manager does not require another platform capability merely to load as a Nuxt Layer.

Identity, Authorization, Asset/Resource and persistence-provider integrations are external boundaries. Machine-readable `requires` declarations MUST represent only actual required or optional capability dependencies and MUST agree with the human-readable architecture.

Tailwind CSS is a Theme Manager implementation/package dependency when presentation migration requires it; it is not thereby a cross-capability manifest requirement.

## Supported imports

The package foundation exposes:

```text
@nuxt4-layers/theme-manager
@nuxt4-layers/theme-manager/contracts
@nuxt4-layers/theme-manager/capability
```

The root entry is the Nuxt Layer. `/contracts` is the supported TypeScript contract entry point. `/capability` exposes machine-readable capability metadata.

## Compatibility

Until a stable public release is declared, consumers should treat the package as pre-1.0. Breaking public-contract changes must still be documented.

Production composition applications must pin the exact integrated dependency set and test it before deployment.

## Security

Theme Definition data and persisted JSON crossing trust boundaries are untrusted until runtime validation succeeds. TypeScript types are not a substitute for runtime validation.

Runtime validators and import/application boundaries enforce this requirement.
