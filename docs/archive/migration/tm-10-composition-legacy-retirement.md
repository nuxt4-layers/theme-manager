# TM-10 — Composition and Legacy Retirement

## Purpose and Status

TM-10 closes the Theme Manager re-baselining programme.

It verifies the target capability against the TM-0/TM-1 recovered legacy evidence, establishes the final composition boundary and defines retirement of the legacy implementation without modifying the legacy repository.

The immutable evidence baseline remains:

```text
nuxt4-layers/legacy-theme-manager
8847e6b1d8ebbca83f00d17b0cddb18522219c6e
```

No TM-10 write operation targets that repository.

## Final Capability

The new Theme Manager is one independently maintained Nuxt 4 foundation layer responsible for:

- versioned Theme Definition semantics and validation;
- semantic presentation values;
- TailwindCSS semantic presentation projection;
- deterministic default/fallback;
- effective Theme runtime application and preview;
- provider-independent persistence;
- Theme CRUD and management workflows;
- Theme ownership/visibility/lifecycle semantics;
- Theme action/resource vocabulary;
- external Identity/AuthZ integration ports;
- semantic presentation consumer contract.

It remains independent of reusable UI implementation, Authentication, Identity implementation, Authorization policy, storage technology and physical asset storage.

## Legacy Disposition Reconciliation

The zero-functional-loss gate does not require retaining historical defects or cross-capability coupling. It requires every recovered behaviour to be preserved, hardened, deliberately relocated or explicitly superseded.

| Recovered legacy area | Final disposition |
|---|---|
| raw → semantic → Tailwind presentation pipeline | **Preserved and contract-tested** |
| static/runtime use of same variable contract | **Preserved** |
| runtime switching without Tailwind recompilation | **Preserved** |
| bundled default CSS fallback | **Preserved and deterministic** |
| 560 raw / 280 semantic / 280 Tailwind colour system | **Preserved and cardinality-tested** |
| light/dark modes | **Preserved; model extensible** |
| six interaction states | **Preserved** |
| fill/pen `shadow` mismatch | **Corrected** — shadow may be supplied as an additional presentation state, not misclassified as a seventh interaction state |
| typography/spacing/radius/effects/responsive vocabulary | **Preserved and incorporated into target Theme model/semantic vocabulary** |
| semantic Theme imagery | **Added** through Theme-owned semantic asset references; physical storage external |
| active Theme state | **Preserved and hardened** |
| one-year persisted selection reference | **Preserved** |
| missing/invalid selected Theme fallback | **Preserved and hardened** |
| runtime CSS application | **Preserved through one validated Theme Application Engine** |
| live preview | **Preserved through the same runtime engine** |
| repository abstraction | **Preserved and formalised** |
| missing implicit `getThemeRepository()` implementation | **Superseded** by explicit composition-root provisioning |
| Theme CRUD API lifecycle | **Preserved and strengthened** |
| weak API validation | **Superseded** by bidirectional runtime validation |
| Theme Library | **Preserved** |
| active/default Theme interaction | **Preserved without magic default IDs** |
| Theme Editor | **Preserved and extended** |
| visual colour editing | **Preserved** |
| raw JSON edit/format | **Preserved** |
| create-new from complete default/template | **Preserved through explicit creation template context** |
| default Theme magic IDs | **Superseded** by canonical default/fallback semantics |
| account layout/auth middleware coupling | **Removed** as application-composition/Auth concern |
| authoritative access control | **Hardened** through external Identity/AuthZ ports and server-side decisions |
| UI component CSS in Theme Manager | **Relocated responsibility to UI capability**; not retained in Theme Manager |
| UI/Auth source scanning in Theme CSS | **Removed** |
| UI topology knowledge | **Removed/prohibited** |
| application-specific routing/navigation | **Composition-root responsibility** |
| persistence provider | **Explicit external adapter**; legacy implementation was absent |
| Theme import/export | **Target kernel capability established by TM-2 boundary; portable Theme Definition contract retained** |
| reusable UI library | **Separate capability**; TM-9 defines consumer direction only |

## Retirement Meaning

"Legacy retirement" means:

1. `nuxt4-layers/theme-manager` is the authoritative implementation for new composition.
2. No application should add a new runtime dependency on `legacy-theme-manager`.
3. Existing consumers should migrate by capability contract rather than copy legacy source.
4. `legacy-theme-manager` remains immutable migration evidence and historical reference.
5. Retirement does **not** mean deleting, rewriting, rebasing, tagging, archiving or otherwise mutating the legacy repository as part of TM-10.
6. Any repository-level archival setting, deletion or administrative change is outside this work package and requires a separate explicit decision.

The evidence repository therefore survives retirement unchanged.

## Composition Gate

The final host composition is defined in `docs/composition-contract.md`.

The composition root supplies infrastructure and external capability adapters. Theme Manager does not acquire reverse dependencies merely to make a sample application convenient.

The dependency graph remains acyclic.

## UI Migration Dependency

TM-9 found that the separate live `nuxt4-layers/ui` foundation still has a provisional parallel Theme/token application model.

That does not block retirement of the **legacy Theme Manager implementation**, because Theme Manager's public semantic presentation contract is now established.

It does mean composed applications must not claim final UI/Theme integration conformance until the separate UI migration reconciles that provisional model.

## Import/Export and Extended Editors

The migration distinguishes architectural capability from specialised management controls.

The canonical validated Theme Definition is the portable representation across the persistence boundary and remains the basis for import/export. Raw Theme Definition editing preserves complete access to the target representation.

Specialised visual editors for non-colour families and concrete physical Asset-provider workflows may evolve independently without restoring legacy coupling. They are extensions of the target model, not unidentified legacy Theme Manager subsystems.

## Retirement Gate Tests

TM-10 adds repository-level closure tests that verify:

- every TM-0→TM-9 migration record exists;
- the immutable legacy baseline is recorded;
- retirement explicitly forbids mutation of the legacy repository;
- all public package surfaces remain deliberate;
- no legacy package dependency is introduced;
- no UI/Auth package or source-topology dependency is introduced;
- composition documentation requires pinned/versioned consumption and composition-supplied adapters;
- the programme status no longer presents Theme Manager as an unfinished migration.

The complete existing typecheck/test suite remains mandatory.

## Residual Work Outside TM-10

The following are not reasons to keep the legacy Theme Manager active:

- migration of the separate UI capability to consume `SemanticPresentationTheme`;
- application-specific adapter implementations;
- concrete database choice;
- concrete Identity/AuthZ capability implementations;
- physical Asset/Resource provider integration;
- specialised visual editors beyond recovered legacy functionality;
- composed-application acceptance/accessibility testing.

These are normal downstream capability/composition work against the new contract.

## Final Gate Conclusion

TM-0 and TM-1 identified the recovered legacy presentation and functional surface before redesign. TM-2 assigned explicit target dispositions. TM-3 through TM-9 implemented and tested the new bounded capability in staged work packages.

TM-10 establishes the final composition contract and reconciles the recovered legacy surface against those dispositions.

The **Theme Manager migration programme TM-0 → TM-10 is complete**.

`nuxt4-layers/theme-manager` is the implementation baseline for future composition. `nuxt4-layers/legacy-theme-manager` remains unchanged as immutable migration evidence and is retired from future implementation use.
