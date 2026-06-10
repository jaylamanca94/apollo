const API = {
  apod: "/api/apod",
  iss: "https://api.wheretheiss.at/v1/satellites/25544",
  people: "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json",
  launches: "/api/launches",
  neo: "/api/neo"
};

const NASA_RATE_LIMIT_MESSAGE = "NASA data is temporarily unavailable because NASA is limiting requests. Other dashboard sections are still live.";
const THEME_STORAGE_KEY = "apollo-theme";
let issMap = null;

const els = {
  refreshButton: document.querySelector("#refreshButton"),
  refreshButtonMobile: document.querySelector("#refreshButtonMobile"),
  themeToggle: document.querySelector("#themeToggle"),
  dashboardUpdated: document.querySelector("#dashboardUpdated"),
  peopleBody: document.querySelector("#peopleBody"),
  issBody: document.querySelector("#issBody"),
  neoBody: document.querySelector("#neoBody"),
  launchBody: document.querySelector("#launchBody"),
  apodBody: document.querySelector("#apodBody"),
  dashboardStatus: document.querySelector("#dashboardStatus")
};

function formatUpdated(date = new Date()) {
  return `Last updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    year: "numeric"
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

  return `T-${Math.max(hours, 0)}h`;
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
  return {
    latitude: getFiniteNumber(data?.latitude),
    longitude: getFiniteNumber(data?.longitude),
    altitude: getFiniteNumber(data?.altitude),
    velocity: getFiniteNumber(data?.velocity)
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

function normalizeNeo(data, date) {
  if (Array.isArray(data?.asteroids)) {
    return data.asteroids.map((item) => ({
      name: getText(item?.name, "Unnamed object"),
      hazardous: Boolean(item?.hazardous),
      closestKilometers: getFiniteNumber(item?.closestKilometers),
      lunarDistance: getFiniteNumber(item?.lunarDistance),
      velocityKph: getFiniteNumber(item?.velocityKph),
      closeApproach: getText(item?.closeApproach),
      minDiameterMeters: getFiniteNumber(item?.minDiameterMeters),
      maxDiameterMeters: getFiniteNumber(item?.maxDiameterMeters),
      sourceUrl: safeHttpUrl(item?.sourceUrl)
    }));
  }

  const rawAsteroids = Array.isArray(data?.near_earth_objects?.[date])
    ? data.near_earth_objects[date]
    : [];

  return rawAsteroids.map((item) => {
    const approach = item?.close_approach_data?.[0] || {};
    const closestKilometers = getFiniteNumber(approach?.miss_distance?.kilometers);
    const lunarDistance = getFiniteNumber(approach?.miss_distance?.lunar);
    const velocityKph = getFiniteNumber(approach?.relative_velocity?.kilometers_per_hour);
    const minDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_min);
    const maxDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_max);

    return {
      name: getText(item?.name, "Unnamed object"),
      hazardous: Boolean(item?.is_potentially_hazardous_asteroid),
      closestKilometers,
      lunarDistance,
      velocityKph,
      closeApproach: getText(approach?.close_approach_date_full || approach?.close_approach_date),
      minDiameterMeters: minDiameterKilometers === null ? null : minDiameterKilometers * 1000,
      maxDiameterMeters: maxDiameterKilometers === null ? null : maxDiameterKilometers * 1000,
      sourceUrl: safeHttpUrl(item?.nasa_jpl_url)
    };
  });
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
      ${message}
    </div>
  `;
}

