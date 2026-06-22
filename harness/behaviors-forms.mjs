// Behavior/interaction harness for Qazana Strata's form-control data-attribute
// components. Self-contained sibling of behaviors.mjs — it DRIVES each behavior
// in a headless browser against the real demos (type, click, keyboard, ARIA
// state) and exits non-zero if any check fails, so it doubles as a regression
// gate. Ships its own throwaway static server + runner.
//
//   node harness/behaviors-forms.mjs
//
// Add a behavior: push a { name, url, viewport, run(page) } onto CHECKS. `run`
// drives the interaction and returns an array of failure strings ([] = pass).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { makeServer } from './_serve.mjs';

const PORT = Number(process.env.PORT || 4185);
const BASE = `http://localhost:${PORT}`;
const server = makeServer();

// collecting assert: records failures instead of throwing on the first
const checker = () => {
  const fails = [];
  return { t: (cond, msg) => { if (!cond) fails.push(msg); }, fails };
};

const CHECKS = [
  {
    // show/hide password: [data-pw-toggle] flips the sibling input type
    // password<->text and tracks aria-pressed.
    name: 'pw-toggle',
    url: '/demo/auth/new-password.html',
    viewport: { width: 480, height: 760 },
    async run(page) {
      const { t, fails } = checker();
      const inp = page.locator('#pw');
      // the toggle is the button inside the same .pw wrapper as #pw
      const btn = page.locator('.pw', { has: page.locator('#pw') }).locator('[data-pw-toggle]');
      if (!(await btn.count())) return ['no [data-pw-toggle] paired with #pw in fixture'];

      // starts masked
      t(await inp.getAttribute('type') === 'password', 'password input starts type=password');

      // click reveals: type=text, aria-pressed=true, label flips to HIDE
      await btn.click();
      t(await inp.getAttribute('type') === 'text', 'clicking toggle reveals the password (type=text)');
      t(await btn.getAttribute('aria-pressed') === 'true', 'toggle aria-pressed=true when revealed');
      t((await btn.textContent()).trim() === 'HIDE', 'text toggle label flips to HIDE when revealed');

      // click again re-masks: type=password, aria-pressed=false, label SHOW
      await btn.click();
      t(await inp.getAttribute('type') === 'password', 'clicking again re-masks (type=password)');
      t(await btn.getAttribute('aria-pressed') === 'false', 'toggle aria-pressed=false when masked');
      t((await btn.textContent()).trim() === 'SHOW', 'text toggle label flips back to SHOW');
      return fails;
    },
  },
  {
    // strength meter: typing into [data-pw-strength] drives the sibling .pwbar i
    // width + class and the .pwhint label across the score bands.
    name: 'pw-strength',
    url: '/demo/auth/new-password.html',
    viewport: { width: 480, height: 760 },
    async run(page) {
      const { t, fails } = checker();
      const inp = page.locator('#pw');
      if (!(await inp.evaluate((el) => el.hasAttribute('data-pw-strength')).catch(() => false)))
        return ['#pw is not [data-pw-strength] in fixture'];
      const field = page.locator('.field', { has: page.locator('#pw') });
      const bar = field.locator('.pwbar i');
      const hint = field.locator('.pwhint');
      if (!(await bar.count())) return ['no .pwbar i sibling in fixture'];

      // empty: bar collapsed, no class, no hint
      t(await bar.evaluate((el) => el.style.width === '0%' || el.style.width === ''), 'strength bar starts empty');

      // mid-strength password (>=8 lowercase only -> score 1) -> partial bar + hint
      await inp.fill('abcdefgh');
      const weakW = await bar.evaluate((el) => parseFloat(el.style.width) || 0);
      const weakHint = (await hint.textContent()).trim();
      t(weakW > 0 && weakW < 100, `partial-strength input gives a partial bar (got ${weakW}%)`);
      t(weakHint.length > 0, 'partial-strength input sets a non-empty hint label');

      // strong password (>=8, lower+upper, digit, symbol) -> full bar + .strong + "Strong"
      await inp.fill('Abcdef1!');
      const strongW = await bar.evaluate((el) => parseFloat(el.style.width) || 0);
      t(strongW === 100, `strong input fills the bar to 100% (got ${strongW}%)`);
      t(await bar.evaluate((el) => el.classList.contains('strong')), 'strong input adds .strong class to the bar');
      t((await hint.textContent()).trim() === 'Strong', 'strong input sets the hint to "Strong"');
      t(strongW > weakW, 'stronger password yields a wider bar than a weak one');

      // clearing collapses the bar + hint back to empty
      await inp.fill('');
      t(await bar.evaluate((el) => parseFloat(el.style.width) === 0), 'clearing the field collapses the bar');
      t((await hint.textContent()).trim() === '', 'clearing the field clears the hint');
      return fails;
    },
  },
  {
    // number stepper: [data-inc]/[data-dec] inside a [data-stepper] root clamp the
    // <input type=number> to min/max and disable the buttons at the bounds.
    name: 'stepper',
    url: '/demo/commerce/product.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const root = page.locator('[data-stepper]').first();
      if (!(await root.count())) return ['no [data-stepper] in fixture'];
      const inp = root.locator('input[type=number]');
      const inc = root.locator('[data-inc]');
      const dec = root.locator('[data-dec]');
      const min = parseFloat(await inp.getAttribute('min')) || 1;
      const max = parseFloat(await inp.getAttribute('max')) || 999;

      // starts at min, dec disabled at the lower bound
      t(parseFloat(await inp.inputValue()) === min, `stepper starts at min (${min})`);
      t(await dec.isDisabled(), 'dec button disabled at the lower bound');
      t(!(await inc.isDisabled()), 'inc button enabled away from the upper bound');

      // inc raises the value by one step and re-enables dec
      await inc.click();
      t(parseFloat(await inp.inputValue()) === min + 1, 'inc raises the value by one step');
      t(!(await dec.isDisabled()), 'dec re-enabled after stepping up off the floor');

      // inc clamps at max and disables itself there (stop clicking once disabled)
      for (let i = 0; i < max - min + 2 && !(await inc.isDisabled()); i++) await inc.click();
      t(parseFloat(await inp.inputValue()) === max, `inc clamps the value at max (${max})`);
      t(await inc.isDisabled(), 'inc button disabled at the upper bound');

      // dec from max steps back down and re-enables inc
      await dec.click();
      t(parseFloat(await inp.inputValue()) === max - 1, 'dec lowers the value by one step');
      t(!(await inc.isDisabled()), 'inc re-enabled after stepping down off the ceiling');
      return fails;
    },
  },
  {
    // select-all: a [data-select-all] checkbox (in the table head) toggles every
    // tbody checkbox and marks/unmarks each row .selected. (Tested on admin.html,
    // where the control sits inside the <table>; see bug note in the report for
    // the components.html placement.)
    name: 'select-all',
    url: '/demo/app/admin.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const all = page.locator('[data-select-all]').first();
      if (!(await all.count())) return ['no [data-select-all] in fixture'];
      const table = all.locator('xpath=ancestor::table[1]');
      if (!(await table.count())) return ['[data-select-all] is not inside a <table> (closest("table") would be null)'];
      const boxes = table.locator('tbody input[type=checkbox]');
      const n = await boxes.count();
      if (n < 2) return ['select-all table needs >=2 tbody checkboxes to test'];

      // none checked initially
      t(await boxes.evaluateAll((els) => els.every((b) => !b.checked)), 'tbody checkboxes start unchecked');

      // check select-all -> every row box checked + every row gets .selected
      await all.check();
      t(await boxes.evaluateAll((els) => els.every((b) => b.checked)), 'checking select-all checks every tbody box');
      t(await table.evaluate((tb) => Array.from(tb.querySelectorAll('tbody tr')).every((tr) => tr.classList.contains('selected'))),
        'checking select-all marks every row .selected');

      // uncheck select-all -> every row box unchecked + .selected cleared
      await all.uncheck();
      t(await boxes.evaluateAll((els) => els.every((b) => !b.checked)), 'unchecking select-all clears every tbody box');
      t(await table.evaluate((tb) => Array.from(tb.querySelectorAll('tbody tr')).every((tr) => !tr.classList.contains('selected'))),
        'unchecking select-all clears every row .selected');
      return fails;
    },
  },
  {
    // expandable table row: clicking .row-toggle expands the following
    // .row-detail (unhides it), flips the row .is-open and the button
    // aria-expanded; clicking again collapses it.
    name: 'row-toggle',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const toggle = page.locator('.row-toggle').first();
      if (!(await toggle.count())) return ['no .row-toggle in fixture'];
      const row = toggle.locator('xpath=ancestor::tr[1]');
      const detail = row.locator('xpath=following-sibling::tr[1]');
      if (!(await detail.evaluate((el) => el.classList.contains('row-detail')).catch(() => false)))
        return ['.row-toggle row is not followed by a .row-detail row'];

      // collapsed: detail hidden, aria-expanded=false, no .is-open
      t(await detail.evaluate((el) => el.hidden), 'detail row starts hidden');
      t(await toggle.getAttribute('aria-expanded') === 'false', 'toggle aria-expanded=false collapsed');
      t(!(await row.evaluate((el) => el.classList.contains('is-open'))), 'row starts without .is-open');

      // click expands: detail shown, aria-expanded=true, row .is-open
      await toggle.click();
      t(!(await detail.evaluate((el) => el.hidden)), 'clicking toggle reveals the detail row');
      t(await toggle.getAttribute('aria-expanded') === 'true', 'toggle aria-expanded=true when expanded');
      t(await row.evaluate((el) => el.classList.contains('is-open')), 'row gets .is-open when expanded');

      // click again collapses
      await toggle.click();
      t(await detail.evaluate((el) => el.hidden), 'clicking again hides the detail row');
      t(await toggle.getAttribute('aria-expanded') === 'false', 'toggle aria-expanded=false after collapse');
      t(!(await row.evaluate((el) => el.classList.contains('is-open'))), 'row loses .is-open after collapse');
      return fails;
    },
  },
  {
    // copy-to-clipboard: clicking [data-copy] writes data-copy to the clipboard
    // (verified via the granted clipboard permission) and flips the button into
    // its confirmed .copied state, restoring after a timeout.
    name: 'copy',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const btn = page.locator('[data-copy]').first();
      if (!(await btn.count())) return ['no [data-copy] in fixture'];
      const expected = await btn.getAttribute('data-copy');

      await btn.click();
      // confirmed state: .copied class + swapped icon/markup (here an icon button -> check mark)
      t(await btn.evaluate((el) => el.classList.contains('copied')), 'copy button gets .copied confirmed state');
      t(await btn.evaluate((el) => !!el.querySelector('i.fa-check') || /Copied/.test(el.textContent)),
        'copy button shows the confirmed check/Copied affordance');

      // the configured text actually reached the clipboard
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      t(clip === expected, `clipboard holds the data-copy text (expected "${expected}", got "${clip}")`);

      // confirmed state reverts after the 1400ms timeout
      await page.waitForTimeout(1600);
      t(!(await btn.evaluate((el) => el.classList.contains('copied'))), 'copy button reverts out of .copied after the timeout');
      return fails;
    },
  },

  // ---- month-grid model: the pure interface behind picker/calendar/daterange.
  // Tested directly (no DOM clicks) — the interface is the test surface.
  {
    name: 'month-grid (QZcal)',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const r = await page.evaluate(() => {
        const Q = window.QZcal;
        if (!Q) return { present: false };
        return {
          present: true,
          febLeap: Q.daysInMonth(2024, 1),     // 29
          feb2025: Q.daysInMonth(2025, 1),     // 28
          jun: Q.daysInMonth(2026, 5),         // 30
          jan: Q.daysInMonth(2026, 0),         // 31
          fwRange: Q.firstWeekday(2026, 5),    // 0..6
          rollUnder: Q.roll(2026, -1),         // {2025,11}
          rollOver: Q.roll(2026, 12),          // {2027,0}
          rollNoop: Q.roll(2026, 5),           // {2026,5}
          g: Q.monthGrid(2026, 5),             // June model
        };
      });
      t(r.present, 'window.QZcal is exposed');
      if (!r.present) return fails;
      t(r.febLeap === 29, `daysInMonth(2024,Feb)=29 (got ${r.febLeap})`);
      t(r.feb2025 === 28, `daysInMonth(2025,Feb)=28 (got ${r.feb2025})`);
      t(r.jun === 30 && r.jan === 31, `daysInMonth Jun=30/Jan=31 (got ${r.jun}/${r.jan})`);
      t(r.fwRange >= 0 && r.fwRange <= 6, `firstWeekday in 0..6 (got ${r.fwRange})`);
      t(r.rollUnder.y === 2025 && r.rollUnder.m === 11, 'roll(-1) -> Dec prev year');
      t(r.rollOver.y === 2027 && r.rollOver.m === 0, 'roll(12) -> Jan next year');
      t(r.rollNoop.y === 2026 && r.rollNoop.m === 5, 'roll in-range is a no-op');
      t(r.g.name === 'June' && r.g.days.length === 30, 'monthGrid(Jun): name+30 days');
      t(r.g.blanks === r.fwRange, 'monthGrid blanks === firstWeekday');
      t(r.g.days[0] === 1 && r.g.days[29] === 30, 'monthGrid days run 1..30');
      return fails;
    },
  },
];

await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch({ headless: true });
let failed = 0;

for (const c of CHECKS) {
  // reducedMotion: deterministic (no waiting on slide/fade transitions).
  // clipboard perms granted so the copy check can read back what was written.
  const ctx = await browser.newContext({
    viewport: c.viewport,
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
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
