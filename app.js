const API = {
  apod: "/api/apod",
  iss: "https://api.wheretheiss.at/v1/satellites/25544",
  people: "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json",
  launches: "/api/launches",
  neo: "/api/neo",
  spaceWeather: "/api/space-weather"
};

const SOURCE_FEEDS = [
  {
    id: "apod",
    label: "NASA APOD",
    description: "Image of the Day",
    icon: "fa-solid fa-image",
    sourceUrl: "https://apod.nasa.gov/apod/"
  },
  {
    id: "iss",
    label: "Where the ISS At",
    description: "ISS position",
    icon: "fa-solid fa-satellite",
    sourceUrl: "https://wheretheiss.at/"
  },
  {
    id: "people",
    label: "People in Space",
    description: "Crew roster",
    icon: "fa-solid fa-user-astronaut",
    sourceUrl: "https://github.com/corquaid/international-space-station-APIs"
  },
  {
    id: "launches",
    label: "The Space Devs",
    description: "SpaceX launches",
    icon: "fa-solid fa-rocket",
    sourceUrl: "https://thespacedevs.com/llapi"
  },
  {
    id: "neo",
    label: "NASA NeoWs",
    description: "Near-Earth objects",
    icon: "fa-solid fa-meteor",
    sourceUrl: "https://api.nasa.gov/"
  },
  {
    id: "spaceWeather",
    label: "NOAA SWPC",
    description: "Space weather",
    icon: "fa-solid fa-sun",
    sourceUrl: "https://www.swpc.noaa.gov/products-and-data"
  }
];

const SOURCE_STATUS_LABELS = {
  attention: "Attention",
  error: "Unavailable",
  ok: "Updated"
};

const NASA_RATE_LIMIT_MESSAGE = "NASA data is temporarily unavailable because NASA is limiting requests. Other dashboard sections are still live.";
const NEO_HAZARD_FLAG_CONTEXT = {
  label: "NASA potentially hazardous asteroid flag",
  summary: "NASA's flag reflects an orbit that can pass within about 7.48M km of Earth and an estimated size near 140 m or larger. It is not an impact prediction."
};
const NEO_SENTRY_CONTEXT = {
  label: "NASA Sentry monitoring",
  summary: "Sentry is NASA/JPL's automated monitoring system for possible future Earth impacts over the next 100 years."
};
const THEME_STORAGE_KEY = "apollo-theme";
const EARTH_RADIUS_KM = 6371;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const NASA_MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};
let issMap = null;

const els = {
  refreshButton: document.querySelector("#refreshButton"),
  refreshButtonMobile: document.querySelector("#refreshButtonMobile"),
  themeToggle: document.querySelector("#themeToggle"),
  dashboardUpdated: document.querySelector("#dashboardUpdated"),
  peopleBody: document.querySelector("#peopleBody"),
  issBody: document.querySelector("#issBody"),
  neoBody: document.querySelector("#neoBody"),
  spaceWeatherBody: document.querySelector("#spaceWeatherBody"),
  launchBody: document.querySelector("#launchBody"),
  apodBody: document.querySelector("#apodBody"),
  sourceStatusBody: document.querySelector("#sourceStatusBody"),
  dashboardStatus: document.querySelector("#dashboardStatus")
};

function formatUpdated(date = new Date()) {
  return `Last updated: ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatCheckedAt(date = new Date()) {
  return `Checked ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric"
  }).format(date);
}

function formatShortDate(value) {
  const date = new Date(`${value}T12:00:00Z`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short"
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
    year: "numeric"
  }).format(date);
}

function getNeoApproachDate(value) {
  const text = getText(value);
  const nasaDate = text.match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})$/);

  if (nasaDate) {
    const [, year, month, day, hour, minute] = nasaDate;
    const monthIndex = NASA_MONTH_INDEX[month.toLowerCase()];

    if (monthIndex !== undefined) {
      return new Date(Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute)));
    }
  }

  return new Date(text);
}

function formatNeoApproachTime(value) {
  const date = getNeoApproachDate(value);

  if (!Number.isFinite(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric"
  }).format(date);
}