function stateMessage(message) {
  return `<p class="state-message text-secondary mb-0">${message}</p>`;
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
                View Image
              </a>
            ` : ""}
            <a class="source-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-earth-americas" aria-hidden="true"></i>
              NASA Source
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    setError(els.apodBody, getApiErrorMessage(error, "NASA's astronomy picture is unavailable right now. This card will update when NASA responds."));
  }
}

async function loadIss() {
  try {
    resetIssMap();
    const data = normalizeIss(await fetchJson(API.iss));

    els.issBody.innerHTML = `
      <div class="iss-map mb-3" id="issMap" role="img" aria-label="Map showing the current ISS position above Earth"></div>
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
      <p class="text-secondary small mb-0 mt-3">These coordinates show the station's current position above Earth.</p>
    `;
    renderIssMap(data);
  } catch (error) {
    resetIssMap();
    setError(els.issBody, "Could not load the ISS location right now.");
  }
}

async function loadPeople() {
  try {
    const people = normalizePeople(await fetchJson(API.people));

    if (!people.length) {
      els.peopleBody.innerHTML = stateMessage("No crew data available.");
      return;
    }

    els.peopleBody.innerHTML = `
      <div class="summary-metric mb-3">
        <span class="stat-chip"><i class="fa-solid fa-user-astronaut" aria-hidden="true"></i></span>
        <div>
          <p class="text-secondary small mb-1">Current crew</p>
          <p class="h3 fw-semibold mb-0">${people.length}</p>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        ${people.map((person) => `
          <li class="list-group-item px-0 py-3 d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3">
            <span class="fw-semibold">${escapeHtml(person.name)}</span>
            ${person.craft ? `<span class="text-secondary text-sm-end">${escapeHtml(person.craft)}</span>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
  } catch (error) {
    setError(els.peopleBody, "Could not load people-in-space data right now.");
  }
}

async function loadLaunches() {
  try {
    const launches = normalizeLaunches(await fetchJson(API.launches));

    if (!launches.length) {
      els.launchBody.innerHTML = stateMessage("No upcoming SpaceX launches are available from the current data source.");
      return;
    }

    const renderLaunchRows = (showAll = false) => {
      const visibleLaunches = showAll ? launches : launches.slice(0, 3);

      els.launchBody.innerHTML = `
        <p class="launch-count">${launches.length} upcoming SpaceX launches</p>
        <div class="launch-list">
          ${visibleLaunches.map((launch) => {
          const launchName = splitLaunchName(launch.name);
          const launchWindow = formatLaunchWindow(launch);
          const summaryDetails = escapeHtml(truncateText(launch.details, 190));
          const fullDetails = escapeHtml(launch.details);
          const detailRows = [
            ["Vehicle", launch.vehicle],
            ["Provider", launch.provider],
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
              ${launch.imageUrl ? `<img src="${escapeHtml(launch.imageUrl)}" alt="" class="launch-thumb">` : `<span class="stat-chip"><i class="fa-solid fa-rocket" aria-hidden="true"></i></span>`}
              <div class="launch-main">
                <p class="launch-meta">${formatDateTime(launch.dateUtc)} · ${formatCountdown(launch.dateUtc)}</p>
                <div class="launch-title-row">
                  <h3 class="launch-vehicle mb-0">${escapeHtml(launchName.vehicle)}</h3>
                  ${launchName.mission ? `<span class="launch-mission">${escapeHtml(launchName.mission)}</span>` : ""}
                </div>
                <div class="launch-footer">
                  <details class="data-details launch-details">
                    <summary><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>Mission Details</summary>
                    <div class="data-detail-panel">
                      <p class="mb-3">${summaryDetails}</p>
                      ${fullDetails !== summaryDetails ? `<p class="mb-3">${fullDetails}</p>` : ""}
                      ${detailRows ? `<dl class="detail-list mb-3">${detailRows}</dl>` : ""}
                      ${launch.sourceUrl ? `
                        <a class="source-link" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer">
                          <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                          Launch Library Source
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
        ${launches.length > 3 ? `
          <button class="btn launch-show-all mt-4" type="button" id="launchToggleButton">
            ${showAll ? "Show Fewer Launches" : "Show All Launches"}
          </button>
        ` : ""}
      `;

      const launchToggleButton = els.launchBody.querySelector("#launchToggleButton");

      if (launchToggleButton) {
        launchToggleButton.addEventListener("click", () => renderLaunchRows(!showAll));
      }
    };

    renderLaunchRows();
  } catch (error) {
    setError(els.launchBody, "Could not load upcoming SpaceX launches right now. Other dashboard sections remain available.");
  }
}

async function loadNeo() {
  try {
    const date = todayIso();
    const asteroids = normalizeNeo(await fetchJson(`${API.neo}?date=${date}`), date);
    const sortedAsteroids = [...asteroids].sort((a, b) => {
      const left = Number.isFinite(a.closestKilometers) ? a.closestKilometers : Number.POSITIVE_INFINITY;
      const right = Number.isFinite(b.closestKilometers) ? b.closestKilometers : Number.POSITIVE_INFINITY;
      return left - right;
    });
    const hazardous = asteroids.filter((item) => item.hazardous).length;
    const closestObject = sortedAsteroids.find((item) => Number.isFinite(item.closestKilometers));
    const fastestVelocity = asteroids
      .map((item) => item.velocityKph)
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];
    const hazardSummary = hazardous === 0
      ? "No listed objects are flagged as potentially hazardous today."
      : `${hazardous} listed ${hazardous === 1 ? "object is" : "objects are"} flagged for NASA tracking. That flag reflects size and orbit, not an expected impact.`;

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
          <p class="text-secondary small mb-1">Closest approach</p>
          <p class="fw-semibold mb-0">${formatLunarDistance(closestObject?.lunarDistance)}</p>
          <p class="text-secondary small mb-0">${formatDistanceKilometers(closestObject?.closestKilometers)}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Fastest relative speed</p>
          <p class="fw-semibold mb-0">${formatVelocityKph(fastestVelocity)}</p>
        </div>
      </div>
      <div class="neo-risk-note mb-3">
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        <p class="mb-0">${hazardSummary}</p>
      </div>
      ${asteroids.length ? `
        <ul class="list-group list-group-flush">
          ${sortedAsteroids.slice(0, 5).map((item) => `
            <li class="list-group-item px-0 py-3 asteroid-row">
              <div>
                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span class="fw-semibold">${escapeHtml(item.name)}</span>
                  ${item.hazardous ? `<span class="badge rounded-pill text-bg-warning">Potentially hazardous</span>` : ""}
                </div>
                <p class="text-secondary small mb-0">${formatLunarDistance(item.lunarDistance)} · ${formatVelocityKph(item.velocityKph)}</p>
              </div>
              <span class="text-secondary text-sm-end">${formatDiameterRange(item.minDiameterMeters, item.maxDiameterMeters)}</span>
            </li>
          `).join("")}
        </ul>
      ` : stateMessage("No near-Earth objects are listed for today.")}
    `;
  } catch (error) {
    setError(els.neoBody, getApiErrorMessage(error, "NASA asteroid data is unavailable right now. Other live sections remain available."));
  }
}

async function loadDashboard() {
  setDashboardStatus("Refreshing Apollo dashboard data.");
  [
    els.apodBody,
    els.issBody,
    els.peopleBody,
    els.launchBody,
    els.neoBody
  ].forEach((element) => setBusy(element, true));
  [els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
    button.disabled = true;
    button.innerHTML = "Refreshing";
  });
  await Promise.allSettled([
    loadApod(),
    loadIss(),
    loadPeople(),
    loadLaunches(),
    loadNeo()
  ]);
  [
    els.apodBody,
    els.issBody,
    els.peopleBody,
    els.launchBody,
    els.neoBody
  ].forEach((element) => setBusy(element, false));
  setDashboardStatus("Apollo dashboard data refreshed.");
  setDashboardUpdated();
  if (els.refreshButton) {
    els.refreshButton.disabled = false;
    els.refreshButton.innerHTML = "Refresh Data";
  }
  if (els.refreshButtonMobile) {
    els.refreshButtonMobile.disabled = false;
    els.refreshButtonMobile.innerHTML = "Refresh Data";
  }
}

[els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
  button.addEventListener("click", loadDashboard);
});
initThemeControl();
loadDashboard();
