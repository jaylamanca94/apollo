const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['index', 'iss', 'launches', 'weather', 'asteroids', 'gallery', 'anomalies'];

test('the deployed Acadia snapshot exactly matches its reviewed integrity manifest', () => {
  const manifest = JSON.parse(read('vendor/acadia/source.json'));
  assert.match(manifest.commit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.package, '@acadia/design-system');
  const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
  const actual = walk('vendor/acadia').filter(file => !file.endsWith('/source.json')).map(file => file.slice('vendor/acadia/'.length)).sort();
  assert.deepEqual(actual, Object.keys(manifest.files).sort(), 'Missing or untracked shared assets');
  for (const [file, hash] of Object.entries(manifest.files)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor/acadia', file))).digest('hex'), hash, file);
  }
  for (const [, asset] of read('vendor/acadia/acadia.css').matchAll(/url\(["']?(\.\/[^"')]+)["']?\)/g)) {
    assert.ok(fs.existsSync(path.resolve(root, 'vendor/acadia', asset)), `Missing CSS asset: ${asset}`);
  }
});

test('every public route consumes the same Acadia snapshot before its product adapter', () => {
  const css = read('vendor/acadia/acadia.css');
  const source = pages.map(page => read(`${page}.html`)).concat(read('app.js'), read('launches.js'));
  for (const [index, html] of source.entries()) {
    assert.doesNotMatch(html, /bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)|data-bs-/i);
    if (index < pages.length) {
      assert.ok(html.indexOf('vendor/acadia/acadia.css') < html.indexOf('styles.css'));
      assert.match(html, /src="\.\/app-shell\.js/);
    }
    for (const name of new Set(html.match(/\bacadia-[a-z][\w-]*/g))) {
      if (name === 'acadia-theme') continue;
      assert.ok(css.includes(`.${name}`) || name === 'acadia-theme', `Unpublished shared class: ${name}`);
    }
  }
});

test('the adapter resolves its design tokens and does not reimplement shared motion or fonts', () => {
  const adapter = read('styles.css');
  const allCss = read('vendor/acadia/acadia.css') + adapter;
  const defined = new Set([...allCss.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  for (const [, variable] of adapter.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(variable), `Undefined ${variable}`);
  assert.doesNotMatch(adapter, /@font-face|@keyframes|--bs-|\.btn(?:[\s.{:-])/);
});
