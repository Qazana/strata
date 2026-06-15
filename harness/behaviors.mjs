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
  {
    name: 'combo',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const combo = page.locator('.combo[data-combo]').first();
      if (!(await combo.count())) return ['no .combo[data-combo] in fixture'];
      const btn = combo.locator('.combo-btn');
      const pop = combo.locator('.combo-pop');

      // closed: listbox popover is [hidden], button aria-expanded=false
      t(await pop.evaluate((el) => el.hidden), 'combo-pop starts hidden');
      t(await btn.getAttribute('aria-expanded') === 'false', 'combo aria-expanded=false closed');

      // open via the button -> pop revealed, aria-expanded, search focused
      await btn.click();
      t(!(await pop.evaluate((el) => el.hidden)), 'clicking combo-btn reveals the listbox');
      t(await btn.getAttribute('aria-expanded') === 'true', 'combo aria-expanded=true when open');
      t(await combo.evaluate((el) => el.querySelector('.combo-search input') === document.activeElement),
        'focus moves into the combo search field on open');

      // ArrowDown highlights the first visible option (.active)
      await page.keyboard.press('ArrowDown');
      const activeText = await combo.evaluate((el) => {
        const a = el.querySelector('.combo-opt.active'); return a ? a.textContent.trim() : null;
      });
      t(activeText !== null, 'ArrowDown highlights an option (.active)');

      // Enter selects: .combo-val text updates to the highlighted option + closes
      await page.keyboard.press('Enter');
      t(await combo.evaluate((el, text) => el.querySelector('.combo-val').textContent.trim() === text, activeText),
        'Enter selects the highlighted option (combo-val updates)');
      t(await pop.evaluate((el) => el.hidden), 'Enter closes the listbox after selecting');

      // re-open then Esc closes + resets aria
      await btn.click();
      t(!(await pop.evaluate((el) => el.hidden)), 'combo re-opens');
      await page.keyboard.press('Escape');
      t(await pop.evaluate((el) => el.hidden), 'Escape closes the combo');
      t(await btn.getAttribute('aria-expanded') === 'false', 'combo aria-expanded=false after Escape');
      return fails;
    },
  },
  {
    name: 'popover',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const wrap = page.locator('.popover-wrap').first();
      if (!(await wrap.count())) return ['no .popover-wrap in fixture'];
      const trig = wrap.locator('[data-popover]');
      const pop = wrap.locator('.popover');

      // closed: no .is-open
      t(!(await pop.evaluate((el) => el.classList.contains('is-open'))), 'popover starts closed');

      // click trigger -> .is-open + focus moves into the panel
      await trig.click();
      t(await pop.evaluate((el) => el.classList.contains('is-open')), 'clicking trigger opens the popover (.is-open)');
      t(await pop.evaluate((el) => el.contains(document.activeElement)),
        'focus moves into the popover panel on open');

      // Escape closes
      await page.keyboard.press('Escape');
      t(!(await pop.evaluate((el) => el.classList.contains('is-open'))), 'Escape closes the popover');

      // re-open then outside-click closes
      await trig.click();
      t(await pop.evaluate((el) => el.classList.contains('is-open')), 'popover re-opens');
      await page.mouse.click(5, 5);   // click far outside the panel
      t(!(await pop.evaluate((el) => el.classList.contains('is-open'))), 'outside-click closes the popover');
      return fails;
    },
  },
  {
    name: 'reorder',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const list = page.locator('.reorder[data-reorder]').first();
      if (!(await list.count())) return ['no .reorder[data-reorder] in fixture'];
      const items = list.locator('.reorder-item');
      if ((await items.count()) < 2) return ['reorder list needs >=2 .reorder-item to test'];

      // items are draggable (the JS wires reorder via native HTML5 DnD only)
      t(await items.first().evaluate((el) => el.draggable === true),
        'reorder items are draggable');

      // capture order, drag the first item onto the second, assert order changed
      const before = await list.evaluate((el) =>
        Array.from(el.querySelectorAll('.reorder-item .rname')).map((n) => n.textContent.trim()));
      await items.nth(0).dragTo(items.nth(1));
      const after = await list.evaluate((el) =>
        Array.from(el.querySelectorAll('.reorder-item .rname')).map((n) => n.textContent.trim()));
      t(before.join('|') !== after.join('|'),
        `dragging item 1 onto item 2 reorders the list (before=[${before}] after=[${after}])`);
      // specifically: the first item should now sit after the (former) second
      t(after.indexOf(before[0]) > after.indexOf(before[1]),
        `dragged item moves past its drop target (after=[${after}])`);

      // keyboard reorder (a11y): items are focusable and Alt+ArrowDown moves the
      // focused item down, announced via an aria-live region
      t(await items.first().evaluate((el) => el.tabIndex >= 0), 'reorder items are keyboard-focusable');
      const kbBefore = await list.evaluate((el) =>
        Array.from(el.querySelectorAll('.reorder-item .rname')).map((n) => n.textContent.trim()));
      await items.first().focus();
      await page.keyboard.press('Alt+ArrowDown');
      const kbAfter = await list.evaluate((el) =>
        Array.from(el.querySelectorAll('.reorder-item .rname')).map((n) => n.textContent.trim()));
      t(kbBefore[0] === kbAfter[1] && kbBefore[1] === kbAfter[0],
        `Alt+ArrowDown moves the focused item down one (before=[${kbBefore}] after=[${kbAfter}])`);
      t(await list.evaluate((el) => {
        const lr = el.querySelector('[aria-live]');
        return !!lr && /position\s*2\s*of/i.test(lr.textContent);
      }), 'move is announced via aria-live (position 2 of N)');
      return fails;
    },
  },
  {
    name: 'otp',
    url: '/demo/auth/two-factor.html',
    viewport: { width: 480, height: 720 },
    async run(page) {
      const { t, fails } = checker();
      const box = page.locator('.otp[data-otp]').first();
      if (!(await box.count())) return ['no .otp[data-otp] in fixture'];
      const inputs = box.locator('input');
      const n = await inputs.count();
      if (n < 2) return ['otp needs >=2 inputs to test auto-advance'];

      // type a digit into the first field -> focus auto-advances to the second
      await inputs.nth(0).focus();
      await inputs.nth(0).type('4');
      t(await box.evaluate((el) => el.querySelectorAll('input')[1] === document.activeElement),
        'typing a digit in field 1 auto-advances focus to field 2');
      t(await inputs.nth(0).inputValue() === '4', 'field 1 retains the typed digit');

      // type another digit -> advances again to field 3
      await inputs.nth(1).type('2');
      t(await box.evaluate((el) => el.querySelectorAll('input')[2] === document.activeElement),
        'typing in field 2 auto-advances focus to field 3');

      // Backspace on an empty field steps focus back to the previous field
      await inputs.nth(2).focus();
      await page.keyboard.press('Backspace');
      t(await box.evaluate((el) => el.querySelectorAll('input')[1] === document.activeElement),
        'Backspace on an empty field steps focus back to the previous field');

      // non-digit input is rejected (kept empty)
      await inputs.nth(0).focus();
      await inputs.nth(0).fill('');
      await inputs.nth(0).type('x');
      t(await inputs.nth(0).inputValue() === '', 'non-digit input is rejected');
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
