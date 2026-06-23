// Visual-regression gate for the Qazana Strata demos.
//
// Captures a representative set of demo pages across every kit in BOTH schemes —
// dark (canonical, data-theme="dark") and light (data-theme="light") — full-page,
// then pixel-diffs each current screenshot against a committed-good baseline under
// harness/baseline/. This is the safety net that catches token/CSS regressions a
// structural probe (shoot.mjs) can't see: a color, spacing, or shadow that renders
// wrong without breaking a computed-state assertion.
//
// LOCAL GATE ONLY — deliberately NOT wired into `npm test`. Pixel diffs are
// font-rendering-sensitive (hinting/AA differs across OSes and font versions), so
// running this in CI would flap on machines whose fonts don't match the baseline's.
// Run it locally before a change you expect to be visually neutral. Mirrors how
// a sibling project keeps run-coverage.mjs out of its test script.
//
// Usage:
//   node harness/visual.mjs                 # diff vs baseline; EXITS 1 on any regression
//   HARNESS_BASELINE=1 node harness/visual.mjs   # (re)capture baselines, then exit 0
//   HARNESS_THRESHOLD=0.002 node harness/visual.mjs  # override the 0.1% noise floor
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { makeServer } from './_serve.mjs';
import { pagesFor } from './_pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'baseline');
const PORT = Number(process.env.PORT || 4189);
const BASE = `http://localhost:${PORT}`;
const SAVE_BASELINE = process.env.HARNESS_BASELINE === '1';
// Pixel-diff noise floor (fraction): ignore sub-0.1% jitter (AA on text/edges).
const NOISE = Number(process.env.HARNESS_THRESHOLD || 0.001);

const server = makeServer();
await new Promise((r) => server.listen(PORT, r));

// A representative page per kit. Kept small and stable — this is a gate, not full
// coverage (shoot.mjs walks every demo). Each is captured dark + light.
// Membership lives in the shared manifest (harness/_pages.mjs, tag 'visual').
const PAGES = pagesFor('visual');

// dark is the canonical scheme; light is the manual data-theme="light" override.
// We pin data-theme explicitly (rather than leaving it unset to follow the OS) so
// the dark capture is deterministic regardless of the host's prefers-color-scheme.
const SCHEMES = [
  { name: 'dark', theme: 'dark', colorScheme: 'dark' },
  { name: 'light', theme: 'light', colorScheme: 'light' },
];

// Kill animations/transitions/caret so screenshots are deterministic. Re-injected
// per navigation (addStyleTag is cleared on load).
const NO_ANIM = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}';

const results = []; // { name, status: ok|diff|size|no-baseline|diff-error, pct?, detail? }

function diffShot(name, buf) {
  const file = `${name}.png`;
  if (SAVE_BASELINE) {
    fs.writeFileSync(path.join(BASELINE, file), buf);
    return;
  }
  const basePath = path.join(BASELINE, file);
  if (!fs.existsSync(basePath)) { results.push({ name: file, status: 'no-baseline' }); return; }
  try {
    const cur = PNG.sync.read(buf);
    const base = PNG.sync.read(fs.readFileSync(basePath));
    if (cur.width !== base.width || cur.height !== base.height) {
      results.push({ name: file, status: 'size', detail: `${base.width}x${base.height} -> ${cur.width}x${cur.height}` });
      return;
    }
    const diff = new PNG({ width: cur.width, height: cur.height });
    const mismatch = pixelmatch(base.data, cur.data, diff.data, cur.width, cur.height, { threshold: 0.1 });
    const frac = mismatch / (cur.width * cur.height);
    const pct = (frac * 100).toFixed(3) + '%';
    results.push(frac > NOISE ? { name: file, status: 'diff', pct } : { name: file, status: 'ok', pct });
  } catch (e) {
    results.push({ name: file, status: 'diff-error', detail: e.message.slice(0, 60) });
  }
}

fs.mkdirSync(BASELINE, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
});

for (const name of PAGES) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/demo/${name}.html`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(400);
  for (const scheme of SCHEMES) {
    await page.emulateMedia({ colorScheme: scheme.colorScheme }).catch(() => {});
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), scheme.theme);
    await page.addStyleTag({ content: NO_ANIM }).catch(() => {});
    await page.waitForTimeout(350);
    const shotName = `${name.replaceAll('/', '-')}-${scheme.name}`;
    const buf = await page.screenshot({ fullPage: true });
    diffShot(shotName, buf);
    const last = results[results.length - 1];
    if (SAVE_BASELINE) console.log(`  baselined ${shotName}`);
    else console.log(`  ${shotName}: ${last.status}${last.pct ? ' ' + last.pct : ''}${last.detail ? ' (' + last.detail + ')' : ''}`);
  }
  await page.close();
}

await browser.close();
server.close();

if (SAVE_BASELINE) {
  const n = fs.readdirSync(BASELINE).filter((f) => f.endsWith('.png')).length;
  console.log(`\nBASELINE SAVED — ${n} screenshot(s) under harness/baseline/`);
  process.exit(0);
}

const regressions = results.filter((r) => r.status !== 'ok');
console.log('\n=== visual-regression report ===');
console.log(`screens: ${results.length}  ok: ${results.length - regressions.length}  regressions: ${regressions.length}`);
if (regressions.length) {
  for (const r of regressions) console.log(`  FAIL ${r.name} [${r.status}]${r.pct ? ' ' + r.pct : ''}${r.detail ? ' ' + r.detail : ''}`);
  console.log(`\n${regressions.length} regression(s) exceed the ${(NOISE * 100).toFixed(3)}% noise floor.`);
  process.exit(1);
}
console.log(`\nno regressions across ${results.length} screens (dark + light).`);
process.exit(0);
