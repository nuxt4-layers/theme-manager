# Theme Persistence Integration Guide

## Purpose

Theme Manager supports persisted Themes without owning a database, ORM, storage service or provider SDK. The consuming Nuxt application is the composition root and supplies a `ThemeRepository` adapter.

This guide shows how to implement that boundary without creating a second Theme authority or coupling Theme Manager to infrastructure.

## Responsibility boundary

| Theme Manager owns | Host application owns |
| --- | --- |
| Theme Definition schema and semantics | Database/provider choice |
| Runtime and semantic validation | Database schema and migrations |
| Canonical JSON serialization | Provider credentials and connectivity |
| `ThemeRepository` contract | Concrete repository adapter |
| Effective Theme resolution | User/Theme association policy |
| Deterministic bundled fallback | Authentication and authorization |
| Import/export semantics | Infrastructure monitoring and backup |

A datastore is optional. Runtime presentation can always operate from the bundled Default Theme.

## Public persistence contract

Import the repository contract from the supported contract entry point:

```ts
import type {
  JsonValue,
  ThemeRepository
} from '@nuxt4-layers/theme-manager/contracts'
```

The contract is deliberately small:

```ts
interface ThemeRepository {
  findById(id: string): Promise<JsonValue | null>
  list(): Promise<readonly JsonValue[]>
  save(serializedTheme: JsonValue): Promise<void>
  delete(id: string): Promise<void>
}
```

Repository implementations exchange JSON-compatible values. They do not decide whether a value is a valid Theme.

Theme Manager serializes before persistence and parses, schema-validates, semantically validates and normalises data crossing back from persistence before it becomes trusted Theme-domain data.

## Minimal adapter

A host can implement the port using any persistence technology:

```ts
import type {
  JsonValue,
  ThemeRepository
} from '@nuxt4-layers/theme-manager/contracts'

export function createThemeRepository(store: {
  get(id: string): Promise<JsonValue | null>
  all(): Promise<readonly JsonValue[]>
  put(id: string, value: JsonValue): Promise<void>
  remove(id: string): Promise<void>
}): ThemeRepository {
  return {
    findById: id => store.get(id),
    list: () => store.all(),

    async save(value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError('Theme repository expected a serialized Theme Definition object.')
      }

      const id = value.id
      if (typeof id !== 'string' || !id) {
        throw new TypeError('Theme repository expected a Theme Definition id.')
      }

      await store.put(id, value)
    },

    delete: id => store.remove(id)
  }
}
```

The example validates only the storage key needed by the adapter. It deliberately does not duplicate Theme validation; that remains Theme Manager's responsibility.

## Registering the repository

Register the adapter during Nitro start-up from the consuming application:

```ts
export default defineNitroPlugin(() => {
  const repository = createThemeRepository(myStore)

  provideThemeRepository({
    getThemeRepository: () => repository
  })
})
```

`provideThemeRepository` is supplied to the composed Nitro application by the Theme Manager layer. The host should configure it before persistence-backed Theme operations are exposed.

If persistence is requested without a provider, Theme Manager fails explicitly rather than silently inventing storage.

## Database-backed implementations

A PostgreSQL, Supabase or other database adapter should keep provider-specific types and SDK objects on the host side of the boundary.

A practical relational model can store at minimum:

```text
theme_id       stable Theme identifier / primary key
theme_json     canonical serialized Theme JSON
created_at     infrastructure metadata, if required
updated_at     infrastructure metadata, if required
```

Additional indexed columns may be projected for query efficiency, but the projection must not become an alternative Theme Definition. The canonical persisted payload remains the versioned Theme JSON accepted by Theme Manager.

Database migrations, row-level security, connection pooling, encryption, backup, tenancy and provider credentials are host/infrastructure concerns.

### Supabase example boundary

A Supabase implementation should therefore look structurally like:

```text
Theme Manager
    │ ThemeRepository
    ▼
Host SupabaseThemeRepository
    │
    ▼
Supabase client / PostgreSQL
```

Do not import the Supabase SDK into Theme Manager and do not expose Supabase row or client types through `ThemeRepository`.

## Identity, ownership and selection

Theme Definitions contain Theme ownership metadata, but Theme Manager does not authenticate users or own application identity.

The host maps its authenticated principal to Theme Manager's opaque actor context and supplies Authorization policy separately. Database ownership constraints and row-level access controls should reinforce that policy rather than replace Theme Manager's authorization boundary.

Likewise, a user's preferred/selected Theme is application state. The host may persist that association independently. Theme Manager remains responsible for validating and applying the Theme that is resolved.

## Runtime and fallback behaviour

Persistence must not be required to obtain a valid initial presentation:

```text
application starts
      │
      ▼
bundled Default Theme
      │
      ├── no persisted selection / repository unavailable / invalid Theme
      │        └── deterministic fallback remains available
      │
      └── persisted Theme resolved
                 │
                 ▼
         parse and validate
                 │
                 ▼
         apply runtime --ui-* values
                 │
                 ▼
       Theme API → Tailwind → UI
```

Do not make application rendering depend on a successful database round trip merely to obtain a valid Theme.

## Trust and failure boundary

Treat every value returned by a repository as untrusted input, even when it came from your own database. Do not bypass Theme Manager parsing or validation because a row was previously validated.

Repository/provider failures should be translated at the adapter boundary. Provider SDK exceptions and database-specific objects must not become undocumented Theme Manager contracts.

A production adapter should also consider request limits, payload limits, transaction behaviour, concurrency/update policy, audit requirements and observability appropriate to the consuming application.

## Import and export

Import/export and repository persistence use the same Theme-domain authority but serve different workflows. Importing JSON does not grant it trust, and exporting a Theme does not expose the underlying database representation.

Consumers should use Theme Manager's canonical Theme serialization and validation rather than inventing a parallel interchange format.

## Integration verification

The [Platform Test Harness](https://github.com/steve-r-lewis/platform-test-harness) is the independent external consumer used to verify Theme Manager through its public composition boundary.

Its Theme Manager Nitro plugin is a useful concrete implementation aid: it implements `ThemeRepository`, registers it with `provideThemeRepository`, and composes actor-context and Authorization adapters without adding those concerns to Theme Manager.

The harness currently uses an in-memory Theme repository for Theme Manager. It is therefore an example of the **adapter/composition pattern**, not a production database adapter. Its separate PostgreSQL integration belongs to the Authentication layer and must not be mistaken for Theme Manager persistence.

The harness pins exact layer revisions and exercises the composed system independently of the Theme Manager repository. Production consumers should follow the same principle: integration-test the exact Theme Manager version together with their real repository, Identity/AuthZ and presentation consumers.

## Related documentation

- [Public Contract](contracts.md)
- [Composition Contract](composition-contract.md)
- [Semantic Presentation Consumer Contract](semantic-presentation-consumer-contract.md)
- [Semantic Presentation Guide](semantic-presentation-guide.md)
