// Copy the library's live assets into the docs-site public/ folder so the
// component demos can be embedded as iframes that resolve their own relative
// CSS/JS (../../kits, ../../tokens, ../../js). Single source of truth: the demos
// are NOT duplicated by hand — they're synced at build time from the repo root.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PUBLIC = path.resolve(__dirname, '..', 'public');

// Directories copied verbatim into public/ (preserving structure so the demos'
// relative paths keep resolving exactly as they do in the repo).
const DIRS = ['demo', 'kits', 'tokens', 'js', 'fonts'];   // themes/ is private — demo/themes ships fictional examples

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

fs.mkdirSync(PUBLIC, { recursive: true });
for (const dir of DIRS) {
  const src = path.join(REPO, dir);
  if (!fs.existsSync(src)) { console.warn(`[sync] skip missing ${dir}/`); continue; }
  const dest = path.join(PUBLIC, dir);
  rmrf(dest);
  copyDir(src, dest);
  console.log(`[sync] ${dir}/ -> public/${dir}/`);
}
console.log('[sync] done');
