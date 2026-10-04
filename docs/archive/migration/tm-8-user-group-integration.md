# TM-8 — User and Group Integration

## Purpose and Status

TM-8 integrates Theme Manager with external Identity and Authorization capabilities without transferring their responsibilities into Theme Manager.

Theme Manager continues to own Theme resource ownership, visibility, lifecycle and action vocabulary. Identity supplies opaque actor/group/organisation context. Authorization supplies authoritative allow/deny decisions.

## Integration Model

```text
Authentication
     ↓
Identity ── opaque actor/scope context ──┐
                                         ▼
                                  Theme Manager
                                  Theme resource
                                  ownership
                                  visibility
                                  action vocabulary
                                         │
                              action/resource/context
                                         ▼
                                  Authorization
                                         │
                                     allow/deny
                                         ▼
                              server Theme operation
```

Theme Manager does not inspect group membership storage, roles, sessions, authentication tokens or Authorization policy internals.

## Public Integration Contracts

TM-8 defines:

- `ThemeActorContext`: opaque actor ID plus group and organisation IDs;
- `ThemeResourceRef`: Theme-owned resource facts supplied to Authorization;
- `ThemeAuthorizationRequest`: actor/action/resource decision request;
- `ThemeActorContextProvider`: Identity-facing context port;
- `ThemeAuthorizationService`: Authorization-facing decision port.

The composition root connects concrete Identity and Authorization capabilities to these ports.

## Authoritative Server Enforcement

The TM-6 CRUD service now accepts the TM-8 access integration.

When configured by the HTTP projection it authoritatively checks:

- `theme.read` for resource reads;
- `theme.read` while producing library/list projections;
- `theme.create` before creation;
- `theme.edit` before update;
- `theme.delete` before deletion.

A denied direct resource operation returns an authorization error. A list projection omits resources the actor is not authorized to read.

Client-side control visibility is therefore not the security boundary.

## Ownership Integrity

Ownership remains a Theme Manager resource fact.

Ordinary `theme.edit` cannot change `ownerType` or `ownerId`. Ownership transfer, sharing or assignment must use an explicit operation with its own action semantics rather than being smuggled through a general Theme update.

This preserves the TM-2 separation between ownership, visibility, authorization and selection.

## User, Group and Organisation Context

Theme Manager receives only opaque identifiers:

```text
actorId
groupIds[]
organisationIds[]
```

It does not determine group membership and does not model Identity roles.

This supports users belonging to zero, one or multiple groups while keeping Identity authoritative for membership.

## Theme Library Scopes

TM-8 introduces a public library-scope vocabulary for:

- My Themes;
- Group Themes;
- Organisation Themes;
- Public Themes;
- System Themes.

These are projections over the same Theme resources, not separate Theme stores.

Authorization remains authoritative for the resources actually returned. Shared-with-me policy requires the external sharing/grant integration and is not fabricated as an ownership rule.

## Anonymous Context

An external Identity adapter may represent an anonymous actor with:

```text
actorId: null
groupIds: []
organisationIds: []
```

Authorization may permit `theme.read` and `theme.use` for public/system Themes while denying management actions. Theme Manager does not hard-code that policy.

This preserves TM-2 support for anonymous public/system Theme consumption without making Theme Manager an authentication capability.

## Sharing and Assignment

TM-2 defines `theme.share` and `theme.assign` as distinct actions.

TM-8 deliberately does not encode grant storage, group membership or assignment policy inside ordinary CRUD. Those operations require explicit resource/action contracts and composition with the external Identity/Authorization context. This prevents `theme.edit` from becoming a privilege-escalation path.

## Failure Behaviour

The HTTP management projection requires both actor-context and Authorization providers. If the composition root does not configure them, management operations fail closed rather than silently becoming unauthenticated CRUD.

Authorization denials project to HTTP 403.

## Quality Gate

TM-8 tests verify:

- library results are filtered through authoritative read decisions;
- direct resource reads enforce `theme.read`;
- create/edit/delete remain distinct action checks;
- ordinary edit cannot transfer ownership;
- group membership remains opaque to Theme Manager.

Nuxt typecheck and all TM-3 through TM-7 tests remain mandatory.

## TM-8 Boundary

TM-8 does not implement:

- Authentication/session management;
- Identity storage;
- group membership management;
- Authorization policy or permission assignment;
- a role model;
- grant persistence;
- physical asset storage;
- final composition-app routing.

These remain external capability/composition concerns.

## TM-8 Gate Conclusion

TM-8 establishes the explicit User/Group/Organisation integration boundary and authoritative server-side Authorization enforcement while preserving Theme Manager ownership semantics and external Identity/AuthZ authority.

Theme Manager is therefore ready for **TM-9 — UI-Layer Integration**.
