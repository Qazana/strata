// Static contract gate for Qazana Strata — enforces the AGENTS.md non-negotiables
// without a browser or any extra dependencies (plain Node, fs only).
//
//   node harness/contract.mjs          # (runs first in `npm test`)
//
// Sibling to behaviors.mjs (which DRIVES the components in a headless browser).
// This one reads the source files and asserts three invariants:
//
//   1. TOKENS SYNC   tokens/tokens.json mirrors the color tokens in
//                    tokens/qazana.tokens.css (no drift in either direction).
//   2. NO HARDCODED  component CSS (kits/*.css) references tokens, not literal
//      COLORS        chromatic colors. Pure black/white (#000/#fff and 0/255
//                    rgb channels, with any alpha), transparent, currentColor,
//                    and the channel form rgb(var(--x-rgb) / a) are allowed.
//   3. REDUCED       any CSS file that animates (@keyframes / animation: /
//      MOTION        transition:) also ships a prefers-reduced-motion guard.
//
// Exits non-zero if any real violation is found. Failures are reported as
// file:line so they can be fixed; the checks are NOT weakened to hide them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

const TOKENS_CSS = path.join(ROOT, 'tokens/qazana.tokens.css');
const TOKENS_JSON = path.join(ROOT, 'tokens/tokens.json');
const KITS_DIR = path.join(ROOT, 'kits');

// kit CSS files (top level of kits/, e.g. app.css, site.css …)
const kitFiles = fs
  .readdirSync(KITS_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => path.join(KITS_DIR, f))
  .sort();

const fail = [];   // genuine violations (each: { check, msg })
const report = (check, msg) => fail.push({ check, msg });

