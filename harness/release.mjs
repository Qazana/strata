import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { makeServer } from './_serve.mjs';

const server = makeServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const failures = [];
const pixel = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3C/svg%3E';

async function fixture(page, body, { kit = 'app', bodyClass = '', module = false, hash = '' } = {}) {
  await page.route('**/__release-test', route => route.fulfill({ contentType: 'text/html', body:
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Release regression</title><link rel="stylesheet" href="/kits/${kit}.css"><script ${module ? 'type="module"' : 'defer'} src="/js/qazana.js"></script></head><body class="${bodyClass}">${body}</body></html>` }));
  await page.goto(`${base}/__release-test${hash}`);
  await page.waitForFunction(() => !!window.QZ);
  await page.evaluate(() => document.fonts.ready);
}

async function check(browser, name, fn) {
  const filter = process.argv[2] || process.env.RELEASE_FILTER;
  if (filter && !name.includes(filter)) return;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await fn(page);
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    console.log(`PASS ${browser.browserType().name()}: ${name}`);
  } catch (error) {
    failures.push(`${browser.browserType().name()}: ${name}: ${error.message}`);
    console.error(`FAIL ${failures.at(-1)}`);
    console.error(error.stack);
  } finally { await page.close(); }
}

try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      await check(browser, 'auth demo navigation spans the grid after late styles', async page => {
        await page.route('**/__auth-demo', route => route.fulfill({ contentType: 'text/html', body:
          '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auth demo</title><script defer src="/demo/demo-nav.js"></script></head><body class="auth"><aside class="auth-brand">Brand</aside><main class="auth-main">Form</main></body></html>' }));
        await page.goto(`${base}/__auth-demo`);
        await page.locator('.demo-bar').waitFor();
        await page.evaluate(() => new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.href = '/kits/auth.css';
          link.onload = resolve; link.onerror = reject; document.head.appendChild(link);
        }));
        await page.evaluate(() => document.fonts.ready);
        const rects = await page.evaluate(() => {
          const rect = selector => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width };
          };
          return { nav: rect('.demo-bar'), brand: rect('.auth-brand'), main: rect('.auth-main') };
        });
        assert(rects.nav.width > 1200, 'navigation spans both columns');
        assert(rects.nav.bottom <= rects.brand.y, 'brand starts below navigation');
        assert.equal(rects.brand.y, rects.main.y, 'brand and form share a row');
        assert(Math.abs(rects.brand.right - rects.main.x) < 1, 'form sits beside brand');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.auth-brand')).display === 'none');
        const mobile = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          form: document.querySelector('.auth-main').getBoundingClientRect().width,
        }));
        assert(mobile.overflow <= 1, 'no phone overflow');
        assert(mobile.form >= 374, 'form fills the phone layout');
      });

      await check(browser, 'autosave checks both identifiers and removes unsafe old values', async page => {
        await page.addInitScript(() => localStorage.setItem('qz:persist:release', JSON.stringify({ v: 1, d: { number: 'old-card', code: 'old-cvv', shipping: 'Nairobi' } })));
        await fixture(page, `<form data-persist="release"><input name="number" id="creditcard"><input name="code" id="cvv"><input name="token" id="ordinary"><input name="shipping"><input name="passenger"><input name="discard"><input name="private" data-no-persist></form>`);
        assert.equal(await page.locator('#creditcard').inputValue(), '');
        assert.equal(await page.locator('[name=shipping]').inputValue(), 'Nairobi');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('qz:persist:release')).d.number), undefined);
        await page.locator('#creditcard').fill('synthetic-card');
        await page.locator('#cvv').fill('synthetic-code');
        await page.locator('[name=passenger]').fill('Ada');
        await page.locator('[name=discard]').fill('Keep');
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('qz:persist:release')).d), { shipping: 'Nairobi', passenger: 'Ada', discard: 'Keep' });
        await page.evaluate(() => { const input = document.querySelector('[name=shipping]'); input.id = 'secret'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('qz:persist:release')).d.shipping), undefined, 'recheck live sensitivity');
      });

      await check(browser, 'dynamic required fields block real-action submissions', async page => {
        await fixture(page, `<form data-validate action="/__post"><div class="form-field"><input name="fixed" value="ok" required></div><div class="form-field"><input id="disabled" disabled required></div><button>Save</button></form>`);
        await page.evaluate(() => {
          const form = document.querySelector('form');
          form.insertAdjacentHTML('afterbegin', '<div class="form-field"><input id="dynamic" required></div>');
          window.blocked = [];
          form.addEventListener('submit', e => { window.blocked.push(e.defaultPrevented); e.preventDefault(); });
          QZ.init(form);
        });
        await page.locator('button').click();
        assert.deepEqual(await page.evaluate(() => window.blocked), [true]);
        assert.equal(await page.locator('#dynamic').getAttribute('aria-invalid'), 'true');
        assert.equal(await page.locator('#disabled').getAttribute('aria-invalid'), null);
        await page.locator('#dynamic').fill('valid');
        assert.equal(await page.locator('#dynamic').getAttribute('aria-invalid'), null, 'new fields clear errors on input');
        await page.locator('button').click();
        assert.deepEqual(await page.evaluate(() => window.blocked), [true, false]);
      });

      await check(browser, 'submit lock preserves payload, prevents re-entry, restores authored disabled state', async page => {
        await fixture(page, `<form data-submit-lock><input name="title" value="Draft"><button id="save" name="intent" value="save">Save</button><button id="publish" name="intent" value="publish">Publish</button><button id="unavailable" disabled>Unavailable</button></form>`);
        await page.evaluate(() => {
          window.submits = [];
          const form = document.querySelector('form');
          form.addEventListener('submit', e => {
            e.preventDefault();
            window.submits.push(new FormData(form, e.submitter).get('intent'));
            if (window.submits.length === 1) form.requestSubmit(document.querySelector('#save'));
          });
        });
        await page.locator('#publish').click();
        await page.waitForFunction(() => document.querySelector('#save').disabled);
        assert.equal(await page.locator('#publish').getAttribute('aria-busy'), 'true');
        assert.equal(await page.locator('#save').getAttribute('aria-busy'), null);
        await page.evaluate(() => document.querySelector('form').requestSubmit(document.querySelector('#save')));
        assert.deepEqual(await page.evaluate(() => window.submits), ['publish']);
        await page.evaluate(() => document.querySelector('form').dispatchEvent(new Event('qz:unlock')));
        assert.equal(await page.locator('#save').isEnabled(), true);
        assert.equal(await page.locator('#unavailable').isDisabled(), true);
        await page.locator('#save').click();
        assert.deepEqual(await page.evaluate(() => window.submits), ['publish', 'save']);
        await page.locator('[name=title]').fill('Edited');
        assert.equal(await page.locator('#save').isEnabled(), true);
      });

      await check(browser, 'native submit retains name, value and formaction', async page => {
        let payload;
        await page.route('**/__native', async route => {
          payload = { method: route.request().method(), body: route.request().postData() };
          await route.fulfill({ contentType: 'text/html', body: '<title>Submitted</title>Saved' });
        });
        await fixture(page, `<form data-submit-lock action="/__wrong" method="post"><input name="title" value="Draft"><button name="intent" value="publish" formaction="/__native">Publish</button></form>`);
        await page.locator('button').click();
        await page.waitForURL('**/__native');
        assert.equal(payload.method, 'POST');
        assert.equal(new URLSearchParams(payload.body).get('intent'), 'publish');
      });

      await check(browser, 'date picker changes reach autosave and form listeners', async page => {
        await fixture(page, `<form data-persist="date"><div class="picker" data-picker><input name="date" value="2026-11-01"><div class="cal" hidden></div></div></form>`);
        await page.evaluate(() => {
          window.events = [];
          for (const type of ['input', 'change']) document.querySelector('form').addEventListener(type, e => window.events.push(e.type));
        });
        await page.locator('input').click();
        await page.locator('.cal .day').nth(4).click();
        assert.equal(await page.locator('input').inputValue(), '2026-11-05');
        assert.deepEqual(await page.evaluate(() => window.events), ['input', 'change']);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('qz:persist:date')).d.date), '2026-11-05');
      });

      await check(browser, 'variant keeps authored selection and handles all-disabled groups', async page => {
        await fixture(page, `<div data-variant><button role="radio" aria-checked="false">Small</button><button role="radio" aria-checked="true">Medium</button><button role="radio" aria-disabled="true">Large</button></div><div data-variant id="empty"><button role="radio" aria-disabled="true">Unavailable</button></div>`);
        const options = page.locator('[data-variant]').first().locator('button');
        assert.equal(await options.nth(1).getAttribute('aria-checked'), 'true');
        assert.equal(await options.nth(1).getAttribute('tabindex'), '0');
        await options.nth(1).focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(await options.first().getAttribute('aria-checked'), 'true');
        await page.locator('#empty button').focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('#empty button').getAttribute('tabindex'), '-1');
      });

      await check(browser, 'module cold deep links, globals, one-image focus and close URL', async page => {
        await fixture(page, `<button id="outside">Outside</button><div id="gallery" data-lightbox><a href='${pixel}'>View image</a></div>`, { module: true, hash: '#lightbox=gallery/0' });
        assert.equal(await page.locator('.qz-lightbox').isVisible(), true);
        assert.equal(await page.evaluate(() => ['cal', 'store', 'i18n', 'scroll', 'q', 'ready'].every(k => window[`QZ${k}`] === QZ[k])), true);
        for (const key of ['Shift+Tab', 'Tab', 'Tab']) {
          await page.keyboard.press(key);
          assert.equal(await page.locator('.lb-close').evaluate(el => el === document.activeElement), true);
        }
        await page.locator('.lb-close').click();
        assert.equal(new URL(page.url()).hash, '');
        assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
        await page.locator('[data-lightbox] a').click();
        await page.evaluate(() => { location.hash = 'lightbox=gallery/0'; });
        await page.keyboard.press('Escape');
        assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
      });

      await check(browser, 'confirmation owns focus and Escape above a modal', async page => {
        await fixture(page, `<button data-modal-open="#modal">Open</button><div class="modal-scrim" id="modal" hidden><div class="modal-dialog"><button data-qz-confirm="Delete this item?" id="confirm">Delete</button><button data-modal-close>Close</button></div></div>`);
        await page.locator('[data-modal-open]').click();
        await page.locator('#confirm').click();
        for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab']) {
          await page.keyboard.press(key);
          assert.equal(await page.locator('.qz-confirm').evaluate(el => el.contains(document.activeElement)), true, `${key}: ${await page.evaluate(() => document.activeElement.outerHTML)}`);
        }
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.qz-confirm').isVisible(), false);
        assert.equal(await page.locator('#modal').isVisible(), true);
        assert.equal(await page.locator('#confirm').evaluate(el => el === document.activeElement), true);
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#modal').isVisible(), false);
        assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
      });

      await check(browser, 'site confirmation and commerce quick-view work with their own kits', async page => {
        await fixture(page, '<button data-qz-confirm="Continue?">Confirm</button>', { kit: 'site', bodyClass: 'site' });
        await page.locator('button').click();
        assert.equal(await page.locator('.qz-confirm').evaluate(el => getComputedStyle(el).position), 'fixed');
        await fixture(page, '<button data-modal-open="#quick">View</button><div id="quick" class="modal-scrim" hidden><div class="quickview"><button data-modal-close>Close</button></div></div>', { kit: 'commerce', bodyClass: 'shop' });
        await page.locator('[data-modal-open]').click();
        assert.equal(await page.locator('#quick').evaluate(el => getComputedStyle(el).position), 'fixed');
        await page.locator('[data-modal-close]').click();
        assert.equal(await page.locator('#quick').isVisible(), false);
      });

      await check(browser, 'pricing lists, button baselines and independent billing expansion', async page => {
        await page.goto(`${base}/demo/app/components.html`);
        const tops = await page.locator('#cards > .grid2 > *').evaluateAll(els => els.map(el => el.getBoundingClientRect().top));
        assert.ok(tops.length === 3 && Math.max(...tops) - Math.min(...tops) <= 1, 'legacy grid cards share a top edge');
        await page.goto(`${base}/demo/site/landing.html`);
        await page.evaluate(() => document.fonts.ready);
        for (const width of [1280, 900]) {
          await page.setViewportSize({ width, height: 900 });
          const bottoms = await page.locator('.price-card > .btn').evaluateAll(els => els.map(el => el.getBoundingClientRect().bottom));
          assert.ok(bottoms.length === 3 && Math.max(...bottoms) - Math.min(...bottoms) <= 1, `aligned CTAs at ${width}px`);
        }
        assert.equal(await page.locator('.price-list').first().evaluate(el => getComputedStyle(el).paddingInlineStart), '0px');
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok((await page.locator('.price-card').first().boundingBox()).x >= 24, 'page gutters retained');
        await page.locator('.faq summary').first().click();
        assert.equal(await page.locator('.faq details p').first().evaluate(el => getComputedStyle(el).marginBlockStart), '0px');
        await page.goto(`${base}/demo/billing/plans.html`);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('.plan ul').first().evaluate(el => getComputedStyle(el).paddingInlineStart), '0px');
        const before = await page.locator('.plan').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
        await page.locator('details.switch summary').click();
        const after = await page.locator('.plan').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
        assert.equal(after[0], before[0]); assert.equal(after[2], before[2]);
        assert.ok(after[1] > before[1], 'only expanded plan grows');
      });

      await check(browser, 'rich accordion metadata moves below the heading on narrow screens', async page => {
        await page.setViewportSize({ width: 320, height: 800 });
        await page.goto(`${base}/demo/app/disclosure.html`);
        await page.evaluate(() => document.fonts.ready);
        const heading = await page.locator('.acc-heading').first().boundingBox();
        const meta = await page.locator('.acc-meta').first().boundingBox();
        assert.ok(meta.y >= heading.y + heading.height, 'metadata has its own row');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.locator('#advanced > details > summary').first().click();
        assert.equal(await page.locator('#advanced > details > .acc-body').first().evaluate(el => getComputedStyle(el.lastElementChild).marginBlockEnd), '0px');
      });

      await check(browser, 'short billing dialog and canned replies stay reachable', async page => {
        await page.setViewportSize({ width: 390, height: 568 });
        await page.goto(`${base}/demo/billing/overview.html`);
        await page.locator('[data-modal-open]').first().click();
        const dialog = page.locator('.modal-scrim.is-open .modal-dialog');
        const rect = await dialog.boundingBox();
        assert.ok(rect.y >= 0 && rect.y + rect.height <= 568);
        await dialog.evaluate(el => { el.scrollTop = el.scrollHeight; });
        assert.ok(await dialog.locator('.mf').evaluate(el => {
          const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight;
        }), 'dialog footer can scroll into view');
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`${base}/demo/support/ticket.html`);
        await page.locator('.macros > summary').click();
        assert.equal(await page.locator('.macro-menu button').first().evaluate(el => {
          const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }), true, 'first canned reply is not clipped');
      });

      if (engine === chromium) {
        await check(browser, 'range focus survives forced colors', async page => {
          await fixture(page, '<input type="range" class="slider"><div class="dual"><input type="range"></div>');
          await page.emulateMedia({ forcedColors: 'active' });
          for (const input of await page.locator('input').all()) {
            await input.focus();
            assert.equal(await input.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
            assert.ok(await input.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) >= 2));
          }
        });
        await check(browser, 'reviewed pages fit 320px and 390px viewports', async page => {
          const overflows = [];
          for (const width of [320, 390]) {
            await page.setViewportSize({ width, height: 844 });
            for (const name of ['app/components', 'app/admin', 'app/survey', 'site/landing', 'media/index', 'media/audio']) {
              await page.goto(`${base}/demo/${name}.html`);
              await page.evaluate(() => document.fonts.ready);
              const offenders = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth ? [] : [...document.querySelectorAll('body *')].filter(el => {
                const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed';
              }).slice(0,15).map(el => `${el.tagName}.${el.className}: ${Math.round(el.getBoundingClientRect().right)}`));
              if (offenders.length) overflows.push(`${name} at ${width}px: ${offenders.join(', ')}`);
              if (name === 'site/landing') {
                const skip = page.locator('.skip-link');
                assert.ok(await skip.evaluate(el => el.getBoundingClientRect().bottom <= 0), 'skip link stays hidden before focus');
                await skip.focus();
                assert.ok(await skip.evaluate(el => el.getBoundingClientRect().top >= 0), 'focused skip link stays in the viewport');
              }
            }
          }
          assert.deepEqual(overflows, []);
        });
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
