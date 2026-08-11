const { getCached, setCached } = require("./_cache");
const { fetchJson } = require("./_http");
const { sendJson, sendMethodNotAllowed } = require("./_response");

const ISS_POSITION_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const ISS_CACHE_SECONDS = 60;
const ISS_TIMEOUT_MS = 10000;
const cache = new Map();

async function requestIssPosition() {
  const cacheKey = "iss:position";
  const cached = getCached(cache, cacheKey);

  if (cached) {
    return cached;
  }

  const { response, payload } = await fetchJson(ISS_POSITION_URL, {
    timeoutMs: ISS_TIMEOUT_MS
  });

  if (!response.ok || !payload || typeof payload !== "object") {
    const error = new Error(`ISS position request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  setCached(cache, cacheKey, payload, ISS_CACHE_SECONDS);
  return payload;
}

async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    sendJson(response, 200, await requestIssPosition(), ISS_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, error.status || 502, {
      error: {
        code: "ISS_POSITION_PROXY_ERROR",
        message: "Could not load the current ISS position."
      }
    });
  }
}

module.exports = handler;
module.exports.requestIssPosition = requestIssPosition;
