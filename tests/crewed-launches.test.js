const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const handler = require('../api/launches');
const { normalizeCrewedLaunchPayload } = handler;

function helpers() {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const context = { document: { querySelector: () => null }, window: {}, URL };
  vm.createContext(context);
  vm.runInContext(app.slice(0, app.indexOf('async function loadDashboard')), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'crewed-launches.js'), 'utf8'), context);
  return context;
}
function rawLaunch(overrides = {}) {
  return { id: 'flight-1', name: 'Soyuz | Example crew mission', net: '2026-10-01T15:00:00Z',
    net_precision: { name: 'Second' }, status: { id: 1, name: 'Go for Launch' },
    launch_service_provider: { name: 'Example operator' },
    mission: { name: 'Example crew mission', description: 'An orbital mission.' },
    rocket: { spacecraft_stage: [{ destination: 'Example station', launch_crew: [
      { astronaut: { name: 'A crew member' }, role: { role: 'Commander' } }
    ] }] }, vid_urls: [{ url: 'javascript:alert(1)' }, { url: 'https://example.com/coverage' }],
    info_urls: [{ url: 'https://example.com/mission' }], ...overrides };
}
const now = new Date('2026-10-01T12:00:00Z');
function payload(rows = [rawLaunch()]) {
  return normalizeCrewedLaunchPayload({ count: rows.length, results: rows, next: null }, now);
}

test('crewed normalization supports other operators and preserves manifest, destination, coverage and credits', () => {
  const normalized = payload([rawLaunch({ image: { image_url: 'https://example.com/image', thumbnail_url: 'https://example.com/thumbnail', credit: 'Image author', name: 'Vehicle at the pad', license: { link: 'https://example.com/licence' } } })]);
  const launch = normalized.launches[0];
  assert.equal(launch.provider, 'Example operator');
  assert.equal(launch.crewed, true);
  assert.equal(launch.destination, 'Example station');
  assert.deepEqual(launch.crew, [{ name: 'A crew member', role: 'Commander' }]);
  assert.equal(launch.watchUrl, 'https://example.com/coverage');
  assert.equal(launch.missionUrl, 'https://example.com/mission');
  assert.equal(launch.imageCredit, 'Image author');
  assert.equal(launch.imageUrl, 'https://example.com/image');
  assert.equal(normalized.checkedAt, now.toISOString());
});

test('unknown crew and provider remain unknown; no ISS or SpaceX assumption', () => {
  const launch = payload([rawLaunch({ rocket: {}, launch_service_provider: null })]).launches[0];
  assert.equal(launch.provider, 'Provider not supplied');
  assert.equal(launch.destination, '');
  assert.deepEqual(launch.crew, []);
});

test('malformed, partial, duplicate or paginated crewed schedules fail closed', () => {
  for (const value of [{}, { results: [] }, { results: [], count: 1 },
    { results: [], count: 0, next: 'https://example.com/page2' },
    { count: 1, results: [rawLaunch({ net: 'invalid' })] },
    { count: 1, results: [rawLaunch({ status: {} })] },
    { count: 2, results: [rawLaunch(), rawLaunch()] }]) {
    assert.throws(() => normalizeCrewedLaunchPayload(value, now), /Incomplete crewed launch schedule/);
  }
  assert.deepEqual(payload([]).launches, []);
});

test('launch-day selection excludes uncrewed, tomorrow, cancelled and vague dates', () => {
  const { getCrewedLaunchDayState } = helpers();
  const p = payload();
  const base = p.launches[0];
  p.launches = [base, { ...base, crewed: false }, { ...base, dateUtc: '2026-10-02T15:00:00Z' },
    { ...base, status: 'Cancelled' }, { ...base, datePrecision: 'Month' }];
  assert.equal(getCrewedLaunchDayState(p, now).length, 1);
});

