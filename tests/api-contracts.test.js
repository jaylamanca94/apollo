const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isIsoDate,
  normalizeApodPayload,
  normalizeNeoPayload,
  normalizeSpaceWeatherPayload
} = require("../api/_space_data");
const { buildHealthPayload } = require("../api/health");
const { getLaunchLimit, normalizeLaunchLibraryPayload } = require("../api/launches");

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
  assert.equal(payload.apod.sourceUrl, "https://apod.nasa.gov/apod/");
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
  assert.equal(payload.launches[1].name, "Later mission");
  assert.equal(payload.launches[1].imageUrl, "");
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
      condition: "Active conditions",
      severity: "active",
      summary: "Geomagnetic activity is elevated but below storm level.",
      alerts: [
        {
          productId: "TIIA",
          issuedAt: "2026-06-10T17:38:31.317Z",
          headline: "ALERT: Type II Radio Emission"
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
});
