function getCached(cache, cacheKey) {
  const cached = cache.get(cacheKey);

  if (!cached || cached.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

function setCached(cache, cacheKey, payload, ttlSeconds) {
  cache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

module.exports = {
  getCached,
  setCached
};
