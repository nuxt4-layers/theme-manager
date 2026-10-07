#!/usr/bin/env node
/**
 * ================================================================================
 *
 * @project-manager    @monorepo/theme-manager
 * @file       ~/layers/theme-manager/scripts/generate-theme-api.mjs
 * @version    1.3.0
 * @createDate 2026 Oct 06
 * @author     Steve R Lewis
 *
 * ================================================================================
 *
 * @description
 * Derives the theme pipeline from its single source. The first three files are
 * LOCKED: this script only verifies them and never rewrites them. It writes the
 * fourth, theme-scope.css.
 *
 *   assets/css/theme/theme-default.css          SOURCE: --ui-* tokens; mode-dependent
 *                                               ones end in -light / -dark
 *   assets/css/theme/theme-api.css              --api-* mappings:
 *                                                 :root      --api-<n>: var(--ui-<n>-light)
 *                                                 html.dark  --api-<n>: var(--ui-<n>-dark)
 *                                                 :root      --api-<n>: var(--ui-<n>)
 *   assets/css/tailwindcss/tailwind-config.css  @theme inline: Tailwind namespaces
 *                                               mapped to --api-* (with literal
 *                                               breakpoints), then plain @keyframes
 *   assets/css/theme/theme-scope.css            the theme-api.css mappings again, on
 *                                               [data-theme-scope="light" | "dark"]:
 *                                               a scoped element (the editor preview)
 *                                               resolves --api-* from --ui-* values set
 *                                               on itself, in its own mode
 *
 * Each target keeps its existing header comment (everything before the first `:root`
 * in theme-api.css, before the first `@theme` in tailwind-config.css, before the first
 * `[data-theme-scope` in theme-scope.css), so descriptions and revision histories stay
 * hand-written. Everything after it is generated. Output uses LF line endings.
 *
 * Usage (from the layer root):
 *   node scripts/generate-theme-api.mjs           verify the locked files, write theme-scope.css
 *   node scripts/generate-theme-api.mjs --check   exit 1 if any file differs from its derivation
 *
 * The script fails (exit 1) when the source is inconsistent:
 *   - a -light token without its -dark partner, or the reverse
 *   - a token name the runtime engine cannot write (lowercase segments joined by
 *     single hyphens only)
 *   - a token that fits no section of either generated file
 *   - a mapping that points at a token that does not exist
 *   - an --ui-animate-* value whose @keyframes name is not defined in KEYFRAMES below
 *   - a breakpoint that is not a literal rem value (media queries cannot read var())
 *
 * No dependencies: Node 18+ only.
 *
 * ================================================================================
 *
 * @notes
 * Revision History
 *
 * v1.3.0 - 2026-10-07
 * - theme-default.css, theme-api.css and tailwind-config.css are locked: verified on
 *   every run, never written.
 * - Generates theme-scope.css: the theme-api.css mappings on [data-theme-scope], so a
 *   scoped preview can show a draft theme in either mode without touching <html>.
 *
 * v1.2.0 - 2026-10-06
 * - Border widths: maps --ui-border-width* to --default-border-width and
 *   --border-width-*, the focus ring to --default-outline-width, --outline-width-focus and
 *   --outline-offset-focus, and --ui-ring-width to --default-ring-width and
 *   --ring-width-focus. Tokens may now feed more than one Tailwind variable.
 *
 * v1.1.0 - 2026-10-06
 * - Also generates tailwind-config.css: colours, shadows and every presentation
 *   namespace mapped to --api-*; text and font-mono partner properties written in
 *   Tailwind's double-hyphen form; literal breakpoints; @keyframes; transition
 *   defaults from the duration and easing tokens. @keyframes are written after the
 *   @theme block as plain CSS, because Tailwind drops @theme keyframes it cannot see
 *   named in an --animate-* value (ours are var() references).
 *
 * v1.0.0 - 2026-10-06
 * - Initial version: generates theme-api.css.
 * ================================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const SOURCE = resolve(root, 'assets/css/theme/theme-default.css')
const API_TARGET = resolve(root, 'assets/css/theme/theme-api.css')
const TAILWIND_TARGET = resolve(root, 'assets/css/tailwindcss/tailwind-config.css')
const SCOPE_TARGET = resolve(root, 'assets/css/theme/theme-scope.css')
// Finalised: verified against their derivation, never rewritten by this script.
const LOCKED = new Set([API_TARGET, TAILWIND_TARGET])
const CHECK = process.argv.includes('--check')

const ROLES = ['floor', 'base', 'primary', 'secondary', 'tertiary', 'accent', 'muted', 'input', 'link', 'success', 'info', 'warning', 'error', 'notification']
const STATUS_START = 'success'
const CHANNELS = [
  ['fill', '1. FILL (Backgrounds)'],
  ['pen', '2. PEN (Text, Icons)'],
  ['edge', '3. EDGE (Borders, outlines, rings, dividers)'],
]
const SHADOWS = [
  ['shadow', '4. SHADOW (Box shadows, elevation)'],
  ['inset-shadow', '5. INSET SHADOW'],
  ['drop-shadow', '6. DROP SHADOW'],
  ['text-shadow', '7. TEXT SHADOW'],
]
// Mode-independent groups, in output order. First match wins.
const GROUPS = [
  ['FONT (families, mono font features)', k => k.startsWith('font-') && !k.startsWith('font-weight-')],
  ['TEXT (sizes, paired line heights, type roles)', k => k.startsWith('text-')],
  ['FONT-WEIGHT', k => k.startsWith('font-weight-')],
  ['TRACKING', k => k.startsWith('tracking-')],
  ['LEADING', k => k.startsWith('leading-')],
  ['BREAKPOINT (REFERENCE ONLY: Tailwind compiles literal values; see tailwind-config.css)', k => k.startsWith('breakpoint-')],
  ['CONTAINER', k => k.startsWith('container-')],
  ['SPACING (base unit and named steps)', k => k === 'spacing' || k.startsWith('spacing-')],
  ['RADIUS (default, scale, roles)', k => k === 'radius' || k.startsWith('radius-')],
  ['BORDER WIDTH (borders, dividers, focus outline, rings)', k => k === 'border-width' || k.startsWith('border-width-') || k.startsWith('focus-ring-') || k === 'ring-width'],
  ['BLUR', k => k.startsWith('blur-')],
  ['PERSPECTIVE and tilt angles', k => k.startsWith('perspective-') || k.startsWith('tilt-')],
  ['ASPECT', k => k.startsWith('aspect-')],
  ['EASE and durations', k => k.startsWith('ease-') || k.startsWith('duration-')],
  ['ANIMATE', k => k.startsWith('animate-')],
]

// Keyframes live in tailwind-config.css: a CSS variable cannot hold them, so the
// theme can change an animation's timing at runtime but never its keyframes.
// They read colours through Tailwind's --color-* names, which Tailwind emits when used.
const KEYFRAMES = {
  'spin': '    to { transform: rotate(360deg); }',
  'ping': '    75%, 100% { transform: scale(2); opacity: 0; }',
  'pulse': '    50% { opacity: 0.5; }',
  'skeleton': '    0%, 100% { background-color: var(--color-fill-muted-pressed); }\n    50% { background-color: var(--color-fill-muted-hover); }',
  'fade-in': '    from { opacity: 0; }',
  'slide-up': '    from { opacity: 0; transform: translateY(0.5rem); }',
  'scale-in': '    from { opacity: 0; transform: scale(0.95); }',
}

const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const DEFAULT_API_HEADER = `/**
 * ================================================================================
 *
 * @file       ~/layers/theme-manager/assets/css/theme/theme-api.css
 *
 * @description:
 * Semantic API layer: maps every --ui-* token from theme-default.css to a stable
 * --api-* name, choosing the light (:root) or dark (html.dark) value.
 * Generated by scripts/generate-theme-api.mjs; do not edit mappings by hand.
 * ================================================================================
 */
