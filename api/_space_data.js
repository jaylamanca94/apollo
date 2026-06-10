function getText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getApodSourceUrl(date) {
  if (!isIsoDate(date)) {
    return "https://apod.nasa.gov/apod/";
  }

  const [year, month, day] = date.split("-");
  return `https://apod.nasa.gov/apod/ap${year.slice(2)}${month}${day}.html`;
}

function normalizeApodPayload(payload) {
  const date = getText(payload?.date);

  return {
    apod: {
      title: getText(payload?.title, "Astronomy Picture of the Day"),
      date,
      explanation: getText(payload?.explanation, "No description available."),
      mediaType: getText(payload?.media_type),
      mediaUrl: safeHttpUrl(payload?.url),
      hdUrl: safeHttpUrl(payload?.hdurl),
      copyright: getText(payload?.copyright),
      sourceUrl: getApodSourceUrl(date)
    },
    source: "NASA APOD"
  };
}

function normalizeNeoObject(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const approach = Array.isArray(item.close_approach_data) ? item.close_approach_data[0] || {} : {};
  const minDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_min);
  const maxDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_max);

  return {
    id: getText(item.id || item.neo_reference_id),
    name: getText(item.name, "Unnamed object"),
    hazardous: Boolean(item.is_potentially_hazardous_asteroid),
    sentryObject: Boolean(item.is_sentry_object),
    closeApproach: getText(approach.close_approach_date_full || approach.close_approach_date),
    closestKilometers: getFiniteNumber(approach?.miss_distance?.kilometers),
    lunarDistance: getFiniteNumber(approach?.miss_distance?.lunar),
    velocityKph: getFiniteNumber(approach?.relative_velocity?.kilometers_per_hour),
    minDiameterMeters: minDiameterKilometers === null ? null : minDiameterKilometers * 1000,
    maxDiameterMeters: maxDiameterKilometers === null ? null : maxDiameterKilometers * 1000,
    sourceUrl: safeHttpUrl(item.nasa_jpl_url)
  };
}

function normalizeNeoPayload(payload, date) {
  const rawAsteroids = Array.isArray(payload?.near_earth_objects?.[date])
    ? payload.near_earth_objects[date]
    : [];
  const asteroids = rawAsteroids
    .map(normalizeNeoObject)
    .filter(Boolean);

  return {
    date,
    elementCount: asteroids.length,
    asteroids,
    source: "NASA NeoWs"
  };
}

module.exports = {
  isIsoDate,
  normalizeApodPayload,
  normalizeNeoPayload
};
