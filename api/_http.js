async function fetchJson(url, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);

    return {
      response,
      payload
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  fetchJson
};