function normalizeUnixTimestamp(value) {
  const timestamp = getFiniteNumber(value);

  if (timestamp === null) {
    return "";
  }

  const milliseconds = timestamp > 9999999999 ? timestamp : timestamp * 1000;
  const date = new Date(milliseconds);

  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function formatNumber(value, options = {}) {
  if (value === null || value === undefined || value === "") {
    return "Unavailable";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Unavailable";
  }

  const { maximumFractionDigits = 0, minimumFractionDigits = 0, suffix = "" } = options;
  return `${number.toLocaleString([], {
    maximumFractionDigits,
    minimumFractionDigits
  })}${suffix}`;
}

function todayIso(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function truncateText(value, maxLength = 360) {
  const text = String(value ?? "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${clipped}...`;
}

function formatCountdown(value) {
  const launchDate = new Date(value);

  if (!Number.isFinite(launchDate.getTime())) {
    return "Date unavailable";
  }

  const diffMs = launchDate.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const days = Math.floor(absMs / 86400000);
  const hours = Math.floor((absMs % 86400000) / 3600000);

  if (diffMs < 0) {
    return "Window has opened";
  }

  if (days > 0) {
    return `T-${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `T-${hours}h`;
  }

  const minutes = Math.floor((absMs % 3600000) / 60000);

  return minutes > 0 ? `T-${minutes}m` : "T-<1m";
}

function formatLaunchWindow(launch) {
  if (!launch.windowStart && !launch.windowEnd) {
    return "";
  }

  const start = launch.windowStart ? formatDateTime(launch.windowStart) : "";
  const end = launch.windowEnd ? formatDateTime(launch.windowEnd) : "";

  if (start && end && start !== end) {
    return `${start} to ${end}`;
  }

  return start || end;
}

function getLaunchWindowDurationMinutes(launch) {
  const apiDuration = getFiniteNumber(launch?.windowDurationMinutes);

  if (apiDuration !== null && apiDuration >= 0) {
    return apiDuration;
  }

  const start = new Date(launch?.windowStart);
  const end = new Date(launch?.windowEnd);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
    return null;
  }

  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function formatLaunchWindowSummary(launch) {
  const durationMinutes = getLaunchWindowDurationMinutes(launch);

  if (durationMinutes === null) {
    return launch?.windowStart || launch?.dateUtc ? "Target time only" : "Window unavailable";
  }

  if (durationMinutes === 0) {
    return "Instantaneous window";
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return `${parts.join(" ")} launch window`;
}

function formatDistanceKilometers(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()} km` : "Unavailable";
}

function formatLunarDistance(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return `${value.toLocaleString([], {
    maximumFractionDigits: 1,
    minimumFractionDigits: value < 10 ? 1 : 0
  })} lunar distances`;
}

function formatVelocityKph(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()} km/h` : "Unavailable";
}

function formatOrbitMinutes(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return `${Math.round(value).toLocaleString()} min`;
}

function formatFootprintKilometers(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return `${Math.round(value).toLocaleString()} km`;
}

function formatOrbitsPerDay(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return value.toLocaleString([], {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  });
}

function formatKpIndex(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return value.toLocaleString([], {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  });
}

function formatIssVisibility(value) {
  const visibility = getText(value).toLowerCase();

  if (visibility === "daylight") {
    return "Sunlit";
  }

  if (visibility === "eclipsed") {
    return "In Earth's shadow";
  }

  return "Unavailable";
}

function getNoaaScaleContext(scale, kpIndex) {
  const scaleDetails = {
    G1: {
      label: "G1 Minor",
      kpThreshold: 5,
      summary: "Minor storm level; aurora can reach high latitudes and small satellite-drag effects are possible."
    },
    G2: {
      label: "G2 Moderate",
      kpThreshold: 6,
      summary: "Moderate storm level; high-latitude aurora and satellite-drag effects become more likely."
    },
    G3: {
      label: "G3 Strong",
      kpThreshold: 7,
      summary: "Strong storm level; satellite navigation, HF radio, and low-Earth-orbit drag can be affected."
    },
    G4: {
      label: "G4 Severe",
      kpThreshold: 8,
      summary: "Severe storm level; navigation, HF radio, and satellite operations may see broader disruption."
    },
    G5: {
      label: "G5 Extreme",
      kpThreshold: 9,
      summary: "Extreme storm level; broad satellite, navigation, HF radio, and power-grid impacts are possible."
    }
  };
  const normalizedScale = getText(scale).toUpperCase();

  if (scaleDetails[normalizedScale]) {
    return {
      ...scaleDetails[normalizedScale],
      range: `NOAA ${normalizedScale} begins at Kp ${scaleDetails[normalizedScale].kpThreshold}`
    };
  }

  if (Number.isFinite(kpIndex) && kpIndex < 5) {
    return {
      label: "Below G1",
      range: "NOAA G-scale starts at Kp 5",
      summary: "Current geomagnetic activity is below NOAA storm level."
    };
  }

  return {
    label: "NOAA scale unavailable",
    range: "Scale not reported",
    summary: "NOAA storm-scale context is unavailable for this observation."
  };
}

function formatDiameterRange(minValue, maxValue) {
  const min = Number.isFinite(minValue) ? Math.round(minValue).toLocaleString() : "";
  const max = Number.isFinite(maxValue) ? Math.round(maxValue).toLocaleString() : "";

  if (min && max && min !== max) {
    return `${min} to ${max} m`;
  }

  if (max) {
    return `Up to ${max} m`;
  }

  if (min) {
    return `${min} m`;
  }

  return "Size unavailable";
}

function getApodSourceUrl(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "https://apod.nasa.gov/apod/";
  }

  const [year, month, day] = date.split("-");
  return `https://apod.nasa.gov/apod/ap${year.slice(2)}${month}${day}.html`;
}

function getStoredTheme() {
  let storedTheme = null;

  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    storedTheme = null;
  }

  return ["light", "dark"].includes(storedTheme) ? storedTheme : "dark";
}

function updateThemeToggle(theme) {
  if (!els.themeToggle) {
    return;
  }

  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = `Switch to ${nextTheme} mode`;
  const icon = els.themeToggle.querySelector("i");

  els.themeToggle.setAttribute("aria-label", label);
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
  els.themeToggle.title = label;

  if (icon) {
    icon.className = `fa-solid ${isDark ? "fa-sun" : "fa-moon"}`;
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  updateThemeToggle(theme);
}

function initThemeControl() {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme);

  if (!els.themeToggle) {
    return;
  }

  els.themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme") === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      // Theme still applies for the current page when storage is unavailable.
    }
    applyTheme(nextTheme);
  });
}

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

function createSourceStatus(id, state, detail) {
  const statusState = Object.prototype.hasOwnProperty.call(SOURCE_STATUS_LABELS, state) ? state : "error";

  return {
    id,
    state: statusState,
    detail: getText(detail, "No source status reported.")
  };
}

function normalizeApod(data) {
  const apod = data?.apod && typeof data.apod === "object" ? data.apod : data;
  const date = getText(apod?.date);

  return {
    title: getText(apod?.title, "Astronomy Picture of the Day"),
    date,
    explanation: getText(apod?.explanation, "No description available."),
    mediaType: getText(apod?.mediaType || apod?.media_type),
    mediaUrl: safeHttpUrl(apod?.mediaUrl || apod?.url),
    hdUrl: safeHttpUrl(apod?.hdUrl || apod?.hdurl),
    copyright: getText(apod?.copyright),
    sourceUrl: safeHttpUrl(apod?.sourceUrl) || getApodSourceUrl(date)
  };
}

