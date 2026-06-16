// Generate tokens/tokens.figma.json — a Figma-shaped token export for the
// Tokens Studio plugin (see docs/figma.md). Code stays the source of truth:
// this reads tokens/tokens.json + tokens/qazana.tokens.css and emits two color
// sets (Dark / Light) wired as Figma variable MODES, plus a scheme-independent
// Scale set (radius/space/type/shadow/motion).
//
// Faithful to the (B) tint model: only BASE solids are exported — the derived
// tints (`-soft`/`-ring`/`-line`) and the pre-composited `line`/`line-strong`
// are NOT, because in Figma they are the base color at a layer opacity. A solid
// `border` is synthesised from --border-rgb so hairlines can use it at 8%/14%.
//
//   node scripts/figma-tokens.mjs    # writes tokens/tokens.figma.json
//
// Regenerate whenever tokens change (keep next to tokens.json in the checklist).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens/tokens.json'), 'utf8'));
const css = fs.readFileSync(path.join(ROOT, 'tokens/qazana.tokens.css'), 'utf8');

// tints expressed as opacity in Figma — never exported as variables
const DROP = new Set(['line', 'line-strong']);

// "r g b" (or "r,g,b") -> #rrggbb
const toHex = (triple) =>
  '#' + triple.trim().split(/[\s,]+/).slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, '0')).join('');

// --border-rgb declarations in source order: first = :root (dark), last = light
const borderRgb = [...css.matchAll(/--border-rgb:\s*([0-9\s]+);/g)].map((m) => m[1].trim());
const border = { dark: toHex(borderRgb[0]), light: toHex(borderRgb[borderRgb.length - 1]) };

// a color group (json.color / json['color-light']) -> Tokens-Studio set
function colorSet(group, borderHex) {
  const set = {};
  for (const [name, t] of Object.entries(group)) {
    if (DROP.has(name)) continue;                 // tint -> opacity, not a var
    set[name] = { value: t.value, type: 'color' };
  }
  set.border = { value: borderHex, type: 'color' };  // synthesised neutral channel
  return set;
}

// scheme-independent scale groups, passed through with their existing types
const SCALE_GROUPS = ['radius', 'space', 'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight', 'measure', 'shadow', 'motion'];
const scale = {};
for (const g of SCALE_GROUPS) if (json[g]) scale[g] = json[g];

const out = {
  'color/Dark': colorSet(json.color, border.dark),
  'color/Light': colorSet(json['color-light'], border.light),
  scale,
  $themes: [
    { id: 'dark', name: 'Dark', selectedTokenSets: { 'color/Dark': 'enabled', scale: 'enabled' } },
    { id: 'light', name: 'Light', selectedTokenSets: { 'color/Light': 'enabled', scale: 'enabled' } },
  ],
  $metadata: { tokenSetOrder: ['color/Dark', 'color/Light', 'scale'] },
};

const dest = path.join(ROOT, 'tokens/tokens.figma.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
const colors = Object.keys(out['color/Dark']).length;
console.log(`wrote tokens/tokens.figma.json — ${colors} color vars x Dark/Light, ${Object.keys(scale).length} scale groups (border dark ${border.dark} / light ${border.light})`);
