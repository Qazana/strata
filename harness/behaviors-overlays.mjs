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
// data-lightbox (gallery viewer: open, img/video, keyboard nav, focus restore),
// data-tabs (activate/show/hide + roving focus), data-table-sort (asc/desc toggle).
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

      // Dispatch pointerover and read the shown state in the SAME synchronous
      // execution context, so the 80ms hide-delay timer can't race the assertions
      // (a multi-await window did, intermittently — green locally, red on slower CI).
      const snap = await trg.evaluate((el) => {
        el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
        const e = document.querySelector('.qz-tip');
        return {
          shown: !!e && e.classList.contains('show'),
          count: document.querySelectorAll('.qz-tip').length,
          bodyLevel: !!e && e.parentElement === document.body,
          fixed: !!e && getComputedStyle(e).position === 'fixed',
          role: e && e.getAttribute('role'),
          text: e && e.textContent.trim(),
          describedby: el.getAttribute('aria-describedby'),
        };
      });
      t(snap.shown, 'pointerover shows the floating tooltip');
      t(snap.count === 1, 'exactly one floating tooltip node exists (no double render)');
      t(snap.bodyLevel, 'tooltip is a direct child of <body> (escapes overflow/clip ancestors)');
      t(snap.fixed, 'tooltip is position:fixed');
      t(snap.role === 'tooltip', 'shown tooltip carries role=tooltip');
      t(snap.text === expected, 'tooltip text matches the data-tip attribute');
      t(snap.describedby === 'qz-tip', 'trigger gets aria-describedby=qz-tip while shown');

      await page.keyboard.press('Escape');
      const after = await page.evaluate(() => {
        const e = document.querySelector('.qz-tip');
        return { shown: e.classList.contains('show'), role: e.getAttribute('role') };
      });
      t(!after.shown, 'Escape hides the tooltip');
      t(after.role === null, 'role is stripped when hidden (empty role=tooltip would fail axe)');
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
      // deep-link: opening writes #lightbox=<group-id>/<index> to the URL
      t(await page.evaluate(() => location.hash) === '#lightbox=shots/0', 'opening writes the deep-link hash');

      await page.keyboard.press('ArrowRight');
      t(await page.evaluate(() => document.querySelector('.qz-lightbox .lb-count').textContent.trim().startsWith('2 /')),
        'ArrowRight advances to item 2');
      t(await page.evaluate(() => location.hash) === '#lightbox=shots/1', 'navigating updates the deep-link hash');

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
      t(await page.evaluate(() => location.hash) === '', 'closing clears the deep-link hash');

      // cold load from a shared deep link opens the viewer at that index
      await page.goto(BASE + '/demo/media/index.html#lightbox=shots/1', { waitUntil: 'load' });
      await page.waitForSelector('.qz-lightbox.open', { timeout: 1000 });
      t(await page.evaluate(() => document.querySelector('.qz-lightbox .lb-count').textContent.trim().startsWith('2 /')),
        'a shared #lightbox link opens the viewer at the linked item');
      return fails;
    },
  },
  {
    // [data-qz-confirm]: clicking the trigger opens an accessible body-level dialog
    // (not native confirm); Cancel/Esc dismiss with no action; Confirm re-activates
    // the trigger (here an anchor -> the href hash navigation runs).
    name: 'confirm',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const trig = page.locator('#confirmDemo');
      if (!(await trig.count())) return ['no [data-qz-confirm] trigger in fixture'];

      // click opens the dialog; the action has NOT run yet
      await trig.click();
      t(await page.locator('.qz-confirm.is-open').count() === 1, 'clicking the trigger opens the confirm dialog');
      t(await page.evaluate(() => document.querySelector('.qz-confirm-box').getAttribute('role')) === 'alertdialog',
        'dialog is role=alertdialog');
      t(await page.evaluate(() => location.hash) !== '#confirmed', 'the action has not run yet');

      // Esc dismisses without acting
      await page.keyboard.press('Escape');
      t(await page.locator('.qz-confirm.is-open').count() === 0, 'Escape dismisses the dialog');
      t(await page.evaluate(() => location.hash) !== '#confirmed', 'Escape does NOT run the action');

      // re-open, Cancel dismisses without acting
      await trig.click();
      await page.locator('.qz-confirm-cancel').click();
      t(await page.locator('.qz-confirm.is-open').count() === 0, 'Cancel dismisses the dialog');
      t(await page.evaluate(() => location.hash) !== '#confirmed', 'Cancel does NOT run the action');

      // re-open, Confirm runs the action (anchor navigates to its href hash)
      await trig.click();
      await page.locator('.qz-confirm-ok').click();
      t(await page.locator('.qz-confirm.is-open').count() === 0, 'Confirm closes the dialog');
      t(await page.evaluate(() => location.hash) === '#confirmed', 'Confirm re-activates the trigger (action runs)');
      return fails;
    },
  },
  {
    // [data-clamp]: content is clamped to N lines with a toggle; clicking expands
    // (removes .is-clamped) and flips aria-expanded, clicking again re-collapses.
    name: 'clamp',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const el = page.locator('#clampDemo');
      if (!(await el.count())) return ['no [data-clamp] element in fixture'];
      t(await el.evaluate((e) => e.classList.contains('is-clamped')), 'content starts clamped');
      const toggle = page.locator('#clampDemo + .clamp-toggle');
      if (!(await toggle.count())) return ['no .clamp-toggle was added (content may not overflow)'];
      t(await toggle.getAttribute('aria-expanded') === 'false', 'toggle starts aria-expanded=false');

      await toggle.click();
      t(!(await el.evaluate((e) => e.classList.contains('is-clamped'))), 'clicking expands (un-clamps)');
      t(await toggle.getAttribute('aria-expanded') === 'true', 'toggle aria-expanded=true when expanded');

      await toggle.click();
      t(await el.evaluate((e) => e.classList.contains('is-clamped')), 'clicking again re-clamps');
      t(await toggle.getAttribute('aria-expanded') === 'false', 'toggle aria-expanded=false when collapsed');
      return fails;
    },
  },
  {
    // [data-qz-dismiss]: clicking hides the target and remembers it (keyed) so it stays
    // hidden after a reload.
    name: 'dismiss',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const alert = page.locator('#dismissDemo');
      const btn = alert.locator('[data-qz-dismiss]');
      if (!(await btn.count())) return ['no [data-qz-dismiss] control in fixture'];
      t(!(await alert.evaluate((el) => el.hidden)), 'target starts visible');

      await btn.click();
      t(await alert.evaluate((el) => el.hidden), 'clicking dismiss hides the target');

      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(150);
      t(await page.locator('#dismissDemo').evaluate((el) => el.hidden), 'stays dismissed after a reload (remembered)');
      return fails;
    },
  },
  {
    // [data-relative-time]: renders a human phrase ("… ago" / "in …" / "just now")
    // from the datetime, not the raw ISO string, and keeps an absolute title.
    name: 'relative-time',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const el = page.locator('#reltimeDemo');
      if (!(await el.count())) return ['no [data-relative-time] element in fixture'];
      const txt = (await el.textContent()).trim();
      t(/\b(ago|just now)\b|^in /.test(txt), `renders a relative phrase (got "${txt}")`);
      t(!/\d{4}-\d{2}-\d{2}T/.test(txt), 'does not show the raw ISO datetime');
      t(!!(await el.getAttribute('title')), 'keeps the absolute time as a title');
      return fails;
    },
  },
  {
    // Tabs: clicking a .tab activates it (+aria-selected), shows its .tabpanel and
    // hides the rest; ArrowRight moves+focuses to the next tab (roving tabindex).
    name: 'tabs',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const grp = page.locator('[data-tabs]').first();
      if (!(await grp.count())) return ['no [data-tabs] in fixture'];
      const tabs = grp.locator('.tab'), panels = grp.locator('.tabpanel');
      const nt = await tabs.count();
      if (nt < 2 || (await panels.count()) < 2) return ['tabs needs >=2 tabs + panels'];

      t(await grp.locator('.tab.active').count() === 1, 'exactly one tab active initially');
      t(await tabs.first().getAttribute('role') === 'tab', 'tabs get role=tab');
      t(await panels.nth(1).evaluate((el) => el.hidden), 'a non-active panel starts hidden');

      await tabs.nth(1).click();
      t(await tabs.nth(1).evaluate((el) => el.classList.contains('active') && el.getAttribute('aria-selected') === 'true'),
        'clicked tab becomes active + aria-selected=true');
      t(await panels.nth(1).evaluate((el) => !el.hidden), "clicked tab's panel is shown");
      t(await panels.first().evaluate((el) => el.hidden), 'the previously-open panel is hidden');

      await tabs.nth(1).focus();
      await page.keyboard.press('ArrowRight');
      const ni = (1 + 1) % nt;
      t(await tabs.nth(ni).evaluate((el) => el.classList.contains('active') && el === document.activeElement),
        'ArrowRight activates + focuses the next tab');
      return fails;
    },
  },
  {
    // Table sort: clicking a th.sortable toggles asc -> desc; sorting another column
    // clears the previous indicator (visual sort state, single active column).
    name: 'table-sort',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const tbl = page.locator('[data-table-sort]').first();
      if (!(await tbl.count())) return ['no [data-table-sort] in fixture'];
      const ths = tbl.locator('th.sortable');
      if ((await ths.count()) < 2) return ['needs >=2 sortable columns'];

      const dir = (loc) => loc.evaluate((el) => el.classList.contains('asc') ? 'asc' : el.classList.contains('desc') ? 'desc' : 'none');
      await ths.first().click();
      const s1 = await dir(ths.first());
      t(s1 !== 'none', 'clicking a sortable header sets a sort direction');
      await ths.first().click();
      const s2 = await dir(ths.first());
      t((s1 === 'asc' && s2 === 'desc') || (s1 === 'desc' && s2 === 'asc'), 'a second click toggles the direction (asc<->desc)');
      await ths.nth(1).click();
      t((await dir(ths.nth(1))) !== 'none', 'sorting another column sets a direction on it');
      t((await dir(ths.first())) === 'none', 'the previously-sorted column clears its indicator');
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
