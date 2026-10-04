# TM-6 — Persistence and Theme Management

## Purpose and Status

TM-6 migrates the recovered Theme persistence and CRUD management behaviour into the new bounded Theme Manager capability.

Legacy evidence was read from immutable baseline:

```text
nuxt4-layers/legacy-theme-manager
8847e6b1d8ebbca83f00d17b0cddb18522219c6e
```

TM-6 implements the provider-independent persistence boundary, canonical Theme Definition JSON crossing that boundary, validated read/write handling, and the recovered Theme CRUD service/API surface.

The visual Theme Library and Theme Editor remain TM-7.

## Recovered Behaviour Preserved

The legacy implementation established:

- list Themes;
- find Theme by ID;
- create Theme with conflict detection;
- update Theme with route/body identity agreement;
- delete Theme with not-found handling;
- a repository abstraction intended to isolate persistence technology.

The recovered repository did not contain a concrete implementation or registration for its implicit `getThemeRepository()` service locator. TM-6 therefore preserves the repository abstraction while replacing the missing implicit global with explicit composition-root provisioning.

## Persistence Architecture

```text
HTTP / Theme-management caller
            ↓
       ThemeService
            ↓
parse + semantic validation
            ↓
canonical JSON serialization
            ↓
      ThemeRepository
            ↓
 composition-supplied adapter
            ↓
       storage provider
```

Reads cross the boundary in the reverse direction:

```text
storage provider
      ↓
ThemeRepository
      ↓
untrusted JSON-compatible value
      ↓
parse + schema/semantic checks
      ↓
trusted ThemeDefinition
```

A database record is never trusted merely because it came from the configured repository.

## Canonical Theme Definition Representation

`shared/theme-definition.ts` owns the parsing and canonical JSON serialization boundary for the TM-2 Theme Definition model.

TM-6 validates the structural/domain envelope established by TM-2:

- identity and metadata;
- ownership;
- visibility;
- lifecycle;
- presentation-family presence;
- modes container.

The presentation/runtime internals continue to be validated by their owning runtime/presentation boundaries. TM-6 does not invent a second token grammar.

Serialization is JSON-compatible and provider-neutral. Database, ORM, filesystem and cloud-provider types do not enter the public Theme contract.

## Repository Provisioning

The public `ThemeRepository` port remains provider independent.

`provideThemeRepository()` explicitly installs a provider supplied by the composition root. `useThemeRepository()` fails closed if no provider has been configured.

This replaces the recovered implicit `getThemeRepository()` assumption without selecting PostgreSQL, filesystem storage, an ORM or another infrastructure technology.

## Theme Management Service

`ThemeService` is the common CRUD kernel used by the HTTP projection.

It provides:

- `list()`;
- `find(id)`;
- `create(input)`;
- `update(id, input)`;
- `delete(id)`.

Create preserves conflict detection. Update preserves resource-ID consistency. Update/delete require the target to exist.

The service returns Theme summaries for list projections and full validated Theme Definitions for resource reads.

## Protected System Theme

The TM-2 canonical system/default Theme is protected from normal CRUD mutation.

Normal Theme CRUD cannot:

- create a Theme claiming system ownership;
- modify an existing system Theme;
- delete an existing system Theme.

This preserves the bundled default as the deterministic runtime fallback rather than allowing ordinary Theme-management operations to redefine it.

## HTTP Projection

TM-6 restores the recovered endpoint surface:

```text
GET    /api/themes
POST   /api/themes
GET    /api/themes/:id
PUT    /api/themes/:id
DELETE /api/themes/:id
```

Domain/persistence errors are projected to appropriate HTTP status semantics:

- malformed input → 400;
- missing resource → 404;
- create conflict → 409;
- protected system Theme mutation → 403.

The HTTP layer does not know the concrete persistence provider.

## Authorization Boundary

TM-2 requires external Authorization to make authoritative action/resource decisions. TM-6 does not fabricate an Authorization implementation or identity model.

The CRUD kernel is structured so that authorization can be enforced at the server operation boundary when the external integration contract is supplied. Until that integration exists, composition applications must not expose these management endpoints as an authorization substitute.

TM-6 therefore does not claim that endpoint reachability is permission.

## Quality Gate

TM-6 tests verify:

- canonical JSON round-trip;
- malformed write rejection;
- persisted-data revalidation on read;
- create/list/read/update/delete through the provider-independent port;
- create conflict semantics;
- update/delete not-found semantics;
- protected system Theme immutability;
- resource identity consistency on update.

All TM-3, TM-4 and TM-5 tests plus Nuxt typecheck remain mandatory.

## TM-6 Boundary

TM-6 does not implement:

- the visual Theme Library;
- the visual Theme Editor;
- reusable UI components;
- external Identity or Authorization implementations;
- a concrete database/storage adapter;
- physical asset storage;
- Theme import/export UI;
- user/group assignment integration.

Those remain later work packages.

## TM-6 Gate Conclusion

TM-6 establishes the provider-independent, validated Theme persistence and CRUD-management kernel while preserving the recovered API behaviour, protecting the canonical system Theme and replacing the legacy missing service locator with explicit composition-root provisioning.

The persistence and management kernel is therefore ready for **TM-7 — Theme Management UI**.