`
const DEFAULT_TAILWIND_HEADER = `/**
 * ================================================================================
 *
 * @file       ~/layers/theme-manager/assets/css/tailwindcss/tailwind-config.css
 *
 * @description
 * Maps Tailwind's theme namespaces to the --api-* tokens of theme-api.css with
 * @theme inline, so every utility reads the runtime-switchable value.
 * Generated by scripts/generate-theme-api.mjs; do not edit mappings by hand.
 * ================================================================================
 */
`

const errors = []
const fail = message => errors.push(message)
const normalise = text => text.replace(/\r\n?/g, '\n')
const stripComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '')

// ---------------------------------------------------------------- read source
// Comments contain code samples (keyframes, recipes), so ignore them.
const sourceBody = stripComments(normalise(readFileSync(SOURCE, 'utf8')))
const declarations = [...sourceBody.matchAll(/--ui-([A-Za-z0-9-]+)\s*:\s*([^;]+);/g)]
const values = new Map()
for (const [, name, value] of declarations) if (!values.has(name)) values.set(name, value.trim())
const names = [...values.keys()]

for (const name of names) {
  if (!SAFE_NAME.test(name)) fail(`--ui-${name}: not engine-safe (lowercase segments joined by single hyphens only)`)
}

const light = names.filter(n => n.endsWith('-light')).map(n => n.slice(0, -'-light'.length))
const dark = new Set(names.filter(n => n.endsWith('-dark')).map(n => n.slice(0, -'-dark'.length)))
const lightSet = new Set(light)
for (const n of light) if (!dark.has(n)) fail(`--ui-${n}-light has no --ui-${n}-dark partner`)
for (const n of dark) if (!lightSet.has(n)) fail(`--ui-${n}-dark has no --ui-${n}-light partner`)
const modeless = names.filter(n => !n.endsWith('-light') && !n.endsWith('-dark'))

// ---------------------------------------------------------------- shared helpers
function banner(title) {
  const line = `  /*${'~'.repeat(66)} */`
  const text = ` ${title} `
  return `${line}\n  /*${'~'.repeat(14)}${text}${'~'.repeat(Math.max(2, 52 - text.length))} */\n${line}\n`
}

function isOfNamespace(key, ns) {
  if (!key.startsWith(`${ns}-`)) return false
  // `shadow-*` must not swallow inset-, drop- or text-shadow keys.
  return ns !== 'shadow' || !/^(inset|drop|text)-/.test(key)
}

function headerOf(path, marker, fallback) {
  if (!existsSync(path)) return fallback
  const current = normalise(readFileSync(path, 'utf8'))
  const at = current.search(marker)
  return at > 0 ? current.slice(0, at).replace(/\s*$/, '\n') : fallback
}

// Walks the colour channels and shadow namespaces in a fixed order, so both
// generated files list tokens identically.
function eachModeToken(onSection, onGroup, onToken) {
  const placed = new Set()
  for (const [channel, title] of CHANNELS) {
    onSection(title)
    for (const role of ROLES) {
      if (role === STATUS_START) onGroup('--- Status roles ---', true)
      onGroup(`--- '${role}' ${channel} ---`)
      for (const key of light.filter(k => k.startsWith(`${channel}-${role}-`))) {
        onToken(key)
        placed.add(key)
      }
    }
  }
  for (const [ns, title] of SHADOWS) {
    onSection(title)
    const keys = light.filter(k => isOfNamespace(k, ns))
    const depth = ns.split('-').length
    onGroup('Default (no role) and elevation roles', false, true)
    for (const key of keys.filter(k => k.split('-').length === depth + 1)) {
      onToken(key)
      placed.add(key)
    }
    for (const role of ROLES) {
      onGroup(`'${role}'`, false, true)
      for (const key of keys.filter(k => k.endsWith(`-${role}`) && !placed.has(k))) {
        onToken(key)
        placed.add(key)
      }
    }
  }
  return placed
}

function groupOf(key) {
  return GROUPS.find(([, test]) => test(key))
}

// ---------------------------------------------------------------- theme-api.css
function apiModeBlock(mode) {
  const out = [banner(`[${mode.toUpperCase()}] MODE VARIANTS`)]
  out.push(`  color-scheme: ${mode};  /* browser controls (scrollbars, inputs, pickers) follow the mode */\n`)
  const placed = eachModeToken(
    title => out.push(`\n${banner(title)}`),
    (label, spaced, tight) => out.push(tight ? `  /* ${label} */` : `\n  /* ${label} */`),
    key => out.push(`  --api-${key}: var(--ui-${key}-${mode});`),
  )
  for (const key of light) if (!placed.has(key)) fail(`--ui-${key}-${mode} fits no section of theme-api.css; add its namespace`)
  return out.join('\n')
}

function apiModelessBlock() {
  const out = []
  for (const [title] of GROUPS) {
    out.push(`\n${banner(title)}`)
    for (const key of modeless.filter(k => groupOf(k)?.[0] === title)) out.push(`  --api-${key}: var(--ui-${key});`)
  }
  for (const key of modeless) if (!groupOf(key)) fail(`--ui-${key} fits no section of theme-api.css; add its namespace to GROUPS`)
  return out.join('\n')
}

const apiCss = `${headerOf(API_TARGET, /^:root\s*\{/m, DEFAULT_API_HEADER)}\n`
  + `:root {\n${apiModeBlock('light')}\n}\n\nhtml.dark {\n${apiModeBlock('dark')}\n}\n\n`
  + `/* Mode-independent presentation tokens: one mapping each, the same in both modes. */\n`
  + `:root {\n${apiModelessBlock()}\n}\n`

// ---------------------------------------------------------------- theme-scope.css
// A custom property's var() resolves where it is declared: --api-* declared on :root is
// already computed when a child sets --ui-* on itself. Re-declaring the mappings on the
// scoped element makes it resolve them from its own --ui-* values, in its own mode.
const DEFAULT_SCOPE_HEADER = `/**
 * ================================================================================
 *
 * @file       ~/layers/theme-manager/assets/css/theme/theme-scope.css
 *
 * @description
 * The theme-api.css mappings again, on [data-theme-scope="light" | "dark"].
 * Generated by scripts/generate-theme-api.mjs; do not edit mappings by hand.
 * ================================================================================
 */
`
// Tailwind declares the --color-* names that @keyframes read on :root, where they resolve
// against the page; re-declare them so scoped animations use the scope's colours.
const keyframeColours = [...new Set(Object.values(KEYFRAMES).join('\n').match(/--color-[a-z0-9-]+/g) ?? [])]
for (const name of keyframeColours) {
  if (!light.includes(name.slice('--color-'.length))) fail(`KEYFRAMES read ${name}, which is not a mode-dependent colour`)
}
const scopeKeyframeColours = keyframeColours.length
  ? `\n\n  /* Read by @keyframes in tailwind-config.css (Tailwind declares these on :root) */\n${keyframeColours.map(name => `  ${name}: var(--api-${name.slice('--color-'.length)});`).join('\n')}`
  : ''

const scopeCss = `${headerOf(SCOPE_TARGET, /^\[data-theme-scope/m, DEFAULT_SCOPE_HEADER)}\n`
  + `[data-theme-scope="light"] {\n${apiModeBlock('light')}\n}\n\n[data-theme-scope="dark"] {\n${apiModeBlock('dark')}\n}\n\n`
  + `/* Mode-independent presentation tokens: one mapping each, the same in both modes. */\n`
  + `[data-theme-scope] {\n${apiModelessBlock()}${scopeKeyframeColours}\n}\n`

// ---------------------------------------------------------------- tailwind-config.css
// How each mode-independent --api-* token reaches Tailwind. Returns a list of
// [tailwindName, value] pairs; an empty list when the token has no Tailwind namespace.
const NOT_A_NAMESPACE = {
  'tilt-': 'tilt angles: use `rotate-x-(--api-tilt-*)` / `rotate-y-(--api-tilt-*)`',
  'duration-': 'durations: use `duration-(--api-duration-*)`; `transition` defaults to duration-base',
}
// Tokens whose Tailwind names differ from their own, or that feed two Tailwind variables
// (a plain-utility default and a named width).
const RENAMED = {
  'font-mono-feature-settings': ['--font-mono--font-feature-settings'],
  'border-width': ['--default-border-width'],
  'focus-ring-width': ['--default-outline-width', '--outline-width-focus'],
  'focus-ring-offset': ['--outline-offset-focus'],
  'ring-width': ['--default-ring-width', '--ring-width-focus'],
}
function tailwindEntries(key) {
  const ref = `var(--api-${key})`
  if (RENAMED[key]) return RENAMED[key].map(name => [name, ref])
  if (key.startsWith('text-') && key.endsWith('-line-height')) return [[`--${key.slice(0, -'-line-height'.length)}--line-height`, ref]]
  if (key.startsWith('breakpoint-')) {
    const literal = values.get(key)
    if (!/^\d+(\.\d+)?rem$/.test(literal)) fail(`--ui-${key}: ${literal} must be a literal rem value (media queries cannot read var())`)
    return [[`--${key}`, literal]]
  }
  if (Object.keys(NOT_A_NAMESPACE).some(prefix => key.startsWith(prefix))) return []
  return [[`--${key}`, ref]]
}

function tailwindTheme() {
  const out = []
  out.push(banner('COLOUR (--color-*)'))
  out.push('  /* utilities: bg-fill-*, text-pen-*, border-, outline-, ring-, divide-edge-* */')
  const colourPlaced = new Set()
  for (const [channel, title] of CHANNELS) {
    out.push(`\n  /* ${title} */`)
    for (const role of ROLES) {
      if (role === STATUS_START) out.push('  /* Status roles */')
      for (const key of light.filter(k => k.startsWith(`${channel}-${role}-`))) {
        out.push(`  --color-${key}: var(--api-${key});`)
        colourPlaced.add(key)
      }
    }
  }

  for (const [ns, title] of SHADOWS) {
    out.push(`\n${banner(`${title.replace(/^\d+\. /, '')} (--${ns}-*)`)}`)
    for (const key of light.filter(k => isOfNamespace(k, ns))) {
      out.push(`  --${key}: var(--api-${key});`)
      colourPlaced.add(key)
    }
  }
  for (const key of light) if (!colourPlaced.has(key)) fail(`--ui-${key}-light fits no namespace of tailwind-config.css`)

  const skipped = new Set()
  for (const [title] of GROUPS) {
    const keys = modeless.filter(k => groupOf(k)?.[0] === title)
    if (!keys.length) continue
    out.push(`\n${banner(title.replace(/ \(REFERENCE ONLY.*\)$/, ' (LITERAL VALUES: media queries cannot read var())'))}`)
    for (const key of keys) {
      const entries = tailwindEntries(key)
      for (const [name, value] of entries) out.push(`  ${name}: ${value};`)
      if (!entries.length) skipped.add(Object.keys(NOT_A_NAMESPACE).find(prefix => key.startsWith(prefix)))
    }
    if (title.startsWith('EASE')) {
      out.push('  /* `transition` utilities default to the base duration and the standard curve */')
      out.push('  --default-transition-duration: var(--api-duration-base);')
      out.push('  --default-transition-timing-function: var(--api-ease-standard);')
    }
  }
  for (const prefix of skipped) out.push(`\n  /* Not a Tailwind namespace (mapped in theme-api.css only): ${NOT_A_NAMESPACE[prefix]} */`)

  // keyframes used by --ui-animate-* values
  const used = new Set()
  for (const key of modeless.filter(k => k.startsWith('animate-'))) {
    const name = values.get(key).split(/\s+/)[0]
    if (!KEYFRAMES[name]) fail(`--ui-${key} uses @keyframes ${name}, which KEYFRAMES in this script does not define`)
    else used.add(name)
  }
  return { theme: out.join('\n'), keyframes: [...used] }
}

// Keyframes go OUTSIDE @theme as plain CSS. Inside @theme, Tailwind only emits a
// keyframe whose name appears literally in an --animate-* value; ours are
// var(--api-animate-*) references, so Tailwind would drop them as unused.
function keyframesBlock(used) {
  const out = [`/* ${'='.repeat(84)}\n   KEYFRAMES (build-time; plain CSS so Tailwind always emits them)\n   Used by the --animate-* tokens. A theme can change an animation's timing, not these.\n   ${'='.repeat(84)} */`]
  for (const name of Object.keys(KEYFRAMES).filter(n => used.includes(n))) out.push(`@keyframes ${name} {\n${KEYFRAMES[name].replace(/^    /gm, '  ')}\n}`)
  return out.join('\n\n')
}

const tailwind = tailwindTheme()
const tailwindCss = `${headerOf(TAILWIND_TARGET, /^@theme\b/m, DEFAULT_TAILWIND_HEADER)}\n`
  + `@theme inline {\n${tailwind.theme}\n}\n\n${keyframesBlock(tailwind.keyframes)}\n`

// ---------------------------------------------------------------- verify
const known = new Set(names)
for (const m of stripComments(apiCss).matchAll(/var\(--ui-([a-z0-9-]+)\)/g)) {
  if (!known.has(m[1])) fail(`theme-api.css references --ui-${m[1]}, which theme-default.css does not define`)
}
const apiNames = new Set([...stripComments(apiCss).matchAll(/--api-([a-z0-9-]+)\s*:/g)].map(m => m[1]))
for (const m of stripComments(tailwindCss).matchAll(/var\(--api-([a-z0-9-]+)\)/g)) {
  if (!apiNames.has(m[1])) fail(`tailwind-config.css references --api-${m[1]}, which theme-api.css does not define`)
}

if (errors.length) {
  console.error(`theme generator: ${errors.length} problem(s) in ${SOURCE}`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const tailwindCount = [...stripComments(tailwindCss).matchAll(/^\s*--[a-z0-9-]+\s*:/gm)].length
const summaries = [
  [API_TARGET, apiCss, `${light.length} mappings per mode, ${modeless.length} mode-independent, ${apiNames.size} --api-* names`],
  [TAILWIND_TARGET, tailwindCss, `${tailwindCount} theme variables`],
  [SCOPE_TARGET, scopeCss, `${light.length} scoped mappings per mode, ${modeless.length} mode-independent`],
]

let stale = false
for (const [path, css, summary] of summaries) {
  if (CHECK || LOCKED.has(path)) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : ''
    if (current !== css) {
      console.error(LOCKED.has(path)
        ? `${path} is locked and no longer matches theme-default.css: the locked files must not change`
        : `${path} is out of date: run \`node scripts/generate-theme-api.mjs\``)
      stale = true
    }
    else console.log(`${path} is up to date (${summary})`)
  }
  else {
    writeFileSync(path, css, 'utf8')
    console.log(`wrote ${path} (${summary})`)
  }
}
if (stale) process.exit(1)