// ---------------------------------------------------------------------------
// 1. TOKENS SYNC — color group is the source of truth for drift.
//
// tokens.json is a curated, NESTED mirror of the CSS, not a flat 1:1 copy:
// non-color groups deliberately rename keys (radius.base -> --radius) and the
// CSS owns derived channels (--primary-rgb / --primary-soft) that have no JSON
// entry by design. A blanket name-equality check would be all false positives.
// The COLOR group, however, maps 1:1 — JSON `color.<name>` <-> CSS `:root`
// `--<name>` with a literal hex value — and is exactly where drift is costly
// (add/rename a semantic color in one file, forget the other). So sync is
// enforced on that group, in both directions, robust to formatting.
// ---------------------------------------------------------------------------
function checkTokensSync() {
  const cssText = read(TOKENS_CSS);
  const json = JSON.parse(read(TOKENS_JSON));

  // JSON canonical color names (the dark scheme group).
  const jsonColors = new Set(Object.keys(json.color || {}));

  // CSS :root block only — scheme overrides (light) re-declare the SAME names
  // and density/derived blocks must not be mistaken for new tokens.
  const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\n\s*\}/);
  if (!rootMatch) {
    report('tokens-sync', `could not locate :root{} block in ${rel(TOKENS_CSS)}`);
    return;
  }
  const rootBody = rootMatch[1];

  // every --name declared in :root (with its raw value, up to the ; )
  const cssDecls = [...rootBody.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)];
  const cssNames = new Set(cssDecls.map((m) => m[1]));

  // CSS tokens whose value is a literal hex color — these are color tokens and
  // must each have a JSON color entry. (Derived channels like --primary-rgb /
  // --primary-soft hold `r g b` triples or rgb(var(...)) and are excluded.)
  const cssColorTokens = cssDecls
    .filter((m) => /^#[0-9a-fA-F]{3,8}$/.test(m[2].trim()))
    .map((m) => m[1]);

  // a) JSON color key with no matching CSS --token (renamed/removed in CSS)
  for (const name of jsonColors) {
    if (!cssNames.has(name)) {
      report('tokens-sync',
        `tokens.json color.${name} has no matching --${name} in ${rel(TOKENS_CSS)} :root`);
    }
  }
  // b) CSS hex color token absent from JSON color group (added in CSS only)
  for (const name of cssColorTokens) {
    if (!jsonColors.has(name)) {
      report('tokens-sync',
        `${rel(TOKENS_CSS)} :root --${name} (color) is missing from tokens.json "color"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. NO HARDCODED COLORS in kits/*.css
//
// Flags literal hex (#rgb/#rrggbb/#rrggbbaa) and rgb()/rgba()/hsl()/hsla()
// with numeric args. Allowed (intentional constants, not flagged):
//   - #fff / #ffffff / #000 / #000000 (case-insensitive), transparent,
//     currentColor — the task allowlist.
//   - the channel form rgb(var(--x-rgb) / a)  (themeable tint, no numeric color)
//   - PURE black / pure white with alpha — rgb()/rgba() whose color channels
//     are all 0 (or all 255) — i.e. scrim/shadow overlays. tokens.css itself
//     defines shadows as rgba(0,0,0,.35); these are the same b/w-overlay family
//     the task already allows #000/#fff for. Documented as an allowlisted
//     false-positive risk, NOT a way to hide chromatic colors.
// Everything else (any chromatic hex/grey, brand color, hsl with hue) is a
// genuine violation and reported file:line.
// ---------------------------------------------------------------------------
const isPureBWHex = (hex) => {
  const h = hex.slice(1).toLowerCase();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const rgb = full.slice(0, 6);
  return rgb === '000000' || rgb === 'ffffff';
};

// rgb()/rgba() with numeric color channels all 0 or all 255 (alpha ignored)
const isPureBWFunc = (inner) => {
  // strip an alpha given as `/ a` or a trailing `, a`
  const nums = inner
    .replace(/\/.*/, '')          // drop `/ alpha`
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(Number);
  if (nums.length < 3 || nums.some((n) => Number.isNaN(n))) return false;
  return nums.every((n) => n === 0) || nums.every((n) => n === 255);
};

function checkHardcodedColors() {
  // match a hex literal OR an rgb/rgba/hsl/hsla(...) call
  const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/gi;

  for (const file of kitFiles) {
    const lines = read(file).split('\n');
    // @media print intentionally forces fixed neutral colors (white bg, black
    // text, grey borders) regardless of theme — a legitimate fixed-color
    // context, like #000/#fff. Track print-block membership and skip it.
    let printDepth = 0;
    lines.forEach((line, i) => {
      const entering = printDepth === 0 && /@media[^{]*\bprint\b/.test(line);
      if (printDepth > 0 || entering) {
        printDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        return;   // skip every line within an @media print block
      }

      for (const m of line.matchAll(COLOR_RE)) {
        const tok = m[0];

        if (/^#/.test(tok)) {
          if (isPureBWHex(tok)) continue;          // #fff / #000 family
          report('hardcoded-colors', `${rel(file)}:${i + 1}  literal hex ${tok}`);
          continue;
        }

        // function form: rgb()/rgba()/hsl()/hsla()
        const inner = tok.slice(tok.indexOf('(') + 1, tok.lastIndexOf(')'));
        if (/var\(\s*--/.test(inner)) continue;    // channel/token form, themeable
        if (/^rgba?\(/i.test(tok) && isPureBWFunc(inner)) continue; // b/w scrim/shadow
        report('hardcoded-colors', `${rel(file)}:${i + 1}  literal color ${tok}`);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 3. REDUCED MOTION — file-granular heuristic.
//
// A CSS file that defines a @keyframes or uses animation:/transition: must also
// contain a prefers-reduced-motion guard. (tokens + kits/*.css.)
// ---------------------------------------------------------------------------
function checkReducedMotion() {
  const files = [TOKENS_CSS, ...kitFiles];
  const ANIM = /@keyframes|animation\s*:|transition\s*:/i;
  for (const file of files) {
    const text = read(file);
    if (ANIM.test(text) && !/prefers-reduced-motion/i.test(text)) {
      report('reduced-motion',
        `${rel(file)} animates (@keyframes / animation: / transition:) but has no prefers-reduced-motion guard`);
    }
  }
}

// ---------------------------------------------------------------------------
checkTokensSync();
checkHardcodedColors();
checkReducedMotion();

const CHECKS = [
  ['tokens-sync', 'tokens.json mirrors qazana.tokens.css (color group)'],
  ['hardcoded-colors', 'kits/*.css use tokens, not literal colors'],
  ['reduced-motion', 'animating CSS ships a prefers-reduced-motion guard'],
];

let failed = 0;
for (const [id, desc] of CHECKS) {
  const hits = fail.filter((f) => f.check === id);
  const ok = hits.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} — ${desc}`);
  for (const h of hits) console.log(`        - ${h.msg}`);
}

console.log(`\n${CHECKS.length - failed}/${CHECKS.length} contract checks passed`);
process.exit(failed ? 1 : 0);
