const { sendJson } = require("./_nasa");
const { normalizeSpaceWeatherPayload } = require("./_space_data");

const NOAA_K_INDEX_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";
const NOAA_K_INDEX_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const NOAA_ALERTS_URL = "https://services.swpc.noaa.gov/products/alerts.json";
const SPACE_WEATHER_CACHE_SECONDS = 60 * 5;
const SPACE_WEATHER_TIMEOUT_MS = 10000;
const cache = new Map();

function getCached(cacheKey) {
  const cached = cache.get(cacheKey);

  if (!cached || cached.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

function setCached(cacheKey, payload, ttlSeconds) {
  cache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function fetchNoaaJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SPACE_WEATHER_TIMEOUT_MS);
  const response = await fetch(url, {
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    const error = new Error(`NOAA SWPC request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function requestSpaceWeather() {
  const cached = getCached("space-weather:current");

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

  setCached("space-weather:current", normalizedPayload, SPACE_WEATHER_CACHE_SECONDS);
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
