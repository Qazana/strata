// Behavior/interaction harness for Qazana Strata's overlay & picker components.
//
// Sibling to behaviors.mjs. This one DRIVES the overlay/popover family in a
// headless browser against the real demos — open/close, keyboard, focus,
// filtering, selection — and exits non-zero if any check fails, so it doubles
// as a regression gate. Same throwaway static server pattern as behaviors.mjs.
//
//   node harness/behaviors-overlays.mjs
//
// Covered: data-cmdk-open (command palette), data-ctx (context menu),
// data-picker (date popover), data-calendar (inline calendar),
// data-daterange (range calendar), data-colorpicker (swatch picker),
// [data-tip]/.tip-pop tooltip engine (body-level, role/aria, Esc),
// data-lightbox (gallery viewer: open, img/video, keyboard nav, focus restore).
//
// Add a behavior: push a { name, url, viewport, run(page) } onto CHECKS. `run`
// drives the interaction and returns an array of failure strings ([] = pass).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { makeServer } from './_serve.mjs';

const PORT = Number(process.env.PORT || 4186);
const BASE = `http://localhost:${PORT}`;
const server = makeServer();

// collecting assert: records failures instead of throwing on the first
const checker = () => {
  const fails = [];
  return { t: (cond, msg) => { if (!cond) fails.push(msg); }, fails };
};