test('today means local calendar day across UTC midnight, not the next 24 hours', () => {
  const previousTz = process.env.TZ;
  try {
    for (const [zone, current, target, expected] of [
      ['America/New_York', '2026-10-02T01:00:00Z', '2026-10-02T02:00:00Z', 1],
      ['America/New_York', '2026-10-02T01:00:00Z', '2026-10-02T05:00:00Z', 0],
      ['Pacific/Kiritimati', '2026-10-01T12:00:00Z', '2026-10-02T00:00:00Z', 1],
      ['Pacific/Honolulu', '2026-10-02T08:00:00Z', '2026-10-02T09:00:00Z', 1]
    ]) {
      process.env.TZ = zone;
      const p = { ...payload(), checkedAt: current };
      p.launches[0].dateUtc = target;
      assert.equal(helpers().getCrewedLaunchDayState(p, new Date(current)).length, expected, zone);
    }
  } finally {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  }
});

test('elapsed targets never imply lift-off; source outcomes and scrubs stay explicit', () => {
  const { getCrewedLaunchDayState } = helpers();
  const p = payload([rawLaunch({ net: '2026-10-01T10:00:00Z' })]);
  assert.match(getCrewedLaunchDayState(p, now)[0].timingNote, /target time has passed/);
  p.launches[0].statusId = 3;
  p.launches[0].status = 'Launch Successful';
  assert.equal(getCrewedLaunchDayState(p, now)[0].timingLabel, 'Launch time');
  p.launches[0].statusId = 6;
  p.launches[0].status = 'Launch Scrubbed';
  assert.equal(getCrewedLaunchDayState(p, now)[0].timingLabel, 'Previous target');
  assert.match(getCrewedLaunchDayState(p, now)[0].timingNote, /scrubbed/);
});

test('moving a scrub to tomorrow removes the feature; stale and malformed successful bodies are unavailable', () => {
  const { getCrewedLaunchDayState } = helpers();
  const p = payload([rawLaunch({ net: '2026-10-02T15:00:00Z' })]);
  assert.equal(getCrewedLaunchDayState(p, now).length, 0);
  for (const value of [{}, { launches: [] }, { ...p, checkedAt: '2026-10-01T10:00:00Z' }]) {
    assert.throws(() => getCrewedLaunchDayState(value, now), /unavailable or stale/);
  }
});

test('feature copy escapes provider text and rejects unsafe coverage and image URLs', () => {
  const { crewedLaunchFeatureHtml, getCrewedLaunchDayState } = helpers();
  const p = payload();
  Object.assign(p.launches[0], { missionName: '<script>alert(1)</script>', watchUrl: 'javascript:alert(1)', imageUrl: 'javascript:alert(1)' });
  const html = crewedLaunchFeatureHtml(getCrewedLaunchDayState(p, now), p.checkedAt);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('Mission updates'));
  assert.ok(!html.includes('Watch coverage'));
});

test('the feature has no assumption of a confirmed time when precision is day only', () => {
  const h = helpers();
  const p = payload([rawLaunch({ net_precision: { name: 'Day' } })]);
  assert.match(h.crewedLaunchFeatureHtml(h.getCrewedLaunchDayState(p, now), p.checkedAt), /Time not confirmed/);
});

test('crewed query is multi-provider, includes suborbital and completed flights, and caches only valid responses', async t => {
  const oldFetch = global.fetch;
  t.after(() => { global.fetch = oldFetch; });
  let calls = 0;
  let valid = false;
  global.fetch = async url => {
    calls++;
    const query = new URL(url);
    assert.equal(query.pathname, '/2.3.0/launches/');
    assert.equal(query.searchParams.get('search'), null);
    assert.equal(query.searchParams.get('is_crewed'), 'true');
    assert.equal(query.searchParams.get('include_suborbital'), 'true');
    assert.equal(query.searchParams.get('mode'), 'detailed');
    assert.equal(Date.parse(query.searchParams.get('net__lt')) - Date.parse(query.searchParams.get('net__gte')), 3 * 86400000);
    return { ok: true, json: async () => valid ? { results: [], count: 0, next: null } : {} };
  };
  function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } }; }
  const request = { method: 'GET', url: '/api/launches?scope=crewed' };
  const bad = response();
  await handler(request, bad);
  assert.equal(bad.statusCode, 502);
  assert.equal(bad.headers['Cache-Control'], 'no-store');
  valid = true;
  const good = response();
  await handler(request, good);
  assert.equal(good.statusCode, 200);
  assert.equal(good.body.scope, 'Crewed launches across providers');
  await handler(request, response());
  assert.equal(calls, 2);
});
