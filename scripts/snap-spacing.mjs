// One-shot maintenance script: tokenize raw px in *spacing* properties of
// kits/*.css onto the (densified) --space-* scale.
//
//   node scripts/snap-spacing.mjs --dry   # report only, no writes
//   node scripts/snap-spacing.mjs         # rewrite files in place
//
// Rules:
//  - Only the spacing properties in PROPS below. Never border/box-shadow/
//    transform/width/height/font/radius/background/stroke etc.
//  - Bare positive integer px only. 0 and 1/2/3px (optical micro-nudges,
//    border-ish) are LEFT as-is. Negative px left as-is (avoid calc()).
//  - Snap to nearest scale value; ties round UP (toward breathing room).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

// scale value -> token suffix (must mirror tokens/qazana.tokens.css)
const SCALE = [
  [4, '1'], [6, '1_5'], [8, '2'], [10, '2_5'], [12, '3'], [14, '3_5'],
  [16, '4'], [20, '4_5'], [24, '5'], [28, '5_5'], [32, '6'], [40, '6_5'],
  [48, '7'], [56, '8'], [64, '9'], [80, '10'],
];
const VALUES = SCALE.map(([v]) => v);

function snap(px) {
  let best = VALUES[0], bestD = Infinity;
  for (const v of VALUES) {
    const d = Math.abs(px - v);
    if (d < bestD || (d === bestD && v > best)) { bestD = d; best = v; }
  }
  return SCALE.find(([v]) => v === best)[1];
}

// Spacing-RHYTHM properties only (box model), longest first so shorthands win.
// Positioning offsets (top/right/bottom/left/inset*) are deliberately EXCLUDED:
// those are placement/geometry, not rhythm — tokenizing them shifts absolutely
// positioned glyphs (checkmarks, the resizer bar, toast-host corners) and
// conflates placement with the spacing scale.
const PROPS = [
  'padding-block-start', 'padding-block-end', 'padding-inline-start', 'padding-inline-end',
  'padding-block', 'padding-inline', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding',
  'margin-block-start', 'margin-block-end', 'margin-inline-start', 'margin-inline-end',
  'margin-block', 'margin-inline', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin',
  'column-gap', 'row-gap', 'grid-gap', 'gap',
];
// require a `:` right after the property, and no word-char/hyphen before it
const declRe = new RegExp(`(?<![\\w-])(${PROPS.join('|')})(\\s*:\\s*)([^;{}]*)`, 'g');
const pxRe = /(^|[\s(])(\d+)px/g; // positive int px not preceded by '-' (so negatives skipped)

const report = {};
let totalFiles = 0, totalRepl = 0;
const leftovers = {};

for (const f of fs.readdirSync(path.join(ROOT, 'kits')).filter((n) => n.endsWith('.css'))) {
  const fp = path.join(ROOT, 'kits', f);
  let css = fs.readFileSync(fp, 'utf8');
  let repl = 0;
  css = css.replace(declRe, (m, prop, sep, val) => {
    const nv = val.replace(pxRe, (mm, pre, numStr) => {
      const n = Number(numStr);
      if (n <= 3) return mm;            // keep 0/1/2/3px micro-nudges
      repl++;
      if (!VALUES.includes(n)) (leftovers[n] = (leftovers[n] || 0) + 1);
      return `${pre}var(--space-${snap(n)})`;
    });
    return `${prop}${sep}${nv}`;
  });
  if (repl) {
    report[f] = repl; totalRepl += repl; totalFiles++;
    if (!DRY) fs.writeFileSync(fp, css);
  }
}

console.log(`${DRY ? '[dry] ' : ''}${totalRepl} replacements across ${totalFiles} files`);
for (const [f, n] of Object.entries(report).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${f}`);
const snapped = Object.entries(leftovers).sort((a, b) => b[1] - a[1]);
if (snapped.length) {
  console.log('\noff-scale values snapped (value: count -> token):');
  for (const [v, n] of snapped) console.log(`  ${v}px: ${n}  -> --space-${snap(Number(v))} (${VALUES.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) || (Math.abs(b - v) === Math.abs(a - v) && b > a) ? b : a)}px)`);
}
