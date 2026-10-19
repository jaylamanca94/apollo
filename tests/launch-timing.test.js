const test = require('node:test');
const assert = require('node:assert/strict');
const timing = require('../launch-timing');
const { normalizeLaunchLibraryPayload } = require('../api/launches');
const launch = { id: 'fixture', name: 'Example mission', dateUtc: '2026-11-01T00:00:00Z', datePrecision: 'Second', statusId: 1 };
const now = Date.parse('2026-10-31T23:00:00Z');

test('source day/month/year retain UTC dates and never acquire a local time or countdown', () => {
  for (const [datePrecision, expected] of [['Day', /Nov 1, 2026.*Time unconfirmed/], ['Month', /Nov 2026.*Day unconfirmed/], ['Year', /2026.*Date unconfirmed/]]) {
    const item = { ...launch, datePrecision };
    assert.match(timing.target(item), expected);
    assert.match(timing.target(item), /source date/);
    assert.doesNotMatch(timing.target(item), /AM|PM|00:00|Oct 31/);
    assert.equal(timing.countdown(item, now), 'Time unconfirmed');
  }
  for (const datePrecision of ['', 'Quarter', 'Hour']) {
    assert.equal(timing.target({ ...launch, datePrecision }), 'Date and time unconfirmed');
    assert.equal(timing.upcoming({ ...launch, datePrecision }, now), false);
  }
});

test('only known scheduled precise future targets get countdowns; elapsed targets claim no outcome', () => {
  assert.equal(timing.countdown(launch, now), 'T-1h');
  assert.equal(timing.countdown({ ...launch, datePrecision: 'Minute' }, now), 'T-1h');
  assert.equal(timing.countdown(launch, +new Date(launch.dateUtc)), 'Target time passed');
  for (const statusId of [null, 2, 3, 4, 5, 6, 7, 9]) {
    assert.doesNotMatch(timing.countdown({ ...launch, statusId }, now), /^T-/);
  }
  for (const dateUtc of ['', 'invalid', '2026-11-01', '2026-11-01T01:00:00']) {
    assert.equal(timing.countdown({ ...launch, dateUtc }, now), 'Time unconfirmed');
  }
});

test('day and month recommendations survive placeholder time until their source period ends', () => {
  const day = { ...launch, datePrecision: 'Day' }, month = { ...launch, datePrecision: 'Month' };
  assert.equal(timing.upcoming(day, '2026-11-01T23:59:59Z'), true);
  assert.equal(timing.upcoming(day, '2026-11-02T00:00:00Z'), false);
  assert.equal(timing.upcoming(month, '2026-11-30T23:59:59Z'), true);
  assert.equal(timing.upcoming(month, '2026-12-01T00:00:00Z'), false);
  for (const statusId of [null, 3, 4, 5, 6, 7]) assert.equal(timing.upcoming({ ...day, statusId }, now), false);
});

test('invalid and partial source pages fail instead of silently becoming an empty or smaller schedule', () => {
  const row = { id: 'example', name: 'Mission', net: launch.dateUtc };
  for (const payload of [{}, { results: null }, { results: [] }, { count: 2, results: [] },
    { results: [{}] }, { results: [row, {}] }, { results: [{ ...row, net: '2026-11-01' }] },
    { count: 0, results: [row] }, { count: 2, results: [row] }, { results: [row, row] },
    { count: 1, next: 'javascript:bad()', results: [row] }]) {
    assert.throws(() => normalizeLaunchLibraryPayload(payload), { status: 502 });
  }
  assert.equal(normalizeLaunchLibraryPayload({ count: 0, results: [], next: null }).launches.length, 0);
  assert.equal(normalizeLaunchLibraryPayload({ count: 10, next: 'https://ll.thespacedevs.com/next', results: [row] }).launches.length, 1);
});

test('actual handler rejects invalid success bodies without caching, then recovers and retains original check time', async t => {
  const handler = require('../api/launches');
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  let payload = { count: 2, results: [{ name: 'Broken partial row' }] }, requests = 0;
  global.fetch = async () => ({ ok: true, async json() { requests++; return payload; } });
  const request = { method: 'GET', url: '/api/launches?limit=17', headers: {} };
  const run = async () => {
    const response = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(value) { this.body = JSON.parse(value); } };
    await handler(request, response);
    return response;
  };
  for (let i = 0; i < 2; i++) {
    const response = await run();
    assert.equal(response.statusCode, 502);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(response.body.error.code, 'LAUNCH_RESPONSE_INVALID');
  }
  payload = { count: 0, results: [], next: null };
  const recovered = await run();
  assert.equal(recovered.statusCode, 200);
  assert.deepEqual(recovered.body.launches, []);
  const cached = await run();
  assert.equal(cached.body.checkedAt, recovered.body.checkedAt);
  assert.equal(requests, 3);
});
