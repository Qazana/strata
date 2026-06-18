// Hermetic render harness for the Qazana Strata demos (Playwright +
// DOM/computed-state probes + full-page screenshots). It serves the repo over a
// throwaway static server, loads each demo page headless, and asserts the demo
// actually renders in BOTH schemes — dark (canonical) and light (data-theme).
// Checks: no page errors, tokens resolve, no dead CSS vars, SVG colours are not
// silently `none`, the background layer exists, the scheme's bg/text actually
// flip (a single-theme shot can't catch a token that breaks in the other).
//
//   npm run harness                 # uses local devDependency
//
// Exits non-zero if any critical check fails, so it doubles as a regression gate.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const PORT = Number(process.env.PORT || 4178);
const BASE = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// --- throwaway static server rooted at the repo (so ../css, ../tokens resolve) -
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
await new Promise((r) => server.listen(PORT, r));

// Runs in the page; returns the structural + computed facts both schemes share.
const PROBE = () => {
  const out = {};
  const probe = document.createElement('div');
  probe.style.cssText = 'color:var(--primary);background:var(--surface)';
  document.body.appendChild(probe);
  out.tokensResolve = getComputedStyle(probe).color !== 'rgba(0, 0, 0, 0)';
  probe.remove();

  const dead = ['--green', '--coral', '--violet', '--amber'];
  const deadHits = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) for (const d of dead) if (r.cssText.includes(d + ')') || r.cssText.includes(d + '-')) deadHits.push(d);
  }
  document.querySelectorAll('[style]').forEach((el) => { for (const d of dead) if (el.getAttribute('style').includes(d)) deadHits.push(d); });
  out.deadVarHits = [...new Set(deadHits)];

  let attrMisuse = 0;
  document.querySelectorAll('svg *').forEach((el) => {
    for (const a of ['fill', 'stroke', 'stop-color']) { const v = el.getAttribute(a); if (v && v.trim().startsWith('var(')) attrMisuse++; }
  });
  out.svgVarInAttr = attrMisuse;

  const swatches = [...document.querySelectorAll('#charts polyline, #charts circle[style], #charts rect[style], svg .spark, .chart polyline')];
  out.chartSamples = swatches.length;
  out.chartNoneStroke = swatches.filter((el) => {
    const s = getComputedStyle(el);
    return (el.getAttribute('style') || '').includes('stroke') && (s.stroke === 'none' || s.stroke === '');
  }).length;

  const bg = document.querySelector('.bg-layer');
  out.bgLayer = bg ? bg.getBoundingClientRect().height > 100 : false;

  out.theme = document.documentElement.getAttribute('data-theme') || '(unset/dark)';
  out.bodyBg = getComputedStyle(document.body).backgroundColor;
  out.bodyText = getComputedStyle(document.body).color;
  out.title = document.title;
  return out;
};

const lum = (rgb) => { const m = (rgb || '').match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

// Mobile-only probe: document-level horizontal overflow (the "wider than the
// phone" bug — inner scrollers like .tbl-wrap don't expand the document, so this
// catches real layout breaks) + a tap-target advisory on button-like controls.
const MOBILE_PROBE = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const overflowPx = Math.max(0, de.scrollWidth - vw);
  let widest = null;
  if (overflowPx > 1) {
    // an element inside a horizontal scroll/clip container (carousel, .tbl-wrap)
    // legitimately extends past the viewport without expanding the document — skip
    // those so we name the element that actually causes document overflow.
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
      }
      return false;
    };
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && (!widest || r.right > widest.right) && !clipped(el)) {
        widest = { right: Math.round(r.right), tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().trim().split(/\s+/)[0] || '' };
      }
    });
  }
  // button-like interactive controls (not inline text links, which are legitimately short)
  const sel = 'button, .btn, .btn-icon, [role="button"], .side-item, .cmd-item, .play-btn, .otp input, input[type="checkbox"], input[type="radio"], .row-toggle, .urm, .pw-toggle';
  const small = [];
  document.querySelectorAll(sel).forEach((el) => {
    if (el.offsetParent === null) return;                 // not rendered
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (Math.min(r.width, r.height) < 32) small.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().trim().split(/\s+/)[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  return { overflowPx: Math.round(overflowPx), widest, small: small.slice(0, 6), smallCount: small.length };
};

// RTL probe: with dir=rtl, layout must not overflow EITHER edge (RTL content can
// spill left). Direction-agnostic — flags the worst non-scroll-contained element
// extending past [0, vw]. Catches physical-property layouts that don't flip.
const RTL_PROBE = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== de; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true;
    }
    return false;
  };
  let over = 0, widest = null;
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || clipped(el)) return;
    const ov = Math.max(0, r.right - vw, -r.left);   // past right edge OR left of 0
    if (ov > over) { over = ov; widest = { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().trim().split(/\s+/)[0] || '' }; }
  });
  return { overflowPx: Math.round(over), widest };
};