const CHECKS = [
  {
    // Command palette: opens via [data-cmdk-open] click AND Ctrl/Cmd+K, the
    // search field focuses, typing filters .cmd-item items (sets [hidden]),
    // a non-matching query reveals .cmd-empty, ArrowDown highlights (.active),
    // Esc closes.
    name: 'cmdk',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const scrim = page.locator('.cmdk-scrim');
      if (!(await scrim.count())) return ['no .cmdk-scrim in fixture'];
      const opener = page.locator('[data-cmdk-open]').first();
      if (!(await opener.count())) return ['no [data-cmdk-open] trigger in fixture'];

      // closed: scrim [hidden], no .is-open
      t(await scrim.evaluate((el) => el.hidden), 'cmdk scrim starts hidden');

      // open via the trigger button -> .is-open + search field focused
      await opener.click();
      t(await scrim.evaluate((el) => el.classList.contains('is-open')),
        'clicking [data-cmdk-open] opens the palette (.is-open)');
      t(await scrim.evaluate((el) => el.querySelector('.cmdk-search input') === document.activeElement),
        'focus moves into the cmdk search field on open');

      // typing filters items: query a known item, others hidden
      const totalItems = await scrim.locator('.cmd-item').count();
      await page.locator('.cmdk-search input').fill('Sign out');
      const visAfter = await scrim.evaluate((el) =>
        Array.prototype.slice.call(el.querySelectorAll('.cmd-item')).filter((i) => !i.hidden).length);
      t(visAfter < totalItems && visAfter >= 1,
        `typing filters the list (visible ${visAfter} of ${totalItems})`);
      t(await scrim.evaluate((el) => {
        const v = Array.prototype.slice.call(el.querySelectorAll('.cmd-item')).filter((i) => !i.hidden);
        return v.every((i) => /sign out/i.test(i.textContent));
      }), 'only matching items remain visible after filtering');

      // a query with no matches reveals the .cmd-empty state
      await page.locator('.cmdk-search input').fill('zzzznomatch');
      t(await scrim.evaluate((el) => {
        const e = el.querySelector('.cmd-empty');
        const vis = Array.prototype.slice.call(el.querySelectorAll('.cmd-item')).filter((i) => !i.hidden);
        return vis.length === 0 && e && !e.hidden;
      }), 'a non-matching query shows the empty state and hides all items');

      // clear, ArrowDown highlights the first visible item (.active)
      await page.locator('.cmdk-search input').fill('');
      await page.keyboard.press('ArrowDown');
      t(await scrim.evaluate((el) => !!el.querySelector('.cmd-item.active')),
        'ArrowDown highlights a command (.active)');

      // Esc closes
      await page.keyboard.press('Escape');
      t(!(await scrim.evaluate((el) => el.classList.contains('is-open'))),
        'Escape closes the command palette');

      // also opens via Ctrl/Cmd+K (the documented shortcut)
      await page.keyboard.press('Control+k');
      t(await scrim.evaluate((el) => el.classList.contains('is-open')),
        'Ctrl+K opens the command palette');
      await page.keyboard.press('Control+k');
      t(!(await scrim.evaluate((el) => el.classList.contains('is-open'))),
        'Ctrl+K again toggles the command palette closed');
      return fails;
    },
  },
  {
    // Context menu: right-click ([contextmenu]) inside [data-ctx] reveals the
    // referenced .menu (display:block, positioned at the cursor); clicking
    // outside closes it (the JS has no Esc handler — close is click/outside).
    name: 'ctx',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const zone = page.locator('[data-ctx]').first();
      if (!(await zone.count())) return ['no [data-ctx] zone in fixture'];
      const sel = await zone.getAttribute('data-ctx');
      const menu = page.locator(sel);
      if (!(await menu.count())) return [`[data-ctx] target ${sel} not found`];

      // closed: menu not displayed
      t(await menu.evaluate((el) => getComputedStyle(el).display === 'none'),
        'context menu starts hidden (display:none)');

      // right-click the zone -> menu shown (display:block). Element-relative
      // click so Playwright scrolls the zone (far down the page) into view and
      // the contextmenu fires at a real in-viewport position.
      await zone.scrollIntoViewIfNeeded();
      await zone.click({ button: 'right' });
      t(await menu.evaluate((el) => el.style.display === 'block'),
        'right-clicking the zone opens the context menu (display:block)');
      t(await menu.evaluate((el) => parseFloat(el.style.left) >= 0 && parseFloat(el.style.top) >= 0),
        'context menu is positioned at the cursor');

      // outside-click closes
      await page.mouse.click(5, 5);
      t(await menu.evaluate((el) => el.style.display === 'none'),
        'outside-click closes the context menu');

      // clicking an item inside the menu also closes it
      await zone.click({ button: 'right' });
      t(await menu.evaluate((el) => el.style.display === 'block'), 'context menu re-opens');
      await menu.locator('.menu-item, button, a, li').first().click();
      t(await menu.evaluate((el) => el.style.display === 'none'),
        'clicking a menu item closes the context menu');
      return fails;
    },
  },
  {
    // Date picker popover: the input opens a .cal on focus/click; clicking a
    // day cell writes the value into the input and closes; outside-click closes.
    name: 'picker',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const pk = page.locator('.picker[data-picker]').first();
      if (!(await pk.count())) return ['no .picker[data-picker] in fixture'];
      const input = pk.locator('input');
      const cal = pk.locator('.cal');

      // closed: .cal hidden
      t(await cal.evaluate((el) => el.hidden), 'picker calendar starts hidden');

      // focusing the input opens the calendar with day cells
      await input.click();
      t(!(await cal.evaluate((el) => el.hidden)), 'clicking the input opens the calendar');
      t(await cal.locator('.day').count() >= 28, 'calendar renders day cells');

      // clicking a day writes the value and closes
      const before = await input.inputValue();
      const day = cal.locator('.day').filter({ hasText: /^15$/ }).first();
      await day.click();
      const after = await input.inputValue();
      t(after !== before && /\d{4}-\d{2}-\d{2}/.test(after),
        `selecting a day updates the input value (before=${before} after=${after})`);
      t(/-15$/.test(after), `selected day reflected in the value (${after})`);
      t(await cal.evaluate((el) => el.hidden), 'selecting a day closes the calendar');

      // re-open then outside-click closes
      await input.click();
      t(!(await cal.evaluate((el) => el.hidden)), 'picker re-opens');
      await page.mouse.click(5, 5);
      t(await cal.evaluate((el) => el.hidden), 'outside-click closes the picker');
      return fails;
    },
  },
  {
    // Inline calendar: [data-calendar] self-renders a .cal-grid of .day cells;
    // clicking a day moves the .sel marker to it.
    name: 'calendar',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const cal = page.locator('[data-calendar]').first();
      if (!(await cal.count())) return ['no [data-calendar] in fixture'];

      t(await cal.locator('.cal-grid').count() >= 1, 'inline calendar renders a grid');
      t(await cal.locator('.day').count() >= 28, 'inline calendar renders day cells');
      t(await cal.locator('.day.sel').count() === 1, 'a single day starts selected (.sel)');

      // pick a day distinct from the current selection -> .sel moves to it
      const selText = await cal.locator('.day.sel').first().textContent();
      const target = selText.trim() === '20' ? '21' : '20';
      await cal.locator('.day').filter({ hasText: new RegExp(`^${target}$`) }).first().click();
      t(await cal.locator('.day.sel').count() === 1, 'still exactly one selected day after picking');
      t((await cal.locator('.day.sel').first().textContent()).trim() === target,
        `selecting a day moves .sel to it (now ${target})`);
      return fails;
    },
  },
  {
    // Range calendar: [data-daterange] renders two month grids; first day click
    // sets the start (.rstart .sel), a later day click sets the end (.rend),
    // and the summary reflects the selection.
    name: 'daterange',
    url: '/demo/app/admin.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const dr = page.locator('[data-daterange]').first();
      if (!(await dr.count())) return ['no [data-daterange] in fixture'];
      const summary = dr.locator('.daterange-summary');
      const cals = dr.locator('.dr-cals');

      t(await cals.locator('.month').count() === 2, 'range calendar renders two months');
      t(await cals.locator('.day').count() >= 56, 'range calendar renders day cells');

      // first month's grid, pick a start then a later end (same month)
      const month0 = cals.locator('.month').nth(0);
      await month0.locator('.day').filter({ hasText: /^10$/ }).first().click();
      t(await month0.locator('.day.rstart.sel').count() === 1,
        'first click sets a start day (.rstart .sel)');
      t(/→\s*…/.test((await summary.textContent())),
        'summary shows the pending start (start → …)');

      await month0.locator('.day').filter({ hasText: /^18$/ }).first().click();
      t(await month0.locator('.day.rend').count() === 1, 'second click sets an end day (.rend)');
      t(await month0.locator('.day.range').count() >= 1, 'days between start and end are marked (.range)');
      t(/\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}/.test((await summary.textContent())),
        `summary shows the full range (${(await summary.textContent()).trim()})`);
      return fails;
    },
  },
  {
    // Color picker: clicking a swatch (.sw) makes it the sole active one (.on),
    // clearing .on from the previously-active swatch.
    name: 'colorpicker',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const cp = page.locator('[data-colorpicker]').first();
      if (!(await cp.count())) return ['no [data-colorpicker] in fixture'];
      const sws = cp.locator('.sw');
      if ((await sws.count()) < 2) return ['colorpicker needs >=2 swatches to test'];

      // one swatch starts active
      t(await cp.locator('.sw.on').count() === 1, 'exactly one swatch starts active (.on)');
      const startActive = await cp.evaluate((el) =>
        Array.prototype.slice.call(el.querySelectorAll('.sw')).findIndex((s) => s.classList.contains('on')));

      // click a different swatch -> it becomes the sole active one
      const targetIdx = startActive === 0 ? 1 : 0;
      await sws.nth(targetIdx).click();
      t(await cp.locator('.sw.on').count() === 1, 'still exactly one active swatch after selecting');
      t(await sws.nth(targetIdx).evaluate((el) => el.classList.contains('on')),
        'clicking a swatch marks it active (.on)');
      t(await cp.evaluate((el, i) => !el.querySelectorAll('.sw')[i].classList.contains('on'), startActive),
        'the previously-active swatch is deactivated');
      return fails;
    },
  },
  {
    // Unified tooltip engine: hovering a [data-tip] shows ONE floating node that
    // lives at <body> level (position:fixed, so it escapes overflow/clip), carries
    // role=tooltip + the attr text, wires aria-describedby, and Esc-dismisses
    // (role stripped when hidden — the empty role=tooltip a11y fix).
    name: 'tooltip',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      t(await page.evaluate(() => document.documentElement.classList.contains('qz-tip-js')),
        'engine marks <html> with .qz-tip-js (gates the CSS fallback off)');
      const trg = page.locator('[data-tip]').first();
      if (!(await trg.count())) return ['no [data-tip] trigger in fixture'];
      const expected = (await trg.getAttribute('data-tip')).trim();

      await trg.focus();   // focus-reveal is part of the contract and is deterministic headless
      await page.waitForSelector('.qz-tip.show', { timeout: 1000 });
      // snapshot the shown state in ONE evaluate (the hide-delay timer must not race
      // a multi-await assertion window)
      const snap = await page.evaluate(() => {
        const e = document.querySelector('.qz-tip');
        const a = document.activeElement;
        return {
          count: document.querySelectorAll('.qz-tip').length,
          bodyLevel: !!e && e.parentElement === document.body,
          fixed: !!e && getComputedStyle(e).position === 'fixed',
          role: e && e.getAttribute('role'),
          text: e && e.textContent.trim(),
          describedby: a && a.getAttribute('aria-describedby'),
        };
      });
      t(snap.count === 1, 'exactly one floating tooltip node exists (no double render)');
      t(snap.bodyLevel, 'tooltip is a direct child of <body> (escapes overflow/clip ancestors)');
      t(snap.fixed, 'tooltip is position:fixed');
      t(snap.role === 'tooltip', 'shown tooltip carries role=tooltip');
      t(snap.text === expected, 'tooltip text matches the data-tip attribute');
      t(snap.describedby === 'qz-tip', 'focused trigger gets aria-describedby=qz-tip while shown');

      await page.keyboard.press('Escape');
      t(await page.evaluate(() => !document.querySelector('.qz-tip').classList.contains('show')),
        'Escape hides the tooltip');
      t(await page.evaluate(() => document.querySelector('.qz-tip').getAttribute('role') === null),
        'role is stripped when hidden (empty role=tooltip would fail axe)');
      return fails;
    },
  },
  {
    // Gallery lightbox: clicking a [data-lightbox] tile opens a body-level viewer
    // with an <img> + "1 / n" counter; ArrowRight advances; the video item renders
    // a <video>; Esc closes and restores focus to the opening tile.
    name: 'lightbox',
    url: '/demo/media/index.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const gal = page.locator('[data-lightbox]').first();
      if (!(await gal.count())) return ['no [data-lightbox] gallery in fixture'];
      const tiles = gal.locator('a[href], [data-lightbox-item]');
      const n = await tiles.count();
      if (n < 2) return ['gallery needs >=2 items to test'];

      t(await page.locator('.qz-lightbox.open').count() === 0, 'lightbox starts closed');

      await tiles.first().click();
      await page.waitForSelector('.qz-lightbox.open', { timeout: 1000 });
      t(await page.locator('.qz-lightbox .lb-stage img').count() === 1, 'first item renders an <img>');
      t(await page.evaluate(() => document.querySelector('.qz-lightbox .lb-count').textContent.trim().startsWith('1 /')),
        'counter shows item 1 of n');

      await page.keyboard.press('ArrowRight');
      t(await page.evaluate(() => document.querySelector('.qz-lightbox .lb-count').textContent.trim().startsWith('2 /')),
        'ArrowRight advances to item 2');

      const vidIdx = await gal.evaluate((el) => {
        const items = el.querySelectorAll('a[href], [data-lightbox-item]');
        for (let i = 0; i < items.length; i++) {
          const src = items[i].getAttribute('data-src') || items[i].getAttribute('href') || '';
          if (items[i].getAttribute('data-type') === 'video' || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src)) return i;
        }
        return -1;
      });
      if (vidIdx >= 0) {
        for (let k = 0; k <= n; k++) {
          const cur = await page.evaluate(() => parseInt(document.querySelector('.qz-lightbox .lb-count').textContent, 10) - 1);
          if (cur === vidIdx) break;
          await page.keyboard.press('ArrowRight');
        }
        t(await page.locator('.qz-lightbox .lb-stage video').count() === 1, 'video item renders a <video>');
      }

      await page.keyboard.press('Escape');
      t(await page.locator('.qz-lightbox.open').count() === 0, 'Escape closes the lightbox');
      t(await tiles.first().evaluate((el) => el === document.activeElement),
        'focus returns to the opening tile on close');
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
