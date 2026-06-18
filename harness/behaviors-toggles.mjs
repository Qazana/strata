// Toggle/state behavior harness for Qazana Strata's data-attribute components.
//
// Sibling to behaviors.mjs. Where that file drives open/close + focus-trap
// widgets, this one drives the *state toggles* — theme/density/direction
// switchers, the off-canvas sidebar, and table bulk-selection — against the
// real demos in a headless browser, asserting the actual DOM state change and
// exiting non-zero if any check fails. Same throwaway static server pattern.
//
//   node harness/behaviors-toggles.mjs
//
// Add a behavior: push a { name, url, viewport, run(page) } onto CHECKS. `run`
// drives the interaction and returns an array of failure strings ([] = pass).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 4187);
const BASE = `http://localhost:${PORT}`;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// throwaway static server rooted at the repo (so /demo, /kits, /js resolve)
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

// collecting assert: records failures instead of throwing on the first
const checker = () => {
  const fails = [];
  return { t: (cond, msg) => { if (!cond) fails.push(msg); }, fails };
};

const CHECKS = [
  {
    // [data-theme-toggle="a,b,…"] cycles html[data-theme] through the comma list
    // and persists to localStorage. A full cycle returns to the start.
    name: 'theme-toggle',
    url: '/demo/strata.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const btn = page.locator('[data-theme-toggle]').first();
      if (!(await btn.count())) return ['no [data-theme-toggle] in fixture'];

      const list = (await btn.getAttribute('data-theme-toggle'))
        .split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length < 2) return [`theme list needs >=2 entries (got [${list}])`];

      const root = page.locator('html');
      const themeNow = () => root.getAttribute('data-theme');

      // Whatever the starting theme (it may be persisted/unset), the first click
      // lands on the entry *after* the current one in the cycle — and unknown
      // current resolves to index 0 -> list[1] (indexOf(-1)+1 === 0+… ). We
      // assert the cycle is deterministic and wraps, independent of the start.
      const start = await themeNow();
      const startIdx = list.indexOf(start);

      await btn.click();
      const afterFirst = await themeNow();
      const expectFirst = list[(startIdx + 1 + list.length) % list.length];
      t(afterFirst === expectFirst,
        `first click advances to next in cycle (start=${start} -> got ${afterFirst}, expected ${expectFirst})`);

      // a known theme is now applied; one click per remaining entry returns to it
      const anchor = afterFirst;
      const anchorIdx = list.indexOf(anchor);
      for (let i = 1; i <= list.length; i++) {
        await btn.click();
        const expect = list[(anchorIdx + i) % list.length];
        const got = await themeNow();
        t(got === expect, `cycle step ${i}: data-theme=${got}, expected ${expect}`);
      }
      // after a full extra cycle from the anchor we are back at the anchor
      t(await themeNow() === anchor, `full cycle returns to start theme (${anchor})`);

      // choice is persisted to localStorage so a reload keeps it
      const persisted = await page.evaluate(() => localStorage.getItem('qazana-theme'));
      t(persisted === anchor, `theme persisted to localStorage (got ${persisted}, expected ${anchor})`);
      return fails;
    },
  },
  {
    // [data-density-toggle] flips html[data-density] between compact and
    // comfortable (it sets an explicit value either way — it does not unset).
    name: 'density-toggle',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const btn = page.locator('[data-density-toggle]').first();
      if (!(await btn.count())) return ['no [data-density-toggle] in fixture'];

      const root = page.locator('html');
      const density = () => root.getAttribute('data-density');

      // components.html ships with no explicit density (treated as comfortable).
      const start = await density();
      const startCompact = start === 'compact';

      await btn.click();
      const after = await density();
      t(after === (startCompact ? 'comfortable' : 'compact'),
        `click flips density (start=${start} -> ${after})`);
      // aria-pressed mirrors the compact state
      t(await btn.getAttribute('aria-pressed') === String(after === 'compact'),
        `aria-pressed mirrors compact state (density=${after}, aria-pressed=${await btn.getAttribute('aria-pressed')})`);

      // a second click flips it back
      await btn.click();
      const back = await density();
      t(back === (startCompact ? 'compact' : 'comfortable'),
        `second click flips density back (${after} -> ${back})`);
      return fails;
    },
  },
  {
    // [data-dir-toggle] flips html[dir] between ltr and rtl and persists it.
    name: 'dir-toggle',
    url: '/demo/index.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const btn = page.locator('[data-dir-toggle]').first();
      if (!(await btn.count())) return ['no [data-dir-toggle] in fixture'];

      const root = page.locator('html');
      const dir = () => page.evaluate(() => document.documentElement.dir);

      const start = await dir();             // '' or 'ltr' initially
      await btn.click();
      const after = await dir();
      // first flip: rtl unless it was already rtl
      const expectFirst = start === 'rtl' ? 'ltr' : 'rtl';
      t(after === expectFirst, `click flips html dir (start='${start}' -> '${after}', expected '${expectFirst}')`);
      t(await root.getAttribute('dir') === expectFirst, `dir attribute set to ${expectFirst}`);
      t(await btn.getAttribute('aria-pressed') === String(expectFirst === 'rtl'),
        `aria-pressed mirrors rtl state after flip (=${await btn.getAttribute('aria-pressed')})`);

      // flip back
      await btn.click();
      const back = await dir();
      t(back === (expectFirst === 'rtl' ? 'ltr' : 'rtl'),
        `second click flips direction back ('${after}' -> '${back}')`);

      // persisted
      const persisted = await page.evaluate(() => localStorage.getItem('qazana-dir'));
      t(persisted === back, `direction persisted to localStorage (got ${persisted}, expected ${back})`);
      return fails;
    },
  },
  {
    // [data-sidebar-toggle="#frame"] toggles .nav-open on the target .adminframe
    // (off-canvas sidebar). Backdrop/nav-item click and Esc close it.
    // NOTE: the implementation uses a `.nav-open` class on the frame, not a
    // `collapsed` class or aria-expanded — we assert the real behavior.
    name: 'sidebar-toggle',
    url: '/demo/app/admin.html',
    viewport: { width: 420, height: 820 },   // narrow: off-canvas regime
    async run(page) {
      const { t, fails } = checker();
      const btn = page.locator('[data-sidebar-toggle]').first();
      if (!(await btn.count())) return ['no [data-sidebar-toggle] in fixture'];
      const frame = page.locator('.adminframe').first();
      if (!(await frame.count())) return ['no .adminframe target in fixture'];

      const open = () => frame.evaluate((el) => el.classList.contains('nav-open'));

      // starts collapsed (no .nav-open)
      t(!(await open()), 'sidebar starts collapsed (no .nav-open)');

      // toggle opens
      await btn.click();
      t(await open(), 'clicking the toggle expands the sidebar (.nav-open)');

      // Esc closes
      await page.keyboard.press('Escape');
      t(!(await open()), 'Escape collapses the sidebar');

      // re-open, then a nav-item click collapses it
      await btn.click();
      t(await open(), 'sidebar re-opens');
      const navItem = frame.locator('.side-item').first();
      if (await navItem.count()) {
        await navItem.click();
        t(!(await open()), 'clicking a nav item collapses the sidebar');
      } else {
        // no nav item to test the close-on-navigate path; toggle closes instead
        await btn.click();
        t(!(await open()), 'toggling again collapses the sidebar');
      }
      return fails;
    },
  },
  {
    // [data-bulk] table + [data-bulkbar]: checking rows reveals the bulk action
    // bar with a live .bcount of the selected rows; clearing hides it again.
    name: 'bulk-select',
    url: '/demo/app/admin.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const table = page.locator('[data-bulk]').first();
      if (!(await table.count())) return ['no [data-bulk] table in fixture'];
      const bar = page.locator('[data-bulkbar]').first();
      if (!(await bar.count())) return ['no [data-bulkbar] in fixture'];
      const rows = table.locator('tbody input[type=checkbox]');
      const n = await rows.count();
      if (n < 2) return ['bulk table needs >=2 row checkboxes to test'];

      const count = () => bar.locator('.bcount').textContent();

      // start: bar hidden
      t(await bar.evaluate((el) => el.hidden), 'bulkbar starts hidden (no rows selected)');

      // check one row -> bar visible, count = 1
      await rows.nth(0).check();
      t(!(await bar.evaluate((el) => el.hidden)), 'checking a row reveals the bulkbar');
      t((await count()).trim() === '1', `bulkbar shows 1 selected (got "${(await count()).trim()}")`);

      // check a second row -> count = 2
      await rows.nth(1).check();
      t((await count()).trim() === '2', `bulkbar count updates to 2 (got "${(await count()).trim()}")`);

      // uncheck both -> bar hides again
      await rows.nth(0).uncheck();
      await rows.nth(1).uncheck();
      t(await bar.evaluate((el) => el.hidden), 'unchecking all rows hides the bulkbar again');

      // select-all checkbox selects every row and reveals the bar with the full count
      const selectAll = table.locator('[data-select-all]').first();
      if (await selectAll.count()) {
        await selectAll.check();
        t(!(await bar.evaluate((el) => el.hidden)), 'select-all reveals the bulkbar');
        t((await count()).trim() === String(n),
          `select-all selects all ${n} rows (bcount="${(await count()).trim()}")`);
      }
      return fails;
    },
  },
  {
    // [data-billing-cycle="<sel>"]: a monthly/annual radiogroup that flips
    // data-cycle on the named target so CSS swaps pre-rendered price spans.
    // Asserts the swap is real (month price visible, year hidden, and back).
    name: 'billing-cycle',
    url: '/demo/billing/plans.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const group = page.locator('[data-billing-cycle]').first();
      if (!(await group.count())) return ['no [data-billing-cycle] in fixture'];

      const sel = await group.getAttribute('data-billing-cycle');
      const target = page.locator(sel).first();
      if (!(await target.count())) return [`cycle target ${sel} not found`];

      const cycle = () => target.getAttribute('data-cycle');
      const opts = group.locator('[role="radio"]');
      const monthOpt = group.locator('[data-value="month"]').first();
      const yearOpt = group.locator('[data-value="year"]').first();

      // a price element of each cycle (first plan card)
      const monthPrice = target.locator('[data-cy="month"]').first();
      const yearPrice = target.locator('[data-cy="year"]').first();
      const visible = (loc) => loc.evaluate((el) => getComputedStyle(el).display !== 'none');

      // init: synced to the checked option (monthly) — month visible, year hidden
      t((await cycle()) === 'month', `starts on monthly cycle (got ${await cycle()})`);
      t(await visible(monthPrice), 'monthly price visible at start');
      t(!(await visible(yearPrice)), 'annual price hidden at start');
      t((await monthOpt.getAttribute('aria-checked')) === 'true', 'monthly option aria-checked at start');

      // click Annual -> data-cycle flips, annual price shows, monthly hides
      await yearOpt.click();
      t((await cycle()) === 'year', `clicking Annual flips cycle to year (got ${await cycle()})`);
      t(await visible(yearPrice), 'annual price visible after toggle');
      t(!(await visible(monthPrice)), 'monthly price hidden after toggle');
      t((await yearOpt.getAttribute('aria-checked')) === 'true', 'annual option aria-checked after toggle');

      // ArrowLeft returns focus/selection to monthly (radiogroup keyboard nav)
      await yearOpt.press('ArrowLeft');
      t((await cycle()) === 'month', `ArrowLeft returns to monthly (got ${await cycle()})`);
      t((await opts.count()) === 2, 'exactly two cycle options');
      return fails;
    },
  },
];

await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch({ headless: true });
let failed = 0;

for (const c of CHECKS) {
  // reducedMotion: deterministic (no waiting on slide/fade transitions)
  const ctx = await browser.newContext({ viewport: c.viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 160)));

  let fails = [];
  try {
    await page.goto(BASE + c.url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(150);
    fails = await c.run(page);
  } catch (e) {
    fails = ['threw: ' + (e.message || String(e)).slice(0, 200)];
  }
  if (pageErrors.length) fails.push(...pageErrors.map((e) => 'pageerror: ' + e));

  const ok = fails.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  for (const f of fails) console.log(`        - ${f}`);
  await ctx.close();
}

await browser.close();
await new Promise((r) => server.close(r));
console.log(`\n${CHECKS.length - failed}/${CHECKS.length} toggle/state checks passed`);
process.exit(failed ? 1 : 0);
