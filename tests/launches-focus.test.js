const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function harness({ fails, movedFocus = false }) {
  const source = fs.readFileSync(path.join(__dirname, '../launches.js'), 'utf8');
  const start = source.indexOf('async function loadLaunches(');
  const body = {};
  let retry;
  const document = { body, activeElement: null, querySelector: () => retry };
  const control = name => ({ name, focus() { document.activeElement = this; } });
  const oldRetry = control('old retry');
  const newRetry = control('replacement retry');
  const refresh = control('refresh');
  const other = control('another control');
  retry = oldRetry;
  document.activeElement = oldRetry;
  const replacePanel = replacement => {
    retry = replacement;
    if (document.activeElement === oldRetry) document.activeElement = body;
  };
  const context = {
    document,
    els: { refreshButton: refresh, launchPageBody: {} },
    LAUNCHES_API: '/api/launches', REFRESH_BUTTON_HTML: 'Refresh', REFRESHING_BUTTON_HTML: 'Refreshing',
    setLaunchPageStatus() {}, setBusy() {}, setLaunchesUpdated() {}, formatLastChecked() {},
    normalizeLaunches: value => value,
    renderLaunches: () => replacePanel(null), setError: () => replacePanel(newRetry),
    fetchJson: async () => {
      if (movedFocus) document.activeElement = other;
      if (fails) throw new Error('Controlled source failure');
      return [];
    }
  };
  vm.runInNewContext(source.slice(start, source.indexOf('\nif (els.refreshButton)', start)), context);
  return { context, document, newRetry, refresh, other, body };
}

test('failed launch retry restores focus to its replacement control', async () => {
  const h = harness({ fails: true });
  await h.context.loadLaunches({ restoreRetryFocus: true });
  assert.equal(h.document.activeElement, h.newRetry);
  assert.equal(h.refresh.disabled, false);
});
test('successful launch retry returns focus to the persistent refresh control', async () => {
  const h = harness({ fails: false });
  await h.context.loadLaunches({ restoreRetryFocus: true });
  assert.equal(h.document.activeElement, h.refresh);
});
test('launch retry does not steal focus after the user moves elsewhere', async () => {
  const h = harness({ fails: true, movedFocus: true });
  await h.context.loadLaunches({ restoreRetryFocus: true });
  assert.equal(h.document.activeElement, h.other);
});
test('background launch loads do not request retry focus', async () => {
  const h = harness({ fails: false });
  await h.context.loadLaunches();
  assert.equal(h.document.activeElement, h.body);
});
