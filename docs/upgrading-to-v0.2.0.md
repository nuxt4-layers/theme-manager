# Upgrading Theme Manager from v0.1.0 to v0.2.0

**Status:** Release-preparation guidance for the proposed `v0.2.0`; no `v0.2.0` tag exists until the release is approved. Review the [changelog](../CHANGELOG.md) and [compare the revisions](https://github.com/nuxt4-layers/theme-manager/compare/v0.1.0...master) before migrating.

## Before upgrading

1. Record the exact currently deployed Theme Manager commit and consumer lockfile; retain a rollback path.
2. Back up persisted Theme JSON and record its `schemaVersion` and owner metadata.
3. Identify all presentation token usages, private-path imports, CSS overrides, Theme repository adapters and management routes in the consuming application.
4. Use a dedicated consumer branch and pin the candidate Theme Manager commit SHA. Do not adopt an unverified moving `master` reference.

## Presentation and CSS

The default palette, semantic token set and non-colour families have evolved considerably since `v0.1.0`. Audit component classes and direct `--api-*` usages against the current [Semantic Presentation Guide](semantic-presentation-guide.md). Preserve Fill/Pen/Edge semantic pairing; do not substitute unrelated roles solely to satisfy contrast tests.

The package exposes `@nuxt4-layers/theme-manager/presentation.css`. The Nuxt layer internally includes a stylesheet that also registers its own management components for Tailwind scanning. Do not import that private internal stylesheet or accidentally include the public CSS twice.

The locked default/API/Tailwind pipeline and generated scoped preview CSS must be verified with `pnpm check`; consuming applications must also check their own compiled output.

## Stored Themes and vocabulary version

The candidate changes the layer's `THEME_MANAGER_VERSION` to `0.2.0` and the token `THEME_VOCABULARY_VERSION` to `2`.

A stored Theme's own `version` is not the layer release version. `schemaVersion` identifies its token vocabulary. The loader accepts older numeric vocabulary versions and fills missing tokens with current defaults while preserving stored version fields on read. Saving writes the current complete vocabulary and stamps `schemaVersion: '2'`.

**Rollback warning:** a `v0.1.0` runtime may reject Themes saved by `v0.2.0` because their vocabulary is newer. Preserve backups and do not rely on automatic downgrade or lossless reverse conversion. Verify representative stored Themes in a staging environment before allowing writes.

## Persistence and management

A host `ThemeRepository` remains optional for displaying the built-in default, but it is required for stored Theme CRUD. Without it, the management endpoints return 503 and the editor does not offer persistence workflows. Host-provided actor context and authorization must be configured for protected operations. Review the [Persistence Integration Guide](persistence-integration-guide.md) and [Composition Contract](composition-contract.md).

The management UI has expanded; review its accessibility, live preview, unsaved-change prompts and protected system-Theme behaviour in the [Theme Editor guide](theme-editor.md).

## Light and dark mode

Theme Manager provides `:root` and `html.dark` CSS mappings and scoped editor previews. It does **not** currently manage a separate light/dark/system mode cookie or a pre-paint mode controller. The host must manage the `dark` class and system-preference synchronisation when needed.

## Acceptance checklist

- [ ] Candidate commit SHA is pinned and consumer lockfile is reproducible.
- [ ] All consumer semantic class names and custom-property references resolve correctly.
- [ ] Both light and dark presentation and focus/contrast behaviour are visually checked.
- [ ] Representative older persisted Themes load, preserve intended values and can be saved safely.
- [ ] Repository and actor/authorization adapters behave correctly, including failure paths.
- [ ] Theme switching, selection restoration, fallback and editor previews work in the composed application.
- [ ] Repository `pnpm check` and independent platform-test-harness checks pass.
- [ ] Rollback and data restoration are verified before production writes.

The [platform test harness](https://github.com/steve-r-lewis/platform-test-harness) is an independent consumer example; its in-memory Theme repository is not a production persistence recommendation.