function normalizeIss(data) {
  const latitude = getFiniteNumber(data?.latitude);
  const longitude = getFiniteNumber(data?.longitude);
  const altitude = getFiniteNumber(data?.altitude);
  const velocity = getFiniteNumber(data?.velocity);
  const orbitalCircumference = altitude !== null ? 2 * Math.PI * (EARTH_RADIUS_KM + altitude) : null;
  const orbitPeriodMinutes = orbitalCircumference !== null && velocity !== null && velocity > 0
    ? (orbitalCircumference / velocity) * MINUTES_PER_HOUR
    : null;
  const orbitsPerDay = orbitPeriodMinutes !== null && orbitPeriodMinutes > 0
    ? (HOURS_PER_DAY * MINUTES_PER_HOUR) / orbitPeriodMinutes
    : null;

  return {
    latitude,
    longitude,
    altitude,
    velocity,
    visibility: getText(data?.visibility),
    footprint: getFiniteNumber(data?.footprint),
    observedAt: normalizeUnixTimestamp(data?.timestamp),
    orbitPeriodMinutes,
    orbitsPerDay
  };
}

function normalizePeople(data) {
  const people = Array.isArray(data?.people) ? data.people : [];

  return people
    .map((person) => ({
      name: getText(person?.name),
      craft: getText(person?.craft)
    }))
    .filter((person) => person.name);
}

function summarizeCraftOccupancy(people) {
  const occupancy = people.reduce((groups, person) => {
    const craft = getText(person.craft, "Location unavailable");
    groups.set(craft, (groups.get(craft) || 0) + 1);
    return groups;
  }, new Map());

  return [...occupancy.entries()]
    .map(([craft, count]) => ({ craft, count }))
    .sort((a, b) => b.count - a.count || a.craft.localeCompare(b.craft));
}

function normalizeLaunches(data) {
  const launches = Array.isArray(data?.launches) ? data.launches : [];

  return launches
    .map((launch) => ({
      name: getText(launch?.name),
      dateUtc: getText(launch?.dateUtc),
      status: getText(launch?.status, "Upcoming"),
      details: getText(launch?.details, "No mission details available."),
      imageUrl: safeHttpUrl(launch?.imageUrl),
      vehicle: getText(launch?.vehicle),
      pad: getText(launch?.pad),
      location: getText(launch?.location),
      windowStart: getText(launch?.windowStart),
      windowEnd: getText(launch?.windowEnd),
      windowDurationMinutes: getFiniteNumber(launch?.windowDurationMinutes),
      provider: getText(launch?.provider, "SpaceX"),
      sourceUrl: safeHttpUrl(launch?.sourceUrl)
    }))
    .filter((launch) => launch.name && launch.dateUtc);
}

function splitLaunchName(name) {
  const parts = String(name ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    vehicle: parts[0] || "Launch",
    mission: parts.slice(1).join(" | ")
  };
}

function formatLaunchImageAlt(launch, launchName = splitLaunchName(launch?.name)) {
  const mission = launchName.mission || launch.name;
  return `Mission image for ${mission || launchName.vehicle}`;
}

function normalizeNeo(data, date) {
  const hazardFlagContext = {
    label: getText(data?.hazardFlagContext?.label, NEO_HAZARD_FLAG_CONTEXT.label),
    summary: getText(data?.hazardFlagContext?.summary, NEO_HAZARD_FLAG_CONTEXT.summary)
  };
  const sentryContext = {
    label: getText(data?.sentryContext?.label, NEO_SENTRY_CONTEXT.label),
    summary: getText(data?.sentryContext?.summary, NEO_SENTRY_CONTEXT.summary)
  };

  if (Array.isArray(data?.asteroids)) {
    return {
      asteroids: data.asteroids.map((item) => ({
        name: getText(item?.name, "Unnamed object"),
        hazardous: Boolean(item?.hazardous),
        sentryObject: Boolean(item?.sentryObject),
        closestKilometers: getFiniteNumber(item?.closestKilometers),
        lunarDistance: getFiniteNumber(item?.lunarDistance),
        velocityKph: getFiniteNumber(item?.velocityKph),
        closeApproach: getText(item?.closeApproach),
        minDiameterMeters: getFiniteNumber(item?.minDiameterMeters),
        maxDiameterMeters: getFiniteNumber(item?.maxDiameterMeters),
        sourceUrl: safeHttpUrl(item?.sourceUrl)
      })),
      hazardFlagContext,
      sentryContext
    };
  }

  const rawAsteroids = Array.isArray(data?.near_earth_objects?.[date])
    ? data.near_earth_objects[date]
    : [];

  return {
    asteroids: rawAsteroids.map((item) => {
      const approach = item?.close_approach_data?.[0] || {};
      const closestKilometers = getFiniteNumber(approach?.miss_distance?.kilometers);
      const lunarDistance = getFiniteNumber(approach?.miss_distance?.lunar);
      const velocityKph = getFiniteNumber(approach?.relative_velocity?.kilometers_per_hour);
      const minDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_min);
      const maxDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_max);

      return {
        name: getText(item?.name, "Unnamed object"),
        hazardous: Boolean(item?.is_potentially_hazardous_asteroid),
        sentryObject: Boolean(item?.is_sentry_object),
        closestKilometers,
        lunarDistance,
        velocityKph,
        closeApproach: getText(approach?.close_approach_date_full || approach?.close_approach_date),
        minDiameterMeters: minDiameterKilometers === null ? null : minDiameterKilometers * 1000,
        maxDiameterMeters: maxDiameterKilometers === null ? null : maxDiameterKilometers * 1000,
        sourceUrl: safeHttpUrl(item?.nasa_jpl_url)
      };
    }),
    hazardFlagContext,
    sentryContext
  };
}

