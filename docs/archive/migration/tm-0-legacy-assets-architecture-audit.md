# TM-0 — Legacy Assets Architecture Audit

## 1. Audit Summary

TM-0 examined the recovered `legacy-theme-manager` presentation assets at baseline `8847e6b1d8ebbca83f00d17b0cddb18522219c6e`. The legacy repository remains immutable migration evidence.

The recovered presentation architecture is coherent and should form the basis of the new Theme Manager:

```text
Theme Definition
    ↓
Raw theme variables (--ui-*)
    ↓
Semantic Theme API (--api-*)
    ↓
TailwindCSS mapping (--color-* etc.)
    ↓
Semantic Tailwind utilities
    ↓
UI consumption
```

Static defaults and runtime-loaded themes feed the same CSS-variable pipeline. Runtime themes override `--ui-*` values, allowing immediate theme changes without Tailwind recompilation; removal/failure of runtime overrides naturally exposes the bundled default theme.

### Recovered token system

| Family | Count |
|---|---:|
| Colour tokens | 280 |
| Font families | 3 |
| Text sizes | 7 |
| Font weights | 7 |
| Breakpoints | 8 |
| Containers | 2 |
| Spacing | 31 |
| Radius | 6 |
| Standard shadows | 56 |
| Inset shadows | 60 |
| Drop shadows | 56 |
| Text shadows | 56 |
| **Non-colour total** | **292** |
| **Total Tailwind vocabulary** | **572** |

Colour currently has the mature runtime theme architecture: **560 raw light/dark values → 280 semantic properties → 280 Tailwind colour mappings**.

The principal legacy architectural defect is that Theme Manager also contains `assets/css/components/`, implementing component-specific presentation for buttons, cards, navigation, sidebars, forms, heroes, etc. This is UI responsibility.

The target architecture therefore preserves and extends the Theme Manager's TailwindCSS-based semantic presentation system while removing knowledge of individual UI components and UI implementation topology.

---

## 2. Migration Action Matrix

| Area | Action |
|---|---|
| Raw → semantic → Tailwind architecture | **KEEP** — core Theme Manager architecture |
| Static/runtime themes using same variable contract | **KEEP** |
| Runtime mutation without Tailwind recompilation | **KEEP** |
| Default-theme CSS fallback | **KEEP + HARDEN** |
| Existing colour roles/states/modes | **KEEP + HARDEN** |
| 560 raw / 280 semantic / 280 Tailwind colour mapping | **KEEP + TEST** cardinality and equivalence |
| Fill/pen `shadow` vs TypeScript state-model mismatch | **FIX** |
| Misleading historical `--ui-*` / `--api-*` documentation | **FIX** in new implementation |
| Theme Definition schema | **HARDEN** — explicit, validated and versioned |
| Semantic presentation interface | **HARDEN** as public Theme Manager contract |
| Runtime loader/property generation | **HARDEN** through validated theme definitions |
| Failure/malformed/missing-theme handling | **HARDEN** |
| Persistence | **HARDEN** behind storage-independent repository contracts |
| Authentication/authorization | **DECOUPLE** — external capabilities |
| UI source-directory knowledge / Tailwind `@source` coupling | **REMOVE** from Theme Manager responsibility |
| Authentication source-directory knowledge | **REMOVE** |
| UI component CSS in Theme Manager | **REMOVE / MOVE TO UI** |
| UI component-specific concepts (`card`, `sidebar`, `hero`, etc.) | **REMOVE** from Theme Manager domain |
| `main.css` cross-capability aggregation | **FIX / SEPARATE** |
| Unimplemented/comment-only historical token families | **REMOVE or explicitly define** |
| Legacy repository | **KEEP IMMUTABLE** throughout migration |

### Capability boundary

**Theme Manager owns presentation primitives, semantic values, TailwindCSS integration, theme resolution and runtime application.**

**UI owns the composition of those primitives into components.**

UI components should be locally styled from the Theme Manager-provided semantic Tailwind vocabulary. Theme Manager must not know which components exist.

---

## 3. Theme Manager Extension Matrix

The legacy architecture should be extended rather than replaced. The existing non-colour Tailwind vocabulary becomes the starting point for a broader runtime-theme model.

| Family | Target |
|---|---|
| Colour | **KEEP + HARDEN** existing runtime theme capability |
| Font families | **EXTEND** into theme variables |
| Text sizes | **EXTEND** into theme variables |
| Font weights | **EXTEND** into theme variables |
| Spacing | **EXTEND** into theme variables |
| Radius | **EXTEND** into theme variables |
| Standard shadows | **EXTEND** into theme variables |
| Inset shadows | **EXTEND** into theme variables |
| Drop shadows | **EXTEND** into theme variables |
| Text shadows | **EXTEND** into theme variables |
| Breakpoints | **EXTEND** to runtime/theme specification |
| Containers | **EXTEND** to runtime/theme specification |
| Background/theme imagery | **ADD** semantic theme-asset support |

The intended evolution is therefore:

```text
Theme Definition
├── Colour
├── Typography
├── Spacing
├── Radius
├── Shadows
├── Breakpoints
├── Containers
├── Modes
└── Theme assets / imagery
        ↓
Semantic Theme API
        ↓
TailwindCSS presentation vocabulary
        ↓
UI-owned component composition
```

Theme assets require a defined workflow for selection, validation, persistence, resolution and fallback. Theme Manager should own the **semantic theme-to-asset association**; physical image/asset storage may be supplied by an external asset/resource library.

## 4. TM-0 Conclusion

TM-0 found a strong existing Theme Manager architecture rather than one requiring replacement. Its central mechanism—**runtime values → semantic variables → TailwindCSS → UI**—should be preserved and expanded.

The migration direction is therefore:

> **Extend Theme Manager from primarily colour-based runtime theming into a comprehensive semantic TailwindCSS presentation system, while completely removing component-specific UI presentation from its responsibility.**

This extension enables `assets/css/components/` to leave Theme Manager: UI components locally compose their presentation from the richer semantic Tailwind vocabulary supplied by Theme Manager.

TM-1 should now audit the remaining legacy Theme Manager functionality outside `assets/` before TM-2 formalises the resulting target architecture and contracts.