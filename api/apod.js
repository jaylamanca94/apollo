const { getCached, setCached } = require("./_cache");
const { fetchJson } = require("./_http");
const cache = new Map();
const { sendJson, sendMethodNotAllowed } = require("./_response");
const { normalizeApodPayload } = require("./_space_data");

const APOD_CACHE_SECONDS = 60 * 60 * 6;
const APOD_TIME_ZONE = "America/New_York";

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getIsoDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

async function requestApodWithFallback(date = new Date()) {
  const targetDates = [
    getIsoDateInTimeZone(date, APOD_TIME_ZONE),
    getIsoDateInTimeZone(addDays(date, -1), APOD_TIME_ZONE)
  ].filter((value, index, values) => values.indexOf(value) === index);
  let lastError = null;
  for (const targetDate of targetDates) {
    const cached = getCached(cache, targetDate);
    if (cached) return cached;
    const compactDate = targetDate.replaceAll("-", "").slice(2);
    const { response, payload } = await fetchJson(`https://science.nasa.gov/wp-json/wp/v2/apod-basic/${compactDate}`, { timeoutMs: 10000 });
    if (!response.ok) {
      const error = new Error("NASA APOD request failed");
      error.status = response.status;
      error.payload = { error: { code: "NASA_REQUEST_FAILED", message: "NASA request failed." } };
      // Only a missing publication warrants yesterday's entry. Do not retry
      // rate limits, outages, or malformed HTTP 200s against another date.
      if (response.status !== 404) throw error;
      lastError = error;
      continue;
    }
    const normalized = normalizeApodPayload(payload, targetDate);
    setCached(cache, targetDate, normalized, APOD_CACHE_SECONDS);
    return normalized;
  }

  throw lastError;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    const payload = await requestApodWithFallback();
    sendJson(response, 200, payload, APOD_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, error.status || 500, error.payload || {
      error: {
        code: "NASA_PROXY_ERROR",
        message: "Could not load NASA APOD."
      }
    });
  }
};

module.exports.requestApodWithFallback = requestApodWithFallback;
