const assert = require('node:assert/strict');
const test = require('node:test');
const { build, unavailableReason } = require('../launch-calendar');
const { normalizeLaunchLibraryPayload } = require('../api/launches');
const now = new Date('2026-11-01T05:30:00Z'); // DST boundary in New York.
const checked = '2026-11-01T05:20:00Z';
const launch = { id: 'flight-1', name: 'Rocket | Example mission', statusId: 1, status: 'Go for Launch',
  dateUtc: '2026-11-01T06:30:00Z', datePrecision: 'Second', location: 'Example pad, Florida',
  windowStart: '2026-11-01T06:00:00Z', windowEnd: '2026-11-01T07:30:00Z', sourceUrl: 'https://example.com/mission' };
const buildFor = (overrides = {}, time = checked) => build({ ...launch, ...overrides }, time, 'https://apollo.example/launches.html#launch-flight-1', now);
const unfold = value => value.replace(/\r\n /g, '');

test('calendar exports a tentative UTC target, real window, provenance and return link', () => {
  const value = unfold(buildFor());
  assert.match(value, /DTSTART:20261101T063000Z\r\nDTEND:20261101T073000Z/);
  assert.match(value, /DTSTAMP:20261101T053000Z/);
  assert.match(value, /STATUS:TENTATIVE\r\nTRANSP:TRANSPARENT/);
  assert.ok(value.includes('will not update automatically'));
  assert.ok(value.includes(checked.replace('Z', '.000Z')));
  assert.ok(value.includes('https://apollo.example/launches.html#launch-flight-1'));
  assert.ok(value.includes('URL:https://example.com/mission'));
  assert.ok(!value.includes('VALARM'));
  assert.ok(value.endsWith('END:VCALENDAR\r\n'));
});

test('calendar rejects missing, stale and future source checks', () => {
  for (const value of ['', null, 'bad', '2026-11-01T04:59:59Z', '2026-11-01T05:30:01Z']) assert.equal(buildFor({}, value), null);
  assert.ok(buildFor({}, '2026-11-01T05:00:00Z'));
});

test('calendar never fabricates a precise time for a day, month or unknown date', () => {
  for (const datePrecision of ['', 'Day', 'Month', 'Quarter', 'Year', 'Hour']) assert.equal(buildFor({ datePrecision }), null);
  assert.ok(buildFor({ datePrecision: 'Minute' }));
  for (const dateUtc of ['', null, 'bad', '2026-11-01T05:30:00Z', '2026-11-01T06:30:00']) assert.equal(buildFor({ dateUtc }), null);
});

test('calendar excludes holds, scrubs, cancelled, completed, unknown and TBD statuses', () => {
  for (const statusId of [null, 0, 2, 3, 4, 5, 6, 7, 9, 42, '1']) assert.equal(buildFor({ statusId }), null);
  assert.ok(buildFor({ statusId: 8, status: 'To Be Confirmed' }));
  assert.ok(unavailableReason({ ...launch, statusId: 5 }, checked, now));
});

test('instantaneous, missing, reversed, unrelated and implausible windows invent no duration', () => {
  for (const overrides of [
    { windowStart: '', windowEnd: '' }, { windowEnd: launch.dateUtc },
    { windowEnd: '2026-11-01T05:00:00Z' }, { windowStart: '2026-11-01T07:00:00Z' },
    { windowEnd: '2026-11-04T07:00:00Z' }
  ]) assert.ok(!buildFor(overrides).includes('DTEND:'));
});

test('untrusted text cannot inject components; Unicode folding stays within 75 UTF-8 octets', () => {
  const name = 'é🚀探索'.repeat(25) + '\r\nEND:VEVENT\r\nBEGIN:VALARM,;\\';
  const value = buildFor({ name, location: 'Pad\u0000\nATTENDEE:bad' });
  assert.equal(value.split('\r\nBEGIN:VEVENT').length, 2);
  assert.equal(value.split('\r\nEND:VEVENT').length, 2);
  assert.ok(!value.includes('\r\nBEGIN:VALARM'));
  assert.ok(!value.includes('\u0000'));
  for (const line of value.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(unfold(value).includes('é🚀探索'.repeat(25)));
  assert.ok(unfold(value).includes('BEGIN:VALARM\\,\\;\\\\'));
});

test('identity stays stable after postponement and unsafe identities or URLs cannot export', () => {
  const uid = value => value.match(/UID:(.*)\r\n/)[1];
  assert.equal(uid(buildFor()), uid(buildFor({ dateUtc: '2026-11-02T06:30:00Z' })));
  for (const overrides of [{ id: '' }, { id: 'evil\r\nATTENDEE:bad' }, { name: '' },
    { sourceUrl: 'javascript:alert(1)' }, { sourceUrl: 'https://user:password@example.com' }]) assert.equal(buildFor(overrides), null);
});

test('general launch proxy preserves source identity, precision, status and original check time', () => {
  const payload = normalizeLaunchLibraryPayload({ results: [{ id: 'flight-1', name: 'Mission', net: launch.dateUtc,
    net_precision: { name: 'Minute' }, status: { id: 8, name: 'To Be Confirmed' } }] }, { now });
  assert.equal(payload.checkedAt, now.toISOString());
  assert.equal(payload.launches[0].datePrecision, 'Minute');
  assert.equal(payload.launches[0].statusId, 8);
  assert.equal(payload.launches[0].id, 'flight-1');
  const legacy = normalizeLaunchLibraryPayload({ results: [{ name: 'Legacy mission', net: launch.dateUtc }] }, { now });
  assert.equal(build(legacy.launches[0], legacy.checkedAt, '', now), null);
});
