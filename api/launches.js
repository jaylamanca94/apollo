const { getCached, setCached } = require("./_cache");
const { fetchJson } = require("./_http");
const { getText, safeHttpUrl } = require("./_normalize");
const { sendJson, sendMethodNotAllowed } = require("./_response");

const LAUNCH_LIBRARY_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/";
const LAUNCH_CACHE_SECONDS = 60 * 15;
const LAUNCH_TIMEOUT_MS = 10000;
const COMPLETED_LAUNCH_STATUS_PATTERN = /\b(success|successful|failure|failed|partial failure)\b/i;
const cache = new Map();

function invalidCrewedResponse() {
  const error = new Error("Incomplete crewed launch schedule");
  error.status = 502;
  error.payload = { error: { code: "CREWED_LAUNCH_RESPONSE_INVALID", message: "The crewed launch schedule is unavailable." } };
  return error;
}

// The provider's is_crewed filter describes the flight, not a human-rated
// vehicle or a mission-name guess. Include completed launches on launch day.
function normalizeCrewedLaunchPayload(payload, now = new Date()) {
  if (!Array.isArray(payload?.results) || !Number.isSafeInteger(payload.count) ||
      payload.count !== payload.results.length || payload.next) throw invalidCrewedResponse();
  const launches = payload.results.map(raw => {
    const launch = normalizeLaunch(raw);
    if (!launch || !getText(raw.id) || !Number.isInteger(raw.status?.id)) throw invalidCrewedResponse();
    const stages = Array.isArray(raw.rocket?.spacecraft_stage) ? raw.rocket.spacecraft_stage : [];
    const crew = stages.flatMap(stage => Array.isArray(stage.launch_crew) ? stage.launch_crew : [])
      .map(member => ({ name: getText(member.astronaut?.name), role: getText(member.role?.role) }))
      .filter(member => member.name);
    const watchUrls = (Array.isArray(raw.vid_urls) ? raw.vid_urls : []).map(item => safeHttpUrl(item.url)).filter(Boolean);
    const infoUrls = (Array.isArray(raw.info_urls) ? raw.info_urls : []).map(item => safeHttpUrl(item.url)).filter(Boolean);
    return { ...launch, id: raw.id, crewed: true, statusId: raw.status.id,
      missionName: getText(raw.mission?.name), provider: getText(raw.launch_service_provider?.name) || "Provider not supplied",
      datePrecision: getText(raw.net_precision?.name),
      destination: stages.map(stage => getText(stage.destination)).filter(Boolean).join(" · "),
      crew, watchUrl: watchUrls[0] || "", missionUrl: infoUrls[0] || launch.sourceUrl,
      imageUrl: safeHttpUrl(raw.image?.image_url || raw.image?.thumbnail_url),
      imageCredit: getText(raw.image?.credit), imageDescription: getText(raw.image?.name),
      imageLicenseUrl: safeHttpUrl(raw.image?.license?.link) };
  });
  if (new Set(launches.map(launch => launch.id)).size !== launches.length) throw invalidCrewedResponse();
  return { launches, source: "The Space Devs launch data", scope: "Crewed launches across providers",
    checkedAt: new Date(now).toISOString() };
}

async function requestCrewedLaunches(now = new Date()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const cacheKey = `launches:crewed:${day}`;
  const cached = getCached(cache, cacheKey);
  if (cached) return cached;
  const start = new Date(`${day}T00:00:00Z`);
  // Three UTC days cover today's date in every visitor timezone. Browser
  // selection then uses local calendar boundaries, never a rolling 24 hours.
  const url = new URL("https://ll.thespacedevs.com/2.3.0/launches/");
  url.searchParams.set("is_crewed", "true");
  url.searchParams.set("include_suborbital", "true");
  url.searchParams.set("net__gte", new Date(+start - 86400000).toISOString());
  url.searchParams.set("net__lt", new Date(+start + 2 * 86400000).toISOString());
  url.searchParams.set("mode", "detailed");
  url.searchParams.set("limit", "25");
  const { response, payload } = await fetchJson(url, { timeoutMs: LAUNCH_TIMEOUT_MS });
  if (!response.ok) throw invalidCrewedResponse();
  const normalized = normalizeCrewedLaunchPayload(payload, now);
  setCached(cache, cacheKey, normalized, LAUNCH_CACHE_SECONDS);
  return normalized;
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

function isPastCompletedLaunch(launch, now = new Date()) {
  const launchDate = new Date(launch?.dateUtc);
  const currentDate = new Date(now);

  if (!Number.isFinite(launchDate.getTime()) || !Number.isFinite(currentDate.getTime())) {
    return false;
  }

  return launchDate < currentDate && COMPLETED_LAUNCH_STATUS_PATTERN.test(getText(launch.status));
}

function normalizeLaunchLibraryPayload(payload, options = {}) {
  const limit = Number.isInteger(options.limit) ? options.limit : 5;
  const now = options.now || new Date();
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const launches = results
    .map(normalizeLaunch)
    .filter(Boolean)
    .filter((launch) => !isPastCompletedLaunch(launch, now))
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

  const { response, payload } = await fetchJson(url, {
    timeoutMs: LAUNCH_TIMEOUT_MS
  });

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
    sendMethodNotAllowed(response);
    return;
  }

  try {
    const scope = request.query?.scope || new URL(request.url, `https://${request.headers?.host || "apollo.local"}`).searchParams.get("scope");
    const payload = scope === "crewed" ? await requestCrewedLaunches() : await requestLaunches(getLaunchLimit(request));
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
module.exports.normalizeCrewedLaunchPayload = normalizeCrewedLaunchPayload;
