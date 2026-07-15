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

function sendMethodNotAllowed(response) {
  sendJson(response, 405, {
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Use GET for this endpoint."
    }
  });
}

module.exports = {
  sendJson,
  sendMethodNotAllowed
};
