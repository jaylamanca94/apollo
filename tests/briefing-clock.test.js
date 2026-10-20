const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const events = {}, intervals = [];
  const elements = { '#spaceBriefBody': { innerHTML: '' } };
  const h = {
    LaunchTiming: require('../launch-timing'), URL,
    document: {
      body: { dataset: { apolloPage: 'dashboard' } }, visibilityState: 'visible', activeElement: null,
      documentElement: { setAttribute() {} }, querySelector: key => elements[key] || null,
      addEventListener: (event, fn) => events[event] = fn
    },
    window: { setInterval: (fn, delay) => intervals.push({ fn, delay }), addEventListener: (event, fn) => events[event] = fn },
    fetch: () => { throw Error('Clock must not fetch'); }
  };
  vm.createContext(h);
  vm.runInContext(source.slice(0, source.indexOf('async function loadDashboard')), h);
  return { h, events, intervals, elements, run: code => vm.runInContext(code, h) };
}
const now = Date.parse('2026-10-20T20:00:00Z');
const statuses = [{ id: 'launches', state: 'ok' }, { id: 'apod', state: 'ok' }, { id: 'spaceWeather', state: 'ok' }];
const data = {
  launches: [{ name: 'Example', dateUtc: new Date(now + 30000).toISOString(), datePrecision: 'Second', statusId: 1, status: 'Go for Launch' }],
  apod: { title: 'NASA selection', date: '2026-10-20' },
  spaceWeather: { kpIndex: 5, condition: 'Storm', observedAt: new Date(now - 6 * 3600000 + 30000).toISOString() }
};
test('open briefing retires weather prominence and elapsed launch targets without inferring lift-off', () => {
  const { h } = harness();
  assert.match(h.getSpaceBriefState(data, statuses, now).headline, /NOAA/);
  assert.equal(h.getSpaceBriefState(data, statuses, now + 61000).headline, 'NASA selection');
  assert.match(h.getSpaceBriefState({ ...data, spaceWeather: null }, statuses, now).headline, /Next SpaceX/);
});
test('30-minute refresh boundary keeps original check time and makes old coverage explicit', () => {
  const { h } = harness();
  const checked = new Date(now);
  assert.equal(h.getSpaceBriefState(data, statuses, now + 30 * 60000 - 1, checked).refresh, undefined);
  const stale = h.getSpaceBriefState(data, statuses, now + 30 * 60000, checked);
  assert.equal(stale.refresh, true);
  assert.match(stale.timing, /Last checked/);
  assert.match(stale.coverage, /From the last check/);
  assert.match(stale.summary, /snapshot and activity below are from that earlier check/);
  assert.equal(+checked, now);
});
test('in-flight checks and failed sources cannot recommend stale retained observations', () => {
  const { h } = harness();
  const pending = statuses.map(s => ({ ...s, state: 'pending' }));
  assert.equal(h.getSpaceBriefState(data, pending, now + 31 * 60000, new Date(now)).headline, 'Your briefing is taking shape');
  const failed = statuses.map(s => ({ ...s, state: 'error' }));
  assert.equal(h.getSpaceBriefState(data, failed, now, new Date(now)).headline, 'The briefing is unavailable');
});
test('clock uses minute and return events, skips hidden/pending snapshots, and preserves check time without fetching', () => {
  const { h, run, intervals, events } = harness();
  let briefs = 0;
  h.renderSpaceBrief = () => briefs++;
  h.renderCommandPanels = () => {};
  h.updateLaunchQuickStat = () => {};
  run('lastDashboardCheckedAt = new Date();');
  const original = run('+lastDashboardCheckedAt');
  h.initBriefingClock();
  assert.equal(intervals.length, 1);
  assert.equal(intervals[0].delay, 60000);
  h.document.visibilityState = 'hidden'; intervals[0].fn(); assert.equal(briefs, 0);
  h.document.visibilityState = 'visible'; events.visibilitychange(); assert.equal(briefs, 1);
  events.pageshow(); assert.equal(briefs, 2);
  run('latestSourceStatuses.set("launches", { id: "launches", state: "pending" })');
  intervals[0].fn(); assert.equal(briefs, 2);
  assert.equal(run('+lastDashboardCheckedAt'), original);
});
test('unchanged clock rendering preserves the action DOM rather than replacing focused content', () => {
  const { h, elements } = harness();
  h.renderSpaceBrief();
  const html = elements['#spaceBriefBody'].innerHTML;
  Object.defineProperty(elements['#spaceBriefBody'], 'innerHTML', { get: () => html, set: () => { throw Error('Unchanged DOM replaced'); } });
  h.renderSpaceBrief({ onlyIfChanged: true });
});
