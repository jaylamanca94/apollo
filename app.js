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
    description: "Astronomy image",
    icon: "fa-solid fa-image",
    sourceUrl: "https://apod.nasa.gov/apod/"
  },
  {
    id: "iss",
    label: "Where the ISS At",
    description: "Station coordinates",
    icon: "fa-solid fa-satellite",
    sourceUrl: "https://wheretheiss.at/"
  },
  {
    id: "people",
    label: "People in Space",
    description: "Current crew",
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
    description: "Asteroid approaches",
    icon: "fa-solid fa-meteor",
    sourceUrl: "https://api.nasa.gov/"
  },
  {
    id: "spaceWeather",
    label: "NOAA SWPC",
    description: "K-index and alerts",
    icon: "fa-solid fa-sun",
    sourceUrl: "https://www.swpc.noaa.gov/products-and-data"
  }
];

const SOURCE_STATUS_LABELS = {
  attention: "Needs attention",
  error: "Unavailable",
  ok: "Loaded"
};

const NASA_RATE_LIMIT_MESSAGE = "NASA data is temporarily unavailable because NASA is limiting requests. Other dashboard sections are still live.";
const ERROR_PREFIX = "Houston, we have a problem.";
const NEO_HAZARD_FLAG_CONTEXT = {
  label: "NASA potentially hazardous asteroid flag",
  summary: "NASA's flag reflects an orbit that can pass within about 7.48M km of Earth and an estimated size near 140 m or larger. It is not an impact prediction."
};
const NEO_SENTRY_CONTEXT = {
  label: "NASA Sentry monitoring",
  summary: "Sentry is NASA/JPL's automated monitoring system for possible future Earth impacts over the next 100 years."
};
const THEME_STORAGE_KEY = "apollo-theme";
const THEME_COLORS = {
  dark: "#1F2427",
  light: "#E8EAED"
};
const EARTH_RADIUS_KM = 6371;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const REFRESH_BUTTON_HTML = `<i class="fa-solid fa-rotate-right acadia-icon" aria-hidden="true"></i><span>Refresh data</span>`;
const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner" aria-hidden="true"></span><span>Preparing launch</span>`;
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
const dashboardData = {
  apod: null,
  iss: null,
  people: null,
  launches: [],
  neo: null,
  spaceWeather: null
};

const els = {
  refreshButton: document.querySelector("#refreshButton"),
  refreshButtonMobile: document.querySelector("#refreshButtonMobile"),
  themeToggle: document.querySelector("#themeToggle"),
  dashboardUpdated: document.querySelector("#dashboardUpdated"),
  dashboardSubtitle: document.querySelector(".apollo-page-subtitle"),
  peopleBody: document.querySelector("#peopleBody"),
  quickStatsBody: document.querySelector("#quickStatsBody"),
  spaceBriefBody: document.querySelector("#spaceBriefBody"),
  recentActivityBody: document.querySelector("#recentActivityBody"),
  watchItemsBody: document.querySelector("#watchItemsBody"),
  issBody: document.querySelector("#issBody"),
  neoBody: document.querySelector("#neoBody"),
  neoRiskAlert: document.querySelector("#neoRiskAlert"),
  spaceWeatherBody: document.querySelector("#spaceWeatherBody"),
  skyAnomaliesBody: document.querySelector("#skyAnomaliesBody"),
  skyAnomalyDate: document.querySelector("#skyAnomalyDate"),
  skyAnomalyForm: document.querySelector("#skyAnomalyForm"),
  skyAnomalyLocation: document.querySelector("#skyAnomalyLocation"),
  skyAnomalyResults: document.querySelector("#skyAnomalyResults"),
  skyAnomalyTime: document.querySelector("#skyAnomalyTime"),
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

function getApodEmbedUrl(value) {
  const safeUrl = safeHttpUrl(value);

  if (!safeUrl) {
    return "";
  }

  const url = new URL(safeUrl);
  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
    const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);
    const videoId = embedMatch?.[1] || url.searchParams.get("v");

    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : "";
  }

  if (hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];

    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : "";
  }

  if (hostname === "player.vimeo.com" && /^\/video\/[^/?#]+/.test(url.pathname)) {
    return safeUrl;
  }

  if (hostname === "vimeo.com") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];

    return videoId ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}` : "";
  }

  return "";
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

function getLocalDateKey(date) {
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLaunchQuickDate(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (getLocalDateKey(date) === getLocalDateKey(today)) {
    return "Today";
  }

  if (getLocalDateKey(date) === getLocalDateKey(tomorrow)) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatDateInputValue(date = new Date()) {
  return getLocalDateKey(date);
}

function formatTimeInputValue(date = new Date()) {
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatRelativeHours(hours) {
  const absHours = Math.abs(hours);

  if (absHours < 1) {
    const minutes = Math.max(1, Math.round(absHours * 60));
    return `${minutes} min ${hours >= 0 ? "after" : "before"}`;
  }

  if (absHours < 48) {
    const rounded = Math.round(absHours);
    return `${rounded} ${rounded === 1 ? "hour" : "hours"} ${hours >= 0 ? "after" : "before"}`;
  }

  const days = Math.round(absHours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ${hours >= 0 ? "after" : "before"}`;
}

function formatRelativeTimestamp(value, fallback = "Live") {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return fallback;
  }

  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatActivityDate(value, fallback = "Today") {
  if (!value) {
    return fallback;
  }

  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);

  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  const todayKey = getLocalDateKey(new Date());

  if (getLocalDateKey(date) === todayKey) {
    return "Today";
  }

  return formatShortDate(value);
}

function getSkyObservationDate() {
  const dateValue = els.skyAnomalyDate?.value;
  const timeValue = els.skyAnomalyTime?.value;

  if (!dateValue || !timeValue) {
    return new Date();
  }

  const observedAt = new Date(`${dateValue}T${timeValue}`);
  return Number.isFinite(observedAt.getTime()) ? observedAt : new Date();
}

function getSkyAnomalyLocation() {
  return getText(els.skyAnomalyLocation?.value, "Selected location");
}

function getPageType() {
  return document.body?.dataset?.apolloPage || (document.querySelector("#quickStatsBody") ? "dashboard" : "detail");
}

function isDashboardPage() {
  return getPageType() === "dashboard";
}

function detailLink(href, label = "View details") {
  return `
    <a class="source-link dashboard-detail-link" href="${escapeHtml(href)}">
      <i class="fa-solid fa-arrow-right acadia-icon" aria-hidden="true"></i>
      ${escapeHtml(label)}
    </a>
  `;
}

function getNearestLaunchMatch(observedAt) {
  const launches = Array.isArray(dashboardData.launches) ? dashboardData.launches : [];

  return launches
    .map((launch) => {
      const launchDate = new Date(launch.dateUtc);

      if (!Number.isFinite(launchDate.getTime())) {
        return null;
      }

      return {
        launch,
        hoursFromObservation: (launchDate.getTime() - observedAt.getTime()) / 3600000
      };
    })
    .filter(Boolean)
    .sort((left, right) => Math.abs(left.hoursFromObservation) - Math.abs(right.hoursFromObservation))[0] || null;
}

function getSkyExplanationRows(observedAt) {
  const rows = [];
  const launchMatch = getNearestLaunchMatch(observedAt);
  const spaceWeather = dashboardData.spaceWeather;
  const neo = dashboardData.neo;
  const iss = dashboardData.iss;

  if (launchMatch) {
    const { launch, hoursFromObservation } = launchMatch;
    const absHours = Math.abs(hoursFromObservation);
    const launchName = splitLaunchName(launch.name);
    const launchLabel = launchName.mission ? `${launchName.vehicle}: ${launchName.mission}` : launchName.vehicle;
    const matchLevel = absHours <= 6 ? "strong" : absHours <= 48 ? "possible" : "context";

    rows.push({
      label: "Launch activity",
      state: matchLevel,
      headline: matchLevel === "strong" ? "Close launch timing match" : matchLevel === "possible" ? "Nearby launch context" : "No close launch timing match",
      detail: `${launchLabel} is ${formatRelativeHours(hoursFromObservation)} this sighting time.`,
      source: "The Space Devs launch feed"
    });
  } else {
    rows.push({
      label: "Launch activity",
      state: "unknown",
      headline: "Launch feed unavailable",
      detail: "Apollo could not compare this sighting against upcoming launch timing.",
      source: "The Space Devs launch feed"
    });
  }

  if (spaceWeather?.kpIndex !== null && spaceWeather?.kpIndex !== undefined) {
    const kpIndex = spaceWeather.kpIndex;
    const isStorm = kpIndex >= 5 || ["active", "storm"].includes(spaceWeather.severity);

    rows.push({
      label: "Space weather",
      state: isStorm ? "possible" : "weak",
      headline: isStorm ? "Aurora or geomagnetic activity possible" : "Quiet space-weather signal",
      detail: `${spaceWeather.condition}; current Kp ${formatKpIndex(kpIndex)}.`,
      source: "NOAA SWPC"
    });
  } else {
    rows.push({
      label: "Space weather",
      state: "unknown",
      headline: "Space-weather feed unavailable",
      detail: "Apollo could not compare this sighting against current NOAA geomagnetic context.",
      source: "NOAA SWPC"
    });
  }

  const hasIssPosition = Boolean(iss && iss.latitude !== null && iss.longitude !== null);

  rows.push({
    label: "ISS pass",
    state: hasIssPosition ? "context" : "unknown",
    headline: hasIssPosition ? "Current ISS position loaded" : "ISS pass check needs position data",
    detail: hasIssPosition
      ? "Apollo has the station's current position. Exact overhead pass matching needs the location-aware pass service planned for the next version."
      : "Apollo could not load ISS position context for this check.",
    source: "Where the ISS At"
  });

  rows.push({
    label: "Meteor or fireball",
    state: "unknown",
    headline: "Fireball reports not connected yet",
    detail: neo?.asteroids?.length
      ? `${neo.asteroids.length.toLocaleString()} near-Earth objects are listed today, but that feed is not a visual fireball report.`
      : "Apollo needs an American Meteor Society import before it can compare witness fireball reports.",
    source: "American Meteor Society planned"
  });

  rows.push({
    label: "Reported sightings",
    state: "unknown",
    headline: "UAP report feed not connected yet",
    detail: "Apollo will treat NUFORC-style reports as unverified reported observations with source, date, and verification status shown clearly.",
    source: "NUFORC import planned"
  });

  return rows;
}

function getSkyResultSummary(rows) {
  const strongMatches = rows.filter((row) => row.state === "strong").length;
  const possibleMatches = rows.filter((row) => row.state === "possible").length;

  if (strongMatches > 0) {
    return "Strong known-context match";
  }

  if (possibleMatches > 0) {
    return "Possible known-context match";
  }

  return "No strong known-space match";
}

