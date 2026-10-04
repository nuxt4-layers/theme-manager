# Theme Manager

Theme Manager is a Nuxt 4 Layer for defining, validating, applying and managing runtime-configurable semantic presentation themes.

It provides one Theme authority between Theme Definitions and consuming UI. Applications consume semantic presentation meaning through Tailwind CSS rather than hard-coded colour, typography, spacing, radius or effect values.

> **Project status:** active pre-release development. The implementation is integration-tested, but no stable public release is currently declared.

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

The project is currently pre-release. During development, consumers may install a pinned Git revision. Do not follow a mutable default branch in an integration or deployment baseline.

Compose the installed package root using Nuxt `extends`. The host application remains the composition root and is responsible for selecting and integration-testing the complete dependency set.

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

## Runtime Themes

Theme Manager owns the effective Theme. Runtime Theme values are validated and applied through Theme Manager rather than independently by consuming components.

A canonical protected default Theme is always available. If a selected Theme cannot be safely resolved or applied, Theme Manager falls back deterministically to that bundled presentation.

Persisted Themes cross a provider-agnostic `ThemeRepository` boundary. Persisted and imported JSON is untrusted until parsed, schema-validated and semantically validated. See the [Theme Persistence Integration Guide](docs/persistence-integration-guide.md) for implementing and registering a host repository adapter, database-provider boundaries, fallback behaviour and integration verification.

Theme Definitions may contain semantic asset references. Physical upload, storage, processing and binary lifecycle remain external responsibilities.

## Theme management

The optional management projection provides Theme-specific workflows such as Theme Library/discovery, editing, live preview, import/export and lifecycle operations.

Theme Manager defines Theme-domain actions such as `theme.read`, `theme.create`, `theme.edit`, `theme.delete`, `theme.use`, `theme.publish`, `theme.share`, `theme.import`, `theme.export` and `theme.assign`. External Authorization decides whether an actor may perform them.

The host decides whether and where management routes are exposed. Management operations fail closed when required actor-context or authorization providers are absent.

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

- [Public Contract](docs/contracts.md) — supported capability and TypeScript boundaries.
- [Composition Contract](docs/composition-contract.md) — host responsibilities, adapters and failure boundaries.
- [Theme Persistence Integration Guide](docs/persistence-integration-guide.md) — implementing provider-neutral persistence and composing a repository adapter.
- [Semantic Presentation Consumer Contract](docs/semantic-presentation-consumer-contract.md) — presentation dependency direction and consumer obligations.
- [Semantic Presentation Guide](docs/semantic-presentation-guide.md) — practical vocabulary, pairing, palette and accessibility guidance.

## Development and verification

The repository uses pnpm:

```sh
pnpm install
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

The repository is being prepared for public open-source use. Repository and supply-chain security hardening will be completed before public release, and no stable public release is currently declared.
