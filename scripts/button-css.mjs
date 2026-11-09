// Build the opt-in button entry from the canonical component and token sources.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rename = (value) => value.replace(/--([\w-]+)/g, '--qz-button-$1');
const refs = (value) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
const selectors = new Set(['.btn', '.btn-primary', '.btn-primary:hover', '.btn-secondary', '.btn-secondary:hover', '.btn-ghost', '.btn-ghost:hover', '.btn-outline', '.btn-outline:hover', '.btn-link', '.btn-link:hover', '.btn-danger', '.btn-danger:hover', '.btn:active', '.btn[disabled],.btn.is-disabled']);

export function generateButton(appText, baseText, tokenText) {
  const app = postcss.parse(appText), base = postcss.parse(baseText), tokens = postcss.parse(tokenText);
  const output = postcss.root(), seen = new Set();
  const reset = postcss.rule({ selector: '.qz-button' });
  function copyProps(tree, selector, names) {
    let found = 0;
    tree.walkRules(selector, rule => {
      if (!rule.nodes.some(n => n.type === 'decl' && n.prop === names[0])) return;
      found++;
      for (const name of names) {
        const declaration = rule.nodes.find(n => n.type === 'decl' && n.prop === name);
        if (!declaration) throw new Error(`Missing ${selector} ${name}`);
        reset.append(declaration.clone());
      }
    });
    if (found !== 1) throw new Error(`Expected one ${selector} rule`);
  }
  copyProps(app, '*', ['box-sizing', 'margin']);
  copyProps(app, 'body', ['line-height', 'letter-spacing', '-webkit-font-smoothing']);
  output.append(reset);
  // Native buttons use UA normal leading; anchors inherit the body leading.
  // Keep that distinction even when a host applies a bare button reset.
  const native = postcss.rule({ selector: 'button.qz-button' });
  native.append({ prop: 'line-height', value: 'normal' });
  native.append({ prop: 'appearance', value: 'auto' });
  output.append(native);
  app.walkRules(rule => {
    if (!selectors.has(rule.selector)) return;
    if (rule.parent.type !== 'atrule' || rule.parent.name !== 'layer') throw new Error(`Unexpected nested button rule: ${rule.selector}`);
    seen.add(rule.selector);
    output.append(rule.clone({ selector: rule.selector.replace(/\.btn\b/g, '.qz-button') }));
  });
  for (const selector of selectors) if (!seen.has(selector)) throw new Error(`Missing button rule ${selector}`);
  let focus;
  base.walkRules(rule => {
    if (rule.selector.startsWith(':where(a[href],button,summary,') && rule.selector.endsWith(':focus-visible')) focus = rule;
  });
  if (!focus) throw new Error('Missing shared focus rule');
  output.append(focus.clone({ selector: '.qz-button:focus-visible' }));
  const forced = postcss.atRule({ name: 'media', params: '(forced-colors: active)' });
  base.walkAtRules('media', media => {
    if (media.params !== '(forced-colors: active)') return;
    const rule = media.nodes.find(n => n.type === 'rule' && n.selector.includes('button:focus-visible'));
    if (rule) forced.append(rule.clone({ selector: '.qz-button:focus-visible' }));
  });
  if (!forced.nodes?.length) throw new Error('Missing forced-colors focus rule');
  output.append(forced);
  const motion = postcss.atRule({ name: 'media', params: '(prefers-reduced-motion: reduce)' });
  app.walkAtRules('media', media => {
    if (media.params !== '(prefers-reduced-motion: reduce)') return;
    const rule = media.nodes.find(n => n.type === 'rule' && n.selector === '*');
    if (rule) motion.append(rule.clone({ selector: '.qz-button,.qz-button *' }));
  });
  if (motion.nodes?.length !== 1) throw new Error('Expected one shared reduced-motion rule');
  output.append(motion);
  const defaults = new Map();
  tokens.walkRules(':root', rule => rule.walkDecls(d => defaults.set(d.prop, d.value)));
  const needed = new Set();
  function include(name) {
    if (needed.has(name)) return;
    if (!defaults.has(name)) throw new Error(`Missing token ${name}`);
    needed.add(name);
    refs(defaults.get(name)).forEach(include);
  }
  output.walkDecls(d => refs(d.value).forEach(include));
  const scopedTokens = postcss.root();
  tokens.walkRules(rule => {
    if (!rule.selector.includes(':root') || rule.selector.includes('data-density')) return;
    const clone = rule.clone();
    clone.removeAll();
    rule.walkDecls(d => { if (needed.has(d.prop) || d.prop === 'color-scheme') clone.append(d.clone()); });
    if (!clone.nodes.length) return;
    clone.selector = rule.selector.replace(/:root/g, ':where(.qz-button)').replace(/\[data-theme="dark-knight"\]/g, '[data-qz-theme="dark"]').replace(/\[data-theme="desert-dunes"\]/g, '[data-qz-theme="light"]').replace(/data-theme/g, 'data-qz-theme');
    // The canonical aliases collapse to one explicit theme selector.
    clone.selector = [...new Set(clone.selector.split(',').map(s => s.trim()))].join(',');
    clone.selector = clone.selector.replace(/:not\(\[data-qz-theme="dark"\]\):not\(\[data-qz-theme="dark"\]\)/g, ':not([data-qz-theme="dark"])');
    if (rule.parent.type === 'atrule' && rule.parent.name === 'media') scopedTokens.append(rule.parent.clone({ nodes: [clone] }));
    else scopedTokens.append(clone);
  });
  for (const tree of [output, scopedTokens]) tree.walkDecls(d => { d.prop = rename(d.prop); d.value = rename(d.value); });
  const banner = '/* Generated by scripts/button-css.mjs. Edit canonical tokens/app/base sources. */\n';
  return { css: banner + '@import "../tokens/button.tokens.css";\n' + output.toString() + '\n', tokens: banner + scopedTokens.toString() + '\n', names: [...needed].map(rename).sort() };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = generateButton(...['kits/app.css', 'kits/base.css', 'tokens/qazana.tokens.css'].map(p => fs.readFileSync(path.join(root, p), 'utf8')));
  for (const [file, content] of [['kits/button.css', result.css], ['tokens/button.tokens.css', result.tokens]]) {
    if (process.argv.includes('--check')) {
      if (fs.readFileSync(path.join(root, file), 'utf8') !== content) throw new Error(`${file} is stale; run npm run build:button`);
    } else fs.writeFileSync(path.join(root, file), content);
  }
}
