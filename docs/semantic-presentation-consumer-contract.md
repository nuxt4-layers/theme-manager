# Semantic Presentation Consumer Contract

## Purpose

Theme Manager exposes a stable presentation boundary for UI and other presentation consumers without knowing their components, source tree or implementation technology.

The public integration surface is:

- capability: `SemanticPresentationTheme`, contract version `1`;
- package stylesheet: `@nuxt4-layers/theme-manager/presentation.css`;
- TypeScript/domain contracts: `@nuxt4-layers/theme-manager/contracts`;
- normal Nuxt-layer composition through `@nuxt4-layers/theme-manager`.

## Dependency Direction

```text
Theme Manager
     │
     │ SemanticPresentationTheme v1
     ▼
presentation consumer / UI capability
```

Theme Manager MUST NOT import the UI capability, UI components, UI source paths or UI token definitions.

A composition application may install and compose both capabilities. The consuming UI capability may rely on the Theme Manager public semantic presentation contract.

## Runtime Contract

Theme Manager owns the effective Theme and writes runtime raw `--ui-*` values through its Theme Application Engine.

Those values are projected through Theme Manager's semantic API and Tailwind vocabulary. Consumers use semantic presentation vocabulary; they do not apply Themes independently and do not mutate Theme Manager runtime state through private implementation.

The public stylesheet packages the:

```text
default raw Theme
      ↓
semantic Theme API
      ↓
Tailwind semantic vocabulary
```

It deliberately contains no UI component CSS and no source-scanning knowledge of any consuming repository.

## Composition

For an independently maintained consuming layer, the platform architecture requires normal package-manager installation and package-name Nuxt composition. During early development a pinned Git package revision is permitted; stable released versions should use normal package versions.

A host application is responsible for selecting compatible versions and testing the composed system.

## Compatibility

A compatible consumer:

1. consumes only declared public Theme Manager surfaces;
2. treats semantic presentation vocabulary as the styling boundary;
3. does not depend on `assets/css/theme/theme-default.css`, `theme-api.css` or other private file paths;
4. does not mutate raw Theme state as a substitute for Theme Manager;
5. preserves accessibility constraints when presenting user-customisable values;
6. does not require Theme Manager to know component names or source topology.

Breaking the semantic contract requires explicit compatibility/version treatment.
