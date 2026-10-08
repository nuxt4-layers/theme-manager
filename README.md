# Theme Manager

Theme Manager is a Nuxt 4 Layer for defining, validating, applying and managing runtime-configurable semantic presentation themes.

It provides one Theme authority between Theme Definitions and consuming UI. Applications consume semantic presentation meaning through Tailwind CSS rather than hard-coded colour, typography, spacing, radius or effect values.

> **Release status:** `v0.1.0` is the existing pre-1.0 GitHub release, but `master` has substantial unreleased changes, including presentation-vocabulary and editor changes. `v0.2.0` is being prepared in a release PR, but has not yet been tagged or published. The repository package is marked `private`; a GitHub source release does not imply npm publication or a stable public API.

## What it provides

Theme Manager owns:

- versioned Theme Definitions, runtime validation and deterministic fallback;
- semantic colour, typography, spacing, radius, effects/shadows, responsive and asset-reference values;
- effective Theme resolution, runtime application, selection and switching;
- provider-agnostic Theme persistence contracts and canonical JSON import/export;
- Theme ownership, visibility, sharing and lifecycle semantics;
- Theme management workflows and an optional self-contained administration projection.

It deliberately does **not** own reusable application components, authentication, authorization policy, application routing, database technology or physical asset storage.

## Installation

The package identity is:

```text
@nuxt4-layers/theme-manager
```

This repository currently uses pre-1.0 source releases rather than a published npm package (`package.json` has `private: true`). Consumers may install an exact Git commit or immutable release tag. Do not follow a mutable default branch in an integration or deployment baseline; verify the selected revision in the consumer lockfile.

Compose the installed package root using Nuxt `extends`. The host application remains the composition root and is responsible for selecting and integration-testing the complete dependency set. The package requires Node.js 22 or later and declares pnpm 10.17.1 for development.

## Using the presentation vocabulary

The public presentation pipeline is:

```text
Theme Definition
      ↓
runtime --ui-* values
      ↓
Semantic Theme API
      ↓
Tailwind semantic vocabulary
      ↓
consuming UI
```

Consumers style by semantic meaning rather than by selecting concrete colours. For example:

```html
<button class="border border-edge-primary-default bg-fill-primary-default text-pen-primary-default">
  Save
</button>
```

Read the [Semantic Presentation Guide](docs/semantic-presentation-guide.md) before composing presentation tokens. It defines Fill/Pen/Edge/Effects grammar, semantic roles and states, palette responsibilities, accessibility review order and correct treatment of shadows.

For the strict consumer boundary, see the [Semantic Presentation Consumer Contract](docs/semantic-presentation-consumer-contract.md).

The public `@nuxt4-layers/theme-manager/presentation.css` entry point provides the semantic presentation stylesheet. When composed as a Nuxt layer, its internal `assets/css/layer.css` includes that stylesheet **and** registers Theme Manager's own management components as Tailwind sources. The latter path is private and is not a consumer import contract. Avoid adding the public stylesheet twice without checking the composed CSS configuration.

## Runtime Themes

Theme Manager owns the effective Theme. Runtime Theme values are validated and applied through Theme Manager rather than independently by consuming components.

A canonical protected default Theme is always available. The selected Theme identifier is stored in the `active-theme-id` cookie. Nuxt route middleware resolves a selected Theme, and a client plugin applies its `--ui-*` overrides to the document. If resolution or application fails, Theme Manager clears the selection and overrides to expose the bundled default. Editor previews normally remain scoped to their preview containers; the editor can optionally preview a valid draft across the application without saving it.

The stylesheet provides light and dark mappings via `:root` and `html.dark`. The inspected runtime does **not** independently manage a light/dark/system preference cookie, set the `dark` class, or install a pre-paint system-mode script. The host must arrange mode selection and first-paint handling where required.

Persisted Themes cross a provider-agnostic `ThemeRepository` boundary. Persisted and imported JSON is untrusted until parsed, schema-validated and semantically validated. See the [Theme Persistence Integration Guide](docs/persistence-integration-guide.md) for implementing and registering a host repository adapter, database-provider boundaries, fallback behaviour and integration verification.

Theme Definitions may contain semantic asset references. Physical upload, storage, processing and binary lifecycle remain external responsibilities.

## Theme management

The optional management projection currently provides Theme Library/discovery, editing, validation, scoped live preview, Theme selection and deletion. Canonical JSON parsing/serialization and lifecycle metadata exist in the domain layer; do not assume that every domain action (including import/export, publishing or sharing) has a dedicated management-screen workflow.

Theme Manager defines Theme-domain actions such as `theme.read`, `theme.create`, `theme.edit`, `theme.delete`, `theme.use`, `theme.publish`, `theme.share`, `theme.import`, `theme.export` and `theme.assign`. External Authorization decides whether an actor may perform them.

The host decides whether and where management routes are exposed. Management operations fail closed when required actor-context or authorization providers are absent. Without a composed `ThemeRepository`, the library offers only the built-in default and creation/editing are unavailable; the Theme HTTP endpoints return `503` rather than providing an implicit store. `GET /api/theme-manager/capabilities` reports storage availability.

## Public API and contracts

Supported package entry points are:

```text
@nuxt4-layers/theme-manager
@nuxt4-layers/theme-manager/contracts
@nuxt4-layers/theme-manager/capability
@nuxt4-layers/theme-manager/presentation.css
```

Undocumented internal paths are private implementation details.

Reference documentation:

- [Changelog](CHANGELOG.md) — changes since `v0.1.0` and release preparation status.
- [Upgrade guide for v0.2.0](docs/upgrading-to-v0.2.0.md) — breaking changes, stored-Theme vocabulary and consumer migration checklist.

- [Public Contract](docs/contracts.md) — supported capability and TypeScript boundaries.
- [Theme Editor](docs/theme-editor.md) — what each editor tab edits, the preview, unsaved changes and accessibility.
- [Composition Contract](docs/composition-contract.md) — host responsibilities, adapters and failure boundaries.
- [Theme Persistence Integration Guide](docs/persistence-integration-guide.md) — implementing provider-neutral persistence and composing a repository adapter.
- [Semantic Presentation Consumer Contract](docs/semantic-presentation-consumer-contract.md) — presentation dependency direction and consumer obligations.
- [Semantic Presentation Guide](docs/semantic-presentation-guide.md) — practical vocabulary, pairing, palette and accessibility guidance.
- [Interactive State Design Guide](docs/interactive-state-design-guide.md) — extended state design and palette guidance; read its implementation-status note before treating proposed mode handling as current behaviour.

## Development and verification

The repository uses pnpm:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` is the complete repository quality gate and is also run by GitHub Actions.

The local `playground/` is a capability fixture. Release acceptance additionally requires integration verification from an independent consuming application.

## Architecture and project history

Platform-wide architecture is maintained separately in the `nuxt4-layers/platform-architecture` repository.

The completed TM-0 through TM-10 migration records are retained under [`docs/archive/migration/`](docs/archive/migration/) as engineering provenance. They are historical records, **not current usage documentation or public API authority**.

Current users and contributors should start with this README and the reference documents above.

## Contributing, security and licence

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, architectural boundaries and verification requirements. Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

Please report suspected vulnerabilities according to [SECURITY.md](SECURITY.md), not through a public issue.

Theme Manager is licensed under the [MIT License](LICENSE).

The project remains pre-1.0. Its existing `v0.1.0` tag is not a declaration of stable API compatibility; the proposed `v0.2.0` remains unreleased until an explicitly verified tag is created. See [SECURITY.md](SECURITY.md) for reporting and support expectations.
