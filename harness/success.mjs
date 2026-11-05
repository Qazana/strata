import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const tokens = postcss.parse(read('tokens/qazana.tokens.css'));
const mirror = JSON.parse(read('tokens/tokens.json'));
const pairs = { success: 'primary', 'success-rgb': 'primary-rgb', 'success-bright': 'primary-bright', 'on-success': 'on-primary' };
const defaults = {};
tokens.walkRules(':root', rule => rule.walkDecls(d => { defaults[d.prop] = d.value; }));
for (const [name, brand] of Object.entries(pairs)) assert.equal(defaults['--' + name], `var(--${brand})`);
for (const group of ['color', 'color-light']) {
  for (const name of ['success', 'success-bright', 'on-success']) {
    assert.equal(mirror[group][name].value, mirror[group][pairs[name]].value, `${group} ${name} mirror preserves default`);
  }
}
const expected = {
  'kits/base.css': {
    'input.is-success,textarea.is-success,select.is-success': { 'border-color': 'var(--success)', 'box-shadow': '0 0 0 3px rgb(var(--success-rgb) / .14)' },
    ':is(input,textarea,select).is-success:focus-visible': { 'box-shadow': '0 0 0 1px var(--success),0 0 0 4px rgb(var(--success-rgb) / .2)' },
  },
  'kits/app.css': {
    '.fok': { color: 'var(--success-bright)' },
    '.form-msg.ok': { color: 'var(--success-bright)', background: 'rgb(var(--success-rgb) / .1)' },
    '.btn.is-success': { background: 'var(--success-bright)', color: 'var(--on-success)' },
    '.btn-primary': { background: 'var(--primary)', color: 'var(--on-primary)' },
  },
  'kits/auth.css': { '.auth .form-msg.ok': { color: 'var(--success-bright)', background: 'rgb(var(--success-rgb) / .12)' } },
};
for (const [file, rules] of Object.entries(expected)) {
  const tree = postcss.parse(read(file));
  for (const [selector, values] of Object.entries(rules)) {
    let count = 0;
    tree.walkRules(selector, rule => {
      count++;
      const declarations = Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(d => [d.prop, d.value]));
      for (const [property, value] of Object.entries(values)) assert.equal(declarations[property], value, `${selector} ${property}`);
    });
    assert.equal(count, 1, selector);
  }
}
console.log('PASS success aliases, both theme mirrors, explicit feedback and unchanged primary semantics');
