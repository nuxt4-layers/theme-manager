# Changelog

Notable changes to Theme Manager are recorded here. GitHub source tags are distinct from npm publication; the package remains `private: true`.

## [0.2.0] — 2026-10-08 (GitHub pre-release)

[v0.2.0](https://github.com/nuxt4-layers/theme-manager/releases/tag/v0.2.0) is the published, accepted canonical pre-1.0 GitHub source release. The baseline is the changes since [v0.1.0](https://github.com/nuxt4-layers/theme-manager/releases/tag/v0.1.0).

### Added

- A substantially expanded Theme Editor with dedicated controls for colours, typography, spacing, radii, borders, shadows, effects and motion; accessible confirmation dialogs and scoped light/dark previews.
- A generated scoped presentation stylesheet for previews, alongside a checked and hash-locked three-stage presentation pipeline.
- A layer-owned Tailwind source-discovery stylesheet for Theme Manager's management UI, separate from the public presentation CSS export.
- Shared utilities for colour pairing and contrast, CSS value parsing, token catalogues and references, type scales, motion and shadow shapes.
- Explicit Theme storage availability reporting through `GET /api/theme-manager/capabilities`, plus tests for missing storage, scoped presentation, token validation and versioning.
- Theme vocabulary completion on stored Theme reads and schema-version stamping on writes.

### Changed

- The semantic colour and non-colour presentation vocabulary and its default palette have been extensively revised. This may change generated utility names, theme appearance and the set of expected tokens.
- Theme management now uses a more complete editor and preview workflow; protected system Themes remain read-only.
- The runtime applies validated `--ui-*` values; selection is restored from `active-theme-id`, and invalid or unavailable selections fall back to the bundled default.
- Persistence is explicitly optional: without a host repository the default Theme remains available, but persistence-backed HTTP operations fail with 503 rather than using an implicit store.
- Package release version is `0.2.0`. The token vocabulary version is `2`, because the vocabulary changed since the original release.

### Breaking changes and integration considerations

- **Presentation vocabulary:** consumers that reference old semantic token names, rely on old CSS values or reach into internal stylesheet paths must review the current [Semantic Presentation Guide](docs/semantic-presentation-guide.md) and [Consumer Contract](docs/semantic-presentation-consumer-contract.md). There is no guaranteed one-to-one renaming table; audit actual usages.
- **Stored Theme vocabulary:** the new release reads older numeric schema versions and fills missing tokens from the bundled default. A saved Theme is stamped with schema version `2`; older Theme Manager releases refuse a newer vocabulary. Test stored Theme round trips and plan rollback accordingly.
- **Management storage:** applications requiring Theme CRUD must provide a `ThemeRepository`; absent storage yields 503. Host-provided actor and authorization services remain required for protected management operations.
- **CSS composition:** use the public `@nuxt4-layers/theme-manager/presentation.css` export when explicitly importing the semantic stylesheet. Do not import the internal `assets/css/layer.css` or duplicate the public stylesheet when Nuxt layer composition already includes it.
- **Mode ownership:** the current layer does not supply a light/dark/system preference controller or pre-paint mode script. Hosts requiring mode switching must manage `html.dark` and first-paint behaviour themselves.
- **Version pinning:** update consumer Git SHA/tag pins and lockfiles only after verifying the final release tag and running composed-system tests.

See [the v0.1.0 → v0.2.0 upgrade guide](docs/upgrading-to-v0.2.0.md) for the practical migration sequence.

### Release verification

The release-preparation PR passed `pnpm install --frozen-lockfile`, `pnpm check` and GitHub security analysis before the `v0.2.0` tag was published. Independent platform-test-harness integration and persisted-Theme rollback verification were not completed at publication; consumers must validate their composed applications before deployment.

## [0.1.0]

Initial tagged pre-1.0 Theme Manager source baseline.
