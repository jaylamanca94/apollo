const { sendJson, sendMethodNotAllowed } = require("./_response");
const { version } = require("../package.json");

function buildHealthPayload(date = new Date(), env = process.env) {
  const nasaApiKeyConfigured = Boolean(env.NASA_API_KEY);
  const checks = {
    runtime: "ok",
    nasaApiKey: nasaApiKeyConfigured ? "configured" : "missing"
  };
  const status = nasaApiKeyConfigured ? "ok" : "degraded";

  return {
    service: "apollo",
    version,
    status,
    timestamp: date.toISOString(),
    checks
  };
}

async function handler(request, response) {
  if (request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  const payload = buildHealthPayload();
  sendJson(response, payload.status === "ok" ? 200 : 503, payload);
}

module.exports = handler;
module.exports.buildHealthPayload = buildHealthPayload;
