const assert = require("node:assert/strict");
const test = require("node:test");

const { getCached, setCached } = require("../api/_cache");
const { fetchJson } = require("../api/_http");
const { getFiniteNumber, getText, safeHttpUrl } = require("../api/_normalize");
const { sendMethodNotAllowed } = require("../api/_response");
const {
  getApodEmbedUrl,
  isIsoDate,
  normalizeApodPayload,
  normalizeNeoPayload,
  normalizeSpaceWeatherPayload
} = require("../api/_space_data");
const { buildHealthPayload } = require("../api/health");
const { getLaunchLimit, normalizeLaunchLibraryPayload } = require("../api/launches");

test("shared cache returns fresh payloads and drops expired entries", () => {
  const cache = new Map();
  const payload = { status: "fresh" };

  setCached(cache, "fresh", payload, 30);
  assert.equal(getCached(cache, "fresh"), payload);

  setCached(cache, "expired", { status: "expired" }, 0);
  assert.equal(getCached(cache, "expired"), null);
  assert.equal(cache.has("expired"), false);
});

test("fetchJson returns parsed payloads and applies an abort signal", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(String(url), "https://example.test/data.json");
    assert.ok(options.signal instanceof AbortSignal);

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          status: "ok"
        };
      }
    };
  };

  const { response, payload } = await fetchJson("https://example.test/data.json", {
    timeoutMs: 500
  });

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    status: "ok"
  });
});

test("fetchJson forwards standard fetch options without leaking timeout settings", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(String(url), "https://example.test/post.json");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, {
      "content-type": "application/json"
    });
    assert.equal(options.body, JSON.stringify({ status: "probe" }));
    assert.equal("timeoutMs" in options, false);
    assert.ok(options.signal instanceof AbortSignal);

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          accepted: true
        };
      }
    };
  };

  const { payload } = await fetchJson("https://example.test/post.json", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ status: "probe" }),
    timeoutMs: 500
  });

  assert.deepEqual(payload, {
    accepted: true
  });
});

test("fetchJson preserves responses when JSON parsing fails", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: false,
    status: 503,
    async json() {
      throw new Error("invalid json");
    }
  });

  const { response, payload } = await fetchJson("https://example.test/unavailable");

  assert.equal(response.status, 503);
  assert.equal(payload, null);
});

test("shared normalizers trim text, parse finite numbers, and keep safe HTTP URLs only", () => {
  assert.equal(getText("  Apollo  "), "Apollo");
  assert.equal(getText("   ", "Fallback"), "Fallback");
  assert.equal(getFiniteNumber("42.5"), 42.5);
  assert.equal(getFiniteNumber(""), null);
  assert.equal(getFiniteNumber("not numeric"), null);
  assert.equal(safeHttpUrl("https://example.test/path?q=1"), "https://example.test/path?q=1");
  assert.equal(safeHttpUrl("ftp://example.test/path"), "");
  assert.equal(safeHttpUrl("javascript:alert(1)"), "");
});

test("shared method guard sends stable JSON 405 responses", () => {
  const headers = {};
  const response = {
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      headers[name] = value;
    },
    end(body) {
      this.body = body;
    }
  };

  sendMethodNotAllowed(response);

  assert.equal(response.statusCode, 405);
  assert.equal(headers.Allow, "GET");
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(headers["Cache-Control"], "no-store");
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Use GET for this endpoint."
    }
  });
});

test("isIsoDate accepts Apollo's API date format only", () => {
  assert.equal(isIsoDate("2026-06-10"), true);
  assert.equal(isIsoDate("2026-6-10"), false);
  assert.equal(isIsoDate("not-a-date"), false);
  assert.equal(isIsoDate(undefined), false);
});

