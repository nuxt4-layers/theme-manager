# Semantic Presentation Guide

## Purpose

Theme Manager exposes a semantic presentation vocabulary so consumers style by **meaning**, not by a particular rendered colour.

This guide defines the grammar for choosing and combining Theme Manager colour and effect tokens, and the order in which semantic correctness, palette correctness and accessibility are assessed.

The public consumer boundary remains `@nuxt4-layers/theme-manager/presentation.css`. Consumers MUST use the public semantic Tailwind vocabulary rather than private `--ui-*` or `--api-*` implementation variables.

## The grammar

A colour token expresses four dimensions:

```text
family + role + state + resolved presentation mode
```

The consumer-facing Tailwind form is:

```text
<utility>-<family>-<role>-<state>
```

For example:

```text
bg-fill-primary-default
text-pen-primary-default
border-edge-primary-default
```

The presentation mode (for example light or dark) is resolved by Theme Manager and is therefore not selected in the consumer utility.

### Families

| Family | Meaning | Typical Tailwind utility |
| --- | --- | --- |
| Fill | surface or background | `bg-fill-*` |
| Pen | foreground text or icon | `text-pen-*` |
| Edge | border, outline or visible boundary | `border-edge-*` |
| Effects | depth/emphasis such as standard, inset, drop and text shadows | shadow utilities |

A family name describes presentation purpose. It does not mean that every component must use all families.

### Roles

The colour vocabulary provides semantic roles including `base`, `primary`, `secondary`, `tertiary`, `accent`, `muted`, `floor`, `input`, `link`, `success`, `info`, `warning`, `error`, and `notification`.

Choose a role because it describes the UI meaning. **Do not select a semantic token merely because its current colour looks suitable.**

For a filled primary control, the coherent starting composition is:

```html
<button class="border border-edge-primary-default bg-fill-primary-default text-pen-primary-default">
  Save
</button>
```

Using `text-pen-base-default` merely because it appears legible changes the semantic relationship and is not a substitute for correcting a deficient primary palette.

### States

Colour roles expose `default`, `hover`, `active`, `selected`, `visited`, and `disabled` states.

State should describe the actual component state. Where a component changes state, its participating semantic families should normally advance coherently rather than mixing unrelated states without a specific semantic reason.

## Pairing rules

Semantic pairing is evaluated **before** colour contrast.

When Fill, Pen and Edge jointly describe one semantic surface or control, begin with the same role and state:

```text
Fill:  primary/default
Pen:   primary/default
Edge:  primary/default
```

Likewise, an error surface should normally compose:

```text
bg-fill-error-default
text-pen-error-default
border-edge-error-default
```

Cross-role combinations are permitted only when the component meaning requires them. They MUST be deliberate; contrast success alone does not justify a cross-role pairing.

This distinguishes two defect classes:

- **semantic-application defect** — a component consumes the wrong semantic token even if its colour happens to work;
- **palette defect** — a component uses the correct semantic token, but the underlying value does not adequately express the role, state or required contrast.

Correct the first in component composition. Correct the second in the Theme palette.

## Palette rules

A palette value must satisfy more than a numeric contrast threshold. It should preserve semantic-role identity, meaningful differentiation from adjacent roles/states, coherent state progression, appropriate light/dark behaviour, and applicable accessibility constraints.

Do not satisfy contrast by flattening distinct semantic roles into interchangeable greys when the role is intended to carry chromatic identity. Adjust the appropriate semantic palette value while retaining its role as far as practical.

Theme Manager's default Theme is the reference implementation of this grammar. User-defined Themes may choose different values, but consuming UI must preserve the semantic relationships.

## WCAG and accessibility

Accessibility validation is a **secondary check on correctly composed semantics**, not a mechanism for deciding which semantic token a component should use.

For the default Theme, the current regression contract applies these working thresholds:

