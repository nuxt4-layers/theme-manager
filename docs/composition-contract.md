# Theme Manager Composition Contract

## Purpose

This document defines the supported composition boundary for Theme Manager.

The host Nuxt application is the composition root. Theme Manager remains a bounded foundation capability and does not become an application shell.

## Package Composition

Install Theme Manager through the package manager and compose the package root with Nuxt `extends`.

During early development a pinned Git-backed dependency is permitted. Production compatibility must not follow a mutable default branch. The consuming application's lockfile records the exact resolved revision.

Public package surfaces are:

```text
@nuxt4-layers/theme-manager
@nuxt4-layers/theme-manager/contracts
@nuxt4-layers/theme-manager/capability
@nuxt4-layers/theme-manager/presentation.css
```

All other source paths are private unless subsequently promoted through an explicit versioned contract.

## Composition Responsibilities

The host application:

- selects a compatible Theme Manager version;
- composes Theme Manager and presentation consumers as peer capabilities;
- supplies a `ThemeRepository` adapter;
- supplies `ThemeActorContextProvider` and `ThemeAuthorizationService` for exposed management operations;
- supplies application-specific routes/navigation policy where the default management projection is not appropriate;
- supplies external physical Asset/Resource integration when semantic Theme asset references are used;
- supplies creation template/owner context for Theme creation;
- integration-tests the composed application.

Theme Manager:

- owns Theme Definition and validation;
- owns canonical persistence representation;
- owns Theme runtime/effective-state authority;
- owns semantic presentation values and Tailwind projection;
- owns Theme management workflows and Theme action vocabulary;
- fails closed at management boundaries when required external access providers are absent.

## Dependency Graph

The intended graph is acyclic:

```text
Identity ───────────────┐
                       │ actor context
                       ▼
                  Theme Manager ── semantic presentation ──► UI
                       │
                       │ authorization request
                       ▼
                 Authorization

Composition root connects ports and infrastructure adapters.
```

The diagram expresses contract flow, not an implementation dependency from Identity or Authorization back to Theme Manager.

Theme Manager has no package dependency on UI, Identity, Authentication, Authorization, a database, or a physical Asset provider.

## Runtime and Management Exposure

Runtime Theme presentation can operate with the bundled deterministic default without persistence or Identity/AuthZ.

Persisted Theme resolution requires a composition-supplied repository adapter.

Management HTTP operations require Identity actor-context and Authorization providers and fail closed when those providers are absent.

The management projection is optional application surface. A host decides whether its routes are exposed and where they appear in navigation.

## Presentation Consumer Rule

UI and other presentation capabilities consume `SemanticPresentationTheme`. They must not establish a competing effective-Theme authority or require Theme Manager to know their components/source topology.

## Failure Boundaries

Expected composition failures include:

- missing repository provider when persistence is requested;
- missing actor/Authorization provider when management operations are exposed;
- invalid/untrusted persisted Theme JSON;
- unauthorized Theme action;
- unresolved or invalid selected Theme, which deterministically falls back to bundled presentation.

Provider SDK exceptions must be translated by adapters rather than becoming undocumented Theme Manager contracts.

## Composed-System Verification

A consuming application must test its actual combination of:

- pinned Theme Manager revision/version;
- repository adapter;
- Identity/AuthZ adapters;
- UI/presentation consumer;
- route/navigation exposure;
- Asset/Resource integration where used.

Theme Manager's repository tests establish its capability contract but cannot establish correctness of an application's external adapters.
