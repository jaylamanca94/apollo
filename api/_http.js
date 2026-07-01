async function fetchJson(url, options = {}) {
  const { timeoutMs: requestedTimeoutMs, ...fetchOptions } = options;
  const timeoutMs = Number.isFinite(requestedTimeoutMs) ? requestedTimeoutMs : 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
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
