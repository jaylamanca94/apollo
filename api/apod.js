const { requestNasa } = require("./_nasa");
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
  const candidates = [
    {
      cacheKey: "apod:default",
      params: {}
    },
    ...targetDates.map((targetDate) => ({
      cacheKey: `apod:${targetDate}`,
      params: { date: targetDate }
    }))
  ];
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await requestNasa(
        "/planetary/apod",
        candidate.params,
        candidate.cacheKey,
        APOD_CACHE_SECONDS
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    const payload = normalizeApodPayload(await requestApodWithFallback());
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