test("buildHealthPayload reports ready server configuration without exposing secrets", () => {
  const payload = buildHealthPayload(new Date("2026-06-10T12:00:00.000Z"), {
    NASA_API_KEY: "secret-key"
  });

  assert.equal(payload.service, "apollo");
  assert.equal(payload.status, "ok");
  assert.equal(payload.timestamp, "2026-06-10T12:00:00.000Z");
  assert.equal(payload.checks.runtime, "ok");
  assert.equal(payload.checks.nasaApiKey, "configured");
  assert.doesNotMatch(JSON.stringify(payload), /secret-key/);
});

test("buildHealthPayload reports degraded when NASA key is missing", () => {
  const payload = buildHealthPayload(new Date("2026-06-10T12:00:00.000Z"), {});

  assert.equal(payload.status, "degraded");
  assert.equal(payload.checks.nasaApiKey, "missing");
});

test("normalizeApodPayload returns a stable dashboard contract", () => {
  const payload = normalizeApodPayload({
    copyright: " NASA ",
    date: "2026-06-10",
    explanation: "A nebula in detail.",
    hdurl: "https://apod.nasa.gov/image.jpg",
    media_type: "image",
    title: " Eagle Nebula ",
    url: "https://apod.nasa.gov/image_1024.jpg"
  });

  assert.deepEqual(payload, {
    apod: {
      title: "Eagle Nebula",
      date: "2026-06-10",
      explanation: "A nebula in detail.",
      mediaType: "image",
      mediaUrl: "https://apod.nasa.gov/image_1024.jpg",
      mediaEmbedUrl: "",
      hdUrl: "https://apod.nasa.gov/image.jpg",
      copyright: "NASA",
      sourceUrl: "https://apod.nasa.gov/apod/ap260610.html"
    },
    source: "NASA APOD"
  });
});

test("normalizeApodPayload uses safe fallbacks for sparse payloads", () => {
  const payload = normalizeApodPayload({
    url: "javascript:alert(1)"
  });

  assert.equal(payload.apod.title, "Astronomy Picture of the Day");
  assert.equal(payload.apod.explanation, "No description available.");
  assert.equal(payload.apod.mediaUrl, "");
  assert.equal(payload.apod.mediaEmbedUrl, "");
  assert.equal(payload.apod.sourceUrl, "https://apod.nasa.gov/apod/");
});

test("normalizeApodPayload exposes embeddable APOD video URLs", () => {
  const payload = normalizeApodPayload({
    date: "2026-06-10",
    media_type: "video",
    title: "Solar eruption",
    url: "https://www.youtube.com/watch?v=abc123XYZ_8"
  });

  assert.equal(payload.apod.mediaUrl, "https://www.youtube.com/watch?v=abc123XYZ_8");
  assert.equal(payload.apod.mediaEmbedUrl, "https://www.youtube.com/embed/abc123XYZ_8");
});

test("getApodEmbedUrl supports known APOD video hosts only", () => {
  assert.equal(getApodEmbedUrl("https://youtu.be/abc123XYZ_8?t=30"), "https://www.youtube.com/embed/abc123XYZ_8");
  assert.equal(getApodEmbedUrl("https://vimeo.com/123456789"), "https://player.vimeo.com/video/123456789");
  assert.equal(getApodEmbedUrl("https://example.com/watch/123456789"), "");
});

