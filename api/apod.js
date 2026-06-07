const { requestNasa, sendJson } = require("./_nasa");

const APOD_CACHE_SECONDS = 60 * 60 * 6;

module.exports = async function handler(request, response) {
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
    const payload = await requestNasa(
      "/planetary/apod",
      {},
      "apod:today",
      APOD_CACHE_SECONDS
    );
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
