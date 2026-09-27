# TM-5 — Runtime Engine Migration

## Purpose and Status

TM-5 migrates the recovered Theme Manager runtime behaviour into the new bounded capability and hardens it around the TM-2 Effective Theme architecture.

Legacy evidence was read from immutable baseline:

```text
nuxt4-layers/legacy-theme-manager
8847e6b1d8ebbca83f00d17b0cddb18522219c6e
```

TM-5 implements runtime application, fallback, active-theme state, preview state and persisted selection-reference semantics. It deliberately does not implement the Theme repository, CRUD API or storage adapter assigned to TM-6.

## Recovered Behaviour Preserved

The legacy runtime established these invariants:

1. selected Theme identity is persisted for one year;
2. resolved active Theme state is reactive;
3. runtime Theme values override the bundled `--ui-*` values;
4. changing Theme removes the previous runtime overrides before applying the replacement;
5. default/no Theme is represented by no runtime overrides;
6. clearing or failing Theme application exposes `theme-default.css`;
7. light and dark values are applied to the same raw-variable contract;
8. preview and active application must use the same application mechanism.

TM-5 preserves and hardens these behaviours without retaining the legacy Pinia race/order coupling.

## Runtime Architecture

```text
persisted selection reference
          │
          ▼
  active Theme state ─────────┐
                              │
  temporary preview state ────┤
                              ▼
                       Effective Theme
                              │
                              ▼
                   Theme Application Engine
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          validated Theme            null / failure
                 │                         │
                 ▼                         ▼
       runtime --ui-* values       clear overrides
                 │                         │
                 └────────────┬────────────┘
                              ▼
                    semantic Theme API
                              ▼
                     Tailwind vocabulary
```

Preview state takes temporary precedence over active state. It does not alter the persisted selected Theme reference. Removing preview immediately exposes the active Theme again through the same application engine.

## Common Theme Application Engine

`shared/theme-runtime.ts` contains the environment-independent runtime kernel.

`createThemeApplication()` accepts a minimal style target rather than depending directly on the browser DOM. The client plugin supplies `document.documentElement.style`; tests supply an in-memory target.

Before a Theme is applied, the previous set of runtime variables is removed. The engine therefore cannot leave stale values from a previous Theme when the replacement contains a different presentation surface.

`clear()` removes every variable applied by the engine, exposing the bundled CSS default.

## Runtime Validation

Runtime Theme input is untrusted until `assertRuntimeTheme()` succeeds.

TM-5 validates:

- non-empty Theme identity and name;
- required light and dark recovered modes;
- presentation-role and state names before constructing CSS variable names;
- the six recovered interaction states for every supplied role;
- non-empty CSS presentation values.

Additional supplied states such as the recovered fill/pen `shadow` colour are applied but do not become a seventh interaction state.

This is the runtime validation required for the migrated application boundary. Full persisted Theme Definition/schema validation remains part of the persistence/import work that consumes the complete target Theme Definition.

## Legacy Compatibility Adapter

`legacyColourThemeToRuntime()` converts the recovered legacy shape:

```text
theme.colors.light
theme.colors.dark
```

into the new runtime shape without changing role/state semantics.

This adapter is a migration boundary, not the target persisted Theme Definition format.

## Active Theme State

`useThemeRuntime()` owns reactive runtime state:

- `selectedThemeId`;
- `activeTheme`;
- `previewTheme`;
- derived `effectiveTheme`;
- runtime error state;
- active/default derived information.

The selected Theme reference uses the recovered `active-theme-id` cookie with a one-year maximum age and `SameSite=Lax`.

The historical magic default identifier `default-fresh` is removed. Default is represented canonically by a null selection and null active Theme.

## Deterministic Fallback

Fallback is deliberately CSS-native:

```text
no effective Theme
      ↓
clear all runtime --ui-* overrides
      ↓
bundled theme-default.css is effective
```

If validation/application throws, the client integration clears runtime overrides and resets runtime state to the default. An invalid Theme cannot remain partially applied.

## Persistence Boundary

TM-5 does not fetch `/api/themes/:id` and does not create a Theme repository adapter.

On application startup, a persisted selection reference may exist before a Theme has been resolved. TM-5 preserves that reference while leaving the bundled CSS fallback effective. TM-6 supplies the repository/persistence resolution that turns an accessible persisted Theme reference into validated active Theme data.

This separation prevents the legacy implicit persistence/API dependency from being recreated inside the runtime engine.

## Public Runtime Contract

The supported `/contracts` entry point exports the runtime Theme/application types and pure application/validation functions required for integration and testing.

DOM manipulation, Nuxt state and the client plugin remain implementation details.

## Quality Gate

TM-5 tests verify:

- exact recovered `--ui-{role}-{state}-{mode}` naming;
- light/dark runtime application;
- additional effect-colour state application;
- complete removal of previous Theme overrides;
- CSS fallback after clear;
- six-state validation;
- legacy colour-payload adaptation;
- rejection of unsafe CSS-variable path segments.

Nuxt typecheck, TM-3 foundation tests and TM-4 presentation-equivalence tests remain mandatory.

## TM-5 Boundary

TM-5 does not implement:

- Theme repository/storage adapters;
- Theme CRUD API;
- persisted Theme Definition serialization;
- Theme management UI;
- Identity/Authorization integration;
- physical asset storage;
- import/export persistence;
- assignment/library persistence.

Those remain subsequent work packages.

## TM-5 Gate Conclusion

TM-5 establishes a validated common Theme Application Engine, reactive Effective Theme state, preview semantics, canonical CSS fallback and persisted selection-reference behaviour without coupling runtime application to persistence technology or the management UI.

The runtime foundation is therefore ready for **TM-6 — Persistence and Theme Management**.
