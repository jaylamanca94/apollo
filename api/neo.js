const { requestNasa, sendJson } = require("./_nasa");
const { isIsoDate, normalizeNeoPayload } = require("./_space_data");

const NEO_CACHE_SECONDS = 60 * 30;

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

  const date = request.query?.date;

  if (!isIsoDate(date)) {
    sendJson(response, 400, {
      error: {
        code: "INVALID_DATE",
        message: "Provide date as YYYY-MM-DD."
      }
    });
    return;
  }

  try {
    const nasaPayload = await requestNasa(
      "/neo/rest/v1/feed",
      {
        start_date: date,
        end_date: date
      },
      `neo:${date}`,
      NEO_CACHE_SECONDS
    );
    const payload = normalizeNeoPayload(nasaPayload, date);
    sendJson(response, 200, payload, NEO_CACHE_SECONDS);
  } catch (error) {
    sendJson(response, error.status || 500, error.payload || {
      error: {
        code: "NASA_PROXY_ERROR",
        message: "Could not load NASA asteroid data."
      }
    });
  }
};
