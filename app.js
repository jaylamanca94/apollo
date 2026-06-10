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
  return {
    title: getText(data?.title, "Astronomy Picture of the Day"),
    date: getText(data?.date),
    explanation: getText(data?.explanation, "No description available."),
    mediaType: getText(data?.media_type),
    mediaUrl: safeHttpUrl(data?.url)
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
      provider: getText(launch?.provider, "SpaceX")
    }))
    .filter((launch) => launch.name && launch.dateUtc);
}

function normalizeNeo(data, date) {
  const asteroids = Array.isArray(data?.near_earth_objects?.[date])
    ? data.near_earth_objects[date]
    : [];

  return asteroids.map((item) => {
    const closestKilometers = getFiniteNumber(item?.close_approach_data?.[0]?.miss_distance?.kilometers);
    const maxDiameterKilometers = getFiniteNumber(item?.estimated_diameter?.kilometers?.estimated_diameter_max);

    return {
      name: getText(item?.name, "Unnamed object"),
      hazardous: Boolean(item?.is_potentially_hazardous_asteroid),
      closestKilometers,
      maxDiameterMeters: maxDiameterKilometers === null ? null : maxDiameterKilometers * 1000
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

  window.L.circle(position, {
    color: "#198754",
    fillColor: "#198754",
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
    const summaryText = truncateText(data.explanation);
    const explanation = escapeHtml(data.explanation);
    const summary = escapeHtml(summaryText);
    const hasLongExplanation = summaryText !== data.explanation;
    const media = data.mediaUrl && data.mediaType === "image"
      ? `<img class="img-fluid rounded apod-media mb-4" src="${data.mediaUrl}" alt="${title}">`
      : data.mediaUrl
        ? `<div class="ratio ratio-16x9 mb-4"><iframe class="rounded" src="${data.mediaUrl}" title="${title}" allowfullscreen></iframe></div>`
        : "";

    els.apodBody.innerHTML = `
      ${media}
      <div class="apod-content">
        <p class="text-secondary small mb-2">${data.date ? formatDate(data.date) : "Today"}</p>
        <h3 class="h2 fw-semibold mb-3">${title}</h3>
        <p class="mb-0 apod-summary">${summary}</p>
        ${hasLongExplanation ? `
          <details class="apod-details mt-3">
            <summary class="fw-semibold">Read full description</summary>
            <p class="mb-0 mt-2">${explanation}</p>
          </details>
        ` : ""}
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

    els.launchBody.innerHTML = `
      <p class="text-secondary small mb-3">${launches.length} upcoming SpaceX launches from Launch Library 2.</p>
      <div class="list-group list-group-flush">
        ${launches.map((launch) => {
          const badge = `<span class="badge text-bg-primary">${escapeHtml(launch.status)}</span>`;
          return `
            <article class="list-group-item px-0 py-3">
              <div class="d-flex gap-3">
                ${launch.imageUrl ? `<img src="${launch.imageUrl}" alt="" width="44" height="44" class="d-none d-sm-block">` : ""}
                <div class="flex-grow-1">
                  <div class="d-flex flex-column flex-sm-row justify-content-sm-between gap-2">
                    <h3 class="h6 mb-0">${escapeHtml(launch.name)}</h3>
                    <div>${badge}</div>
                  </div>
                  <p class="text-secondary small mb-2">${formatDate(launch.dateUtc)} · ${escapeHtml(launch.provider)}</p>
                  <p class="mb-0 text-body-secondary">${escapeHtml(launch.details)}</p>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  } catch (error) {
    setError(els.launchBody, "Could not load upcoming SpaceX launches right now. Other dashboard sections remain available.");
  }
}

async function loadNeo() {
  try {
    const date = todayIso();
    const asteroids = normalizeNeo(await fetchJson(`${API.neo}?date=${date}`), date);
    const hazardous = asteroids.filter((item) => item.hazardous).length;
    const closest = asteroids
      .map((item) => item.closestKilometers)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0];

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
          <p class="fw-semibold mb-0">${Number.isFinite(closest) ? `${Math.round(closest).toLocaleString()} km` : "Unavailable"}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Report date</p>
          <p class="fw-semibold mb-0">${formatDate(date)}</p>
        </div>
      </div>
      ${asteroids.length ? `
        <ul class="list-group list-group-flush">
          ${asteroids.slice(0, 4).map((item) => `
            <li class="list-group-item px-0 py-3 d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3">
              <span>${escapeHtml(item.name)}</span>
              <span class="text-secondary text-sm-end">${item.maxDiameterMeters === null ? "Size unavailable" : `${Math.round(item.maxDiameterMeters).toLocaleString()} m max`}</span>
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
    button.innerHTML = `<i class="fa-solid fa-rotate me-2"></i>Refreshing`;
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
    els.refreshButton.innerHTML = `<i class="fa-solid fa-rotate me-2"></i>Refresh`;
  }
  if (els.refreshButtonMobile) {
    els.refreshButtonMobile.disabled = false;
    els.refreshButtonMobile.innerHTML = `<i class="fa-solid fa-rotate me-2"></i>Refresh`;
  }
}

[els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach((button) => {
  button.addEventListener("click", loadDashboard);
});
initThemeControl();
loadDashboard();