const SCHEMES = [
  { name: 'dark', apply: () => document.documentElement.setAttribute('data-theme', 'dark-knight'), bgMax: 0.3, textMin: 0.55 },
  { name: 'light', apply: () => document.documentElement.setAttribute('data-theme', 'desert-dunes'), bgMin: 0.85, textMax: 0.35 },
];
const PAGES = [
  'index',
  'foundations/typography', 'foundations/layout', 'foundations/forms',
  'app/components', 'app/admin', 'app/errors',
  'site/landing', 'site/minimal', 'site/product', 'site/startup', 'site/app',
  'site/event', 'site/agency', 'site/newsletter', 'site/coming-soon', 'site/waitlist',
  'content/blog', 'content/blog-medium', 'content/article', 'content/article-plain', 'content/article-media',
  'auth/sign-in', 'auth/sign-in-centered', 'auth/sign-up', 'auth/reset',
  'auth/check-email', 'auth/new-password', 'auth/verify', 'auth/two-factor', 'auth/passwordless', 'auth/app-password',
  'email/index', 'email/transactional', 'email/newsletter',
  'media/index', 'media/video', 'media/audio', 'media/social',
  'commerce/products', 'commerce/product', 'commerce/cart', 'commerce/checkout', 'commerce/order',
  'billing/plans',
];
const NEEDS_BG = new Set(['app/components', 'app/admin', 'app/errors']); // app demos use .bg-layer; others bring their own atmosphere

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 });
let failures = 0;

for (const name of PAGES) {
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 200)));
  await page.goto(`${BASE}/demo/${name}.html`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500);

  for (const scheme of SCHEMES) {
    await page.evaluate(scheme.apply);
    await page.waitForTimeout(350);
    const r = await page.evaluate(PROBE);
    const shot = path.join(OUT, `${name.replaceAll('/', '-')}-${scheme.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    const bgL = lum(r.bodyBg), txtL = lum(r.bodyText);
    const fails = [];
    if (!r.tokensResolve) fails.push('tokens do not resolve');
    if (r.deadVarHits.length) fails.push('dead vars: ' + r.deadVarHits.join(','));
    if (r.svgVarInAttr) fails.push(`${r.svgVarInAttr} var() in SVG attrs`);
    if (r.chartNoneStroke) fails.push(`${r.chartNoneStroke} chart strokes none`);
    if (NEEDS_BG.has(name) && !r.bgLayer) fails.push('bg layer missing');
    if (scheme.bgMax != null && !(bgL <= scheme.bgMax)) fails.push(`bg not dark (lum ${bgL?.toFixed(2)})`);
    if (scheme.bgMin != null && !(bgL >= scheme.bgMin)) fails.push(`bg not light (lum ${bgL?.toFixed(2)})`);
    if (scheme.textMin != null && !(txtL >= scheme.textMin)) fails.push(`text not light (lum ${txtL?.toFixed(2)})`);
    if (scheme.textMax != null && !(txtL <= scheme.textMax)) fails.push(`text not dark (lum ${txtL?.toFixed(2)})`);
    if (pageErrors.length) fails.push(`${pageErrors.length} page errors`);

    failures += fails.length;
    console.log(`\n=== ${name}.html [${scheme.name}] ${fails.length ? 'FAIL' : 'ok'} ===`);
    console.log(`  bg=${r.bodyBg} (lum ${bgL?.toFixed(2)})  text=${r.bodyText} (lum ${txtL?.toFixed(2)})  deadVars=${r.deadVarHits.length} svgVarAttr=${r.svgVarInAttr} chartNone=${r.chartNoneStroke}`);
    if (fails.length) console.log('  -> ' + fails.join(' | '));
    console.log('  screenshot:', path.relative(ROOT, shot));
  }
  // ---- mobile pass (390px phone): h-overflow is a hard fail; tap targets advisory ----
  await page.setViewportSize({ width: 390, height: 844 });
  for (const scheme of SCHEMES) {
    await page.evaluate(scheme.apply);
    await page.waitForTimeout(300);
    const m = await page.evaluate(MOBILE_PROBE);
    const shot = path.join(OUT, `${name.replaceAll('/', '-')}-mobile-${scheme.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    const fails = [];
    if (m.overflowPx > 1) fails.push(`h-overflow ${m.overflowPx}px${m.widest ? ` (widest: ${m.widest.tag}.${m.widest.cls})` : ''}`);
    failures += fails.length;
    console.log(`\n=== ${name}.html [mobile/${scheme.name}] ${fails.length ? 'FAIL' : 'ok'} ===`);
    console.log(`  overflow=${m.overflowPx}px  smallTargets=${m.smallCount}${m.smallCount ? ' (' + m.small.join(', ') + ')' : ''}`);
    if (fails.length) console.log('  -> ' + fails.join(' | '));
  }
  // ---- RTL pass (390px, dir=rtl, dark): logical-property layout must not break ----
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.evaluate(SCHEMES[0].apply);
  await page.waitForTimeout(300);
  const rtl = await page.evaluate(RTL_PROBE);
  const rtlShot = path.join(OUT, `${name.replaceAll('/', '-')}-rtl.png`);
  await page.screenshot({ path: rtlShot, fullPage: true });
  const rfails = rtl.overflowPx > 1 ? [`rtl-overflow ${rtl.overflowPx}px${rtl.widest ? ` (${rtl.widest.tag}.${rtl.widest.cls})` : ''}`] : [];
  failures += rfails.length;
  console.log(`\n=== ${name}.html [rtl] ${rfails.length ? 'FAIL' : 'ok'} ===`);
  console.log(`  overflow=${rtl.overflowPx}px  screenshot: ${path.relative(ROOT, rtlShot)}`);
  if (rfails.length) console.log('  -> ' + rfails.join(' | '));
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));

  if (pageErrors.length) console.log('  pageErrors:', pageErrors);
  await page.close();
}

await browser.close();
server.close();
console.log(`\n${failures ? 'HARNESS FAILED: ' + failures + ' check(s)' : 'HARNESS PASSED'}`);
process.exit(failures ? 1 : 0);
