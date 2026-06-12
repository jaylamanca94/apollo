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

function parseNoaaDate(value) {
  const text = getText(value);

  if (!text) {
    return "";
  }

  const withTimezone = text.includes("T") ? text : text.replace(" ", "T");
  const isoCandidate = /Z$/.test(withTimezone) ? withTimezone : `${withTimezone}Z`;
  const date = new Date(isoCandidate);

  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function getKpCondition(kpIndex) {
  if (!Number.isFinite(kpIndex)) {
    return {
      condition: "Unavailable",
      severity: "quiet",
      summary: "NOAA space weather observations are unavailable right now."
    };
  }

  if (kpIndex >= 5) {
    return {
      condition: kpIndex >= 7 ? "Storm conditions" : "Minor storm conditions",
      severity: "storm",
      summary: "Geomagnetic activity is elevated. High-latitude aurora and satellite drag conditions may be more active."
    };
  }

  if (kpIndex >= 4) {
    return {
      condition: "Active conditions",
      severity: "active",
      summary: "Geomagnetic activity is elevated but below storm level."
    };
  }

  return {
    condition: "Quiet conditions",
    severity: "quiet",
    summary: "Geomagnetic activity is quiet right now."
  };
}

function getNoaaScale(kpIndex) {
  if (!Number.isFinite(kpIndex) || kpIndex < 5) {
    return "";
  }

  if (kpIndex >= 9) {
    return "G5";
  }

  if (kpIndex >= 8) {
    return "G4";
  }

  if (kpIndex >= 7) {
    return "G3";
  }

  if (kpIndex >= 6) {
    return "G2";
  }

  return "G1";
}

function getAlertHeadline(message) {
  const lines = getText(message)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headline = lines.find((line) => /^(alert|warning|watch|summary):/i.test(line));

  if (headline) {
    return headline.replace(/\s+/g, " ");
  }

  return lines.find((line) => !/^space weather message code:/i.test(line) && !/^serial number:/i.test(line) && !/^issue time:/i.test(line)) || "";
}

function getAlertType(headline) {
  const text = getText(headline).toLowerCase();

  if (/^warning:/.test(text)) {
    return "Warning";
  }

  if (/^watch:/.test(text)) {
    return "Watch";
  }

  if (/^alert:/.test(text)) {
    return "Alert";
  }

  return "Notice";
}

function normalizeKpForecast(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const dailyForecast = new Map();

  items.forEach((item) => {
    const observedType = getText(item?.observed).toLowerCase();

    if (!["estimated", "predicted"].includes(observedType)) {
      return;
    }

    const observedAt = parseNoaaDate(item?.time_tag);
    const date = observedAt.slice(0, 10);
    const kpIndex = getFiniteNumber(item?.kp);

    if (!date || kpIndex === null) {
      return;
    }

    const existing = dailyForecast.get(date);

    if (!existing || kpIndex > existing.maxKp) {
      const condition = getKpCondition(kpIndex);

      dailyForecast.set(date, {
        date,
        maxKp: kpIndex,
        noaaScale: getText(item?.noaa_scale) || getNoaaScale(kpIndex),
        condition: condition.condition,
        severity: condition.severity
      });
    }
  });

  return [...dailyForecast.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
}

function normalizeSpaceWeatherPayload(payload) {
  const kIndexItems = Array.isArray(payload?.kIndex) ? payload.kIndex : [];
  const kpForecastItems = Array.isArray(payload?.kpForecast) ? payload.kpForecast : [];
  const alerts = Array.isArray(payload?.alerts) ? payload.alerts : [];
  const latestKp = kIndexItems
    .map((item) => ({
      observedAt: parseNoaaDate(item?.time_tag),
      kpIndex: getFiniteNumber(item?.estimated_kp ?? item?.kp_index),
      kpLabel: getText(item?.kp)
    }))
    .filter((item) => item.observedAt && item.kpIndex !== null)
    .sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt))[0] || {};
  const condition = getKpCondition(latestKp.kpIndex);
  const normalizedAlerts = alerts
    .map((alert) => {
      const headline = getAlertHeadline(alert?.message);

      return {
        productId: getText(alert?.product_id),
        issuedAt: parseNoaaDate(alert?.issue_datetime),
        headline,
        type: getAlertType(headline)
      };
    })
    .filter((alert) => alert.issuedAt && alert.headline)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    .slice(0, 5);

  return {
    spaceWeather: {
      observedAt: latestKp.observedAt || "",
      kpIndex: latestKp.kpIndex ?? null,
      kpLabel: latestKp.kpLabel || "",
      ...condition,
      forecast: normalizeKpForecast(kpForecastItems),
      alerts: normalizedAlerts,
      sourceUrl: "https://www.swpc.noaa.gov/products-and-data"
    },
    source: "NOAA SWPC"
  };
}

module.exports = {
  isIsoDate,
  normalizeApodPayload,
  normalizeNeoPayload,
  normalizeSpaceWeatherPayload
};
