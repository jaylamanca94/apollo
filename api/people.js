const { getCached, setCached } = require("./_cache");
const { fetchJson } = require("./_http");
const { sendJson, sendMethodNotAllowed } = require("./_response");

const PEOPLE_IN_SPACE_URL = "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json";
const PEOPLE_CACHE_SECONDS = 60 * 5;
const PEOPLE_TIMEOUT_MS = 10000;
const cache = new Map();

async function requestPeopleInSpace() {
  const cacheKey = "people:current";
  const cached = getCached(cache, cacheKey);

  if (cached) {
    return cached;
  }

  const { response, payload } = await fetchJson(PEOPLE_IN_SPACE_URL, {
    timeoutMs: PEOPLE_TIMEOUT_MS
  });

  if (!response.ok || !payload || typeof payload !== "object") {
    const error = new Error(`People in Space request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  setCached(cache, cacheKey, payload, PEOPLE_CACHE_SECONDS);
  return payload;
}

async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    sendJson(response, 200, await requestPeopleInSpace(), PEOPLE_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, error.status || 502, {
      error: {
        code: "PEOPLE_IN_SPACE_PROXY_ERROR",
        message: "Could not load the current crew roster."
      }
    });
  }
}

module.exports = handler;
module.exports.requestPeopleInSpace = requestPeopleInSpace;
