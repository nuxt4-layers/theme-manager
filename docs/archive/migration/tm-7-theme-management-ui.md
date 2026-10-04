# TM-7 — Theme Management UI

## Purpose and Status

TM-7 migrates the recovered Theme Library and Theme Editor as an optional, self-contained Theme Manager management projection.

The management UI belongs to the Theme Manager repository because it operates Theme Manager's own domain workflows. It does not depend on the separate reusable UI capability and it does not transfer Theme-domain authority to a composition application.

## Legacy Evidence

The immutable legacy baseline provided:

- Theme Library listing;
- default/custom Theme distinction;
- active Theme indication and selection;
- create/edit navigation;
- Theme metadata editing;
- light/dark presentation context;
- visual colour editing across Fill/Pen/Edge roles;
- live preview;
- raw JSON editing and formatting;
- save/update;
- delete confirmation;
- create-new by deep cloning the then-current default Theme.

TM-7 preserves these functional workflows while applying the TM-2 boundary corrections.

## Management Projection

The projection is supplied under:

```text
/theme-manager
/theme-manager/:id
/theme-manager/new
```

These are Theme Manager-owned default routes. A composition application remains responsible for whether and where the management projection is exposed in its application navigation.

The components themselves are under `app/components/theme-manager/` and can be composed independently of the default pages.

## No UI Capability Dependency

The management projection uses Vue/Nuxt and Theme Manager's own semantic Tailwind presentation contract.

It does not import a UI Library or reusable application component capability. This avoids the prohibited cycle in which UI consumes Theme Manager presentation contracts while Theme Manager depends back on UI.

The separate UI capability remains responsible for reusable application/component primitives outside Theme Manager's own domain projection.

## No Legacy Account/Auth Coupling

The legacy pages were hard-wired to:

- `/account/themes`;
- an `account` layout;
- `authentication` middleware.

Those assumptions are not migrated.

Authentication, Identity and Authorization remain external capabilities. TM-7 does not claim that rendering or hiding a button is authoritative permission enforcement.

## Theme Library

The migrated Theme Library preserves:

- loading state;
- error state;
- empty state;
- Theme cards;
- selected Theme indication;
- Theme selection;
- create navigation;
- edit navigation.

It consumes Theme summaries from the TM-6 management API and uses TM-5 runtime activation when an accessible Theme is selected.

Future library projections such as My Themes, Group Themes, Organisation Themes, Shared With Me, Public Themes and System Themes remain compatible with this projection model; their actor/scope filtering belongs to the later external Identity/Authorization integration.

## Theme Editor

The migrated Theme Editor preserves:

- metadata editing;
- light/dark preview context;
- Fill/Pen/Edge visual colour editing;
- raw Theme Definition JSON editing;
- JSON formatting;
- live preview;
- create/update;
- delete with confirmation.

The target Theme Definition also contains typography, spacing, radii, effects, responsive and asset families. TM-7 exposes these families as first-class editor tabs while retaining Raw JSON as the complete editing surface. Specialised visual controls for those families can be added without changing the Theme Definition or management boundary.

## Live Preview

The legacy editor directly mutated `document.documentElement.style`, creating a second runtime application path.

TM-7 removes that duplication.

Editor preview emits a validated Theme Definition through `useThemeManagement()`, which adapts the recovered colour presentation to the TM-5 preview state. TM-5's common Theme Application Engine remains the sole runtime CSS-variable application mechanism.

Leaving the editor clears preview state and restores the active Theme automatically.

## Create-New Semantics

The recovered editor deep-cloned a default Theme, which is retained as the correct strategy for obtaining a complete current schema/presentation baseline.

The legacy magic default identifiers are not retained.

Creation requires the composition context to supply:

- `creationTemplateId`;
- `creationOwnerType`;
- `creationOwnerId`.

The template is loaded through the normal Theme management contract and deep-cloned. Theme Manager generates a new resource ID and resets mutable resource metadata.

This preserves complete-default cloning without fabricating Identity data or hard-coding a system Theme identifier.

## Authorization Boundary

TM-2 defines Theme action vocabulary but external Authorization decides whether an actor may perform an action.

TM-7 therefore does not hard-code account roles or permission policy. Management controls are a projection only; server-side operations remain the authoritative enforcement point once TM-8 supplies Identity/Authorization integration.

## Accessibility

The management projection uses semantic headings, fieldsets, labels, native buttons/inputs and status/alert roles. User-customisable Theme values remain subject to the platform requirement that presentation customisation preserve accessibility.

## Quality Gate

TM-7 tests verify that:

- Theme Library and Theme Editor projections exist;
- Raw JSON, preview, deletion and visual colour editing workflows remain present;
- preview uses the TM-5 engine rather than direct CSS mutation;
- legacy account/authentication composition assumptions are absent;
- no UI capability dependency is introduced;
- legacy magic default IDs and fabricated owner IDs are absent;
- create/edit/select/save/delete workflows remain represented.

Nuxt typecheck and all TM-3 through TM-6 tests remain mandatory.

## TM-7 Boundary

TM-7 does not implement:

- external Authentication;
- external Identity;
- external Authorization policy/decision;
- user/group/organisation membership;
- Theme assignment policy;
- concrete persistence technology;
- physical asset storage;
- reusable cross-application UI components;
- final host-application integration.

These remain later work packages.

## TM-7 Gate Conclusion

TM-7 restores the Theme Library and Theme Editor as a self-contained Theme Manager management projection, preserves the recovered management workflows, routes live preview through the common runtime engine, and removes the legacy UI/Auth/account coupling.

The management projection is therefore ready for **TM-8 — User and Group Integration**.
