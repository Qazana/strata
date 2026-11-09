// Focus-indicator harness for Qazana Strata — tabs through every demo page in
// BOTH color schemes and fails when a keyboard focus stop has no usable focus
// indicator.
//
//   node harness/focus.mjs
//
// Per focus stop it compares the element's computed style (plus its parent and
// grandparent, for :focus-within wrappers, and next sibling, for a hidden
// native input styled through `input:focus-visible + .track`) against a snapshot taken before any
// focus, then gates on:
//   1. ua-ring   the change is the browser's default `outline:auto` — the
//                element slipped past the global :focus-visible rule in base.css
//   2. no-change nothing visible changed at all
//   3. contrast  the strongest indicator colour (solid outline, changed border,
//                or box-shadow ring, alpha-blended) is under 3:1 against what's
//                behind it (WCAG 1.4.11)
//   4. content-ring  the opposite case: a heading or landmark that script focuses
//                (tabindex="-1", after a skip link or route change) shows a
//                ring. Content isn't a control, so it must not look like one.
// Range inputs are exempt from 2/3: their ring is drawn on the thumb
// pseudo-element, which computed style can't see. Screenshots cover those.
//
// Same scheme model as a11y.mjs: dark = prefers-color-scheme:dark with no theme
// attribute; light = explicit html[data-theme="light"]. Email pages are skipped
// (table-based mail markup, nothing to tab through that the kits style).
import { chromium } from 'playwright';
import { makeServer } from './_serve.mjs';
import { PAGES, urlFor } from './_pages.mjs';

const PORT = Number(process.env.PORT || 4189);
const BASE = `http://localhost:${PORT}`;
const MAX_STOPS = 400;   // per page; a safety cap, real pages stop far sooner
const MIN_CONTRAST = 3;
const server = makeServer();

const SCHEMES = [
  { name: 'dark', colorScheme: 'dark', theme: null },
  { name: 'light', colorScheme: 'light', theme: 'light' },
];

// Runs in the page. Installs window.__qzFocus with the snapshot + measure fns.
function install() {
  const PROPS = ['outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset', 'boxShadow',
    'borderTopColor', 'borderBottomColor', 'backgroundColor', 'color', 'textDecorationLine'];
  const snap1 = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el); const o = {};
    for (const p of PROPS) o[p] = cs[p];
    return o;
  };
  const nodes = (el) => [el, el.parentElement, el.parentElement && el.parentElement.parentElement, el.nextElementSibling];
  const snap = (el) => nodes(el).map(snap1);

  const parse = (s) => {
    const m = s && s.match(/rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:,? \/? ?([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null;
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  // the colour actually painted behind `el`: composite every translucent
  // background up the tree (tints like --primary-soft) over the first opaque one
  const bgBehind = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (!c || c[3] === 0) continue;
      layers.push(c);
      if (c[3] === 1) break;
    }
    let out = layers.length && layers[layers.length - 1][3] === 1 ? layers.pop() : [255, 255, 255, 1];
    while (layers.length) out = [...blend(layers.pop(), out), 1];
    return out;
  };

  const base = new Map();
  const SEL = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable=true]';
  document.querySelectorAll(SEL).forEach((el) => base.set(el, snap(el)));

  window.__qzFocus = () => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return { end: true };
    const r = el.getBoundingClientRect();
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    const desc = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls + (el.tagName === 'INPUT' ? `[type=${el.type}]` : '');
    const out = { desc, visible: r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' };
    const before = base.get(el);
    if (!before) { out.unknown = true; return out; }   // injected after load (e.g. by a behavior)
    const now = snap(el);

    let uaRing = false, changed = false, best = 0;
    now.forEach((cs, i) => {
      if (!cs || !before[i]) return;
      const node = nodes(el)[i];
      for (const p in cs) if (cs[p] !== before[i][p]) changed = true;
      if (i === 0 && cs.outlineStyle === 'auto' && before[0].outlineStyle !== 'auto') uaRing = true;
      // candidate indicator colours, each measured against what sits behind it
      const cands = [];
      if (cs.outlineStyle !== before[i].outlineStyle && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) {
        const inset = parseFloat(cs.outlineOffset) < 0;
        cands.push([parse(cs.outlineColor), bgBehind(inset ? node : node.parentElement || node)]);
      }
      if (cs.borderTopColor !== before[i].borderTopColor || cs.borderBottomColor !== before[i].borderBottomColor) {
        cands.push([parse(cs.borderTopColor), bgBehind(node.parentElement || node)]);
      }
      if (cs.boxShadow !== before[i].boxShadow && cs.boxShadow !== 'none') {
        const bg = bgBehind(node.parentElement || node);
        for (const m of cs.boxShadow.matchAll(/rgba?\([^)]*\)/g)) cands.push([parse(m[0]), bg]);
      }
      for (const [c, bg] of cands) if (c && bg) best = Math.max(best, ratio(blend(c, bg), bg));
    });
    const c0 = now[0];
    const detail = `outline ${c0.outlineStyle} ${c0.outlineWidth} ${c0.outlineColor} @${c0.outlineOffset}; ` +
      `border ${c0.borderTopColor}; shadow ${c0.boxShadow}; parent ${el.parentElement ? el.parentElement.className || el.parentElement.tagName : '-'}`;
    Object.assign(out, { uaRing, changed, contrast: best, detail, range: el.tagName === 'INPUT' && el.type === 'range' });
    return out;
  };
}

