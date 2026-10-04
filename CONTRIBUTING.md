# Contributing to Theme Manager

Thank you for considering a contribution to Theme Manager.

Theme Manager is a Nuxt 4 Layer with deliberately narrow architectural boundaries. Contributions should improve the capability without transferring responsibilities from consuming applications or other platform capabilities into this repository.

## Before contributing

Start with:

1. [README.md](README.md)
2. [Public Contract](docs/contracts.md)
3. [Composition Contract](docs/composition-contract.md)
4. [Semantic Presentation Consumer Contract](docs/semantic-presentation-consumer-contract.md)
5. [Semantic Presentation Guide](docs/semantic-presentation-guide.md)

Historical TM-0 through TM-10 migration records are retained under `docs/archive/migration/` for provenance. They are not current public API authority.

For a suspected security vulnerability, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Development environment

The repository requires Node.js 22 or later and uses the pnpm version declared by `packageManager` in `package.json`.

Install and verify with:

```sh
pnpm install
pnpm check
```

`pnpm check` runs the repository typecheck and test suite and is the minimum local quality gate before submitting a pull request.

## Contribution workflow

Create a focused branch from current `master`. Keep each change narrowly scoped and avoid unrelated formatting, dependency or documentation churn.

Submit changes through a pull request rather than modifying `master` directly. The pull request should explain the problem, the intended behaviour, material architectural or compatibility effects, and how the change was verified.

Keep commits reviewable. Add or update tests when behaviour or a public contract changes. Update current documentation when a user-visible contract, integration requirement or semantic rule changes.

All required CI checks must pass before merge.

## Architectural boundaries

Theme Manager owns Theme-domain semantics and the semantic presentation vocabulary. It does not own reusable application UI, Authentication, Identity, Authorization policy, application routing, database technology or physical asset storage.

Contributions must preserve the dependency direction and public package surface defined by the repository contracts. Do not couple Theme Manager to a particular consuming UI implementation or private source topology.

Persisted or imported Theme data is untrusted until validated. New external-input surfaces must fail safely and preserve the existing validation boundary.

## Presentation changes

Select presentation tokens by semantic meaning rather than by their current rendered colour.

Review presentation changes in this order:

1. semantic correctness;
2. palette correctness;
3. accessibility of the actual rendered relationship; and
4. composed-system verification.

Do not substitute an unrelated semantic token solely to make a contrast calculation pass. See the [Semantic Presentation Guide](docs/semantic-presentation-guide.md).

## Compatibility

Treat documented package exports and contracts as public interfaces. Breaking changes require explicit compatibility/version treatment even while the project is pre-1.0.

Undocumented internal paths are private implementation details and should not become accidental public contracts.

## Dependencies

Avoid adding dependencies unless they provide clear value that cannot reasonably be achieved within the existing stack. Explain new runtime dependencies in the pull request.

Do not add dependencies on UI, Authentication, Identity or Authorization packages where the current provider/host boundary is the intended architecture.

## Licence

By submitting a contribution to this repository, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).

## Conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