test("normalizeNeoPayload returns asteroid context and filters malformed records", () => {
  const payload = normalizeNeoPayload({
    near_earth_objects: {
      "2026-06-10": [
        null,
        {
          id: "3655761",
          name: " (2014 AE29) ",
          nasa_jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3655761",
          is_potentially_hazardous_asteroid: true,
          is_sentry_object: false,
          estimated_diameter: {
            kilometers: {
              estimated_diameter_min: "0.008",
              estimated_diameter_max: "0.02"
            }
          },
          close_approach_data: [
            {
              close_approach_date_full: "2026-Jun-10 15:41",
              relative_velocity: {
                kilometers_per_hour: "26999.6"
              },
              miss_distance: {
                kilometers: "37075104.4",
                lunar: "96.4"
              }
            }
          ]
        }
      ]
    }
  }, "2026-06-10");

  assert.equal(payload.date, "2026-06-10");
  assert.equal(payload.elementCount, 1);
  assert.equal(payload.source, "NASA NeoWs");
  assert.deepEqual(payload.hazardFlagContext, {
    label: "NASA potentially hazardous asteroid flag",
    summary: "NASA's flag reflects an orbit that can pass within about 7.48M km of Earth and an estimated size near 140 m or larger. It is not an impact prediction."
  });
  assert.deepEqual(payload.sentryContext, {
    label: "NASA Sentry monitoring",
    summary: "Sentry is NASA/JPL's automated monitoring system for possible future Earth impacts over the next 100 years."
  });
  assert.deepEqual(payload.asteroids[0], {
    id: "3655761",
    name: "(2014 AE29)",
    hazardous: true,
    sentryObject: false,
    closeApproach: "2026-Jun-10 15:41",
    closestKilometers: 37075104.4,
    lunarDistance: 96.4,
    velocityKph: 26999.6,
    minDiameterMeters: 8,
    maxDiameterMeters: 20,
    sourceUrl: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3655761"
  });
});

test("normalizeNeoPayload returns an empty list for missing date buckets", () => {
  const payload = normalizeNeoPayload({
    near_earth_objects: {}
  }, "2026-06-10");

  assert.deepEqual(payload, {
    date: "2026-06-10",
    elementCount: 0,
    asteroids: [],
    hazardFlagContext: {
      label: "NASA potentially hazardous asteroid flag",
      summary: "NASA's flag reflects an orbit that can pass within about 7.48M km of Earth and an estimated size near 140 m or larger. It is not an impact prediction."
    },
    sentryContext: {
      label: "NASA Sentry monitoring",
      summary: "Sentry is NASA/JPL's automated monitoring system for possible future Earth impacts over the next 100 years."
    },
    source: "NASA NeoWs"
  });
});

test("normalizeLaunchLibraryPayload sorts, limits, and sanitizes launches", () => {
  const payload = normalizeLaunchLibraryPayload({
    results: [
      {
        name: "Incomplete launch"
      },
      {
        name: "Later mission",
        net: "2026-06-12T12:27:00Z",
        status: { name: "Go for Launch" },
        mission: { description: "Second mission." },
        image: { thumbnail_url: "javascript:bad()" },
        rocket: { configuration: { name: "Falcon 9" } },
        pad: {
          name: "SLC-40",
          location: { name: "Cape Canaveral SFS, FL, USA" }
        },
        launch_service_provider: { name: "SpaceX" },
        url: "https://ll.thespacedevs.com/launch/later/"
      },
      {
        name: "Earlier mission",
        net: "2026-06-11T14:00:00Z",
        status: { name: "To Be Confirmed" },
        status_description: "Ignored",
        mission: { description: "First mission." },
        image: { image_url: "https://example.com/launch.jpg" },
        rocket: { configuration: { name: "Falcon 9" } },
        pad: {
          name: "SLC-4E",
          location: { name: "Vandenberg SFB, CA, USA" }
        },
        window_start: "2026-06-11T14:00:00Z",
        window_end: "2026-06-11T18:00:00Z",
        launch_service_provider: { name: "SpaceX" },
        url: "https://ll.thespacedevs.com/launch/earlier/"
      }
    ]
  });

  assert.equal(payload.source, "The Space Devs launch data");
  assert.equal(payload.scope, "SpaceX upcoming launches");
  assert.equal(payload.launches.length, 2);
  assert.equal(payload.launches[0].name, "Earlier mission");
  assert.equal(payload.launches[0].imageUrl, "https://example.com/launch.jpg");
  assert.equal(payload.launches[0].windowStart, "2026-06-11T14:00:00Z");
  assert.equal(payload.launches[0].windowEnd, "2026-06-11T18:00:00Z");
  assert.equal(payload.launches[0].windowDurationMinutes, 240);
  assert.equal(payload.launches[1].name, "Later mission");
  assert.equal(payload.launches[1].imageUrl, "");
  assert.equal(payload.launches[1].windowDurationMinutes, null);
});

