// Accessibility harness for Qazana Strata — runs axe-core (WCAG 2 A/AA) against a
// representative set of demo pages in BOTH color schemes (dark + light) and exits
// non-zero on real (serious/critical) violations.
//
//   node harness/a11y.mjs
//
// Sibling to behaviors.mjs / shoot.mjs: same throwaway static server rooted at the
// repo, same headless chromium. Per page+scheme we inject the locally-installed
// axe-core source, run it in-page, and report.
//
// Scheme model (see tokens/qazana.tokens.css): the canonical dark scheme is the
// default :root, BUT an unset root flips to light tokens under
// `@media (prefers-color-scheme: light)`. Headless chromium defaults to light, so
// relying on the bare default would render light for BOTH runs. We therefore make
// each scheme explicit: dark = emulate prefers-color-scheme:dark with no theme
// attribute; light = emulate light + set html[data-theme="light"] (the explicit
// light theme, which applies regardless of the OS media query).
//
// Noise policy: we GATE on impact 'serious'|'critical' only, but we still COUNT
// 'minor'|'moderate' so the report shows the full picture without failing on it.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 4188);
const BASE = `http://localhost:${PORT}`;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// throwaway static server rooted at the repo (so /demo, /kits, /js, /tokens resolve)
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

// axe-core source, read once, injected into each page via addScriptTag
const axeSource = fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

// representative pages: marketing, app surfaces, auth, forms, the kitchen-sink
const PAGES = [
  '/demo/site/landing.html',
  '/demo/app/components.html',
  '/demo/app/survey.html',
  '/demo/auth/sign-in.html',
  '/demo/foundations/forms.html',
  '/demo/strata.html',
  '/demo/billing/overview.html',
  '/demo/docs/guide.html',
  '/demo/support/ticket.html',
];

// dark = emulate prefers-color-scheme:dark, no theme attribute (canonical :root);
// light = emulate light + explicit html[data-theme="light"]
const SCHEMES = [
  { name: 'dark', colorScheme: 'dark', theme: null },
  { name: 'light', colorScheme: 'light', theme: 'light' },
];

const GATE = new Set(['serious', 'critical']);

await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch({ headless: true });

let gatedTotal = 0;   // serious/critical violations (the failing kind)
let noiseTotal = 0;   // minor/moderate (counted, not gated)
const runs = [];

for (const url of PAGES) {
  for (const scheme of SCHEMES) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      colorScheme: scheme.colorScheme,
    });
    const page = await ctx.newPage();
    const label = `${url}  [${scheme.name}]`;
    let result = null;
    let error = null;
    try {
      await page.goto(BASE + url, { waitUntil: 'load', timeout: 30000 });
      // apply the scheme BEFORE axe runs (contrast checks read computed colors)
      await page.evaluate((theme) => {
        if (theme) document.documentElement.setAttribute('data-theme', theme);
        else document.documentElement.removeAttribute('data-theme');
      }, scheme.theme);
      await page.waitForTimeout(150);   // let any data-theme restyle settle
      await page.addScriptTag({ content: axeSource });
      result = await page.evaluate(async () =>
        await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    } catch (e) {
      error = (e.message || String(e)).slice(0, 200);
    }
    await ctx.close();

    const gated = [];
    let noise = 0;
    // WCAG 1.4.3 exempts disabled/inactive controls from contrast — drop those
    // nodes from color-contrast findings (a disabled control is dimmed by design).
    const isExemptDisabled = (node) =>
      /(?:^|[\s.#[])(?:is-disabled|disabled)\b|\[disabled\]|aria-disabled/i.test((node.target || []).join(' '));
    if (result) {
      for (const v of result.violations) {
        let vv = v;
        if (v.id === 'color-contrast') {
          const nodes = (v.nodes || []).filter((n) => !isExemptDisabled(n));
          if (!nodes.length) continue;        // only disabled controls → exempt
          vv = { ...v, nodes };
        }
        if (GATE.has(vv.impact)) gated.push(vv);
        else noise++;
      }
    }
    gatedTotal += gated.length;
    noiseTotal += noise;
    runs.push({ url, scheme: scheme.name, label, gated, noise, error });
  }
}

await browser.close();
await new Promise((r) => server.close(r));

// ---- report ----
console.log('axe-core WCAG 2 A/AA — gating on serious/critical only\n');
let erroredRuns = 0;
for (const run of runs) {
  if (run.error) {
    erroredRuns++;
    console.log(`ERROR ${run.label}`);
    console.log(`        - threw: ${run.error}`);
    continue;
  }
  const ok = run.gated.length === 0;
  const noiseNote = run.noise ? `  (+${run.noise} minor/moderate, not gated)` : '';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${run.label}${noiseNote}`);
  for (const v of run.gated) {
    const nodes = v.nodes || [];
    const example = nodes[0]?.target?.join(' ') || '(no target)';
    console.log(`        - ${v.id} (${v.impact}): ${v.help}  [${nodes.length} node${nodes.length === 1 ? '' : 's'}]  e.g. ${example}`);
  }
}

console.log(`\nserious/critical violations: ${gatedTotal} across ${runs.length} page+scheme runs` +
  ` (${noiseTotal} minor/moderate counted but not gated)`);
// fail on any gated violation, or if a run couldn't be scanned at all
process.exit(gatedTotal > 0 || erroredRuns > 0 ? 1 : 0);
