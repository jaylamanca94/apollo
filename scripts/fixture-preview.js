// Disposable, explicitly labelled UI fixtures. Never imported by production.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handleLocalPreviewRequest } = require('./local-preview');
const routes = ['index', 'iss', 'launches', 'weather', 'asteroids', 'gallery', 'anomalies'];
function fixtures(origin) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(+now + 86400000).toISOString();
  return {
    apod: { apod: { title: 'Fixture: an illustrated space scene', date: today, explanation: 'Synthetic UI fixture. This is not a current NASA observation.', mediaType: 'image', mediaUrl: `${origin}/vendor/acadia/assets/thumbnail-orbit.png`, sourceUrl: 'https://apod.nasa.gov/' } },
    iss: { latitude: 25, longitude: -40, altitude: 420, velocity: 27600, visibility: 'daylight', timestamp: Math.floor(+now / 1000) },
    people: { number: 2, iss_expedition: 'Fixture', people: [{ name: 'Example crew member A', spacecraft: 'ISS' }, { name: 'Example crew member B', spacecraft: 'ISS' }] },
    launches: { launches: [{ name: 'Fixture rocket | Example mission with a long descriptive name', dateUtc: tomorrow, status: 'Scheduled', imageUrl: `${origin}/vendor/acadia/assets/thumbnail-orbit.png`, details: 'Synthetic mission description for layout and disclosure testing.', vehicle: 'Fixture rocket', pad: 'Example pad', location: 'Example launch location', windowStart: tomorrow, windowEnd: new Date(+now + 90000000).toISOString(), windowDurationMinutes: 60, provider: 'Fixture provider', sourceUrl: 'https://www.spacex.com/launches/' }] },
    neo: { asteroids: [{ name: 'Fixture object (not a real observation)', hazardous: true, sentryObject: false, closestKilometers: 12000000, lunarDistance: 31.2, velocityKph: 35000, closeApproach: today, minDiameterMeters: 100, maxDiameterMeters: 220, sourceUrl: 'https://cneos.jpl.nasa.gov/' }] },
    'space-weather': { spaceWeather: { observedAt: now.toISOString(), kpIndex: 5, kpLabel: 'Kp 5', noaaScale: 'G1', condition: 'Minor storm', severity: 'storm', summary: 'Synthetic storm fixture, not a current forecast.', sourceUrl: 'https://www.swpc.noaa.gov/', forecast: [{ date: today, maxKp: 5, noaaScale: 'G1', condition: 'Minor storm', severity: 'storm' }, { date: tomorrow.slice(0, 10), maxKp: 3, noaaScale: '', condition: 'Quiet', severity: 'quiet' }], alerts: [{ productId: 'FIXTURE', issuedAt: now.toISOString(), headline: 'Fixture alert: synthetic warning for layout verification', type: 'Warning' }] } }
  };
}
function createFixtureServer() {
  return http.createServer(async (req, res) => {
    const origin = `http://${req.headers.host}`;
    const url = new URL(req.url, origin);
    const settings = url.pathname.startsWith('/api/') ? new URL(req.headers.referer || '/', origin).searchParams : url.searchParams;
    const mode = settings.get('fixture') || 'loaded';
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5);
      const data = fixtures(origin);
      const failed = mode === 'failure' || (mode === 'partial' && ['apod', 'neo'].includes(name));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 5000));
      res.statusCode = failed ? 503 : 200;
      let payload = data[name] || {};
      if (name === 'apod' && settings.get('media')) {
        payload.apod.explanation = 'Synthetic long description for disclosure testing. '.repeat(20);
        payload.apod.mediaType = 'video';
        payload.apod.mediaUrl = 'https://example.com/fixture-video';
        // A local SVG exercises the iframe frame without contacting a video provider.
        payload.apod.mediaEmbedUrl = settings.get('media') === 'video' ? `${origin}/assets/favicon.svg` : '';
      }
      const brief = settings.get('brief');
      if (brief === 'launch' || brief === 'gallery') {
        if (name === 'space-weather') Object.assign(payload.spaceWeather, { kpIndex: 2, condition: 'Quiet', severity: 'quiet' });
        if (brief === 'gallery' && name === 'launches') payload = { launches: [] };
      }
      if (brief === 'old-weather' && name === 'space-weather') payload.spaceWeather.observedAt = new Date(Date.now() - 86400000).toISOString();
      if (brief === 'unknown-time' && name === 'space-weather') payload.spaceWeather.observedAt = '';
      if (brief === 'progressive' && name === 'space-weather') await new Promise(resolve => setTimeout(resolve, 3500));
      if (mode === 'empty') {
        if (name === 'launches') payload = { launches: [] };
        if (name === 'people') payload = { number: 0, people: [] };
        if (name === 'neo') payload = { asteroids: [] };
        if (name === 'space-weather') payload.spaceWeather = { ...payload.spaceWeather, alerts: [], forecast: [] };
      }
      res.end(JSON.stringify(failed ? { error: { code: 'FIXTURE_UNAVAILABLE', message: 'Synthetic source failure.' } } : payload));
      return;
    }
    const page = url.pathname === '/' ? 'index' : url.pathname.replace(/^\//, '').replace(/\.html$/, '');
    if (routes.includes(page)) {
      let html = fs.readFileSync(path.join(__dirname, '..', `${page}.html`), 'utf8');
      html = html.replace('<body ', '<body data-fixture="true" ');
      html = html.replace('<div class="apollo-app acadia-app">', `<div class="apollo-app acadia-app"><aside class="acadia-alert" role="note">UI fixture: ${['loaded', 'empty', 'partial', 'failure', 'loading'].includes(mode) ? mode : 'loaded'} — synthetic data, not live space activity.</aside>`);
      if (settings.get('text') === '200') html = html.replace('</head>', '<style>html { font-size: 200%; }</style></head>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(html);
      return;
    }
    await handleLocalPreviewRequest(req, res, { apiHandlers: {} });
  });
}
if (require.main === module) {
  const port = Number(process.argv[2]) || 4182;
  createFixtureServer().listen(port, '127.0.0.1', () => console.log(`Synthetic fixture preview: http://127.0.0.1:${port}`));
}
module.exports = { createFixtureServer, fixtures };
