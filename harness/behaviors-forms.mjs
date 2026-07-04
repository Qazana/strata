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

  {
    // [data-validate]: native-constraint rules drive .is-error + aria-invalid +
    // aria-describedby, cross-field data-match, focus the first invalid field, and a
    // valid submit on an action-less form shows the inline .form-msg.ok.
    name: 'validate',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const form = page.locator('#signupDemo');
      if (!(await form.count())) return ['no #signupDemo [data-validate] in fixture'];
      const email = page.locator('#vEmail');
      const submit = form.locator('button[type=submit]');

      // submit empty -> required errors painted, summary shown, first field focused
      await submit.click();
      t(await email.getAttribute('aria-invalid') === 'true', 'empty required email gets aria-invalid');
      t(await email.evaluate((el) => el.classList.contains('is-error')), 'empty required email gets .is-error');
      t((await form.locator('.form-msg.error').count()) > 0, 'invalid submit shows the error summary');
      const desc = await email.getAttribute('aria-describedby');
      t(!!desc && (await page.locator('#' + desc.split(' ').pop()).count()) > 0,
        'invalid field is wired to its error node via aria-describedby');
      t((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'vName',
        'first invalid field (name) receives focus on a failed submit');

      // malformed email errors on blur (type mismatch)
      await page.locator('#vName').fill('Ada');
      await email.fill('not-an-email');
      await email.blur();
      t(await email.evaluate((el) => el.classList.contains('is-error')), 'malformed email errors on blur');

      // fix everything incl. matching passwords -> valid submit shows the ok summary
      await email.fill('ada@lovelace.io');
      await page.locator('#vPw').fill('hunter2hunter2');
      await page.locator('#vPw2').fill('hunter2hunter2');
      await submit.click();
      t((await form.locator('.form-msg.ok').count()) > 0, 'valid submit on a data-validate="confirm" action-less form shows the ok summary');
      t(await email.evaluate((el) => !el.classList.contains('is-error')), 'fixed email clears its error');
      t(await email.evaluate((el) => el.classList.contains('is-success')), 'a valid non-empty field gains .is-success (inline positive feedback)');

      // mismatched confirm -> data-match error
      await page.locator('#vPw2').fill('different');
      await page.locator('#vPw2').blur();
      t(await page.locator('#vPw2').evaluate((el) => el.classList.contains('is-error')), 'mismatched confirm errors via data-match');
      return fails;
    },
  },
  {
    // [data-persist]: non-sensitive fields are snapshotted to storage on input and
    // restored after a reload; password fields are never persisted.
    name: 'persist',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      if (!(await page.locator('#signupDemo[data-persist]').count())) return ['no [data-persist] form in fixture'];
      await page.locator('#vName').fill('Grace Hopper');
      await page.locator('#vEmail').fill('grace@navy.mil');
      await page.locator('#vPw').fill('supersecretpw');         // sensitive: must NOT persist
      await page.waitForTimeout(60);                            // let the input snapshot land
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(200);
      t((await page.locator('#vName').inputValue()) === 'Grace Hopper', 'text field restored after reload');
      t((await page.locator('#vEmail').inputValue()) === 'grace@navy.mil', 'email field restored after reload');
      t((await page.locator('#vPw').inputValue()) === '', 'password field is NOT persisted');
      return fails;
    },
  },
  {
    // [data-autosize]: a textarea grows in height to fit its content (no inner scroll).
    name: 'autosize',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const ta = page.locator('#vBio');
      if (!(await ta.count())) return ['no [data-autosize] textarea in fixture'];
      const h0 = await ta.evaluate((el) => el.clientHeight);
      await ta.fill('one\ntwo\nthree\nfour\nfive\nsix');
      const h1 = await ta.evaluate((el) => el.clientHeight);
      t(h1 > h0, `textarea grows with content (${h0}px -> ${h1}px)`);
      t(await ta.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight) <= 2), 'no inner scrollbar (height fits content)');
      return fails;
    },
  },
  {
    // [data-char-count]: the counter reflects length / maxlength and warns near the limit.
    name: 'char-count',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const ta = page.locator('#vBio');
      if (!(await ta.evaluate((el) => el.hasAttribute('data-char-count')).catch(() => false))) return ['#vBio is not [data-char-count]'];
      const c = page.locator('.form-field', { has: page.locator('#vBio') }).locator('.char-count, .counter');
      if (!(await c.count())) return ['no counter rendered for [data-char-count]'];
      t((await c.textContent()).trim() === '0 / 160', `counter starts at 0 / 160 (got "${(await c.textContent()).trim()}")`);
      await ta.fill('hello');
      t((await c.textContent()).trim() === '5 / 160', 'counter updates as you type');
      await ta.fill('x'.repeat(155));
      t(await c.evaluate((el) => el.classList.contains('is-near')), 'counter gains .is-near approaching the limit');
      return fails;
    },
  },
  {
    // [data-submit-lock]: a valid submit disables + .is-loading the submit button to
    // block double-submits; the numeric value auto-unlocks after that many ms.
    name: 'submit-lock',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const form = page.locator('#signupDemo[data-submit-lock]');
      if (!(await form.count())) return ['no [data-submit-lock] form in fixture'];
      const submit = form.locator('button[type=submit]');
      await page.locator('#vName').fill('Ada');
      await page.locator('#vEmail').fill('ada@lovelace.io');
      await page.locator('#vPw').fill('hunter2hunter2');
      await page.locator('#vPw2').fill('hunter2hunter2');
      await submit.click();
      t(await submit.isDisabled(), 'submit button disabled on a valid submit');
      t(await submit.evaluate((el) => el.classList.contains('is-loading')), 'submit button marked .is-loading');
      t(await submit.getAttribute('aria-busy') === 'true', 'submit button aria-busy=true while locked');
      await page.waitForTimeout(1700);
      t(!(await submit.isDisabled()), 'submit re-enabled after the auto-unlock window');
      return fails;
    },
  },
  {
    // i18n seam: setting window.QZi18n before load rethemes the built-in validate
    // strings (proves non-English consumers can override without forking the engine).
    name: 'i18n-override',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    initScript: () => { window.QZi18n = { validate: { required: 'CUSTOM-REQUIRED-MSG' } }; },
    async run(page) {
      const { t, fails } = checker();
      // sanity: the merged table + fmt are exposed
      t(await page.evaluate(() => !!(window.QZi18n && typeof window.QZi18n.fmt === 'function')), 'QZi18n table + fmt are exposed');
      t(await page.evaluate(() => window.QZi18n.fmt('a {x} b', { x: 'Z' })) === 'a Z b', 'QZi18n.fmt fills {placeholders}');
      // the override replaces the built-in required message
      const submit = page.locator('#signupDemo button[type=submit]');
      if (!(await submit.count())) return ['no #signupDemo in fixture'];
      await submit.click();
      const err = page.locator('#signupDemo .form-field', { has: page.locator('#vName') }).locator('.field-error');
      t((await err.textContent()).trim() === 'CUSTOM-REQUIRED-MSG', 'window.QZi18n override replaces the built-in required message');
      return fails;
    },
  },

  {
    // [data-stepper] with min="0": 0 is a legal bound and must not fall back to 1.
    // Also the QZ.init idempotency probe: init runs twice, one click still steps once.
    name: 'stepper-zero',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const r = await page.evaluate(() => {
        const d = document.createElement('div');
        d.setAttribute('data-stepper', '');
        d.innerHTML = '<button type="button" data-dec aria-label="Decrease">-</button>'
          + '<input type="number" min="0" max="5" value="0">'
          + '<button type="button" data-inc aria-label="Increase">+</button>';
        document.body.appendChild(d);
        window.QZ.init(d);
        window.QZ.init(d);                      // second pass must not double-bind
        const inp = d.querySelector('input'), dec = d.querySelector('[data-dec]'), inc = d.querySelector('[data-inc]');
        const startVal = inp.value, decDisabledAtZero = dec.disabled;
        inc.click();
        const afterOneInc = inp.value;
        dec.click();
        const backAtZero = inp.value, decDisabledAgain = dec.disabled;
        d.remove();
        return { startVal, decDisabledAtZero, afterOneInc, backAtZero, decDisabledAgain };
      });
      t(r.startVal === '0', `min="0" stepper starts at 0, not 1 (got ${r.startVal})`);
      t(r.decDisabledAtZero, 'dec disabled at the 0 floor');
      t(r.afterOneInc === '1', `one inc click steps exactly once — init is idempotent (got ${r.afterOneInc})`);
      t(r.backAtZero === '0' && r.decDisabledAgain, 'dec returns to 0 and re-disables');
      return fails;
    },
  },
  {
    // [data-persist] sensitive-name guard: concatenated lowercase names like
    // "creditcard" must never land in storage; "shipping" must still persist.
    name: 'persist-sensitive',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const raw = await page.evaluate(() => {
        const f = document.createElement('form');
        f.setAttribute('data-persist', 'qa-sensitive');
        f.innerHTML = '<input name="creditcard"><input name="shipping">';
        document.body.appendChild(f);
        window.QZ.init(f);
        f.querySelector('[name=creditcard]').value = '4111111111111111';
        f.querySelector('[name=shipping]').value = '12 Main St';
        f.dispatchEvent(new Event('input', { bubbles: true }));
        const blob = localStorage.getItem('qz:persist:qa-sensitive') || '';
        localStorage.removeItem('qz:persist:qa-sensitive');
        f.remove();
        return blob;
      });
      t(!/4111111111111111/.test(raw), 'concatenated sensitive name (creditcard) never lands in storage');
      t(/12 Main St/.test(raw), 'non-sensitive field (shipping) still persists');
      return fails;
    },
  },
  {
    // QZ.init(subtree): markup rendered AFTER load gets behavior — the framework
    // integration seam (React/Ember mounts, HTMX swaps).
    name: 'qz-init (dynamic DOM)',
    url: '/demo/foundations/forms.html',
    viewport: { width: 720, height: 1100 },
    async run(page) {
      const { t, fails } = checker();
      const r = await page.evaluate(() => {
        if (!(window.QZ && window.QZ.init)) return { hasQZ: false };
        const w = document.createElement('div');
        w.innerHTML = '<div class="form-field"><textarea data-char-count maxlength="20"></textarea></div>';
        document.body.appendChild(w);
        window.QZ.init(w);
        const ta = w.querySelector('textarea');
        ta.value = 'hello';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        const text = (w.querySelector('.char-count') || { textContent: '' }).textContent;
        w.remove();
        return { hasQZ: true, text };
      });
      t(r.hasQZ, 'window.QZ.init is exposed');
      if (!r.hasQZ) return fails;
      t(r.text === '5 / 20', `char-count works on post-load markup after QZ.init (got "${r.text}")`);
      return fails;
    },
  },
  {
    // rating: stars are an arrow-key radiogroup (keyboard sets the value)
    name: 'rating-keyboard',
    url: '/demo/app/components.html',
    viewport: { width: 1200, height: 900 },
    async run(page) {
      const { t, fails } = checker();
      const r = page.locator('.rating:not(.ro)').first();
      if (!(await r.count())) return ['no .rating in fixture'];
      t(await r.getAttribute('role') === 'radiogroup', 'rating exposes role=radiogroup');
      const stop = r.locator('i[tabindex="0"]').first();
      t(await stop.count() === 1, 'one star is the roving tab stop');
      await stop.focus();
      await page.keyboard.press('ArrowRight');
      const checked = r.locator('i[aria-checked="true"]');
      t(await checked.count() === 1, 'ArrowRight selects a star (aria-checked)');
      t(await page.evaluate(() => document.activeElement.matches('.rating i')), 'focus follows the selection');
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
    // optional: inject globals (e.g. window.QZi18n overrides) BEFORE the page script runs
    if (c.initScript) await page.addInitScript(c.initScript);
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
