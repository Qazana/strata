import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
import { makeServer } from './_serve.mjs';

const server = makeServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 760, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/demo/app/disclosure.html`);
      const tabs = page.locator('#line-tabs > .tabs > .tab');
      const panels = page.locator('#line-tabs > .tabpanel');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      assert.equal(await panels.locator(':scope[hidden]').count(), 3);
      await tabs.first().focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true', 'skip disabled tabs');
      assert.equal(await panels.nth(2).isVisible(), true);
      await page.keyboard.press('End');
      assert.equal(await tabs.nth(3).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('input[value="Workspace"]').evaluate(el => el === document.activeElement), true);
      await tabs.first().click();
      await page.locator('#nested-tabs .tab').nth(1).click();
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true', 'nested tabs leave parent selection intact');
      assert.equal(await panels.first().isVisible(), true);
      assert.equal(await page.locator('#nested-tabs .tabpanel').nth(1).isVisible(), true);

      const manual = page.locator('#manual-tabs > .tabs > .tab');
      await manual.first().focus();
      await page.keyboard.press('ArrowDown');
      assert.equal(await manual.nth(2).evaluate(el => el === document.activeElement), true);
      assert.equal(await manual.first().getAttribute('aria-selected'), 'true', 'manual navigation does not activate');
      await page.keyboard.press('Enter');
      assert.equal(await manual.nth(2).getAttribute('aria-selected'), 'true');
      await manual.nth(1).evaluate(el => el.click());
      assert.equal(await manual.nth(2).getAttribute('aria-selected'), 'true', 'aria-disabled cannot activate');
      await page.locator('#line-tabs > .tabs').evaluate(el => { el.dir = 'rtl'; });
      await tabs.first().focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true', 'RTL arrows follow visual order');

      const details = page.locator('#advanced > details');
      await details.first().locator(':scope > summary').focus();
      await page.keyboard.press('Space');
      assert.equal(await details.first().evaluate(el => el.open), true);
      const nested = details.first().locator('.acc details');
      assert.equal(await nested.evaluate(el => el.open), false);
      await page.waitForFunction(() => {
        const outer = document.querySelector('#advanced > details > summary');
        const inner = document.querySelector('#advanced .acc summary');
        return getComputedStyle(outer, '::after').transform !== getComputedStyle(inner, '::after').transform;
      });
      const outerTransform = await details.first().locator(':scope > summary').evaluate(el => getComputedStyle(el, '::after').transform);
      const innerTransform = await nested.locator('summary').evaluate(el => getComputedStyle(el, '::after').transform);
      assert.notEqual(outerTransform, innerTransform, 'opening an outer accordion does not rotate a nested closed summary');
      await details.nth(1).locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await details.nth(1).evaluate(el => el.open), true);
      assert.equal(await details.first().evaluate(el => el.open), false, 'native name creates single-open accordions');

      await page.setViewportSize({ width: 320, height: 800 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'narrow viewport does not overflow');
      await tabs.last().focus();
      assert.equal(await tabs.last().evaluate(el => el.getBoundingClientRect().right <= window.innerWidth), true, 'focused tabs remain reachable in scrolling bar');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await tabs.first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
      assert.equal(await details.first().locator(':scope > summary').evaluate(el => getComputedStyle(el, '::after').transitionDuration), '0s');
      await page.emulateMedia({ forcedColors: 'active' });
      await tabs.first().focus();
      assert.notEqual(await tabs.first().evaluate(el => getComputedStyle(el).outlineStyle), 'none');
      assert.equal(await page.locator('#host-control').evaluate(el => getComputedStyle(el).display), 'inline-block', 'standalone imports do not reset host buttons');
      assert.deepEqual(errors, []);
      await page.setViewportSize({ width: 1000, height: 1000 });
      await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
      fs.mkdirSync('harness/artifacts/disclosure', { recursive: true });
      await page.screenshot({ path: `harness/artifacts/disclosure/${engine.name()}.png`, fullPage: true });
      console.log(`PASS ${engine.name()}: tabs, nested/disabled/manual/RTL navigation, accordion keyboard, narrow layout and motion`);
    } finally { await browser.close(); }
  }
} finally { server.close(); }