await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch({ headless: true });

const failures = [];
let stops = 0;
const pages = PAGES.map((p) => p.name).filter((n) => !n.startsWith('email/'));

for (const scheme of SCHEMES) {
  const ctx = await browser.newContext({ colorScheme: scheme.colorScheme, reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
  for (const name of pages) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + urlFor(name), { waitUntil: 'load' });
      if (scheme.theme) await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), scheme.theme);
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await page.mouse.move(0, 0);
      await page.evaluate(install);
      const seen = new Set();
      let first = null;
      for (let i = 0; i < MAX_STOPS; i++) {
        await page.keyboard.press('Tab');
        // a stable identity for the focused node, so wrap-around ends the walk;
        // multi-segment controls (date inputs) take several Tabs on one node
        const id = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          if (!el.dataset.qzFid) el.dataset.qzFid = String(Math.random()).slice(2);
          return el.dataset.qzFid;
        });
        if (id === null) break;
        if (first === null) first = id; else if (id === first) break;
        if (seen.has(id)) continue;
        seen.add(id);
        const r = await page.evaluate(() => window.__qzFocus());
        if (r.end || !r.visible || r.unknown) continue;
        stops++;
        const at = `${scheme.name}  ${name}  ${r.desc}`;
        if (r.uaRing) failures.push(['ua-ring', at, 'browser default outline (missed the global :focus-visible rule)']);
        else if (r.range) continue;
        else if (!r.changed) failures.push(['no-change', at, `nothing visible changes on focus — ${r.detail}`]);
        else if (r.contrast < MIN_CONTRAST) failures.push(['contrast', at, `indicator ${r.contrast.toFixed(2)}:1, needs ${MIN_CONTRAST}:1 — ${r.detail}`]);
      }
      // 4. focus the page's headings and landmarks the way a skip link or a
      // router would (tabindex="-1" + focus() right after a key press, so
      // :focus-visible matches) and require no ring
      const targets = await page.evaluate(() => {
        const els = [...document.querySelectorAll('h1,h2,h3,main,section,article')]
          .filter((el) => el.getBoundingClientRect().width > 0).slice(0, 6);
        return els.map((el, i) => { el.dataset.qzTarget = i; return el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''); });
      });
      for (let i = 0; i < targets.length; i++) {
        await page.keyboard.press('Shift');
        const ring = await page.evaluate((i) => {
          const el = document.querySelector(`[data-qz-target="${i}"]`);
          const had = el.getAttribute('tabindex');
          if (had === null) el.setAttribute('tabindex', '-1');
          el.focus();
          const cs = getComputedStyle(el);
          const out = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` : null;
          el.blur();
          if (had === null) el.removeAttribute('tabindex');
          return out;
        }, i);
        if (ring) failures.push(['content-ring', `${scheme.name}  ${name}  ${targets[i]}`, `focused content shows a ring (${ring})`]);
      }
    } catch (e) {
      failures.push(['error', `${scheme.name}  ${name}`, String(e.message || e).split('\n')[0]]);
    } finally {
      await page.close();
    }
  }
  await ctx.close();
}

await browser.close();
await new Promise((r) => server.close(r));

console.log(`focus indicators — ${stops} focus stops across ${pages.length} pages x ${SCHEMES.length} schemes\n`);
for (const [kind, at, msg] of failures) console.log(`FAIL  [${kind}] ${at}\n        - ${msg}`);
console.log(failures.length ? `\n${failures.length} focus stop(s) without a usable indicator` : 'PASS  every focus stop shows a 3:1 indicator');
process.exit(failures.length ? 1 : 0);
