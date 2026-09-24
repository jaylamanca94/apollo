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
const issHandler = require("../api/iss");
const { getLaunchLimit, normalizeLaunchLibraryPayload } = require("../api/launches");
const peopleHandler = require("../api/people");
const apodHandler = require("../api/apod");
const neoHandler = require("../api/neo");

test("NASA routes never forward upstream error content or credentials", async (t) => {
  const originalFetch = global.fetch;
  const originalKey = process.env.NASA_API_KEY;
  const fixtureKey = "apollo-disposable-fixture-key";
  process.env.NASA_API_KEY = fixtureKey;
  t.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NASA_API_KEY;
    else process.env.NASA_API_KEY = originalKey;
  });

  for (const status of [400, 403, 429, 500, 503]) {
    global.fetch = async (url) => {
      assert.equal(new URL(url).searchParams.get("api_key"), new URL(url).hostname === "api.nasa.gov" ? fixtureKey : null);
      return {
        ok: false,
        status,
        async json() {
          return {
            error: { message: `Rejected credential ${fixtureKey}`, code: "UPSTREAM_DETAIL" },
            request: { url: String(url), api_key: fixtureKey },
            trace: [encodeURIComponent(String(url))]
          };
        }
      };
    };

    for (const handler of [apodHandler, neoHandler]) {
      const response = createResponse();
      await handler({ method: "GET", url: "/api/neo?date=2026-09-23" }, response);
      assert.equal(response.statusCode, status);
      assert.equal(response.headers["Cache-Control"], "no-store");
      assert.deepEqual(JSON.parse(response.body), {
        error: { code: "NASA_REQUEST_FAILED", message: "NASA request failed." }
      });
      assert.ok(!response.body.includes(fixtureKey));
      assert.ok(!response.body.includes("UPSTREAM_DETAIL"));
    }
  }
});

test("NASA routes keep malformed and transport failures safe and non-cacheable", async (t) => {
  const originalFetch = global.fetch;
  const originalKey = process.env.NASA_API_KEY;
  process.env.NASA_API_KEY = "apollo-disposable-fixture-key";
  t.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NASA_API_KEY;
    else process.env.NASA_API_KEY = originalKey;
  });

  for (const failure of ["malformed", "timeout", "network"]) {
    global.fetch = async () => {
      if (failure !== "malformed") {
        const error = new Error("Transport diagnostics with apollo-disposable-fixture-key");
        error.name = failure === "timeout" ? "AbortError" : "TypeError";
        throw error;
      }
      return { ok: false, status: 502, async json() { throw new SyntaxError("Invalid JSON"); } };
    };
    for (const handler of [apodHandler, neoHandler]) {
      const response = createResponse();
      await handler({ method: "GET", url: "/api/neo?date=2026-09-24" }, response);
      assert.equal(response.statusCode, failure === "malformed" ? 502 : 500);
      assert.equal(response.headers["Cache-Control"], "no-store");
      const payload = JSON.parse(response.body);
      assert.equal(payload.error.code, failure === "malformed" ? "NASA_REQUEST_FAILED" : "NASA_PROXY_ERROR");
      assert.ok(!response.body.includes("apollo-disposable-fixture-key"));
    }
  }

  delete process.env.NASA_API_KEY;
  for (const handler of [neoHandler]) {
    const response = createResponse();
    await handler({ method: "GET", url: "/api/neo?date=2026-09-24" }, response);
    assert.equal(response.statusCode, 500);
    assert.equal(JSON.parse(response.body).error.code, "NASA_API_KEY_MISSING");
    assert.equal(response.headers["Cache-Control"], "no-store");
  }
});

test("NASA request recovers after failure and caches only the scrubbed success", async (t) => {
  const { requestNasa } = require("../api/_nasa");
  const originalFetch = global.fetch;
  const originalKey = process.env.NASA_API_KEY;
  process.env.NASA_API_KEY = "apollo-disposable-fixture-key";
  t.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NASA_API_KEY;
    else process.env.NASA_API_KEY = originalKey;
  });
  let requests = 0;
  global.fetch = async () => {
    requests += 1;
    return {
      ok: requests > 1,
      status: requests > 1 ? 200 : 503,
      async json() {
        return requests === 1
          ? { error: { message: "apollo-disposable-fixture-key" } }
          : { links: { self: "https://api.nasa.gov/example?api_key=apollo-disposable-fixture-key&date=2026-09-23" } };
      }
    };
  };
  const request = () => requestNasa("/example", {}, "test:recovery", 60);
  await assert.rejects(request, { status: 503 });
  const recovered = await request();
  assert.deepEqual(recovered, { links: { self: "https://api.nasa.gov/example?date=2026-09-23" } });
  assert.deepEqual(await request(), recovered);
  assert.equal(requests, 2);
});