test("normalizeLaunchLibraryPayload honors a safe display limit", () => {
  const payload = normalizeLaunchLibraryPayload({
    results: [
      { name: "Mission 3", net: "2026-06-13T12:00:00Z" },
      { name: "Mission 1", net: "2026-06-11T12:00:00Z" },
      { name: "Mission 2", net: "2026-06-12T12:00:00Z" }
    ]
  }, {
    limit: 2
  });

  assert.deepEqual(payload.launches.map((launch) => launch.name), ["Mission 1", "Mission 2"]);
});

test("normalizeLaunchLibraryPayload excludes past completed launches from upcoming rows", () => {
  const payload = normalizeLaunchLibraryPayload({
    results: [
      {
        name: "Completed mission",
        net: "2026-07-07T07:12:00Z",
        status: { name: "Launch Successful" }
      },
      {
        name: "Future mission",
        net: "2026-07-08T12:00:00Z",
        status: { name: "Go for Launch" }
      }
    ]
  }, {
    now: "2026-07-07T13:00:00Z",
    limit: 5
  });

  assert.deepEqual(payload.launches.map((launch) => launch.name), ["Future mission"]);
});

test("getLaunchLimit clamps launch request limits", () => {
  assert.equal(getLaunchLimit({ query: { limit: "20" }, url: "/api/launches", headers: {} }), 20);
  assert.equal(getLaunchLimit({ query: { limit: "100" }, url: "/api/launches", headers: {} }), 25);
  assert.equal(getLaunchLimit({ query: { limit: "-1" }, url: "/api/launches", headers: {} }), 1);
  assert.equal(getLaunchLimit({ query: {}, url: "/api/launches?limit=8", headers: {} }), 8);
  assert.equal(getLaunchLimit({ query: {}, url: "/api/launches", headers: {} }), 5);
});

test("normalizeSpaceWeatherPayload returns a stable NOAA dashboard contract", () => {
  const payload = normalizeSpaceWeatherPayload({
    kIndex: [
      {
        time_tag: "2026-06-10T15:30:00",
        kp_index: 1,
        estimated_kp: 0.67,
        kp: "1M"
      },
      {
        time_tag: "2026-06-10T15:31:00",
        kp_index: 4,
        estimated_kp: 4,
        kp: "4Z"
      }
    ],
    kpForecast: [
      {
        time_tag: "2026-06-10T15:00:00",
        observed: "observed",
        noaa_scale: "",
        kp: 2
      },
      {
        time_tag: "2026-06-10T18:00:00",
        observed: "estimated",
        noaa_scale: "",
        kp: 3
      },
      {
        time_tag: "2026-06-11T00:00:00",
        observed: "predicted",
        noaa_scale: "G1",
        kp: 5
      },
      {
        time_tag: "2026-06-11T03:00:00",
        observed: "predicted",
        noaa_scale: "",
        kp: 4
      },
      {
        time_tag: "2026-06-12T00:00:00",
        observed: "predicted",
        noaa_scale: "",
        kp: 7
      },
      {
        time_tag: "2026-06-13T00:00:00",
        observed: "predicted",
        noaa_scale: "",
        kp: 2
      }
    ],
    alerts: [
      {
        product_id: "TIIA",
        issue_datetime: "2026-06-10 17:38:31.317",
        message: "Space Weather Message Code: ALTTP2\nSerial Number: 1502\nIssue Time: 2026 Jun 10 1738 UTC\n\nALERT: Type II Radio Emission \nBegin Time: 2026 Jun 10 1715 UTC"
      }
    ]
  });

  assert.deepEqual(payload, {
    spaceWeather: {
      observedAt: "2026-06-10T15:31:00.000Z",
      kpIndex: 4,
      kpLabel: "4Z",
      noaaScale: "",
      condition: "Active conditions",
      severity: "active",
      summary: "Geomagnetic activity is elevated but below storm level.",
      forecast: [
        {
          date: "2026-06-10",
          maxKp: 3,
          noaaScale: "",
          condition: "Quiet conditions",
          severity: "quiet"
        },
        {
          date: "2026-06-11",
          maxKp: 5,
          noaaScale: "G1",
          condition: "Minor storm conditions",
          severity: "storm"
        },
        {
          date: "2026-06-12",
          maxKp: 7,
          noaaScale: "G3",
          condition: "Storm conditions",
          severity: "storm"
        }
      ],
      alerts: [
        {
          productId: "TIIA",
          issuedAt: "2026-06-10T17:38:31.317Z",
          headline: "ALERT: Type II Radio Emission",
          type: "Alert",
          impactScale: null
        }
      ],
      sourceUrl: "https://www.swpc.noaa.gov/products-and-data"
    },
    source: "NOAA SWPC"
  });
});