function normalizeSpaceWeather(data) {
  const weather = data?.spaceWeather && typeof data.spaceWeather === "object" ? data.spaceWeather : data;
  const alerts = Array.isArray(weather?.alerts) ? weather.alerts : [];
  const forecast = Array.isArray(weather?.forecast) ? weather.forecast : [];

  return {
    observedAt: getText(weather?.observedAt),
    kpIndex: getFiniteNumber(weather?.kpIndex),
    kpLabel: getText(weather?.kpLabel),
    noaaScale: getText(weather?.noaaScale),
    condition: getText(weather?.condition, "Unavailable"),
    severity: getText(weather?.severity, "quiet"),
    summary: getText(weather?.summary, "Space weather data is unavailable right now."),
    sourceUrl: safeHttpUrl(weather?.sourceUrl) || "https://www.swpc.noaa.gov/products-and-data",
    forecast: forecast
      .map((item) => ({
        date: getText(item?.date),
        maxKp: getFiniteNumber(item?.maxKp),
        noaaScale: getText(item?.noaaScale),
        condition: getText(item?.condition, "Unavailable"),
        severity: getText(item?.severity, "quiet")
      }))
      .filter((item) => item.date && item.maxKp !== null),
    alerts: alerts
      .map((alert) => ({
        productId: getText(alert?.productId),
        issuedAt: getText(alert?.issuedAt),
        headline: getText(alert?.headline),
        type: getText(alert?.type, "Notice"),
        impactScale: alert?.impactScale && typeof alert.impactScale === "object"
          ? {
              scale: getText(alert.impactScale.scale),
              label: getText(alert.impactScale.label),
              summary: getText(alert.impactScale.summary)
            }
          : null
      }))
      .filter((alert) => alert.headline)
  };
}

function setBusy(element, isBusy) {
  if (element) {
    element.setAttribute("aria-busy", String(isBusy));
  }
}

function setDashboardStatus(message) {
  if (els.dashboardStatus) {
    els.dashboardStatus.textContent = message;
  }
}

function setError(container, message) {
  container.innerHTML = `
    <div class="alert alert-warning mb-0 py-3" role="alert">
      ${escapeHtml(message)}
    </div>
  `;
}

function stateMessage(message) {
  return `<p class="state-message text-secondary mb-0">${escapeHtml(message)}</p>`;
}

function resetIssMap() {
  if (issMap) {
    issMap.remove();
    issMap = null;
  }
}

function renderIssMap(data) {
  const mapElement = document.querySelector("#issMap");

  if (!mapElement) {
    return;
  }

  if (!window.L || data.latitude === null || data.longitude === null) {
    mapElement.innerHTML = stateMessage("ISS map is unavailable right now.");
    return;
  }

  const position = [data.latitude, data.longitude];
  const icon = window.L.divIcon({
    className: "iss-map-marker",
    html: `<i class="fa-solid fa-satellite" aria-hidden="true"></i>`,
    iconAnchor: [18, 18],
    iconSize: [36, 36]
  });

  issMap = window.L.map(mapElement, {
    attributionControl: true,
    scrollWheelZoom: false,
    worldCopyJump: true,
    zoomControl: false
  }).setView(position, 2);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 6,
    minZoom: 1
  }).addTo(issMap);

  window.L.control.zoom({
    position: "bottomright"
  }).addTo(issMap);

  const issAccentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--apollo-accent")
    .trim() || "#ff4056";

  window.L.circle(position, {
    color: issAccentColor,
    fillColor: issAccentColor,
    fillOpacity: 0.12,
    radius: 900000,
    weight: 1
  }).addTo(issMap);

  window.L.marker(position, {
    icon,
    keyboard: false,
    title: "Current ISS position"
  }).addTo(issMap);

  const map = issMap;
  window.setTimeout(() => {
    if (issMap === map) {
      map.invalidateSize();
    }
  }, 0);
}

function setDashboardUpdated(value = formatUpdated()) {
  if (els.dashboardUpdated) {
    els.dashboardUpdated.textContent = value;
  }
}