function renderSkyAnomalyOverview() {
  if (!els.skyAnomalyResults) {
    return;
  }

  const contextRows = [
    {
      label: "ISS",
      value: dashboardData.iss && dashboardData.iss.latitude !== null && dashboardData.iss.longitude !== null ? "Position loaded" : "Unavailable"
    },
    {
      label: "Launches",
      value: dashboardData.launches.length ? `${dashboardData.launches.length} upcoming` : "Unavailable"
    },
    {
      label: "Space weather",
      value: dashboardData.spaceWeather?.condition || "Unavailable"
    },
    {
      label: "Asteroids",
      value: dashboardData.neo?.asteroids ? `${dashboardData.neo.asteroids.length} today` : "Unavailable"
    }
  ];

  els.skyAnomalyResults.dataset.mode = "overview";
  els.skyAnomalyResults.innerHTML = `
    <div class="sky-anomaly-result-header">
      <div>
        <p class="section-kicker mb-1">Known context</p>
        <h3 class="sky-anomaly-result-title mb-0">Ready for a sighting check</h3>
      </div>
      <span class="sky-explanation-pill sky-explanation-context">Beta</span>
    </div>
    <div class="sky-context-grid">
      ${contextRows.map((row) => `
        <article class="sky-context-cell">
          <p class="sky-context-label mb-1">${escapeHtml(row.label)}</p>
          <p class="sky-context-value mb-0">${escapeHtml(row.value)}</p>
        </article>
      `).join("")}
    </div>
    <p class="sky-anomaly-note mb-0">Apollo compares known sky activity first and does not infer origin.</p>
  `;
}

function renderSkyExplanation() {
  if (!els.skyAnomalyResults) {
    return;
  }

  const observedAt = getSkyObservationDate();
  const location = getSkyAnomalyLocation();
  const rows = getSkyExplanationRows(observedAt);
  const resultSummary = getSkyResultSummary(rows);

  els.skyAnomalyResults.dataset.mode = "submitted";
  els.skyAnomalyResults.innerHTML = `
    <div class="sky-anomaly-result-header">
      <div>
        <p class="section-kicker mb-1">${escapeHtml(location)}</p>
        <h3 class="sky-anomaly-result-title mb-0">${escapeHtml(resultSummary)}</h3>
        <p class="sky-anomaly-observed-at mb-0">${escapeHtml(formatDateTime(observedAt.toISOString()))}</p>
      </div>
      <span class="sky-explanation-pill sky-explanation-${escapeHtml(rows.some((row) => row.state === "strong") ? "strong" : rows.some((row) => row.state === "possible") ? "possible" : "context")}">Sourced check</span>
    </div>
    <div class="sky-explanation-list">
      ${rows.map((row) => `
        <article class="sky-explanation-row sky-explanation-${escapeHtml(row.state)}">
          <div class="sky-explanation-row-copy">
            <p class="sky-explanation-label mb-1">${escapeHtml(row.label)}</p>
            <h4 class="sky-explanation-headline mb-1">${escapeHtml(row.headline)}</h4>
            <p class="sky-explanation-detail mb-0">${escapeHtml(row.detail)}</p>
            <p class="sky-explanation-source mb-0">${escapeHtml(row.source)}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function initSkyAnomalyEngine() {
  const now = new Date();

  if (els.skyAnomalyDate && !els.skyAnomalyDate.value) {
    els.skyAnomalyDate.value = formatDateInputValue(now);
  }

  if (els.skyAnomalyTime && !els.skyAnomalyTime.value) {
    els.skyAnomalyTime.value = formatTimeInputValue(now);
  }

  els.skyAnomalyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSkyExplanation();
  });
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

function getSpaceWeatherBrief(data, forecastRows = []) {
  const current = getText(data?.condition, "Space weather");
  const currentSentence = data?.severity === "storm"
    ? `${current} are active right now.`
    : `Geomagnetic conditions are currently ${current.toLowerCase()}.`;
  const forecastMax = forecastRows
    .map((item) => item.maxKp)
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  let outlook = "NOAA's short-range forecast is unavailable.";

  if (Number.isFinite(forecastMax)) {
    if (forecastMax >= 5) {
      outlook = `NOAA's 3-day outlook reaches Kp ${formatKpIndex(forecastMax)}, which crosses the G1 geomagnetic storm threshold.`;
    } else if (forecastMax >= 4) {
      outlook = `Activity may increase to Kp ${formatKpIndex(forecastMax)} in the next 72 hours, but remains below NOAA storm thresholds.`;
    } else {
      outlook = `The next 72 hours remain below NOAA storm thresholds, peaking near Kp ${formatKpIndex(forecastMax)}.`;
    }
  }

  return `${currentSentence} ${outlook}`;
}

function getSpaceWeatherTrendLabel(forecastRows = []) {
  const values = forecastRows.map((item) => item.maxKp).filter(Number.isFinite);

  if (values.length < 2) {
    return "Trend unavailable";
  }

  const first = values[0];
  const peak = Math.max(...values);
  const last = values[values.length - 1];

  if (peak >= 5) {
    return `Storm threshold possible: Kp ${formatKpIndex(peak)}`;
  }

  if (peak - first >= 1) {
    return `Slight increase expected: Kp ${formatKpIndex(first)} to ${formatKpIndex(peak)}`;
  }

  if (first - last >= 1) {
    return `Easing trend: Kp ${formatKpIndex(first)} to ${formatKpIndex(last)}`;
  }

  return `Stable outlook: Kp ${formatKpIndex(first)} to ${formatKpIndex(peak)}`;
}

