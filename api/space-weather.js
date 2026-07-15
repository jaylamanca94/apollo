const { getCached, setCached } = require("./_cache");
const { fetchJson } = require("./_http");
const { sendJson, sendMethodNotAllowed } = require("./_response");
const { normalizeSpaceWeatherPayload } = require("./_space_data");

const NOAA_K_INDEX_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";
const NOAA_K_INDEX_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const NOAA_ALERTS_URL = "https://services.swpc.noaa.gov/products/alerts.json";
const SPACE_WEATHER_CACHE_SECONDS = 60 * 5;
const SPACE_WEATHER_TIMEOUT_MS = 10000;
const cache = new Map();

async function fetchNoaaJson(url) {
  const { response, payload } = await fetchJson(url, {
    timeoutMs: SPACE_WEATHER_TIMEOUT_MS
  });

  if (!response.ok || !payload) {
    const error = new Error(`NOAA SWPC request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function requestSpaceWeather() {
  const cached = getCached(cache, "space-weather:current");

  if (cached) {
    return cached;
  }

  const [kIndex, alerts, kpForecast] = await Promise.all([
    fetchNoaaJson(NOAA_K_INDEX_URL),
    fetchNoaaJson(NOAA_ALERTS_URL),
    fetchNoaaJson(NOAA_K_INDEX_FORECAST_URL).catch(() => [])
  ]);
  const normalizedPayload = normalizeSpaceWeatherPayload({
    kIndex,
    kpForecast,
    alerts
  });

  setCached(cache, "space-weather:current", normalizedPayload, SPACE_WEATHER_CACHE_SECONDS);
  return normalizedPayload;
}

async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    const payload = await requestSpaceWeather();
    sendJson(response, 200, payload, SPACE_WEATHER_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, 502, {
      error: {
        code: "SPACE_WEATHER_PROXY_ERROR",
        message: "Could not load NOAA space weather data."
      }
    });
  }
}

module.exports = handler;
module.exports.requestSpaceWeather = requestSpaceWeather;
