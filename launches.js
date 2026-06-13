const LAUNCHES_API = "/api/launches?limit=20";
const THEME_STORAGE_KEY = "apollo-theme";

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
  els.launchPageBody.innerHTML = `
    <div class="alert alert-warning mb-0 py-3" role="alert">
      ${escapeHtml(message)}
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
    els.launchPageBody.innerHTML = `<p class="state-message text-secondary mb-0">No upcoming SpaceX launches are available from the current data source.</p>`;
    return;
  }

  const nextLaunch = launches[0];
  const nextLaunchName = splitLaunchName(nextLaunch.name);
  const nextLaunchWindow = formatLaunchWindow(nextLaunch);
  const nextLaunchWindowSummary = formatLaunchWindowSummary(nextLaunch);
  const nextLaunchDetails = [
    ["Status", nextLaunch.status],
    ["Vehicle", nextLaunch.vehicle || nextLaunchName.vehicle],
    ["Window length", nextLaunchWindowSummary],
    ["Launch window", nextLaunchWindow],
    ["Pad", nextLaunch.pad],
    ["Location", nextLaunch.location]
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `
      <div>
        <dt>${label}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>
    `)
    .join("");

  els.launchPageBody.innerHTML = `
    <section class="next-launch-spotlight" aria-labelledby="nextLaunchTitle">
      <div class="next-launch-media">
        ${nextLaunch.imageUrl
          ? `<img src="${escapeHtml(nextLaunch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(nextLaunch, nextLaunchName))}">`
          : `<div class="launch-page-media-placeholder"><i class="fa-solid fa-rocket" aria-hidden="true"></i></div>`}
      </div>
      <div class="next-launch-content">
        <div class="next-launch-heading">
          <div>
            <p class="section-kicker mb-2">Next SpaceX launch</p>
            <h2 class="next-launch-title mb-0" id="nextLaunchTitle">
              ${escapeHtml(nextLaunchName.vehicle)}
              ${nextLaunchName.mission ? `<span>${escapeHtml(nextLaunchName.mission)}</span>` : ""}
            </h2>
          </div>
          <span class="launch-status-pill">${escapeHtml(nextLaunch.status)}</span>
        </div>
        <div class="next-launch-countdown">
          <div>
            <p class="text-secondary small mb-1">Liftoff target</p>
            <p class="mb-0">${formatDateTime(nextLaunch.dateUtc)}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Countdown</p>
            <p class="mb-0">${formatCountdown(nextLaunch.dateUtc)}</p>
          </div>
          <div>
            <p class="text-secondary small mb-1">Window length</p>
            <p class="mb-0">${escapeHtml(nextLaunchWindowSummary)}</p>
          </div>
        </div>
        <p class="launch-page-summary">${escapeHtml(truncateText(nextLaunch.details, 300))}</p>
        ${nextLaunchDetails ? `<dl class="detail-list next-launch-detail-list mb-3">${nextLaunchDetails}</dl>` : ""}
        ${nextLaunch.sourceUrl ? `
          <a class="source-link" href="${escapeHtml(nextLaunch.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
            Launch feed
          </a>
        ` : ""}
      </div>
    </section>
    <p class="launch-count">${launches.length} upcoming SpaceX launches</p>
    <div class="launch-page-list">
      ${launches.map((launch) => {
        const launchName = splitLaunchName(launch.name);
        const launchWindow = formatLaunchWindow(launch);
        const launchWindowSummary = formatLaunchWindowSummary(launch);
        const detailRows = [
          ["Provider", launch.provider],
          ["Vehicle", launch.vehicle || launchName.vehicle],
          ["Status", launch.status],
          ["Window length", launchWindowSummary],
          ["Launch window", launchWindow],
          ["Pad", launch.pad],
          ["Location", launch.location]
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
          <article class="launch-page-card">
            <div class="launch-page-media">
              ${launch.imageUrl
                ? `<img src="${escapeHtml(launch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(launch, launchName))}">`
                : `<div class="launch-page-media-placeholder"><i class="fa-solid fa-rocket" aria-hidden="true"></i></div>`}
            </div>
            <div class="launch-page-content">
              <div class="launch-page-title-row">
                <div>
                  <p class="launch-meta">${formatDateTime(launch.dateUtc)} · ${formatCountdown(launch.dateUtc)}</p>
                  <h2 class="launch-page-title mb-0">
                    ${escapeHtml(launchName.vehicle)}
                    ${launchName.mission ? `<span class="launch-mission">${escapeHtml(launchName.mission)}</span>` : ""}
                  </h2>
                  <p class="launch-window-summary mb-0">${escapeHtml(launchWindowSummary)}</p>
                </div>
                <span class="launch-status-pill">${escapeHtml(launch.status)}</span>
              </div>
              <p class="launch-page-summary">${escapeHtml(truncateText(launch.details))}</p>
              ${detailRows ? `<dl class="detail-list mb-3">${detailRows}</dl>` : ""}
              ${launch.sourceUrl ? `
                <a class="source-link" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer">
                  <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                  Launch feed
                </a>
              ` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

async function loadLaunches() {
  setLaunchPageStatus("Refreshing launch data.");
  setBusy(els.launchPageBody, true);

  if (els.refreshButton) {
    els.refreshButton.disabled = true;
    els.refreshButton.innerHTML = "Refreshing";
  }

  try {
    renderLaunches(normalizeLaunches(await fetchJson(LAUNCHES_API)));
    setLaunchPageStatus("Launch data refreshed.");
    setLaunchesUpdated();
  } catch (error) {
    setError("Could not load upcoming SpaceX launches right now.");
    setLaunchPageStatus("Launch data could not be loaded.");
  } finally {
    setBusy(els.launchPageBody, false);

    if (els.refreshButton) {
      els.refreshButton.disabled = false;
      els.refreshButton.innerHTML = "Refresh data";
    }
  }
}

if (els.refreshButton) {
  els.refreshButton.addEventListener("click", loadLaunches);
}

initThemeControl();
loadLaunches();
