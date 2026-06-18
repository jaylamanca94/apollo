const LAUNCHES_API = "/api/launches?limit=20";
const THEME_STORAGE_KEY = "apollo-theme";
const THEME_COLORS = {
  dark: "#1F2427",
  light: "#E8EAED"
};
const REFRESH_BUTTON_HTML = `<i class="fa-solid fa-rotate-right acadia-icon" aria-hidden="true"></i><span>Refresh data</span>`;
const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner" aria-hidden="true"></span><span>Preparing launch</span>`;
const ERROR_PREFIX = "Houston, we have a problem.";

const els = {
  refreshButton: document.querySelector("#launchesRefreshButton"),
  themeToggle: document.querySelector("#themeToggle"),
  launchPageBody: document.querySelector("#launchPageBody"),
  launchesUpdated: document.querySelector("#launchesUpdated"),
  launchPageStatus: document.querySelector("#launchPageStatus")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function getText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function formatUpdated(date = new Date()) {
  return `Last updated: ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
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

function formatDateShort(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat([], {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatLaunchTime(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
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

function getFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

function truncateText(value, maxLength = 420) {
  const text = String(value ?? "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${clipped}...`;
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

function getLaunchMissionLabel(launchName) {
  return launchName.mission || launchName.vehicle;
}

function formatLaunchLocation(launch) {
  const location = getText(launch?.location);

  if (!location) {
    return getText(launch?.pad, "Location pending");
  }

  return location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function formatLaunchImageAlt(launch, launchName = splitLaunchName(launch?.name)) {
  const mission = launchName.mission || launch.name;
  return `Mission image for ${mission || launchName.vehicle}`;
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

function setBusy(element, isBusy) {
  if (element) {
    element.setAttribute("aria-busy", String(isBusy));
  }
}

function setLaunchPageStatus(message) {
  if (els.launchPageStatus) {
    els.launchPageStatus.textContent = message;
  }
}

function setLaunchesUpdated(value = formatUpdated()) {
  if (els.launchesUpdated) {
    els.launchesUpdated.textContent = value;
  }
}

function setError(message) {
  const text = getText(message, "Launch telemetry did not come through.");
  els.launchPageBody.innerHTML = stateMessage(text.startsWith(ERROR_PREFIX) ? text : `${ERROR_PREFIX} ${text}`, { role: "alert", tone: "warning" });
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

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function renderLaunches(launches) {
  if (!launches.length) {
    els.launchPageBody.innerHTML = stateMessage("No upcoming SpaceX launches are available from the current launch source.");
    return;
  }

  const nextLaunch = launches[0];
  const nextLaunchName = splitLaunchName(nextLaunch.name);
  const nextLaunchWindow = formatLaunchWindow(nextLaunch);
  const nextLaunchWindowSummary = formatLaunchWindowSummary(nextLaunch);
  const nextLaunchLocation = formatLaunchLocation(nextLaunch);
  const scheduleRows = launches.map((launch, index) => {
    const launchName = splitLaunchName(launch.name);
    const missionLabel = getLaunchMissionLabel(launchName);
    const countdownLabel = formatCountdown(launch.dateUtc);
    const launchWindow = formatLaunchWindow(launch);
    const launchWindowSummary = formatLaunchWindowSummary(launch);
    const launchLocation = formatLaunchLocation(launch);
    const rowTitleId = `launchTimelineTitle-${index}`;
    const detailRows = [
      ["Launch window", launchWindow],
      ["Pad", launch.pad],
      ["Location", launch.location],
      ["Vehicle", launch.vehicle || launchName.vehicle],
      ["Provider", launch.provider]
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
      <article class="launch-timeline-row${index === 0 ? " launch-timeline-row-next" : ""}" aria-labelledby="${rowTitleId}">
        <div class="launch-timeline-rail">
          <span><span class="visually-hidden">Countdown </span>${escapeHtml(countdownLabel)}</span>
        </div>
        <div class="launch-timeline-main">
          <div class="launch-timeline-header">
            <div>
              <p class="launch-timeline-when mb-1">${escapeHtml(formatDateShort(launch.dateUtc))} · ${escapeHtml(formatLaunchTime(launch.dateUtc))}</p>
              <h3 class="launch-timeline-title mb-0" id="${rowTitleId}">${escapeHtml(missionLabel)}</h3>
              ${launchName.mission && missionLabel !== launchName.vehicle ? `<p class="launch-timeline-vehicle mb-0">${escapeHtml(launchName.vehicle)}</p>` : ""}
            </div>
            <span class="launch-status-pill">${escapeHtml(launch.status)}</span>
          </div>
          <div class="launch-timeline-facts">
            <span><i class="fa-solid fa-location-dot acadia-icon" aria-hidden="true"></i>${escapeHtml(launchLocation)}</span>
            <span><i class="fa-regular fa-clock acadia-icon" aria-hidden="true"></i>${escapeHtml(launchWindowSummary)}</span>
          </div>
          <details class="data-details launch-details launch-timeline-details">
            <summary aria-label="Show mission details for ${escapeHtml(launch.name)}"><i class="fa-solid fa-chevron-down acadia-icon" aria-hidden="true"></i>Mission details</summary>
            <div class="data-detail-panel">
              <p class="mb-3">${escapeHtml(truncateText(launch.details, 360))}</p>
              ${detailRows ? `<dl class="detail-list mb-3">${detailRows}</dl>` : ""}
              ${launch.sourceUrl ? `
                <a class="source-link" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open launch source for ${escapeHtml(launch.name)}">
                  <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
                  Launch source
                </a>
              ` : ""}
            </div>
          </details>
        </div>
      </article>
    `;
  }).join("");
  const nextLaunchFacts = [
    ["Liftoff", `${formatDateShort(nextLaunch.dateUtc)} · ${formatLaunchTime(nextLaunch.dateUtc)}`],
    ["Countdown", formatCountdown(nextLaunch.dateUtc)],
    ["Window", nextLaunchWindowSummary],
    ["Location", nextLaunchLocation]
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `
      <div>
        <span>${label}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");
  const nextLaunchActionItems = [
    nextLaunch.sourceUrl ? `
      <a class="source-link" href="${escapeHtml(nextLaunch.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open launch source for ${escapeHtml(nextLaunch.name)}">
        <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
        Launch source
      </a>
    ` : "",
    nextLaunchWindow ? `<span>${escapeHtml(nextLaunchWindow)}</span>` : ""
  ].filter(Boolean).join("");

  els.launchPageBody.innerHTML = `
    <section class="next-launch-spotlight" aria-labelledby="nextLaunchTitle">
      <div class="next-launch-media">
        ${nextLaunch.imageUrl
          ? `<img src="${escapeHtml(nextLaunch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(nextLaunch, nextLaunchName))}">`
          : `<div class="launch-page-media-placeholder"><i class="fa-solid fa-rocket acadia-icon" aria-hidden="true"></i></div>`}
      </div>
      <div class="next-launch-content">
        <div class="next-launch-heading">
          <div>
            <p class="section-kicker mb-2">Next SpaceX launch</p>
            <h2 class="next-launch-title mb-0" id="nextLaunchTitle">
              ${escapeHtml(getLaunchMissionLabel(nextLaunchName))}
              ${nextLaunchName.mission ? `<span>${escapeHtml(nextLaunchName.vehicle)}</span>` : ""}
            </h2>
          </div>
          <span class="launch-status-pill">${escapeHtml(nextLaunch.status)}</span>
        </div>
        <div class="next-launch-keyfacts">${nextLaunchFacts}</div>
        <p class="launch-page-summary">${escapeHtml(truncateText(nextLaunch.details, 300))}</p>
        ${nextLaunchActionItems ? `<div class="next-launch-actions">${nextLaunchActionItems}</div>` : ""}
      </div>
    </section>
    <section class="launch-timeline-section" aria-labelledby="upcomingLaunchesTitle">
      <div class="launch-timeline-section-header">
        <div>
          <p class="section-kicker mb-1">Upcoming launches</p>
          <h2 class="section-title mb-0" id="upcomingLaunchesTitle">Next missions to watch</h2>
        </div>
        <p class="launch-count mb-0">${launches.length} upcoming SpaceX launches</p>
      </div>
      <div class="launch-timeline-list">${scheduleRows}</div>
    </section>
  `;
}

async function loadLaunches() {
  setLaunchPageStatus("Preparing the launch manifest.");
  setBusy(els.launchPageBody, true);

  if (els.refreshButton) {
    els.refreshButton.disabled = true;
    els.refreshButton.innerHTML = REFRESHING_BUTTON_HTML;
  }

  try {
    renderLaunches(normalizeLaunches(await fetchJson(LAUNCHES_API)));
    setLaunchPageStatus("Launch manifest is ready.");
    setLaunchesUpdated();
  } catch (error) {
    setError("The launch manifest did not come through. Try refreshing in a moment.");
    setLaunchPageStatus("Houston, we have a problem. Launch telemetry did not arrive.");
    setLaunchesUpdated("Last updated: Signal lost");
  } finally {
    setBusy(els.launchPageBody, false);

    if (els.refreshButton) {
      els.refreshButton.disabled = false;
      els.refreshButton.innerHTML = REFRESH_BUTTON_HTML;
    }
  }
}

if (els.refreshButton) {
  els.refreshButton.addEventListener("click", loadLaunches);
}

initThemeControl();
loadLaunches();