function renderSourceStatus(statuses, checkedAt = new Date()) {
  if (!els.sourceStatusBody) {
    return;
  }

  const statusById = new Map(
    statuses
      .filter(Boolean)
      .map((status) => [status.id, status])
  );
  const feedStatuses = SOURCE_FEEDS.map((feed) => ({
    ...feed,
    ...(statusById.get(feed.id) || createSourceStatus(feed.id, "error", "Source check did not finish."))
  }));
  const updatedCount = feedStatuses.filter((feed) => feed.state === "ok").length;
  const attentionCount = feedStatuses.filter((feed) => feed.state !== "ok").length;
  const summary = attentionCount === 0
    ? `${updatedCount} of ${feedStatuses.length} sources updated`
    : `${updatedCount} of ${feedStatuses.length} sources updated, ${attentionCount} need attention`;

  els.sourceStatusBody.innerHTML = `
    <div class="source-status-summary">
      <div>
        <p class="section-kicker mb-1">Source check</p>
        <p class="source-status-headline mb-0">${escapeHtml(summary)}</p>
      </div>
      <span class="source-status-time">${escapeHtml(formatCheckedAt(checkedAt))}</span>
    </div>
    <div class="source-status-list">
      ${feedStatuses.map((feed) => {
        const stateLabel = SOURCE_STATUS_LABELS[feed.state] || SOURCE_STATUS_LABELS.error;

        return `
          <article class="source-status-row source-status-${escapeHtml(feed.state)}">
            <span class="source-status-icon">
              <i class="${escapeHtml(feed.icon)}" aria-hidden="true"></i>
            </span>
            <div class="source-status-copy">
              <h3 class="source-status-title mb-0">${escapeHtml(feed.label)}</h3>
              <p class="source-status-source mb-0">${escapeHtml(feed.description)}</p>
              <p class="source-status-detail mb-0">${escapeHtml(feed.detail)}</p>
              <a class="source-status-link" href="${escapeHtml(feed.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(feed.label)} source">
                <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                Open source
              </a>
            </div>
            <span class="source-status-pill">${escapeHtml(stateLabel)}</span>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function getApiErrorMessage(error, fallback) {
  const errorCode = error.payload?.error?.code;

  if (error.status === 429 || errorCode === "OVER_RATE_LIMIT" || errorCode === "NASA_API_KEY_MISSING") {
    return NASA_RATE_LIMIT_MESSAGE;
  }

  return fallback;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return response.json();
}

async function loadApod() {
  try {
    const data = normalizeApod(await fetchJson(API.apod));
    const title = escapeHtml(data.title);
    const mediaUrl = escapeHtml(data.mediaUrl);
    const fullImageUrl = escapeHtml(data.hdUrl || data.mediaUrl);
    const sourceUrl = escapeHtml(data.sourceUrl);
    const summaryText = truncateText(data.explanation, 520);
    const explanation = escapeHtml(data.explanation);
    const summary = escapeHtml(summaryText);
    const hasLongExplanation = summaryText !== data.explanation;
    const media = data.mediaUrl && data.mediaType === "image"
      ? `
        <a class="apod-media-link" href="${fullImageUrl}" target="_blank" rel="noopener noreferrer">
          <img class="apod-media" src="${mediaUrl}" alt="${title}">
        </a>
      `
      : data.mediaUrl
        ? `<div class="ratio ratio-16x9 apod-embed"><iframe src="${mediaUrl}" title="${title}" allowfullscreen></iframe></div>`
        : `<div class="state-message">NASA media is unavailable right now.</div>`;

    els.apodBody.innerHTML = `
      <div class="apod-showcase">
        ${media}
        <div class="apollo-card apod-info-card">
          <div class="apod-info-header">
            <i class="fa-solid fa-image apod-info-icon" aria-hidden="true"></i>
            <h2 class="apod-info-title mb-0">NASA Image of the Day</h2>
          </div>
          <p class="apod-date">${data.date ? formatDate(data.date) : "Today"}</p>
          <h3 class="apod-title">${title}</h3>
          ${data.copyright ? `<p class="apod-credit">Credit: ${escapeHtml(data.copyright)}</p>` : ""}
          <p class="apod-summary">${summary}</p>
          ${hasLongExplanation ? `
            <details class="apod-details mt-3">
              <summary class="fw-semibold">Read full description</summary>
              <p class="mb-0 mt-2">${explanation}</p>
            </details>
          ` : ""}
          <div class="detail-action-row">
            ${data.mediaType === "image" && fullImageUrl ? `
              <a class="source-link" href="${fullImageUrl}" target="_blank" rel="noopener noreferrer">
                <i class="fa-regular fa-image" aria-hidden="true"></i>
                View image
              </a>
            ` : ""}
            <a class="source-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-earth-americas" aria-hidden="true"></i>
              NASA source
            </a>
          </div>
        </div>
      </div>
    `;
    return createSourceStatus("apod", "ok", data.date ? `Image for ${formatDate(data.date)}` : "Current image loaded.");
  } catch (error) {
    setError(els.apodBody, getApiErrorMessage(error, "NASA's astronomy picture is unavailable right now. This card will update when NASA responds."));
    return createSourceStatus("apod", "error", "NASA image did not load.");
  }
}

async function loadIss() {
  try {
    resetIssMap();
    const data = normalizeIss(await fetchJson(API.iss));
    const observedAtLabel = data.observedAt ? formatDateTime(data.observedAt) : "";
    const observedAtMarkup = observedAtLabel && observedAtLabel !== "Unavailable"
      ? `<p class="iss-position-fix mb-3">Position fix <time datetime="${escapeHtml(data.observedAt)}">${escapeHtml(observedAtLabel)}</time></p>`
      : "";

    els.issBody.innerHTML = `
      <div class="iss-map mb-3" id="issMap" role="img" aria-label="Map showing the current ISS position above Earth"></div>
      ${observedAtMarkup}
      <div class="metadata-grid">
        <div>
          <p class="text-secondary small mb-1">Current latitude</p>
          <p class="fw-semibold mb-0">${formatNumber(data.latitude, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Current longitude</p>
          <p class="fw-semibold mb-0">${formatNumber(data.longitude, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Altitude</p>
          <p class="fw-semibold mb-0">${formatNumber(data.altitude, { suffix: " km" })}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Velocity</p>
          <p class="fw-semibold mb-0">${formatNumber(data.velocity, { suffix: " km/h" })}</p>
        </div>
      </div>
      <div class="iss-orbit-context mt-3">
        <p class="section-kicker mb-2">Orbital context</p>
        <div class="orbit-context-grid">
          <div>
            <p class="text-secondary small mb-1">Estimated orbit time</p>
            <p class="fw-semibold mb-0">${formatOrbitMinutes(data.orbitPeriodMinutes)}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Estimated orbits per day</p>
            <p class="fw-semibold mb-0">${formatOrbitsPerDay(data.orbitsPerDay)}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Sunlight state</p>
            <p class="fw-semibold mb-0">${escapeHtml(formatIssVisibility(data.visibility))}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Signal footprint</p>
            <p class="fw-semibold mb-0">${formatFootprintKilometers(data.footprint)}</p>
          </div>
        </div>
        <p class="orbit-context-note mb-0">Orbit timing is calculated from the current altitude and velocity; sunlight and footprint come from the ISS position feed.</p>
      </div>
      <div class="detail-action-row iss-source-row">
        <a class="source-link" href="https://wheretheiss.at/" target="_blank" rel="noopener noreferrer">
          <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
          ISS position source
        </a>
      </div>
    `;
    renderIssMap(data);
    return createSourceStatus(
      "iss",
      data.latitude !== null && data.longitude !== null ? "ok" : "attention",
      data.latitude !== null && data.longitude !== null
        ? data.observedAt
          ? `Station coordinates loaded for ${formatDateTime(data.observedAt)}; ${formatIssVisibility(data.visibility).toLowerCase()}.`
          : "Current station coordinates loaded."
        : "Position response was missing coordinates."
    );
  } catch (error) {
    resetIssMap();
    setError(els.issBody, "Could not load the ISS location right now.");
    return createSourceStatus("iss", "error", "ISS position did not load.");
  }
}

async function loadPeople() {
  try {
    const people = normalizePeople(await fetchJson(API.people));

    if (!people.length) {
      els.peopleBody.innerHTML = stateMessage("No crew data available.");
      return createSourceStatus("people", "attention", "Crew roster returned no people.");
    }

    const craftGroups = summarizeCraftOccupancy(people);
    const crewLocationLabel = craftGroups.length === 1 ? "crew location" : "crew locations";

    els.peopleBody.innerHTML = `
      <div class="summary-metric mb-3">
        <span class="stat-chip"><i class="fa-solid fa-user-astronaut" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current crew</p>
          <p class="h3 fw-semibold mb-0">${people.length}</p>
        </div>
      </div>
      <div class="crew-location-summary mb-3" aria-label="Crew locations">
        <p class="text-secondary small mb-2">${craftGroups.length} ${crewLocationLabel}</p>
        <div class="crew-location-grid">
          ${craftGroups.map((group) => `
            <article class="crew-location">
              <p class="crew-location-count mb-1">${group.count}</p>
              <p class="crew-location-name mb-0">${escapeHtml(group.craft)}</p>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="crew-grid">
        ${people.map((person) => `
          <article class="crew-person">
            <h3 class="crew-name mb-0">${escapeHtml(person.name)}</h3>
            ${person.craft ? `<p class="crew-craft mb-0">${escapeHtml(person.craft)}</p>` : ""}
          </article>
        `).join("")}
      </div>
    `;
    return createSourceStatus("people", "ok", `${people.length} people across ${craftGroups.length} ${crewLocationLabel} listed.`);
  } catch (error) {
    setError(els.peopleBody, "Could not load people-in-space data right now.");
    return createSourceStatus("people", "error", "Crew roster did not load.");
  }
}

async function loadLaunches() {
  try {
    const launches = normalizeLaunches(await fetchJson(API.launches));

    if (!launches.length) {
      els.launchBody.innerHTML = stateMessage("No upcoming SpaceX launches are available from the current data source.");
      return createSourceStatus("launches", "attention", "Launch source returned no upcoming missions.");
    }

    const renderLaunchRows = () => {
      const visibleLaunches = launches.slice(0, 3);

      els.launchBody.innerHTML = `
        <p class="launch-count">${launches.length} upcoming SpaceX launches</p>
        <div class="launch-list">
          ${visibleLaunches.map((launch) => {
          const launchName = splitLaunchName(launch.name);
          const launchWindow = formatLaunchWindow(launch);
          const launchWindowSummary = formatLaunchWindowSummary(launch);
          const fullDetails = escapeHtml(launch.details);
          const detailRows = [
            ["Vehicle", launch.vehicle],
            ["Provider", launch.provider],
            ["Window length", launchWindowSummary],
            ["Pad", launch.pad],
            ["Location", launch.location],
            ["Launch window", launchWindow]
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => `
              <div>
                <dt>${label}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `)
            .join("");

          return `
            <article class="launch-card">
              ${launch.imageUrl ? `<img src="${escapeHtml(launch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(launch, launchName))}" class="launch-thumb">` : `<span class="stat-chip"><i class="fa-solid fa-rocket" aria-hidden="true"></i></span>`}
              <div class="launch-main">
                <p class="launch-meta">${formatDateTime(launch.dateUtc)} · ${formatCountdown(launch.dateUtc)}</p>
                <div class="launch-title-row">
                  <h3 class="launch-vehicle mb-0">${escapeHtml(launchName.vehicle)}</h3>
                  ${launchName.mission ? `<span class="launch-mission">${escapeHtml(launchName.mission)}</span>` : ""}
                </div>
                <p class="launch-window-summary mb-0">${escapeHtml(launchWindowSummary)}</p>
                <div class="launch-footer">
                  <details class="data-details launch-details">
                    <summary><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>Mission details</summary>
                    <div class="data-detail-panel">
                      <p class="mb-3">${fullDetails}</p>
                      ${detailRows ? `<dl class="detail-list mb-3">${detailRows}</dl>` : ""}
                      ${launch.sourceUrl ? `
                        <a class="source-link" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer">
                          <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                          Launch source
                        </a>
                      ` : ""}
                    </div>
                  </details>
                  <span class="launch-status-pill">${escapeHtml(launch.status)}</span>
                </div>
              </div>
            </article>
          `;
        }).join("")}
        </div>
        <a class="btn launch-show-all mt-4" href="./launches.html">View all launches</a>
      `;
    };

    renderLaunchRows();
    return createSourceStatus("launches", "ok", `${launches.length} upcoming SpaceX launches loaded; next window: ${formatLaunchWindowSummary(launches[0])}.`);
  } catch (error) {
    setError(els.launchBody, "Could not load upcoming SpaceX launches right now. Other dashboard sections remain available.");
    return createSourceStatus("launches", "error", "Launch data did not load.");
  }
}

async function loadNeo() {
  try {
    const date = todayIso();
    const neoSummary = normalizeNeo(await fetchJson(`${API.neo}?date=${date}`), date);
    const { asteroids, hazardFlagContext, sentryContext } = neoSummary;
    const sortedAsteroids = [...asteroids].sort((a, b) => {
      const left = Number.isFinite(a.closestKilometers) ? a.closestKilometers : Number.POSITIVE_INFINITY;
      const right = Number.isFinite(b.closestKilometers) ? b.closestKilometers : Number.POSITIVE_INFINITY;
      return left - right;
    });
    const hazardous = asteroids.filter((item) => item.hazardous).length;
    const sentryObjects = asteroids.filter((item) => item.sentryObject).length;
    const closestObject = sortedAsteroids.find((item) => Number.isFinite(item.closestKilometers));
    const closestApproachDate = closestObject?.closeApproach ? getNeoApproachDate(closestObject.closeApproach) : null;
    const closestApproachIso = Number.isFinite(closestApproachDate?.getTime()) ? closestApproachDate.toISOString() : "";
    const closestApproachLabel = closestObject?.closeApproach ? formatNeoApproachTime(closestObject.closeApproach) : "Time unavailable";
    const fastestVelocity = asteroids
      .map((item) => item.velocityKph)
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];
    const hazardSummary = hazardous === 0
      ? "No listed objects are flagged as potentially hazardous today."
      : `${hazardous} listed ${hazardous === 1 ? "object is" : "objects are"} flagged for NASA tracking. That flag reflects size and orbit, not an expected impact.`;
    const sentrySummary = sentryObjects === 0
      ? "None of today's listed objects are on NASA's Sentry monitoring list."
      : `${sentryObjects} listed ${sentryObjects === 1 ? "object is" : "objects are"} on NASA's Sentry monitoring list.`;
    const hazardNoteClass = hazardous === 0 ? "neo-risk-note-success" : "neo-risk-note-warning";
    const hazardIcon = hazardous === 0 ? "fa-circle-check" : "fa-circle-info";

    els.neoBody.innerHTML = `
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Asteroids listed today</p>
          <p class="fw-semibold mb-0">${asteroids.length}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Flagged as potentially hazardous</p>
          <p class="fw-semibold mb-0">${hazardous}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">On Sentry monitoring list</p>
          <p class="fw-semibold mb-0">${sentryObjects}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Closest approach</p>
          <p class="fw-semibold mb-0">${formatLunarDistance(closestObject?.lunarDistance)}</p>
          <p class="text-secondary small mb-0">${formatDistanceKilometers(closestObject?.closestKilometers)}</p>
          <p class="text-secondary small mb-0">
            ${closestApproachIso
              ? `<time datetime="${escapeHtml(closestApproachIso)}">${escapeHtml(closestApproachLabel)}</time>`
              : escapeHtml(closestApproachLabel)}
          </p>
          ${closestObject?.name ? `<p class="text-secondary small mb-0">${escapeHtml(closestObject.name)}</p>` : ""}
        </div>
        <div>
          <p class="text-secondary small mb-1">Fastest relative speed</p>
          <p class="fw-semibold mb-0">${formatVelocityKph(fastestVelocity)}</p>
        </div>
      </div>
      <div class="neo-risk-note ${hazardNoteClass} mb-3">
        <i class="fa-solid ${hazardIcon}" aria-hidden="true"></i>
        <div>
          <p class="mb-1">${escapeHtml(hazardSummary)}</p>
          <p class="neo-risk-context mb-0">${escapeHtml(hazardFlagContext.summary)}</p>
          <p class="neo-risk-context mb-0">${escapeHtml(sentrySummary)} ${escapeHtml(sentryContext.summary)}</p>
        </div>
      </div>
      ${asteroids.length ? `
        <ul class="list-group list-group-flush">
          ${sortedAsteroids.slice(0, 5).map((item) => `
            <li class="list-group-item px-0 py-3 asteroid-row">
              <div class="asteroid-main">
                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span class="fw-semibold">${escapeHtml(item.name)}</span>
                  ${item.hazardous ? `<span class="badge rounded-pill text-bg-warning">Potentially hazardous</span>` : ""}
                  ${item.sentryObject ? `<span class="badge rounded-pill text-bg-info">Sentry monitored</span>` : ""}
                </div>
                <p class="text-secondary small mb-0">${formatLunarDistance(item.lunarDistance)} · ${formatVelocityKph(item.velocityKph)}</p>
                <details class="data-details asteroid-details mt-2">
                  <summary><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>Approach details</summary>
                  <div class="data-detail-panel">
                    <dl class="detail-list mb-3">
                      <div>
                        <dt>Close approach</dt>
                        <dd>${escapeHtml(item.closeApproach || "Time unavailable")}</dd>
                      </div>
                      <div>
                        <dt>Miss distance</dt>
                        <dd>${formatDistanceKilometers(item.closestKilometers)}</dd>
                      </div>
                      <div>
                        <dt>Relative speed</dt>
                        <dd>${formatVelocityKph(item.velocityKph)}</dd>
                      </div>
                      <div>
                        <dt>Estimated diameter</dt>
                        <dd>${formatDiameterRange(item.minDiameterMeters, item.maxDiameterMeters)}</dd>
                      </div>
                      <div>
                        <dt>NASA tracking flag</dt>
                        <dd>${item.hazardous ? "Potentially hazardous asteroid" : "Not flagged as potentially hazardous"}</dd>
                      </div>
                      <div>
                        <dt>Sentry monitoring</dt>
                        <dd>${item.sentryObject ? "On NASA's Sentry monitoring list" : "Not on NASA's Sentry monitoring list"}</dd>
                      </div>
                    </dl>
                    ${item.sourceUrl ? `
                      <a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                        NASA object source
                      </a>
                    ` : ""}
                  </div>
                </details>
              </div>
              <span class="asteroid-size text-secondary text-sm-end">${formatDiameterRange(item.minDiameterMeters, item.maxDiameterMeters)}</span>
            </li>
          `).join("")}
        </ul>
      ` : stateMessage("No near-Earth objects are listed for today.")}
    `;
    return createSourceStatus("neo", "ok", `${asteroids.length} listed today, ${hazardous} flagged for tracking, ${sentryObjects} on Sentry monitoring.`);
  } catch (error) {
    setError(els.neoBody, getApiErrorMessage(error, "NASA asteroid data is unavailable right now. Other live sections remain available."));
    return createSourceStatus("neo", "error", "Asteroid summary did not load.");
  }
}

async function loadSpaceWeather() {
  try {
    const data = normalizeSpaceWeather(await fetchJson(API.spaceWeather));
    const severityClass = `space-weather-${data.severity}`;
    const recentAlerts = data.alerts.slice(0, 2);
    const forecastRows = data.forecast.slice(0, 3);
    const noaaScaleContext = getNoaaScaleContext(data.noaaScale, data.kpIndex);
    const observedAtLabel = data.observedAt ? formatDateTime(data.observedAt) : "";
    const observedAtMarkup = observedAtLabel && observedAtLabel !== "Unavailable"
      ? `<p class="space-weather-observed mb-0">Observed <time datetime="${escapeHtml(data.observedAt)}">${escapeHtml(observedAtLabel)}</time></p>`
      : "";

    els.spaceWeatherBody.innerHTML = `
      <div class="summary-metric mb-3">
        <span class="stat-chip ${severityClass}"><i class="fa-solid fa-sun" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current K-index</p>
          <p class="h3 fw-semibold mb-0">${formatKpIndex(data.kpIndex)}</p>
          ${observedAtMarkup}
        </div>
      </div>
      <div class="space-weather-status ${severityClass} mb-3">
        <div>
          <p class="section-kicker mb-1">${escapeHtml(data.condition)}</p>
          <p class="mb-0">${escapeHtml(data.summary)}</p>
        </div>
        ${data.kpLabel ? `<span class="space-weather-kp">${escapeHtml(data.kpLabel)}</span>` : ""}
      </div>
      <div class="space-weather-scale-context mb-3">
        <div>
          <p class="text-secondary small mb-1">NOAA geomagnetic scale</p>
          <p class="space-weather-scale-label mb-0">${escapeHtml(noaaScaleContext.label)}</p>
          <p class="space-weather-scale-range mb-0">${escapeHtml(noaaScaleContext.range)}</p>
        </div>
        <p class="space-weather-scale-summary mb-0">${escapeHtml(noaaScaleContext.summary)}</p>
      </div>
      ${forecastRows.length ? `
        <div class="space-weather-forecast mb-3">
          <p class="text-secondary small mb-2">3-day K-index outlook</p>
          <div class="space-weather-forecast-grid">
            ${forecastRows.map((item) => `
              <article class="space-weather-forecast-day space-weather-${escapeHtml(item.severity)}">
                <p class="space-weather-forecast-date mb-1">${formatShortDate(item.date)}</p>
                <p class="space-weather-forecast-kp mb-1">Kp ${formatKpIndex(item.maxKp)}</p>
                <p class="space-weather-forecast-condition mb-0">
                  ${escapeHtml(item.noaaScale || item.condition)}
                </p>
              </article>
            `).join("")}
          </div>
        </div>
      ` : ""}
      ${recentAlerts.length ? `
        <div class="space-weather-alerts mb-3">
          <p class="text-secondary small mb-2">Recent SWPC notices</p>
          <ul class="list-unstyled mb-0">
            ${recentAlerts.map((alert) => `
              <li>
                <div class="space-weather-alert-heading">
                  <span class="space-weather-alert-pill">${escapeHtml(alert.type)}</span>
                  <span>${escapeHtml(alert.headline)}</span>
                </div>
                ${alert.impactScale?.label ? `
                  <p class="space-weather-alert-impact mb-0">
                    <span>${escapeHtml(alert.impactScale.label)}</span>
                    ${alert.impactScale.summary ? `<span>${escapeHtml(alert.impactScale.summary)}</span>` : ""}
                  </p>
                ` : ""}
                ${alert.issuedAt ? `<time datetime="${escapeHtml(alert.issuedAt)}">${formatDateTime(alert.issuedAt)}</time>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      ` : stateMessage("No recent SWPC alerts are listed.")}
      <a class="source-link" href="${escapeHtml(data.sourceUrl)}" target="_blank" rel="noopener noreferrer">
        <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
        NOAA space weather source
      </a>
    `;
    return createSourceStatus(
      "spaceWeather",
      data.kpIndex === null ? "attention" : "ok",
      data.kpIndex === null
        ? "NOAA response loaded without a current K-index."
        : `Current K-index ${formatKpIndex(data.kpIndex)} loaded.`
    );
  } catch (error) {
    setError(els.spaceWeatherBody, "Could not load space weather right now.");
    return createSourceStatus("spaceWeather", "error", "NOAA space weather did not load.");
  }
}

async function loadDashboard() {
  setDashboardStatus("Refreshing Apollo dashboard data.");
  [
    els.apodBody,
    els.issBody,
    els.peopleBody,
    els.launchBody,
    els.neoBody,
    els.spaceWeatherBody,
    els.sourceStatusBody
  ].forEach((element) => setBusy(element, true));
  [els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
    button.disabled = true;
    button.innerHTML = "Refreshing";
  });
  const sourceResults = await Promise.allSettled([
    loadApod(),
    loadIss(),
    loadPeople(),
    loadLaunches(),
    loadNeo(),
    loadSpaceWeather()
  ]);
  renderSourceStatus(sourceResults.map((result, index) => (
    result.status === "fulfilled" && result.value
      ? result.value
      : createSourceStatus(SOURCE_FEEDS[index].id, "error", "Source check did not finish.")
  )), new Date());
  [
    els.apodBody,
    els.issBody,
    els.peopleBody,
    els.launchBody,
    els.neoBody,
    els.spaceWeatherBody,
    els.sourceStatusBody
  ].forEach((element) => setBusy(element, false));
  setDashboardStatus("Apollo dashboard data refreshed.");
  setDashboardUpdated();
  if (els.refreshButton) {
    els.refreshButton.disabled = false;
    els.refreshButton.innerHTML = "Refresh data";
  }
  if (els.refreshButtonMobile) {
    els.refreshButtonMobile.disabled = false;
    els.refreshButtonMobile.innerHTML = "Refresh data";
  }
}

[els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
  button.addEventListener("click", loadDashboard);
});
initThemeControl();
loadDashboard();