function createResponse() {
  const headers = {};

  return {
    body: "",
    headers,
    statusCode: 200,
    end(body) {
      this.body = body;
    },
    setHeader(name, value) {
      headers[name] = value;
    }
  };
}

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

test("ISS and crew source proxies return source-specific errors and cache source payloads", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: false,
    status: 503,
    async json() {
      return null;
    }
  });

  const issResponse = createResponse();
  const peopleResponse = createResponse();
  await issHandler({ method: "GET" }, issResponse);
  await peopleHandler({ method: "GET" }, peopleResponse);

  assert.equal(issResponse.statusCode, 503);
  assert.deepEqual(JSON.parse(issResponse.body), {
    error: {
      code: "ISS_POSITION_PROXY_ERROR",
      message: "Could not load the current ISS position."
    }
  });
  assert.equal(peopleResponse.statusCode, 503);
  assert.deepEqual(JSON.parse(peopleResponse.body), {
    error: {
      code: "PEOPLE_IN_SPACE_PROXY_ERROR",
      message: "Could not load the current crew roster."
    }
  });

  const requests = [];
  global.fetch = async (url) => {
    requests.push(String(url));

    return {
      ok: true,
      status: 200,
      async json() {
        return String(url).includes("wheretheiss")
          ? { latitude: 12.4, longitude: -4.2 }
          : { number: 1, people: [{ name: "Maya Chen", craft: "ISS" }] };
      }
    };
  };

  assert.deepEqual(await issHandler.requestIssPosition(), { latitude: 12.4, longitude: -4.2 });
  assert.deepEqual(await issHandler.requestIssPosition(), { latitude: 12.4, longitude: -4.2 });
  assert.deepEqual(await peopleHandler.requestPeopleInSpace(), {
    number: 1,
    people: [{ name: "Maya Chen", craft: "ISS" }]
  });
  assert.deepEqual(await peopleHandler.requestPeopleInSpace(), {
    number: 1,
    people: [{ name: "Maya Chen", craft: "ISS" }]
  });
  assert.deepEqual(requests, [
    "https://api.wheretheiss.at/v1/satellites/25544",
    "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json"
  ]);
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
      alt: "Eagle Nebula",
      sourceUrl: "https://apod.nasa.gov/apod/ap260610.html"
    },
    source: "NASA APOD"
  });
});

test("normalizeApodPayload rejects sparse or unusable success payloads", () => {
  for (const payload of [null, {}, [], { url: "javascript:alert(1)" }]) {
    assert.throws(() => normalizeApodPayload(payload), { status: 502 });
  }
});