- normal text represented by applicable non-disabled Pen/Fill pairs: at least **4.5:1**;
- meaningful non-text UI boundaries represented by applicable non-disabled Edge/Fill pairs: at least **3:1**, with additional margin in the default palette where practical;
- disabled/inactive controls are not subjected to the normal contrast requirement merely by being disabled.

These checks do not prove every possible consumer composition accessible. A consuming component remains responsible for testing the **actual rendered foreground, background, boundary and state indicator** it creates.

Large text, graphics, focus indicators and other accessibility cases must be assessed according to their actual rendered purpose rather than forced through an unrelated token-pair test.

### Focus and interaction states

Focus, hover, active and selected indicators must remain perceivable in their rendered context. Do not assume that a same-role Edge/Fill test proves a focus indicator is sufficient against every adjacent surface.

Accessibility testing therefore follows the rendered component relationship after semantic composition has been established.

## Shadows and effects

Shadow/effect tokens express depth, separation or emphasis. They are not another Edge family and do not automatically acquire a blanket 3:1 contrast requirement.

A decorative shadow may remain decorative. If a shadow or effect is relied upon as the only means of perceiving a meaningful boundary, focus state, selection or other UI information, assess the resulting rendered indicator under the applicable accessibility requirement.

Choose shadow tokens by effect semantics, not by searching for a shadow colour that happens to improve contrast.

## Review order

Use this order when creating or reviewing presentation:

```text
1. Semantic correctness
   Is each Fill, Pen, Edge and Effect token appropriate to the component's meaning and state?

2. Palette correctness
   Do the resolved values preserve role identity, state differentiation and light/dark coherence?

3. Accessibility
   Does the actual rendered combination meet the applicable WCAG requirement?

4. Composition verification
   Does the result remain correct when Theme Manager is composed with the consuming application?
```

Do not reverse steps 1 and 3. Substituting an unrelated semantic token solely to make a contrast calculation pass creates a semantically incorrect presentation system.

## Examples

### Correct primary action

```html
<button class="border border-edge-primary-default bg-fill-primary-default text-pen-primary-default">
  Save
</button>
```

The three families describe the same primary/default semantic state. Contrast is then evaluated for that intended combination.

### Incorrect contrast-driven substitution

```html
<button class="bg-fill-primary-default text-pen-base-default">
  Save
</button>
```

This is incorrect when the component is intended to be a coherent primary surface merely because `pen-base` happens to produce an acceptable colour. Use the primary Pen and correct the primary palette if necessary.

### Correct error surface

```html
<div class="border border-edge-error-default bg-fill-error-default text-pen-error-default">
  The Theme could not be saved.
</div>
```

The error meaning is represented consistently by Fill, Pen and Edge.

## Defect classification

| Class | Question | Corrective location |
| --- | --- | --- |
| Semantic application | Is the component using the wrong family/role/state? | component composition |
| Palette | Are correct semantic tokens resolving to poor or misleading values? | Theme values/default palette |
| Accessibility | Does correctly composed, intended presentation fail an applicable requirement? | normally palette or component indicator design, without corrupting semantics |
| Composition | Does another stylesheet/framework override Theme Manager's intended vocabulary? | presentation/composition boundary |

This classification is the enduring rule behind the semantic-pairing and palette-correction work exposed during PRs #28 and #29; the PRs are historical evidence, not the contract itself.

## Consumer checklist

Before accepting a component or Theme change, verify that tokens were selected by semantic meaning rather than appearance; Fill, Pen and Edge relationships are intentional; effects have an explicit presentation purpose; light and dark modes preserve semantic identity; actual rendered text and meaningful indicators meet applicable accessibility requirements; and no consumer bypasses the public contract with private Theme Manager variables or hard-coded replacements.

For integration and dependency-direction requirements, also see [Semantic Presentation Consumer Contract](./semantic-presentation-consumer-contract.md) and [Composition Contract](./composition-contract.md).
