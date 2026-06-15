// Behavior/interaction harness for Qazana Strata's data-attribute components.
//
// Sibling to shoot.mjs (which gates render/theme integrity). This one DRIVES
// each behavior in a headless browser against the real demos — open/close,
// keyboard, focus-trap, ARIA state — and exits non-zero if any check fails, so
// it doubles as a regression gate. Same throwaway static server as shoot.mjs.
//
//   npm run harness:behaviors        # (also runs as `npm test`)
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
const PORT = Number(process.env.PORT || 4179);
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

const HAMBURGER = '.nav-menu-btn[data-nav-drawer-toggle]';

const CHECKS = [
  {
    name: 'nav-drawer',
    url: '/demo/site/landing.html',
    viewport: { width: 390, height: 820 },   // drawer only exists <=760px
    async run(page) {
      const { t, fails } = checker();
      const drawer = page.locator('.nav-drawer');

      // closed: panel out of the tab order + a11y tree (visibility:hidden)
      t(await drawer.evaluate((el) => getComputedStyle(el).visibility === 'hidden'),
        'closed drawer should be visibility:hidden (out of tab order)');

      // open via hamburger -> .open, aria-expanded, focus moves inside
      await page.locator(HAMBURGER).click();
      t(await drawer.evaluate((el) => el.classList.contains('open')), 'hamburger opens (.open)');
      t(await page.locator(HAMBURGER).getAttribute('aria-expanded') === 'true',
        'opener aria-expanded=true when open');
      t(await page.evaluate(() => document.querySelector('.nav-drawer').contains(document.activeElement)),
        'focus moves into the drawer on open');

      // Esc closes, restores focus to opener, resets aria-expanded
      await page.keyboard.press('Escape');
      t(await drawer.evaluate((el) => !el.classList.contains('open')), 'Escape closes');
      t(await page.locator(HAMBURGER).getAttribute('aria-expanded') === 'false',
        'opener aria-expanded=false after close');
      t(await page.evaluate((sel) => document.activeElement === document.querySelector(sel), HAMBURGER),
        'focus restored to opener after Esc');

      // the in-drawer close button toggles closed (regression: it used to re-open)
      await page.locator(HAMBURGER).click();                 // open
      await page.locator('.nav-drawer [data-nav-drawer-toggle]').click();   // X
      t(await drawer.evaluate((el) => !el.classList.contains('open')),
        'in-drawer close button closes (does not re-open)');

      return fails;
    },
  },
  {
    name: 'modal',
    url: '/demo/commerce/product.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const opener = page.locator('[data-modal-open]').first();
      const sel = await opener.getAttribute('data-modal-open');
      if (!sel) return ['no [data-modal-open] in fixture'];

      await opener.click();
      t(await page.locator(sel).evaluate((el) => el.classList.contains('is-open')),
        'scrim gets .is-open after trigger');
      t(await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), sel),
        'focus moves into the dialog');

      await page.keyboard.press('Escape');
      t(await page.locator(sel).evaluate((el) => !el.classList.contains('is-open')),
        'Escape closes the modal');
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
console.log(`\n${CHECKS.length - failed}/${CHECKS.length} behavior checks passed`);
process.exit(failed ? 1 : 0);