test("normalizeApodPayload exposes embeddable APOD video URLs", () => {
  const payload = normalizeApodPayload({
    date: "2026-06-10",
    media_type: "video",
    title: "Solar eruption",
    explanation: "An eruption on the Sun.",
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

test("normalizeNeoPayload returns complete asteroid context", () => {
  const payload = normalizeNeoPayload({
    element_count: 1,
    near_earth_objects: {
      "2026-06-10": [
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
              close_approach_date: "2026-06-10",
              orbiting_body: "Earth",
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

test("normalizeNeoPayload accepts an explicit count-verified empty day", () => {
  const payload = normalizeNeoPayload({
    element_count: 0,
    near_earth_objects: { "2026-06-10": [] }
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

function neoFixture(date = "2026-10-01") {
  return {
    element_count: 1,
    near_earth_objects: { [date]: [{
      id: "fixture-1", name: "Synthetic object", is_potentially_hazardous_asteroid: false,
      is_sentry_object: false,
      close_approach_data: [{ close_approach_date: date, orbiting_body: "Earth",
        miss_distance: { kilometers: "1000000", lunar: "2.6" } }]
    }] }
  };
}

test("NeoWs rejects incomplete coverage and uncertain records instead of reporting zero", () => {
  const date = "2026-10-01";
  const invalid = [null, [], {}, { near_earth_objects: {} },
    { element_count: 0, near_earth_objects: { "2026-10-02": [] } }];
  const mutate = (fn) => { const payload = neoFixture(date); fn(payload, payload.near_earth_objects[date][0]); invalid.push(payload); };
  for (const count of [undefined, null, "1", -1, 0, 2, 1.5]) mutate(p => p.element_count = count);
  for (const bucket of [null, {}, "", [null], [{}], [false]]) mutate(p => p.near_earth_objects[date] = bucket);
  mutate(p => { p.near_earth_objects["2026-10-02"] = []; });
  mutate(p => { p.near_earth_objects[date].push(p.near_earth_objects[date][0]); p.element_count = 2; });
  for (const flag of [undefined, null, 0, "false", "true"]) {
    mutate((p, item) => item.is_potentially_hazardous_asteroid = flag);
    mutate((p, item) => item.is_sentry_object = flag);
  }
  mutate((p, item) => item.id = "");
  mutate((p, item) => item.name = "");
  mutate(p => { p.near_earth_objects[date].push(null); p.element_count = 2; });
  mutate((p, item) => item.close_approach_data.push(item.close_approach_data[0]));
  mutate((p, item) => item.close_approach_data = []);
  mutate((p, item) => item.close_approach_data[0].close_approach_date = "2026-10-02");
  mutate((p, item) => item.close_approach_data[0].orbiting_body = "Mars");
  for (const distance of [undefined, null, "", " ", false, [], {}, "NaN", -1]) {
    mutate((p, item) => item.close_approach_data[0].miss_distance.kilometers = distance);
  }
  for (const payload of invalid) {
    assert.throws(() => normalizeNeoPayload(payload, date), { status: 502,
      payload: { error: { code: "NASA_NEO_INVALID_RESPONSE", message: "NASA asteroid data is incomplete or invalid. Try again shortly." } } });
  }
});

test("NeoWs selects the requested Earth approach and preserves unavailable optional measurements", () => {
  const payload = neoFixture();
  const item = payload.near_earth_objects["2026-10-01"][0];
  item.close_approach_data.unshift({ close_approach_date: "2026-09-30", orbiting_body: "Earth", miss_distance: { kilometers: "1" } });
  item.close_approach_data[1].relative_velocity = { kilometers_per_hour: false };
  const result = normalizeNeoPayload(payload, "2026-10-01").asteroids[0];
  assert.equal(result.closestKilometers, 1000000);
  assert.equal(result.closeApproach, "2026-10-01");
  assert.equal(result.velocityKph, null);
  assert.equal(result.minDiameterMeters, null);
  assert.equal(result.hazardous, false);
});

test("NeoWs handler rejects invalid successes without caching them and recovers on retry", async (t) => {
  const originalFetch = global.fetch;
  const originalKey = process.env.NASA_API_KEY;
  process.env.NASA_API_KEY = "apollo-disposable-fixture-key";
  t.after(() => { global.fetch = originalFetch; if (originalKey === undefined) delete process.env.NASA_API_KEY; else process.env.NASA_API_KEY = originalKey; });
  for (const empty of [false, true]) {
    const date = empty ? "2026-10-03" : "2026-10-02";
    let calls = 0;
    global.fetch = async () => ({ ok: true, status: 200, json: async () => {
      calls += 1;
      return calls === 1 ? { element_count: 0, near_earth_objects: {}, diagnostic: "apollo-disposable-fixture-key" }
        : empty ? { element_count: 0, near_earth_objects: { [date]: [] } } : neoFixture(date);
    } });
    for (const expected of [502, 200, 200]) {
      const response = createResponse();
      await neoHandler({ method: "GET", url: `/api/neo?date=${date}` }, response);
      assert.equal(response.statusCode, expected);
      assert.ok(!response.body.includes("apollo-disposable-fixture-key"));
      if (expected === 502) {
        assert.equal(response.headers["Cache-Control"], "no-store");
        assert.equal(JSON.parse(response.body).error.code, "NASA_NEO_INVALID_RESPONSE");
      } else {
        assert.match(response.headers["Cache-Control"], /s-maxage=1800/);
        assert.equal(JSON.parse(response.body).elementCount, empty ? 0 : 1);
      }
    }
    assert.equal(calls, 2);
  }
});

function wordpressApod(date = '2026-09-23', overrides = {}) {
  return { date, title: 'Moon &amp; stars', media_type: 'image',
    explanation: '<strong>Explanation:</strong> A <a href="https://example.com">lunar</a> scene. &#x1F319;',
    copyright: '<b>Credit:</b> Example &amp; Team', alt: 'A crater &amp; ridges.',
    permalink: 'https://science.nasa.gov/image-article/example/',
    url: 'https://science.nasa.gov/image-article/example/',
    hdurl: 'https://assets.science.nasa.gov/example.jpg', ...overrides };
}

test('APOD WordPress contract separates image, source, readable text and alt', () => {
  const { apod } = normalizeApodPayload(wordpressApod());
  assert.equal(apod.mediaUrl, 'https://assets.science.nasa.gov/example.jpg');
  assert.equal(apod.sourceUrl, 'https://science.nasa.gov/image-article/example/');
  assert.equal(apod.title, 'Moon & stars');
  assert.equal(apod.explanation, 'A lunar scene. 🌙');
  assert.equal(apod.copyright, 'Credit: Example & Team');
  assert.equal(apod.alt, 'A crater & ridges.');
  assert.equal(normalizeApodPayload(wordpressApod(undefined, { copyright: '', credit: 'Other author' })).apod.copyright, 'Other author');
});

test('APOD new video, iframe and unknown media keep the article hand-off without treating a thumbnail as video', () => {
  for (const media_type of ['video', 'iframe', 'interactive']) {
    const { apod } = normalizeApodPayload(wordpressApod(undefined, { media_type,
      basic_html: '<iframe src="https://evil.example/"></iframe><script>alert(1)</script>' }));
    assert.equal(apod.mediaUrl, '');
    assert.equal(apod.hdUrl, '');
    assert.equal(apod.mediaEmbedUrl, '');
    assert.equal(apod.sourceUrl, 'https://science.nasa.gov/image-article/example/');
  }
});

test('APOD rejects wrong dates, unsafe or missing image/source and incomplete metadata', () => {
  for (const overrides of [{ date: '2026-02-30' }, { date: '2026-09-22' }, { title: '' }, { explanation: '' },
    { media_type: '' }, { hdurl: 'javascript:alert(1)' }, { hdurl: '' },
    { hdurl: 'https://science.nasa.gov/image-article/example/' },
    { permalink: 'https://evil.example/' }, { permalink: 'javascript:alert(1)' }]) {
    assert.throws(() => normalizeApodPayload(wordpressApod(undefined, overrides), '2026-09-23'), { status: 502 });
  }
  const { apod } = normalizeApodPayload(wordpressApod(undefined, {
    explanation: '<script>bad()</script><style>bad</style><p>Actual &lt;img onerror=bad()&gt; text.</p>'
  }));
  assert.equal(apod.explanation, 'Actual <img onerror=bad()> text.'); // Escaped by renderer, never inserted as HTML.
});

test('APOD keyless request validates before cache and recovers after invalid HTTP 200', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const { requestApodWithFallback } = apodHandler;
  let calls = 0;
  global.fetch = async url => {
    calls++;
    assert.equal(String(url), 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/260910');
    return { ok: true, status: 200, json: async () => calls === 1 ? {} : wordpressApod('2026-09-10') };
  };
  const date = new Date('2026-09-10T20:00:00Z');
  await assert.rejects(requestApodWithFallback(date), { status: 502 });
  assert.equal((await requestApodWithFallback(date)).apod.date, '2026-09-10');
  await requestApodWithFallback(date);
  assert.equal(calls, 2);
});

test('APOD falls back only on missing publication and keys cache by Eastern day', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const calls = [];
  global.fetch = async url => {
    calls.push(String(url));
    const previousDay = String(url).endsWith('260911');
    return { ok: previousDay, status: previousDay ? 200 : 404, json: async () => wordpressApod('2026-09-11') };
  };
  const { apod } = await apodHandler.requestApodWithFallback(new Date('2026-09-13T01:00:00Z'));
  assert.equal(apod.date, '2026-09-11');
  assert.deepEqual(calls.map(url => url.split('/').pop()), ['260912', '260911']);
  calls.length = 0;
  global.fetch = async url => { calls.push(url); return { ok: false, status: 429, json: async () => ({ secret: 'diagnostic' }) }; };
  await assert.rejects(apodHandler.requestApodWithFallback(new Date('2026-09-14T12:00:00Z')), { status: 429 });
  assert.equal(calls.length, 1);
});

test('APOD missing-day fallback does not skip a publication across spring DST', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const dates = [];
  global.fetch = async url => {
    const day = String(url).split('/').pop();
    dates.push(day);
    return { ok: day === '260308', status: day === '260308' ? 200 : 404,
      json: async () => wordpressApod('2026-03-08') };
  };
  const result = await apodHandler.requestApodWithFallback(new Date('2026-03-09T04:30:00Z'));
  assert.deepEqual(dates, ['260309', '260308']);
  assert.equal(result.apod.date, '2026-03-08');
});