test("normalizeSpaceWeatherPayload classifies storm-level K-index values", () => {
  const payload = normalizeSpaceWeatherPayload({
    kIndex: [
      {
        time_tag: "2026-06-10T15:31:00",
        estimated_kp: 6,
        kp: "6Z"
      }
    ],
    alerts: []
  });

  assert.equal(payload.spaceWeather.condition, "Minor storm conditions");
  assert.equal(payload.spaceWeather.severity, "storm");
  assert.equal(payload.spaceWeather.noaaScale, "G2");
  assert.deepEqual(payload.spaceWeather.forecast, []);
});

test("normalizeSpaceWeatherPayload labels SWPC notice types", () => {
  const payload = normalizeSpaceWeatherPayload({
    kIndex: [
      {
        time_tag: "2026-06-10T15:31:00",
        estimated_kp: 2,
        kp: "2"
      }
    ],
    alerts: [
      {
        product_id: "WARN",
        issue_datetime: "2026-06-10 17:38:31.317",
        message: "WARNING: Geomagnetic K-index of 6 expected"
      },
      {
        product_id: "WATCH",
        issue_datetime: "2026-06-10 16:38:31.317",
        message: "WATCH: Geomagnetic Storm Category G1 Predicted"
      },
      {
        product_id: "SUMMARY",
        issue_datetime: "2026-06-10 15:38:31.317",
        message: "SUMMARY: Geomagnetic activity was quiet"
      }
    ]
  });

  assert.deepEqual(payload.spaceWeather.alerts.map((alert) => alert.type), ["Warning", "Watch", "Notice"]);
  assert.deepEqual(payload.spaceWeather.alerts.map((alert) => alert.impactScale), [
    {
      scale: "G2",
      label: "G2 Geomagnetic storm",
      summary: "Moderate NOAA geomagnetic storm level"
    },
    {
      scale: "G1",
      label: "G1 Geomagnetic storm",
      summary: "Minor NOAA geomagnetic storm level"
    },
    null
  ]);
});

test("normalizeSpaceWeatherPayload extracts radio blackout scale ranges from notices", () => {
  const payload = normalizeSpaceWeatherPayload({
    kIndex: [
      {
        time_tag: "2026-06-10T15:31:00",
        estimated_kp: 2,
        kp: "2"
      }
    ],
    alerts: [
      {
        product_id: "RANGE",
        issue_datetime: "2026-06-10 17:38:31.317",
        message: "ALERT: R1-R2 Radio Blackouts Observed"
      }
    ]
  });

  assert.deepEqual(payload.spaceWeather.alerts[0].impactScale, {
    scale: "R1-R2",
    label: "R1-R2 Radio blackout",
    summary: "Moderate NOAA radio blackout level"
  });
});
