const { requestNasa } = require("./_nasa");
const { sendJson, sendMethodNotAllowed } = require("./_response");
const { isIsoDate, normalizeNeoPayload } = require("./_space_data");

const NEO_CACHE_SECONDS = 60 * 30;

function getQueryParam(request, name) {
  try {
    const host = request.headers?.host || "localhost";
    const url = new URL(request.url || "", `https://${host}`);
    return url.searchParams.get(name) || "";
  } catch (error) {
    return "";
  }
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  const date = getQueryParam(request, "date");

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