function getSpaceWeatherAlertInterpretation(alert) {
  const headline = getText(alert?.headline).toLowerCase();
  const type = getText(alert?.type, "Notice");

  if (alert?.impactScale?.summary) {
    return {
      title: alert.impactScale.label || `${type} context`,
      summary: alert.impactScale.summary
    };
  }

  if (headline.includes("electron")) {
    return {
      title: "Satellite environment watch",
      summary: "Elevated high-energy electron activity can affect the satellite environment; minimal impact is expected for most users."
    };
  }

  if (headline.includes("geomagnetic") || headline.includes("k-index")) {
    return {
      title: "Geomagnetic activity watch",
      summary: "NOAA is flagging changing geomagnetic conditions; monitor for aurora, HF radio, navigation, or satellite-drag effects if storm levels rise."
    };
  }

  if (headline.includes("radio blackout") || headline.includes("x-ray")) {
    return {
      title: "Radio conditions watch",
      summary: "Solar radio conditions may be changing; impacts are usually most relevant to HF radio and aviation communication paths."
    };
  }

  if (headline.includes("proton")) {
    return {
      title: "Radiation environment watch",
      summary: "NOAA is flagging energetic particle activity; impacts are mainly relevant to satellites, polar aviation, and space operations."
    };
  }

  return {
    title: `${type} context`,
    summary: "NOAA has issued a space-weather notice. Apollo has no additional impact signal from the alert text."
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

function formatApproxDiameterRange(minValue, maxValue) {
  const min = Number.isFinite(minValue) ? minValue : null;
  const max = Number.isFinite(maxValue) ? maxValue : null;

  if (min === null && max === null) {
    return "Diameter unavailable";
  }

  const useKilometers = (max ?? min) >= 1000 && (min ?? max) >= 500;
  const formatKilometers = (value) => (value / 1000).toLocaleString([], {
    maximumFractionDigits: value / 1000 >= 10 ? 0 : 1,
    minimumFractionDigits: 0
  });

  if (useKilometers) {
    if (min !== null && max !== null && Math.round(min) !== Math.round(max)) {
      return `Approx. ${formatKilometers(min)} to ${formatKilometers(max)} km diameter`;
    }

    return `Approx. ${formatKilometers(max ?? min)} km diameter`;
  }

  const formatDiameterValue = (value) => {
    if (value >= 1000) {
      const kilometers = value / 1000;
      return `${kilometers.toLocaleString([], {
        maximumFractionDigits: kilometers >= 10 ? 0 : 1,
        minimumFractionDigits: 0
      })} km`;
    }

    return `${Math.round(value).toLocaleString()} m`;
  };

  if (min !== null && max !== null && Math.round(min) !== Math.round(max)) {
    return `Approx. ${formatDiameterValue(min)} to ${formatDiameterValue(max)} diameter`;
  }

  return `Approx. ${formatDiameterValue(max ?? min)} diameter`;
}

function getNeoSizeLabel(item) {
  const maxDiameter = item?.maxDiameterMeters;

  if (!Number.isFinite(maxDiameter)) {
    return "Size unavailable";
  }

  if (maxDiameter >= 1000) {
    return "Large asteroid";
  }

  if (maxDiameter >= 140) {
    return "Medium asteroid";
  }

  if (maxDiameter >= 25) {
    return "Small asteroid";
  }

  return "Very small object";
}

function formatCompactLunarDistance(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return `${value.toLocaleString([], {
    maximumFractionDigits: 1,
    minimumFractionDigits: value < 10 ? 1 : 0
  })} LD`;
}

function getNeoPassLabel(lunarDistance) {
  if (!Number.isFinite(lunarDistance)) {
    return "Approach distance unavailable";
  }

  if (lunarDistance <= 1) {
    return "Close pass";
  }

  if (lunarDistance <= 10) {
    return "Nearby pass";
  }

  if (lunarDistance <= 50) {
    return "Moderate-distance pass";
  }

  return "Distant pass";
}

function getNeoPassSummary(lunarDistance) {
  if (!Number.isFinite(lunarDistance)) {
    return "approaches with unavailable distance data";
  }

  if (lunarDistance <= 1) {
    return "close passes inside one lunar distance";
  }

  if (lunarDistance <= 10) {
    return "nearby passes within ten lunar distances";
  }

  if (lunarDistance <= 50) {
    return "moderate-distance passes";
  }

  return "relatively distant passes";
}

function getNeoIndicatorText(item) {
  const indicators = [];

  if (item?.hazardous) {
    indicators.push("NASA potential-hazard flag");
  }

  if (item?.sentryObject) {
    indicators.push("Sentry monitoring");
  }

  return indicators.length ? indicators.join(" and ") : "No hazard indicators";
}

function getNeoRiskLevel({ hazardous, sentryObjects, closestObject }) {
  const closestLunarDistance = closestObject?.lunarDistance;

  if (sentryObjects > 0) {
    return {
      label: "Watch",
      tone: "attention",
      headline: "Sentry object listed"
    };
  }

  if (hazardous > 0) {
    return {
      label: "Elevated",
      tone: "attention",
      headline: "Potential-hazard flag present"
    };
  }

  if (Number.isFinite(closestLunarDistance) && closestLunarDistance <= 1) {
    return {
      label: "Notable",
      tone: "attention",
      headline: "Close pass today"
    };
  }

  return {
    label: "Minimal",
    tone: "clear",
    headline: "No hazard indicators today"
  };
}

function formatCountWord(value) {
  const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[value] || value.toLocaleString();
}

function capitalizeSentence(value) {
  const text = getText(value);
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
}

function getNeoBriefLines({ asteroids, hazardous, sentryObjects, closestObject }) {
  const objectCount = asteroids.length;
  const objectCountText = capitalizeSentence(formatCountWord(objectCount));
  const objectNoun = objectCount === 1 ? "object is" : "objects are";
  const hazardLine = hazardous === 0
    ? "No listed objects are considered potentially hazardous today."
    : `${capitalizeSentence(formatCountWord(hazardous))} listed ${hazardous === 1 ? "object is" : "objects are"} considered potentially hazardous today.`;
  const objectLine = objectCount === 0
    ? "No near-Earth objects are listed for today's feed."
    : `${objectCountText} near-Earth ${objectNoun} making ${getNeoPassSummary(closestObject?.lunarDistance)}.`;
  const closestLine = closestObject
    ? `The closest object will remain ${formatLunarDistance(closestObject.lunarDistance)} away.`
    : "Closest-approach distance is unavailable.";
  const sentryLine = sentryObjects === 0
    ? "No objects are currently on NASA's Sentry monitoring list."
    : `${capitalizeSentence(formatCountWord(sentryObjects))} ${sentryObjects === 1 ? "object is" : "objects are"} currently on NASA's Sentry monitoring list.`;

  return [hazardLine, objectLine, closestLine, sentryLine];
}

function renderNeoDetails(item) {
  return `
    <details class="data-details asteroid-details mt-3">
      <summary aria-label="Show approach details for ${escapeHtml(item.name)}"><i class="fa-solid fa-chevron-down acadia-icon" aria-hidden="true"></i>Approach details</summary>
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
          <a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open NASA object source for ${escapeHtml(item.name)}">
            <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
            NASA object source
          </a>
        ` : ""}
      </div>
    </details>
  `;
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

  if (["light", "dark"].includes(storedTheme)) {
    return storedTheme;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
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
    icon.className = `fa-solid ${isDark ? "fa-sun" : "fa-moon"} acadia-icon`;
  }
}

function updateThemeColorMeta(theme) {
  const themeColorMeta = document.querySelector("meta[name='theme-color']");

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.light);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  document.documentElement.setAttribute("data-acadia-theme", theme);
  updateThemeColorMeta(theme);
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
  const mediaUrl = safeHttpUrl(apod?.mediaUrl || apod?.url);

  return {
    title: getText(apod?.title, "Astronomy Picture of the Day"),
    date,
    explanation: getText(apod?.explanation, "No description available."),
    mediaType: getText(apod?.mediaType || apod?.media_type),
    mediaUrl,
    mediaEmbedUrl: safeHttpUrl(apod?.mediaEmbedUrl) || getApodEmbedUrl(mediaUrl),
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
      craft: getText(person?.spacecraft || person?.craft)
    }))
    .filter((person) => person.name);
}

function normalizeCrewRoster(data) {
  const sourceCount = getFiniteNumber(data?.number);
  const expeditionNumber = getFiniteNumber(data?.iss_expedition);
  const expeditionText = getText(data?.iss_expedition);

  return {
    people: normalizePeople(data),
    sourceCount: sourceCount !== null && sourceCount >= 0 ? Math.round(sourceCount) : null,
    expedition: expeditionNumber !== null ? String(Math.round(expeditionNumber)) : expeditionText
  };
}

function formatCrewSourceCount(value) {
  return value === null ? "Unavailable" : `${value.toLocaleString()} declared`;
}

function formatCrewExpedition(value) {
  const expedition = getText(value);
  return expedition ? `Expedition ${expedition}` : "Unavailable";
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

function groupCrewByCraft(people) {
  const grouped = people.reduce((groups, person) => {
    const craft = getText(person.craft, "Location unavailable");
    const members = groups.get(craft) || [];
    members.push(person);
    groups.set(craft, members);
    return groups;
  }, new Map());

  return [...grouped.entries()]
    .map(([craft, members]) => ({
      craft,
      count: members.length,
      members: members.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => b.count - a.count || a.craft.localeCompare(b.craft));
}

function formatReadableList(items) {
  const values = items.map((item) => getText(item)).filter(Boolean);

  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function getIssOrbitalBriefText(iss, peopleState) {
  const hasPosition = Boolean(iss && iss.latitude !== null && iss.longitude !== null);
  const region = hasPosition
    ? getIssRegion(iss.latitude, iss.longitude)
    : "its current orbital track";
  const altitude = iss?.altitude !== null ? formatNumber(iss.altitude, { suffix: " km" }) : "current altitude";
  const velocity = iss?.velocity !== null ? formatNumber(iss.velocity, { suffix: " km/h" }) : "orbital velocity";
  const crewText = peopleState?.count
    ? `${peopleState.count.toLocaleString()} ${peopleState.count === 1 ? "crew member" : "crew members"} aboard`
    : "the current crew manifest loading";
  const craftList = peopleState?.craftGroups?.length
    ? ` Crew are distributed across ${formatReadableList(peopleState.craftGroups.map((group) => group.craft))}.`
    : "";

  return `The International Space Station is operating normally with ${crewText}. The station is currently over ${region} at ${altitude} and traveling at ${velocity}.${craftList}`;
}

function updateIssOrbitalBrief() {
  const brief = document.querySelector("#issOrbitalBriefText");

  if (brief && dashboardData.iss) {
    brief.textContent = getIssOrbitalBriefText(dashboardData.iss, dashboardData.people);
  }
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

function resetQuickStats() {
  [
    ["iss", "Preflight", "Acquiring orbit", "loading"],
    ["people", "Preflight", "Checking crew manifest", "loading"],
    ["launches", "Preflight", "Opening launch window", "loading"],
    ["neo", "Preflight", "Scanning near-Earth space", "loading"],
    ["spaceWeather", "Preflight", "Reading solar weather", "loading"]
  ].forEach(([id, value, detail, state]) => {
    setQuickStat(id, { value, detail, state });
  });
}

function setQuickStat(id, options = {}) {
  const stat = els.quickStatsBody?.querySelector(`[data-quick-stat="${id}"]`);

  if (!stat) {
    return;
  }

  const { value = "Unavailable", detail = "", state = "ok" } = options;
  const safeState = ["ok", "attention", "error", "loading"].includes(state) ? state : "ok";
  stat.dataset.state = safeState;
  stat.querySelector(".apollo-quick-stat-value").textContent = value;
  stat.querySelector(".apollo-quick-stat-detail").textContent = detail;
}

function setDashboardStatus(message) {
  if (els.dashboardStatus) {
    els.dashboardStatus.textContent = message;
  }
}

function setError(container, message) {
  if (!container) {
    return;
  }

  container.innerHTML = stateMessage(formatErrorMessage(message), { role: "alert", tone: "warning" });
}

function formatErrorMessage(message) {
  const text = getText(message, "Telemetry did not come through.");

  return text.startsWith(ERROR_PREFIX) ? text : `${ERROR_PREFIX} ${text}`;
}

function stateMessage(message, options = {}) {
  const tone = options.tone === "warning" ? " state-message-warning" : "";
  const icon = options.tone === "warning" ? "fa-circle-exclamation" : "fa-circle-info";
  const role = options.role ? ` role="${escapeHtml(options.role)}"` : "";

  return `
    <div class="state-message acadia-alert${tone} mb-0"${role}>
      <i class="fa-solid ${icon} acadia-icon" aria-hidden="true"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function renderNeoRiskAlert({
  hazardous,
  hazardSummary,
  hazardFlagContext,
  sentrySummary,
  sentryContext
}) {
  if (!els.neoRiskAlert) {
    return;
  }

  const isClear = hazardous === 0;
  const tone = isClear ? "success" : "warning";
  const icon = isClear ? "fa-circle-check" : "fa-circle-info";
  const role = isClear ? "status" : "alert";

  els.neoRiskAlert.innerHTML = `
    <div class="neo-risk-alert acadia-alert acadia-alert-${tone}" role="${role}">
      <i class="fa-solid ${icon} acadia-icon" aria-hidden="true"></i>
      <div>
        <p class="mb-1"><strong>${escapeHtml(hazardSummary)}</strong></p>
        <p class="neo-risk-context mb-0">${escapeHtml(hazardFlagContext.summary)}</p>
        <p class="neo-risk-context mb-0">${escapeHtml(sentrySummary)} ${escapeHtml(sentryContext.summary)}</p>
      </div>
    </div>
  `;
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
    mapElement.innerHTML = stateMessage("Mission control is reacquiring the ISS map signal.");
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
    ? `${updatedCount} of ${feedStatuses.length} sources loaded`
    : `${updatedCount} of ${feedStatuses.length} sources loaded, ${attentionCount} need attention`;

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
              <i class="${escapeHtml(feed.icon)} acadia-icon" aria-hidden="true"></i>
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

function renderDashboardApodSummary(data) {
  if (!els.apodBody) {
    return;
  }

  const mediaUrl = escapeHtml(data.mediaUrl);
  const title = escapeHtml(data.title);

  els.apodBody.innerHTML = `
    <div class="dashboard-summary-card dashboard-summary-media-card">
      ${data.mediaUrl && data.mediaType === "image" ? `
        <img class="dashboard-summary-thumb" src="${mediaUrl}" alt="${title}">
      ` : `
        <span class="stat-chip"><i class="fa-solid fa-image acadia-icon" aria-hidden="true"></i></span>
      `}
      <div class="dashboard-summary-copy">
        <p class="section-kicker mb-1">NASA APOD</p>
        <h3 class="dashboard-summary-title mb-1">${title}</h3>
        <p class="dashboard-summary-detail mb-0">${data.date ? formatDate(data.date) : "Today"}</p>
      </div>
      ${detailLink("./gallery.html", "Open gallery")}
    </div>
  `;
}

function renderDashboardIssSummary(data) {
  if (!els.issBody) {
    return;
  }

  els.issBody.innerHTML = `
    <div class="dashboard-summary-card">
      <div class="summary-metric mb-3">
        <span class="stat-chip"><i class="fa-solid fa-satellite acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current ISS location</p>
          <p class="h3 fw-semibold mb-0">${formatNumber(data.latitude, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}, ${formatNumber(data.longitude, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Altitude</p>
          <p class="fw-semibold mb-0">${formatNumber(data.altitude, { suffix: " km" })}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Velocity</p>
          <p class="fw-semibold mb-0">${formatNumber(data.velocity, { suffix: " km/h" })}</p>
        </div>
      </div>
      ${detailLink("./iss.html", "Open ISS")}
    </div>
  `;
}

function renderDashboardPeopleSummary(roster, craftGroups, countMatches) {
  if (!els.peopleBody) {
    return;
  }

  els.peopleBody.innerHTML = `
    <div class="dashboard-summary-card">
      <div class="summary-metric mb-3">
        <span class="stat-chip"><i class="fa-solid fa-user-astronaut acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Crew in orbit</p>
          <p class="h3 fw-semibold mb-0">${roster.people.length.toLocaleString()} aboard</p>
        </div>
      </div>
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Crew locations</p>
          <p class="fw-semibold mb-0">${craftGroups.length.toLocaleString()}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Source status</p>
          <p class="fw-semibold mb-0">${countMatches ? "Matched" : "Check source"}</p>
        </div>
      </div>
      ${detailLink("./iss.html", "Open crew")}
    </div>
  `;
}

function renderDashboardLaunchSummary(launches) {
  if (!els.launchBody) {
    return;
  }

  const nextLaunch = launches[0];
  const launchName = splitLaunchName(nextLaunch.name);

  els.launchBody.innerHTML = `
    <div class="dashboard-summary-card">
      <p class="launch-count mb-3">${launches.length.toLocaleString()} upcoming launches</p>
      <div class="summary-metric mb-3">
        ${nextLaunch.imageUrl ? `<img src="${escapeHtml(nextLaunch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(nextLaunch, launchName))}" class="launch-thumb">` : `<span class="stat-chip"><i class="fa-solid fa-rocket acadia-icon" aria-hidden="true"></i></span>`}
        <div>
          <p class="text-secondary small mb-1">Next launch</p>
          <p class="h3 fw-semibold mb-0">${escapeHtml(launchName.vehicle)}</p>
          ${launchName.mission ? `<p class="dashboard-summary-detail mb-0">${escapeHtml(launchName.mission)}</p>` : ""}
        </div>
      </div>
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Countdown</p>
          <p class="fw-semibold mb-0">${formatCountdown(nextLaunch.dateUtc)}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Status</p>
          <p class="fw-semibold mb-0">${escapeHtml(nextLaunch.status)}</p>
        </div>
      </div>
      ${detailLink("./launches.html", "Open launches")}
    </div>
  `;
}

function renderDashboardNeoSummary(neoSummary) {
  if (!els.neoBody) {
    return;
  }

  const asteroids = neoSummary.asteroids;
  const hazardous = asteroids.filter((item) => item.hazardous).length;
  const closestObject = [...asteroids].sort((a, b) => {
    const left = Number.isFinite(a.closestKilometers) ? a.closestKilometers : Number.POSITIVE_INFINITY;
    const right = Number.isFinite(b.closestKilometers) ? b.closestKilometers : Number.POSITIVE_INFINITY;
    return left - right;
  })[0];

  els.neoBody.innerHTML = `
    <div class="dashboard-summary-card">
      <div class="summary-metric mb-3">
        <span class="stat-chip ${hazardous === 0 ? "space-weather-quiet" : "space-weather-active"}"><i class="fa-solid fa-meteor acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Near-Earth objects today</p>
          <p class="h3 fw-semibold mb-0">${asteroids.length.toLocaleString()}</p>
        </div>
      </div>
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Closest approach</p>
          <p class="fw-semibold mb-0">${formatLunarDistance(closestObject?.lunarDistance)}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Hazard status</p>
          <p class="fw-semibold mb-0">${hazardous === 0 ? "None flagged" : `${hazardous} flagged`}</p>
        </div>
      </div>
      ${detailLink("./asteroids.html", "Open asteroids")}
    </div>
  `;
}

function renderDashboardWeatherSummary(data) {
  if (!els.spaceWeatherBody) {
    return;
  }

  els.spaceWeatherBody.innerHTML = `
    <div class="dashboard-summary-card">
      <div class="summary-metric mb-3">
        <span class="stat-chip space-weather-${escapeHtml(data.severity)}"><i class="fa-solid fa-sun acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current K-index</p>
          <p class="h3 fw-semibold mb-0">${formatKpIndex(data.kpIndex)}</p>
        </div>
      </div>
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Severity</p>
          <p class="fw-semibold mb-0">${escapeHtml(data.condition)}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Trend</p>
          <p class="fw-semibold mb-0">${data.forecast[0]?.condition ? escapeHtml(data.forecast[0].condition) : "Outlook unavailable"}</p>
        </div>
      </div>
      ${detailLink("./weather.html", "Open weather")}
    </div>
  `;
}

function renderDashboardAnomalySummary() {
  if (!els.skyAnomaliesBody) {
    return;
  }

  els.skyAnomaliesBody.innerHTML = `
    <div class="dashboard-summary-card">
      <div class="summary-metric mb-3">
        <span class="stat-chip"><i class="fa-solid fa-magnifying-glass-location acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Sky Explanation Engine</p>
          <p class="h3 fw-semibold mb-0">What did I see?</p>
        </div>
      </div>
      <p class="dashboard-summary-detail mb-3">Compare a sighting against launches, ISS context, meteor/fireball gaps, space weather, and reported-sighting sources.</p>
      ${detailLink("./anomalies.html", "Open engine")}
    </div>
  `;
}

function getLaunchBrief(launches) {
  const launch = launches[0];

  if (!launch) {
    return "Launch activity is unavailable from the current source.";
  }

  const launchName = splitLaunchName(launch.name);
  const mission = launchName.mission ? ` ${launchName.mission}` : "";
  const status = getText(launch.status, "status pending");
  const countdown = formatCountdown(launch.dateUtc);
  const statusLower = status.toLowerCase();

  if (statusLower.includes("success")) {
    return `${launchName.vehicle}${mission} launched successfully.`;
  }

  if (countdown === "Window has opened") {
    return `${launchName.vehicle}${mission} is in its launch window now.`;
  }

  return `${launchName.vehicle}${mission} is next on the schedule, ${countdown.toLowerCase()}.`;
}

function getAsteroidBrief(neoSummary) {
  const asteroids = Array.isArray(neoSummary?.asteroids) ? neoSummary.asteroids : null;

  if (!asteroids) {
    return "Asteroid tracking is unavailable from NASA right now.";
  }

  const hazardous = asteroids.filter((item) => item.hazardous).length;

  if (hazardous > 0) {
    return `${hazardous.toLocaleString()} of ${asteroids.length.toLocaleString()} near-Earth ${asteroids.length === 1 ? "object is" : "objects are"} flagged for NASA tracking.`;
  }

  return "No hazardous asteroids are being tracked today.";
}

function getWeatherBrief(spaceWeather) {
  if (!spaceWeather) {
    return "Space weather is unavailable from NOAA right now.";
  }

  const kpDetail = spaceWeather.kpIndex === null || spaceWeather.kpIndex === undefined
    ? "with the current Kp unavailable"
    : `at Kp ${formatKpIndex(spaceWeather.kpIndex)}`;

  return `Space weather remains ${getText(spaceWeather.condition, "unavailable").toLowerCase()} ${kpDetail}.`;
}

function getOrbitalBrief(peopleState, iss) {
  if (!peopleState && (!iss || iss.latitude === null || iss.longitude === null)) {
    return "Orbital operations are partially unavailable from the current sources.";
  }

  if (!peopleState) {
    return "The ISS is reporting normal orbital position; crew status is unavailable.";
  }

  const crewWord = peopleState.count === 1 ? "person remains" : "people remain";
  const issStatus = iss && iss.latitude !== null && iss.longitude !== null
    ? "and the ISS is reporting normal position"
    : "while ISS position is unavailable";

  return `${peopleState.count.toLocaleString()} ${crewWord} in orbit, ${issStatus}.`;
}

function getIssRegion(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "current orbital track";
  }

  if (latitude > 66) {
    return "the Arctic region";
  }

  if (latitude < -60) {
    return "the Southern Ocean";
  }

  if (latitude >= -55 && latitude <= 25 && (longitude >= 120 || longitude <= -70)) {
    return latitude < 0 ? "the South Pacific" : "the Pacific";
  }

  if (latitude >= -45 && latitude <= 45 && longitude > -70 && longitude < 20) {
    return latitude < 5 ? "the South Atlantic" : "the Atlantic";
  }

  if (latitude >= -40 && latitude <= 35 && longitude >= 20 && longitude < 120) {
    return latitude < 0 ? "the southern Indian Ocean" : "the Indian Ocean";
  }

  if (latitude >= 5 && latitude <= 75 && longitude >= -170 && longitude < -50) {
    return "North America";
  }

  if (latitude >= -55 && latitude < 15 && longitude >= -85 && longitude < -35) {
    return "South America";
  }

  if (latitude >= 35 && latitude <= 75 && longitude >= -15 && longitude < 45) {
    return "Europe";
  }

  if (latitude >= -35 && latitude < 38 && longitude >= -20 && longitude < 55) {
    return "Africa";
  }

  if (latitude >= 5 && latitude <= 75 && longitude >= 45 && longitude < 150) {
    return "Asia";
  }

  if (latitude >= -45 && latitude < -5 && longitude >= 110 && longitude < 180) {
    return "Australia";
  }

  return "the current orbital track";
}

function getSpaceBriefState() {
  const feedStates = [
    dashboardData.iss,
    dashboardData.people,
    dashboardData.launches.length ? dashboardData.launches : null,
    dashboardData.neo,
    dashboardData.spaceWeather
  ];
  const unavailableCount = feedStates.filter((item) => !item).length;
  const hazardous = dashboardData.neo?.asteroids?.filter((item) => item.hazardous).length || 0;
  const weatherSeverity = dashboardData.spaceWeather?.severity || "unknown";
  const isStorm = ["active", "storm"].includes(weatherSeverity);

  if (hazardous > 0 || isStorm) {
    return {
      label: "Active",
      tone: "attention",
      headline: hazardous > 0
        ? "Space activity needs monitoring."
        : "Space activity is elevated."
    };
  }

  if (unavailableCount >= 2) {
    return {
      label: "Partial",
      tone: "error",
      headline: "Space activity is only partially visible."
    };
  }

  if (unavailableCount === 1) {
    return {
      label: "Mostly Calm",
      tone: "attention",
      headline: "Space activity is calm where sources are available."
    };
  }

  return {
    label: "Calm",
    tone: "ok",
    headline: "Space activity remains calm."
  };
}

function renderSpaceBrief() {
  if (!els.spaceBriefBody) {
    return;
  }

  const state = getSpaceBriefState();
  const summary = [
    getLaunchBrief(dashboardData.launches),
    getAsteroidBrief(dashboardData.neo),
    getWeatherBrief(dashboardData.spaceWeather),
    getOrbitalBrief(dashboardData.people, dashboardData.iss)
  ].join(" ");

  if (els.dashboardSubtitle && isDashboardPage()) {
    els.dashboardSubtitle.textContent = `Space Activity: ${state.label}`;
  }

  els.spaceBriefBody.innerHTML = `
    <div class="apollo-space-brief-header">
      <div>
        <p class="section-kicker mb-1">Space Brief</p>
        <h2 class="apollo-space-brief-title mb-0">${escapeHtml(state.headline)}</h2>
      </div>
    </div>
    <p class="apollo-space-brief-summary mb-0">${escapeHtml(summary)}</p>
  `;
}

function resetSpaceBrief() {
  if (!els.spaceBriefBody) {
    return;
  }

  if (els.dashboardSubtitle && isDashboardPage()) {
    els.dashboardSubtitle.textContent = "Space Activity: Preflight";
  }

  els.spaceBriefBody.innerHTML = stateMessage("Writing the mission brief...");
}

function commandPanelRow({ icon, label, title, detail, time, href }) {
  const content = `
    <span class="command-panel-icon"><i class="fa-solid ${escapeHtml(icon)} acadia-icon" aria-hidden="true"></i></span>
    <span class="command-panel-copy">
      <span class="command-panel-meta">
        <span class="command-panel-label">${escapeHtml(label)}</span>
        ${time ? `<span class="command-panel-time">${escapeHtml(time)}</span>` : ""}
      </span>
      <span class="command-panel-title">${escapeHtml(title)}</span>
      <span class="command-panel-detail">${escapeHtml(detail)}</span>
    </span>
  `;

  if (href) {
    return `<a class="command-panel-row command-panel-row-link" href="${escapeHtml(href)}">${content}</a>`;
  }

  return `<article class="command-panel-row">${content}</article>`;
}

function getRecentActivityRows() {
  const rows = [];
  const launch = dashboardData.launches[0];

  if (launch) {
    const launchName = splitLaunchName(launch.name);
    rows.push({
      icon: "fa-rocket",
      label: "Launches",
      title: getText(launch.status, "Launch status loaded"),
      detail: launchName.mission ? `${launchName.vehicle} ${launchName.mission}` : launchName.vehicle,
      time: formatCountdown(launch.dateUtc),
      href: "./launches.html"
    });
  }

  if (dashboardData.apod) {
    rows.push({
      icon: "fa-image",
      label: "Gallery",
      title: "New APOD published",
      detail: dashboardData.apod.title,
      time: formatActivityDate(dashboardData.apod.date),
      href: "./gallery.html"
    });
  }

  if (dashboardData.spaceWeather) {
    rows.push({
      icon: "fa-sun",
      label: "Weather",
      title: dashboardData.spaceWeather.condition,
      detail: dashboardData.spaceWeather.kpIndex === null ? "Current Kp unavailable" : `Current Kp ${formatKpIndex(dashboardData.spaceWeather.kpIndex)}`,
      time: formatRelativeTimestamp(dashboardData.spaceWeather.observedAt, "Live"),
      href: "./weather.html"
    });
  }

  if (dashboardData.iss?.latitude !== null && dashboardData.iss?.longitude !== null) {
    const region = getIssRegion(dashboardData.iss.latitude, dashboardData.iss.longitude);

    rows.push({
      icon: "fa-satellite",
      label: "ISS",
      title: `ISS over ${region}`,
      detail: dashboardData.iss.altitude !== null ? `${formatNumber(dashboardData.iss.altitude, { suffix: " km" })} altitude` : "Current station coordinates loaded",
      time: formatRelativeTimestamp(dashboardData.iss.observedAt, "Live track"),
      href: "./iss.html"
    });
  }

  return rows;
}

function getWatchItemRows() {
  const rows = [];
  const launch = dashboardData.launches[0];
  const asteroids = Array.isArray(dashboardData.neo?.asteroids) ? dashboardData.neo.asteroids : [];
  const hazardous = asteroids.filter((item) => item.hazardous).length;
  const closestObject = [...asteroids].sort((a, b) => {
    const left = Number.isFinite(a.closestKilometers) ? a.closestKilometers : Number.POSITIVE_INFINITY;
    const right = Number.isFinite(b.closestKilometers) ? b.closestKilometers : Number.POSITIVE_INFINITY;
    return left - right;
  })[0];
  const forecast = dashboardData.spaceWeather?.forecast?.[0];

  if (launch) {
    const launchName = splitLaunchName(launch.name);
    rows.push({
      icon: "fa-rocket",
      label: "Next launch",
      title: launchName.vehicle,
      detail: formatCountdown(launch.dateUtc),
      href: "./launches.html"
    });
  }

  rows.push({
    icon: "fa-meteor",
    label: "Closest asteroid",
    title: closestObject ? formatLunarDistance(closestObject.lunarDistance) : "Unavailable",
    detail: closestObject
      ? `${closestObject.name}${hazardous === 0 ? " · no hazards flagged" : ` · ${hazardous.toLocaleString()} flagged`}`
      : "No current close-approach list",
    href: "./asteroids.html"
  });

  if (dashboardData.spaceWeather) {
    rows.push({
      icon: "fa-sun",
      label: "Kp forecast",
      title: forecast?.maxKp !== null && forecast?.maxKp !== undefined ? `${formatKpIndex(forecast.maxKp)} ${forecast.date ? formatActivityDate(forecast.date, "") : ""}`.trim() : "Unavailable",
      detail: forecast?.condition ? forecast.condition : "NOAA outlook unavailable",
      href: "./weather.html"
    });
  }

  if (dashboardData.people) {
    rows.push({
      icon: "fa-user-astronaut",
      label: "Orbital presence",
      title: `${dashboardData.people.count.toLocaleString()} aboard`,
      detail: `${dashboardData.people.locationCount.toLocaleString()} crew locations`,
      href: "./iss.html"
    });
  }

  return rows;
}

function renderCommandPanels() {
  if (els.recentActivityBody) {
    const rows = getRecentActivityRows();
    els.recentActivityBody.innerHTML = rows.length
      ? `<div class="command-panel-list">${rows.slice(0, 4).map(commandPanelRow).join("")}</div>`
      : stateMessage("Mission control is waiting for activity telemetry.");
  }

  if (els.watchItemsBody) {
    const rows = getWatchItemRows();
    els.watchItemsBody.innerHTML = rows.length
      ? `<div class="command-panel-list">${rows.slice(0, 4).map(commandPanelRow).join("")}</div>`
      : stateMessage("Watch items are still coming over the downlink.");
  }
}

function resetCommandPanels() {
  if (els.recentActivityBody) {
    els.recentActivityBody.innerHTML = stateMessage("Checking the mission log...");
  }

  if (els.watchItemsBody) {
    els.watchItemsBody.innerHTML = stateMessage("Scanning the watchlist...");
  }
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
    dashboardData.apod = data;
    const title = escapeHtml(data.title);
    const mediaUrl = escapeHtml(data.mediaUrl);
    const mediaEmbedUrl = escapeHtml(data.mediaEmbedUrl);
    const fullImageUrl = escapeHtml(data.hdUrl || data.mediaUrl);
    const sourceUrl = escapeHtml(data.sourceUrl);
    const summaryText = truncateText(data.explanation, 520);
    const explanation = escapeHtml(data.explanation);
    const summary = escapeHtml(summaryText);
    const hasLongExplanation = summaryText !== data.explanation;
    let media = `
      <div class="state-message apod-media-fallback">
        <i class="fa-solid fa-circle-info acadia-icon" aria-hidden="true"></i>
        <span>NASA media is unavailable right now.</span>
      </div>
    `;

    if (data.mediaUrl && data.mediaType === "image") {
      media = `
        <a class="apod-media-link" href="${fullImageUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size APOD image: ${title}">
          <img class="apod-media" src="${mediaUrl}" alt="${title}">
        </a>
      `;
    } else if (data.mediaType === "video" && data.mediaEmbedUrl) {
      media = `<div class="ratio ratio-16x9 apod-embed"><iframe src="${mediaEmbedUrl}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    } else if (data.mediaType === "video" && data.mediaUrl) {
      media = `
        <div class="state-message apod-media-fallback">
          <i class="fa-solid fa-circle-info acadia-icon" aria-hidden="true"></i>
          <span>NASA video preview is unavailable here. Use the video link for the source media.</span>
        </div>
      `;
    } else if (data.mediaUrl) {
      media = `
        <div class="state-message apod-media-fallback">
          <i class="fa-solid fa-circle-info acadia-icon" aria-hidden="true"></i>
          <span>NASA media preview is unavailable here. Open the media link or NASA source for the original.</span>
        </div>
      `;
    }

    if (isDashboardPage()) {
      renderDashboardApodSummary(data);
      const mediaLabel = data.mediaType === "video" ? "Video" : data.mediaType === "image" ? "Image" : "Media";
      return createSourceStatus("apod", "ok", data.date ? `${mediaLabel} for ${formatDate(data.date)}` : `Current ${mediaLabel.toLowerCase()} loaded.`);
    }

    els.apodBody.innerHTML = `
      <div class="apollo-card acadia-surface apod-showcase">
        ${media}
        <aside class="apod-info-card" aria-label="NASA astronomy picture context">
          <div class="apod-info-header">
            <i class="fa-solid fa-image acadia-icon apod-info-icon" aria-hidden="true"></i>
            <div>
              <p class="section-kicker apod-kicker mb-0">NASA APOD</p>
              <h2 class="apod-info-title mb-0">Astronomy Picture of the Day</h2>
            </div>
          </div>
          <p class="apod-date acadia-badge">${data.date ? formatDate(data.date) : "Today"}</p>
          <h3 class="apod-title">${title}</h3>
          ${data.copyright ? `<p class="apod-credit">Credit: ${escapeHtml(data.copyright)}</p>` : ""}
          <p class="apod-summary">${summary}</p>
          ${hasLongExplanation ? `
            <details class="apod-details mt-3">
              <summary aria-label="Read full description for ${title}">Read full description</summary>
              <p class="mb-0 mt-2">${explanation}</p>
            </details>
          ` : ""}
          <div class="detail-action-row apod-action-row">
            ${data.mediaType === "image" && fullImageUrl ? `
              <a class="source-link" href="${fullImageUrl}" target="_blank" rel="noopener noreferrer">
                <i class="fa-regular fa-image" aria-hidden="true"></i>
                View image
              </a>
            ` : ""}
            ${data.mediaType === "video" && mediaUrl ? `
              <a class="source-link" href="${mediaUrl}" target="_blank" rel="noopener noreferrer">
                <i class="fa-regular fa-circle-play" aria-hidden="true"></i>
                View video
              </a>
            ` : ""}
            ${data.mediaType !== "image" && data.mediaType !== "video" && mediaUrl ? `
              <a class="source-link" href="${mediaUrl}" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
                Open media
              </a>
            ` : ""}
            <a class="source-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-earth-americas acadia-icon" aria-hidden="true"></i>
              NASA source
            </a>
          </div>
        </aside>
      </div>
    `;
    const mediaLabel = data.mediaType === "video" ? "Video" : data.mediaType === "image" ? "Image" : "Media";
    return createSourceStatus("apod", "ok", data.date ? `${mediaLabel} for ${formatDate(data.date)}` : `Current ${mediaLabel.toLowerCase()} loaded.`);
  } catch (error) {
    dashboardData.apod = null;
    setError(els.apodBody, getApiErrorMessage(error, "NASA's astronomy picture is unavailable right now. This card will update when NASA responds."));
    return createSourceStatus("apod", "error", "NASA image signal did not come through.");
  }
}

async function loadIss() {
  try {
    resetIssMap();
    const data = normalizeIss(await fetchJson(API.iss));
    dashboardData.iss = data;
    const issRegion = getIssRegion(data.latitude, data.longitude);
    const observedAtLabel = data.observedAt ? formatDateTime(data.observedAt) : "";
    const observedAtMarkup = observedAtLabel && observedAtLabel !== "Unavailable"
      ? `<p class="iss-position-fix mb-3">Position fix <time datetime="${escapeHtml(data.observedAt)}">${escapeHtml(observedAtLabel)}</time></p>`
      : "";

    if (isDashboardPage()) {
      renderDashboardIssSummary(data);
      setQuickStat("iss", {
        value: data.latitude !== null && data.longitude !== null ? "In orbit" : "Position unknown",
        detail: data.altitude !== null ? `${formatNumber(data.altitude, { suffix: " km" })} altitude` : formatIssVisibility(data.visibility),
        state: data.latitude !== null && data.longitude !== null ? "ok" : "attention"
      });
      return createSourceStatus(
        "iss",
        data.latitude !== null && data.longitude !== null ? "ok" : "attention",
        data.latitude !== null && data.longitude !== null
          ? data.observedAt
            ? `Station coordinates loaded for ${formatDateTime(data.observedAt)}; ${formatIssVisibility(data.visibility).toLowerCase()}.`
            : "Current station coordinates loaded."
          : "Position response was missing coordinates."
      );
    }

    if (!els.issBody) {
      return createSourceStatus(
        "iss",
        data.latitude !== null && data.longitude !== null ? "ok" : "attention",
        data.latitude !== null && data.longitude !== null
          ? "Current station coordinates loaded for context."
          : "Position response was missing coordinates."
      );
    }

    els.issBody.innerHTML = `
      <div class="iss-status-summary">
        <div class="iss-status-headline">
          <p class="section-kicker mb-1">ISS Status</p>
          <h2 class="iss-status-title mb-0">Normal Operations</h2>
          <p class="iss-orbital-brief mb-0" id="issOrbitalBriefText">${escapeHtml(getIssOrbitalBriefText(data, dashboardData.people))}</p>
        </div>
        <p class="iss-status-line mb-0">
          <span>${formatNumber(data.altitude, { suffix: " km" })} altitude</span>
          <span>${formatNumber(data.velocity, { suffix: " km/h" })}</span>
          <span>${escapeHtml(formatIssVisibility(data.visibility))}</span>
          <span>Over ${escapeHtml(issRegion)}</span>
        </p>
      </div>
      <div class="iss-map" id="issMap" role="region" aria-label="Interactive map showing the current ISS position above Earth"></div>
      ${observedAtMarkup}
      <div class="iss-current-position">
        <div class="iss-position-copy">
          <p class="section-kicker mb-1">Current Position</p>
          <h3 class="iss-position-title mb-0">${escapeHtml(issRegion)}</h3>
          <p class="iss-position-summary mb-0">The station is moving at orbital speed while ${escapeHtml(formatIssVisibility(data.visibility).toLowerCase())}.</p>
        </div>
        <div class="iss-position-stats">
          <div>
            <span>Altitude</span>
            <strong>${formatNumber(data.altitude, { suffix: " km" })}</strong>
          </div>
          <div>
            <span>Velocity</span>
            <strong>${formatNumber(data.velocity, { suffix: " km/h" })}</strong>
          </div>
        </div>
      </div>
      <div class="iss-orbit-context">
        <p class="section-kicker mb-2">Orbital Snapshot</p>
        <div class="orbit-snapshot-list">
          <article class="orbit-snapshot-item">
            <span><i class="fa-solid fa-earth-americas acadia-icon" aria-hidden="true"></i></span>
            <strong>Over ${escapeHtml(issRegion)}</strong>
          </article>
          <article class="orbit-snapshot-item">
            <span><i class="fa-solid fa-sun acadia-icon" aria-hidden="true"></i></span>
            <strong>${escapeHtml(formatIssVisibility(data.visibility))}</strong>
          </article>
          <article class="orbit-snapshot-item">
            <span><i class="fa-solid fa-satellite acadia-icon" aria-hidden="true"></i></span>
            <strong>${formatOrbitsPerDay(data.orbitsPerDay)} orbits/day</strong>
          </article>
          <article class="orbit-snapshot-item">
            <span><i class="fa-solid fa-tower-broadcast acadia-icon" aria-hidden="true"></i></span>
            <strong>${formatFootprintKilometers(data.footprint)} footprint</strong>
          </article>
          <article class="orbit-snapshot-item">
            <span><i class="fa-regular fa-clock acadia-icon" aria-hidden="true"></i></span>
            <strong>One orbit every ${formatOrbitMinutes(data.orbitPeriodMinutes)}</strong>
          </article>
        </div>
        <p class="orbit-context-note mb-0">Orbit estimates use current altitude and velocity; sunlight and footprint come from the ISS position source.</p>
      </div>
      <div class="iss-coordinate-strip" aria-label="ISS coordinates">
        <div>
          <span>Latitude</span>
          <strong>${formatNumber(data.latitude, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}</strong>
        </div>
        <div>
          <span>Longitude</span>
          <strong>${formatNumber(data.longitude, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}</strong>
        </div>
      </div>
      <div class="detail-action-row iss-source-row">
        <a class="source-link" href="https://wheretheiss.at/" target="_blank" rel="noopener noreferrer">
          <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
          ISS position source
        </a>
      </div>
    `;
    renderIssMap(data);
    updateIssOrbitalBrief();
    setQuickStat("iss", {
      value: data.latitude !== null && data.longitude !== null ? "In orbit" : "Position unknown",
      detail: data.altitude !== null ? `${formatNumber(data.altitude, { suffix: " km" })} altitude` : formatIssVisibility(data.visibility),
      state: data.latitude !== null && data.longitude !== null ? "ok" : "attention"
    });
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
    dashboardData.iss = null;
    resetIssMap();
    setError(els.issBody, "We lost the ISS position signal. Try refreshing in a moment.");
    setQuickStat("iss", {
      value: "Unavailable",
      detail: "Station signal lost",
      state: "error"
    });
    return createSourceStatus("iss", "error", "ISS position signal did not come through.");
  }
}

async function loadPeople() {
  try {
    const roster = normalizeCrewRoster(await fetchJson(API.people));
    const { people } = roster;

    if (!people.length) {
      dashboardData.people = null;
      if (els.peopleBody) {
        els.peopleBody.innerHTML = stateMessage("No current crew roster is available.");
      }
      setQuickStat("people", {
        value: "No roster",
        detail: "Crew source empty",
        state: "attention"
      });
      return createSourceStatus("people", "attention", "Crew roster returned no people.");
    }

    const craftGroups = summarizeCraftOccupancy(people);
    const craftManifest = groupCrewByCraft(people);
    const crewLocationLabel = craftGroups.length === 1 ? "crew location" : "crew locations";
    const countMatches = roster.sourceCount === null || roster.sourceCount === people.length;
    const rosterCheck = countMatches
      ? `${people.length.toLocaleString()} listed below`
      : `${people.length.toLocaleString()} listed below; source reports ${roster.sourceCount.toLocaleString()}`;
    const expeditionLabel = formatCrewExpedition(roster.expedition);
    const crewBriefDetail = expeditionLabel === "Unavailable"
      ? "Crew are grouped by spacecraft assignment."
      : `${expeditionLabel} crew are grouped by spacecraft assignment.`;
    const sourceExpeditionDetail = expeditionLabel === "Unavailable" ? "" : `; ${expeditionLabel}`;
    dashboardData.people = {
      count: people.length,
      locationCount: craftGroups.length,
      craftGroups,
      countMatches
    };

    if (isDashboardPage()) {
      renderDashboardPeopleSummary(roster, craftGroups, countMatches);
      setQuickStat("people", {
        value: `${people.length.toLocaleString()} aboard`,
        detail: `${craftGroups.length} ${crewLocationLabel}`,
        state: countMatches ? "ok" : "attention"
      });
      return createSourceStatus(
        "people",
        countMatches ? "ok" : "attention",
        countMatches
          ? `${people.length} people across ${craftGroups.length} ${crewLocationLabel} listed${sourceExpeditionDetail}.`
          : `Source reports ${roster.sourceCount} people but ${people.length} roster entries loaded${sourceExpeditionDetail}.`
      );
    }

    els.peopleBody.innerHTML = `
      <div class="crew-brief">
        <span class="stat-chip"><i class="fa-solid fa-user-astronaut acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="section-kicker mb-1">Crew Manifest</p>
          <h3 class="crew-brief-title mb-0">${people.length.toLocaleString()} aboard across ${craftGroups.length.toLocaleString()} ${crewLocationLabel}</h3>
          <p class="crew-brief-summary mb-0">${escapeHtml(crewBriefDetail)}</p>
        </div>
      </div>
      <div class="crew-manifest-grid">
        ${craftManifest.map((group) => `
          <article class="crew-manifest-card">
            <header class="crew-manifest-header">
              <h3 class="crew-manifest-title mb-0">${escapeHtml(group.craft)}</h3>
              <span>${group.count.toLocaleString()} ${group.count === 1 ? "person" : "aboard"}</span>
            </header>
            <ul class="crew-manifest-list">
              ${group.members.map((person) => `<li>${escapeHtml(person.name)}</li>`).join("")}
            </ul>
          </article>
        `).join("")}
      </div>
      <div class="crew-source-note">
        <p class="mb-0"><strong>Source roster count:</strong> ${escapeHtml(formatCrewSourceCount(roster.sourceCount))}; ${escapeHtml(rosterCheck)}.</p>
      </div>
    `;
    updateIssOrbitalBrief();
    setQuickStat("people", {
      value: `${people.length.toLocaleString()} aboard`,
      detail: `${craftGroups.length} ${crewLocationLabel}`,
      state: countMatches ? "ok" : "attention"
    });
    return createSourceStatus(
      "people",
      countMatches ? "ok" : "attention",
      countMatches
        ? `${people.length} people across ${craftGroups.length} ${crewLocationLabel} listed${sourceExpeditionDetail}.`
        : `Source reports ${roster.sourceCount} people but ${people.length} roster entries loaded${sourceExpeditionDetail}.`
    );
  } catch (error) {
    dashboardData.people = null;
    setError(els.peopleBody, "The crew manifest did not come through. Try refreshing in a moment.");
    setQuickStat("people", {
      value: "Unavailable",
      detail: "Crew signal lost",
      state: "error"
    });
    return createSourceStatus("people", "error", "Crew manifest signal did not come through.");
  }
}

async function loadLaunches() {
  try {
    const launches = normalizeLaunches(await fetchJson(API.launches));
    dashboardData.launches = launches;

    if (!launches.length) {
      if (els.launchBody) {
        els.launchBody.innerHTML = stateMessage("No upcoming SpaceX launches are available from the current launch source.");
      }
      setQuickStat("launches", {
        value: "No upcoming",
        detail: "Schedule empty",
        state: "attention"
      });
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
              ${launch.imageUrl ? `<img src="${escapeHtml(launch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(launch, launchName))}" class="launch-thumb">` : `<span class="stat-chip"><i class="fa-solid fa-rocket acadia-icon" aria-hidden="true"></i></span>`}
              <div class="launch-main">
                <p class="launch-meta">${formatDateTime(launch.dateUtc)} · ${formatCountdown(launch.dateUtc)}</p>
                <div class="launch-title-row">
                  <h3 class="launch-vehicle mb-0">${escapeHtml(launchName.vehicle)}</h3>
                  ${launchName.mission ? `<span class="launch-mission">${escapeHtml(launchName.mission)}</span>` : ""}
                </div>
                <p class="launch-window-summary mb-0">${escapeHtml(launchWindowSummary)}</p>
                <div class="launch-footer">
                  <details class="data-details launch-details">
                    <summary aria-label="Show mission details for ${escapeHtml(launch.name)}"><i class="fa-solid fa-chevron-down acadia-icon" aria-hidden="true"></i>Mission details</summary>
                    <div class="data-detail-panel">
                      <p class="mb-3">${fullDetails}</p>
                      ${detailRows ? `<dl class="detail-list mb-3">${detailRows}</dl>` : ""}
                      ${launch.sourceUrl ? `
                        <a class="source-link" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open launch source for ${escapeHtml(launch.name)}">
                          <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
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
        <a class="btn launch-show-all mt-4" href="./launches.html">View all SpaceX launches</a>
      `;
    };

    if (isDashboardPage()) {
      renderDashboardLaunchSummary(launches);
    } else if (!els.launchBody) {
      return createSourceStatus("launches", "ok", `${launches.length} upcoming launches loaded for context.`);
    } else {
      renderLaunchRows();
    }
    setQuickStat("launches", {
      value: formatLaunchQuickDate(launches[0].dateUtc),
      detail: formatCountdown(launches[0].dateUtc),
      state: "ok"
    });
    return createSourceStatus("launches", "ok", `${launches.length} upcoming SpaceX launches loaded; next launch ${formatDateTime(launches[0].dateUtc)} (${formatLaunchWindowSummary(launches[0])}).`);
  } catch (error) {
    dashboardData.launches = [];
    setError(els.launchBody, "The launch manifest did not come through. Other dashboard sections remain available.");
    setQuickStat("launches", {
      value: "Unavailable",
      detail: "Manifest signal lost",
      state: "error"
    });
    return createSourceStatus("launches", "error", "Launch manifest signal did not come through.");
  }
}

async function loadNeo() {
  try {
    const date = todayIso();
    const neoSummary = normalizeNeo(await fetchJson(`${API.neo}?date=${date}`), date);
    dashboardData.neo = neoSummary;
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
    const riskStatus = getNeoRiskLevel({ hazardous, sentryObjects, closestObject });
    const briefLines = getNeoBriefLines({ asteroids, hazardous, sentryObjects, closestObject });
    const featuredObject = closestObject || sortedAsteroids[0] || null;
    const additionalObjects = sortedAsteroids.filter((item) => item !== featuredObject).slice(0, 4);

    if (isDashboardPage()) {
      renderDashboardNeoSummary(neoSummary);
      setQuickStat("neo", {
        value: `${asteroids.length.toLocaleString()} near Earth`,
        detail: hazardous === 0 ? "None flagged" : `${hazardous.toLocaleString()} flagged`,
        state: hazardous === 0 ? "ok" : "attention"
      });
      return createSourceStatus("neo", "ok", `${formatDate(date)} NASA NeoWs list loaded: ${asteroids.length} objects, ${hazardous} flagged for tracking, ${sentryObjects} on Sentry monitoring.`);
    }

    if (!els.neoBody) {
      return createSourceStatus("neo", "ok", `${formatDate(date)} NASA NeoWs list loaded for context: ${asteroids.length} objects.`);
    }

    if (els.neoRiskAlert) {
      els.neoRiskAlert.innerHTML = "";
    }

    els.neoBody.innerHTML = `
      <section class="neo-brief neo-brief-${escapeHtml(riskStatus.tone)}" aria-labelledby="neoBriefTitle">
        <div class="neo-brief-heading">
          <span class="stat-chip neo-risk-chip neo-risk-${escapeHtml(riskStatus.tone)}"><i class="fa-solid fa-shield-halved acadia-icon" aria-hidden="true"></i></span>
          <div>
            <p class="section-kicker mb-1">Near-Earth Brief</p>
            <h3 class="neo-section-title mb-0" id="neoBriefTitle">${escapeHtml(riskStatus.headline)}</h3>
          </div>
        </div>
        <ul class="neo-brief-list mb-0">
          ${briefLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
        <div class="neo-source-context">
          <p class="mb-1"><strong>${escapeHtml(hazardFlagContext.label)}</strong>: ${escapeHtml(hazardFlagContext.summary)}</p>
          <p class="mb-0"><strong>${escapeHtml(sentryContext.label)}</strong>: ${escapeHtml(sentryContext.summary)}</p>
        </div>
      </section>

      <section class="neo-watch-status" aria-labelledby="neoWatchStatusTitle">
        <div class="space-weather-section-heading">
          <div>
            <p class="section-kicker mb-1">Watch Status</p>
            <h3 class="neo-section-title mb-0" id="neoWatchStatusTitle">Risk level: ${escapeHtml(riskStatus.label)}</h3>
          </div>
        </div>
        <div class="neo-watch-grid">
          <div>
            <p class="text-secondary small mb-1">Hazardous objects</p>
            <p class="fw-semibold mb-0">${hazardous.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Sentry objects</p>
            <p class="fw-semibold mb-0">${sentryObjects.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Closest approach</p>
            <p class="fw-semibold mb-0">${formatCompactLunarDistance(closestObject?.lunarDistance)}</p>
            <p class="text-secondary small mb-0">${formatDistanceKilometers(closestObject?.closestKilometers)}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Risk level</p>
            <p class="fw-semibold mb-0">${escapeHtml(riskStatus.label)}</p>
          </div>
        </div>
      </section>

      ${featuredObject ? `
        <section class="neo-featured-section" aria-labelledby="neoFeaturedTitle">
          <div class="space-weather-section-heading">
            <div>
              <p class="section-kicker mb-1">Closest Approach</p>
              <h3 class="neo-section-title mb-0" id="neoFeaturedTitle">Featured Approach</h3>
            </div>
            <p class="neo-section-note mb-0">
              ${closestApproachIso
                ? `<time datetime="${escapeHtml(closestApproachIso)}">${escapeHtml(closestApproachLabel)}</time>`
                : escapeHtml(closestApproachLabel)}
            </p>
          </div>
          <article class="neo-featured-card">
            <div class="neo-object-copy">
              <p class="neo-object-role mb-1">Closest object today</p>
              <h4 class="neo-object-title mb-2">${escapeHtml(featuredObject.name)}</h4>
              <p class="neo-object-interpretation mb-1">${escapeHtml(getNeoSizeLabel(featuredObject))}</p>
              <p class="neo-object-detail mb-0">${escapeHtml(formatApproxDiameterRange(featuredObject.minDiameterMeters, featuredObject.maxDiameterMeters))}</p>
            </div>
            <div class="neo-featured-metrics">
              <p class="neo-distance-value mb-1">${formatLunarDistance(featuredObject.lunarDistance)}</p>
              <p class="neo-object-interpretation mb-1">${escapeHtml(getNeoPassLabel(featuredObject.lunarDistance))}</p>
              <p class="neo-object-detail mb-0">${escapeHtml(getNeoIndicatorText(featuredObject))}</p>
            </div>
            ${renderNeoDetails(featuredObject)}
          </article>
        </section>
      ` : stateMessage("No near-Earth objects are listed for today.")}

      ${additionalObjects.length ? `
        <section class="neo-additional-section" aria-labelledby="neoAdditionalTitle">
          <div class="space-weather-section-heading">
            <div>
              <p class="section-kicker mb-1">Additional Objects</p>
              <h3 class="neo-section-title mb-0" id="neoAdditionalTitle">Other passes today</h3>
            </div>
          </div>
          <ul class="neo-object-list list-unstyled mb-0">
            ${additionalObjects.map((item) => `
              <li class="neo-object-card">
                <div class="neo-object-copy">
                  <h4 class="neo-object-title mb-2">${escapeHtml(item.name)}</h4>
                  <p class="neo-object-interpretation mb-1">${escapeHtml(getNeoSizeLabel(item))}</p>
                  <p class="neo-object-detail mb-0">${escapeHtml(formatApproxDiameterRange(item.minDiameterMeters, item.maxDiameterMeters))}</p>
                </div>
                <div class="neo-object-pass">
                  <p class="neo-object-interpretation mb-1">${escapeHtml(getNeoPassLabel(item.lunarDistance))}</p>
                  <p class="neo-distance-value mb-1">${formatLunarDistance(item.lunarDistance)}</p>
                  <p class="neo-object-detail mb-0">${escapeHtml(getNeoIndicatorText(item))}</p>
                </div>
                ${renderNeoDetails(item)}
              </li>
            `).join("")}
          </ul>
        </section>
      ` : ""}
    `;
    setQuickStat("neo", {
      value: `${asteroids.length.toLocaleString()} near Earth`,
      detail: hazardous === 0 ? "None flagged" : `${hazardous.toLocaleString()} flagged`,
      state: hazardous === 0 ? "ok" : "attention"
    });
    return createSourceStatus("neo", "ok", `${formatDate(date)} NASA NeoWs list loaded: ${asteroids.length} objects, ${hazardous} flagged for tracking, ${sentryObjects} on Sentry monitoring.`);
  } catch (error) {
    dashboardData.neo = null;
    if (els.neoRiskAlert) {
      els.neoRiskAlert.innerHTML = "";
    }
    setError(els.neoBody, getApiErrorMessage(error, "NASA asteroid data is unavailable right now. Other live sections remain available."));
    setQuickStat("neo", {
      value: "Unavailable",
      detail: "NASA signal lost",
      state: "error"
    });
    return createSourceStatus("neo", "error", "Asteroid tracking signal did not come through.");
  }
}

async function loadSpaceWeather() {
  try {
    const data = normalizeSpaceWeather(await fetchJson(API.spaceWeather));
    dashboardData.spaceWeather = data;
    const severityClass = `space-weather-${data.severity}`;
    const recentAlerts = data.alerts.slice(0, 2);
    const forecastRows = data.forecast.slice(0, 3);
    const noaaScaleContext = getNoaaScaleContext(data.noaaScale, data.kpIndex);
    const weatherBrief = getSpaceWeatherBrief(data, forecastRows);
    const trendLabel = getSpaceWeatherTrendLabel(forecastRows);
    const observedAtLabel = data.observedAt ? formatDateTime(data.observedAt) : "";
    const observedAtMarkup = observedAtLabel && observedAtLabel !== "Unavailable"
      ? `<p class="space-weather-observed mb-0">Observed <time datetime="${escapeHtml(data.observedAt)}">${escapeHtml(observedAtLabel)}</time></p>`
      : "";

    if (isDashboardPage()) {
      renderDashboardWeatherSummary(data);
      setQuickStat("spaceWeather", {
        value: data.condition,
        detail: data.kpIndex === null ? "Kp unavailable" : `Kp ${formatKpIndex(data.kpIndex)}`,
        state: data.kpIndex === null ? "attention" : data.severity === "quiet" ? "ok" : "attention"
      });
      return createSourceStatus(
        "spaceWeather",
        data.kpIndex === null ? "attention" : "ok",
        data.kpIndex === null
          ? "NOAA response loaded without a current K-index."
          : data.observedAt
            ? `Current K-index ${formatKpIndex(data.kpIndex)} observed ${formatDateTime(data.observedAt)}.`
            : `Current K-index ${formatKpIndex(data.kpIndex)} loaded.`
      );
    }

    if (!els.spaceWeatherBody) {
      return createSourceStatus(
        "spaceWeather",
        data.kpIndex === null ? "attention" : "ok",
        data.kpIndex === null ? "NOAA response loaded without a current K-index." : `Current K-index ${formatKpIndex(data.kpIndex)} loaded for context.`
      );
    }

    els.spaceWeatherBody.innerHTML = `
      <div class="summary-metric">
        <span class="stat-chip ${severityClass}"><i class="fa-solid fa-sun acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current K-index</p>
          <p class="h3 fw-semibold mb-0">${formatKpIndex(data.kpIndex)}</p>
          ${observedAtMarkup}
        </div>
      </div>
      <section class="space-weather-brief ${severityClass}" aria-labelledby="spaceWeatherBriefTitle">
        <div>
          <p class="section-kicker mb-1">Space Weather Brief</p>
          <h3 class="space-weather-brief-title mb-0" id="spaceWeatherBriefTitle">${escapeHtml(data.condition)}</h3>
          <p class="space-weather-brief-copy mb-0">${escapeHtml(weatherBrief)}</p>
        </div>
        ${data.kpLabel ? `<span class="space-weather-kp">${escapeHtml(data.kpLabel)}</span>` : ""}
      </section>
      ${forecastRows.length ? `
        <section class="space-weather-forecast" aria-labelledby="spaceWeatherForecastTitle">
          <div class="space-weather-section-heading">
            <div>
              <p class="section-kicker mb-1">Next 72 hours</p>
              <h3 class="space-weather-section-title mb-0" id="spaceWeatherForecastTitle">Kp Trend</h3>
            </div>
            <p class="space-weather-trend-label mb-0">${escapeHtml(trendLabel)}</p>
          </div>
          <div class="space-weather-trend-line" aria-label="K-index trend">
            ${forecastRows.map((item) => `
              <span class="space-weather-trend-step space-weather-${escapeHtml(item.severity)}">
                <strong>${formatKpIndex(item.maxKp)}</strong>
                <small>${formatShortDate(item.date)}</small>
              </span>
            `).join("")}
          </div>
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
        </section>
      ` : ""}
      <div class="space-weather-status ${severityClass}">
        <div>
          <p class="section-kicker mb-1">${escapeHtml(data.condition)}</p>
          <p class="mb-0">${escapeHtml(data.summary)}</p>
        </div>
      </div>
      <div class="space-weather-scale-context">
        <div>
          <p class="text-secondary small mb-1">NOAA geomagnetic scale</p>
          <p class="space-weather-scale-label mb-0">${escapeHtml(noaaScaleContext.label)}</p>
          <p class="space-weather-scale-range mb-0">${escapeHtml(noaaScaleContext.range)}</p>
        </div>
        <p class="space-weather-scale-summary mb-0">${escapeHtml(noaaScaleContext.summary)}</p>
      </div>
      ${recentAlerts.length ? `
        <section class="space-weather-alerts" aria-labelledby="spaceWeatherAlertsTitle">
          <div class="space-weather-section-heading">
            <div>
              <p class="section-kicker mb-1">Watch Items</p>
              <h3 class="space-weather-section-title mb-0" id="spaceWeatherAlertsTitle">Recent NOAA Notices</h3>
            </div>
          </div>
          <ul class="list-unstyled mb-0">
            ${recentAlerts.map((alert) => {
              const interpretation = getSpaceWeatherAlertInterpretation(alert);
              return `
              <li>
                <div class="space-weather-alert-heading">
                  <span class="space-weather-alert-pill">${escapeHtml(alert.type)}</span>
                  <span>${escapeHtml(alert.headline)}</span>
                </div>
                <p class="space-weather-alert-impact mb-0">
                  <span>${escapeHtml(interpretation.title)}</span>
                  <span>${escapeHtml(interpretation.summary)}</span>
                </p>
                ${alert.issuedAt ? `<time datetime="${escapeHtml(alert.issuedAt)}">${formatDateTime(alert.issuedAt)}</time>` : ""}
              </li>
            `; }).join("")}
          </ul>
        </section>
      ` : stateMessage("No recent NOAA alerts are listed.")}
      <a class="source-link" href="${escapeHtml(data.sourceUrl)}" target="_blank" rel="noopener noreferrer">
        <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
        NOAA space weather source
      </a>
    `;
    setQuickStat("spaceWeather", {
      value: data.condition,
      detail: data.kpIndex === null ? "Kp unavailable" : `Kp ${formatKpIndex(data.kpIndex)}`,
      state: data.kpIndex === null ? "attention" : data.severity === "quiet" ? "ok" : "attention"
    });
    return createSourceStatus(
      "spaceWeather",
      data.kpIndex === null ? "attention" : "ok",
      data.kpIndex === null
        ? "NOAA response loaded without a current K-index."
        : data.observedAt
          ? `Current K-index ${formatKpIndex(data.kpIndex)} observed ${formatDateTime(data.observedAt)}.`
          : `Current K-index ${formatKpIndex(data.kpIndex)} loaded.`
    );
  } catch (error) {
    dashboardData.spaceWeather = null;
    setError(els.spaceWeatherBody, "The NOAA space-weather signal did not come through. Try refreshing in a moment.");
    setQuickStat("spaceWeather", {
      value: "Unavailable",
      detail: "NOAA signal lost",
      state: "error"
    });
    return createSourceStatus("spaceWeather", "error", "NOAA space-weather signal did not come through.");
  }
}

async function loadDashboard() {
  setDashboardStatus("Preparing fresh telemetry.");
  dashboardData.apod = null;
  dashboardData.iss = null;
  dashboardData.people = null;
  dashboardData.launches = [];
  dashboardData.neo = null;
  dashboardData.spaceWeather = null;
  const pageType = getPageType();
  const loadersByPage = {
    dashboard: [loadApod, loadIss, loadPeople, loadLaunches, loadNeo, loadSpaceWeather],
    iss: [loadIss, loadPeople],
    asteroids: [loadNeo],
    weather: [loadSpaceWeather],
    gallery: [loadApod],
    anomalies: [loadIss, loadLaunches, loadNeo, loadSpaceWeather]
  };
  const sourceIdsByPage = {
    dashboard: ["apod", "iss", "people", "launches", "neo", "spaceWeather"],
    iss: ["iss", "people"],
    asteroids: ["neo"],
    weather: ["spaceWeather"],
    gallery: ["apod"],
    anomalies: ["iss", "launches", "neo", "spaceWeather"]
  };
  const busyElements = [
    els.quickStatsBody,
    els.spaceBriefBody,
    els.recentActivityBody,
    els.watchItemsBody,
    els.apodBody,
    els.issBody,
    els.peopleBody,
    els.launchBody,
    els.neoRiskAlert,
    els.neoBody,
    els.spaceWeatherBody,
    els.skyAnomaliesBody,
    els.sourceStatusBody
  ].filter(Boolean);
  const loaders = loadersByPage[pageType] || loadersByPage.dashboard;
  const sourceIds = sourceIdsByPage[pageType] || sourceIdsByPage.dashboard;

  busyElements.forEach((element) => setBusy(element, true));

  if (els.skyAnomalyResults && pageType === "anomalies") {
    els.skyAnomalyResults.innerHTML = stateMessage("Triangulating sky context...");
  }

  if (els.quickStatsBody) {
    resetQuickStats();
  }

  if (els.spaceBriefBody) {
    resetSpaceBrief();
  }

  resetCommandPanels();

  [els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
    button.disabled = true;
    button.innerHTML = REFRESHING_BUTTON_HTML;
  });

  const sourceResults = await Promise.allSettled(loaders.map((loader) => loader()));

  if (els.sourceStatusBody) {
    renderSourceStatus(sourceResults.map((result, index) => (
      result.status === "fulfilled" && result.value
        ? result.value
        : createSourceStatus(sourceIds[index], "error", "Source check did not finish.")
    )), new Date());
  }

  if (pageType === "dashboard") {
    renderSpaceBrief();
    renderCommandPanels();
  }

  if (pageType === "anomalies") {
    if (els.skyAnomalyResults?.dataset.mode === "submitted") {
      renderSkyExplanation();
    } else {
      renderSkyAnomalyOverview();
    }
  } else if (isDashboardPage()) {
    renderDashboardAnomalySummary();
  }

  busyElements.forEach((element) => setBusy(element, false));
  setDashboardStatus("Live space data refreshed.");
  setDashboardUpdated();
  if (els.refreshButton) {
    els.refreshButton.disabled = false;
    els.refreshButton.innerHTML = REFRESH_BUTTON_HTML;
  }
  if (els.refreshButtonMobile) {
    els.refreshButtonMobile.disabled = false;
    els.refreshButtonMobile.innerHTML = REFRESH_BUTTON_HTML;
  }
}

[els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
  button.addEventListener("click", loadDashboard);
});
initThemeControl();
initSkyAnomalyEngine();
loadDashboard();
