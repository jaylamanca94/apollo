const { getCached, setCached } = require("./_cache");

const cache = new Map();
const NASA_BASE_URL = "https://api.nasa.gov";
const NASA_TIMEOUT_MS = 10000;

function sendJson(response, statusCode, payload, maxAgeSeconds = 0) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");

  if (maxAgeSeconds > 0 && statusCode >= 200 && statusCode < 300) {
    response.setHeader("Cache-Control", `s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`);
  } else {
    response.setHeader("Cache-Control", "no-store");
  }

  response.end(JSON.stringify(payload));
}

function scrubNasaApiKey(value) {
  if (Array.isArray(value)) {
    return value.map(scrubNasaApiKey);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubNasaApiKey(item)])
    );
  }

  if (typeof value === "string" && value.includes("api_key=")) {
    try {
      const url = new URL(value);
      url.searchParams.delete("api_key");
      return url.toString();
    } catch (error) {
      return value.replace(/([?&])api_key=[^&]+&?/g, "$1").replace(/[?&]$/, "");
    }
  }

  return value;
}

async function requestNasa(path, params, cacheKey, ttlSeconds) {
  const cached = getCached(cache, cacheKey);

  if (cached) {
    return cached;
  }

  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    const error = new Error("NASA_API_KEY is not configured");
    error.status = 500;
    error.payload = {
      error: {
        code: "NASA_API_KEY_MISSING",
        message: "NASA_API_KEY is not configured on the server."
      }
    };
    throw error;
  }

  const url = new URL(path, NASA_BASE_URL);
  Object.entries({
    ...params,
    api_key: apiKey
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NASA_TIMEOUT_MS);
  const response = await fetch(url, {
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(`NASA request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload || {
      error: {
        code: "NASA_REQUEST_FAILED",
        message: "NASA request failed."
      }
    };
    throw error;
  }

  const sanitizedPayload = scrubNasaApiKey(payload);

  setCached(cache, cacheKey, sanitizedPayload, ttlSeconds);
  return sanitizedPayload;
}

module.exports = {
  requestNasa,
  sendJson
};
