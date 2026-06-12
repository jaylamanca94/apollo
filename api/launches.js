const { getCached, setCached } = require("./_cache");
const { sendJson } = require("./_nasa");

const LAUNCH_LIBRARY_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/";
const LAUNCH_CACHE_SECONDS = 60 * 15;
const LAUNCH_TIMEOUT_MS = 10000;
const cache = new Map();

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getWindowDurationMinutes(windowStart, windowEnd) {
  const start = new Date(windowStart);
  const end = new Date(windowEnd);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
    return null;
  }

  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function normalizeLaunch(launch) {
  if (!launch || typeof launch !== "object") {
    return null;
  }

  const name = getText(launch.name);
  const dateUtc = getText(launch.net);
  const launchDate = new Date(dateUtc);
  const windowStart = getText(launch.window_start);
  const windowEnd = getText(launch.window_end);

  if (!name || !dateUtc || !Number.isFinite(launchDate.getTime())) {
    return null;
  }

  return {
    name,
    dateUtc,
    status: getText(launch.status?.name) || "Upcoming",
    details: getText(launch.mission?.description) || getText(launch.status?.description),
    imageUrl: safeHttpUrl(launch.image?.thumbnail_url || launch.image?.image_url),
    vehicle: getText(launch.rocket?.configuration?.name),
    pad: getText(launch.pad?.name),
    location: getText(launch.pad?.location?.name),
    windowStart,
    windowEnd,
    windowDurationMinutes: getWindowDurationMinutes(windowStart, windowEnd),
    provider: getText(launch.launch_service_provider?.name) || "SpaceX",
    sourceUrl: safeHttpUrl(launch.url)
  };
}

function normalizeLaunchLibraryPayload(payload, options = {}) {
  const limit = Number.isInteger(options.limit) ? options.limit : 5;
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const launches = results
    .map(normalizeLaunch)
    .filter(Boolean)
    .sort((a, b) => new Date(a.dateUtc) - new Date(b.dateUtc))
    .slice(0, limit);

  return {
    launches,
    source: "The Space Devs launch data",
    scope: "SpaceX upcoming launches"
  };
}

function getLaunchLimit(request) {
  const rawLimit = request.query?.limit || new URL(request.url, `https://${request.headers?.host || "apollo.local"}`).searchParams.get("limit");

  if (rawLimit === null || rawLimit === undefined || rawLimit === "") {
    return 5;
  }

  const limit = Number(rawLimit);

  if (!Number.isFinite(limit)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 25);
}

async function requestLaunches(limit = 5) {
  const cacheKey = `launches:spacex:${limit}`;
  const cached = getCached(cache, cacheKey);

  if (cached) {
    return cached;
  }

  const url = new URL(LAUNCH_LIBRARY_URL);
  url.searchParams.set("search", "SpaceX");
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LAUNCH_TIMEOUT_MS);
  const response = await fetch(url, {
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(`Launch Library request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload || {
      error: {
        code: "LAUNCH_LIBRARY_REQUEST_FAILED",
        message: "Launch Library request failed."
      }
    };
    throw error;
  }

  const normalizedPayload = normalizeLaunchLibraryPayload(payload, {
    limit
  });
  setCached(cache, cacheKey, normalizedPayload, LAUNCH_CACHE_SECONDS);
  return normalizedPayload;
}

async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Use GET for this endpoint."
      }
    });
    return;
  }

  try {
    const payload = await requestLaunches(getLaunchLimit(request));
    sendJson(response, 200, payload, LAUNCH_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, error.status || 502, error.payload || {
      error: {
        code: "LAUNCH_PROXY_ERROR",
        message: "Could not load launch data."
      }
    });
  }
}

module.exports = handler;
module.exports.normalizeLaunchLibraryPayload = normalizeLaunchLibraryPayload;
module.exports.getLaunchLimit = getLaunchLimit;
