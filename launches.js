const LAUNCHES_API = "/api/launches?limit=20";
const THEME_STORAGE_KEY = "apollo-theme";
const THEME_COLORS = {
  dark: "#0B0B0B",
  light: "#F5F5F5"
};
const REFRESH_BUTTON_HTML = `<i class="fa-solid fa-rotate-right acadia-icon" aria-hidden="true"></i><span>Refresh data</span>`;
const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner acadia-activity-indicator is-small" aria-hidden="true"></span><span>Refreshing data</span>`;
const ERROR_PREFIX = "Data unavailable.";
let calendarSchedule = { launches: [], checkedAt: "" };

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

function formatLastChecked(date = new Date()) {
  return `Last checked: ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
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

function formatLaunchWindow(launch) {
  if (!hasPreciseLaunchTime(launch)) return "";
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
  if (!hasPreciseLaunchTime(launch)) return "Time not confirmed";
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

function hasPreciseLaunchTime(launch) {
  return LaunchTiming.precise(launch);
}

function formatLaunchTarget(launch) {
  return LaunchTiming.target(launch, true);
}

function normalizeLaunches(data) {
  if (!Array.isArray(data?.launches) || data.launches.some(launch => !getText(launch?.name) || !Number.isFinite(LaunchTiming.timestamp(launch?.dateUtc)))) throw new Error("Launch schedule response invalid");
  const launches = data.launches;

  return launches
    .map((launch) => ({
      id: getText(launch?.id),
      datePrecision: getText(launch?.datePrecision),
      statusId: Number.isInteger(launch?.statusId) ? launch.statusId : null,
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

  els.themeToggle.classList.toggle("is-dark", isDark);
  els.themeToggle.classList.toggle("is-light", !isDark);
  els.themeToggle.setAttribute("aria-label", label);
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
  els.themeToggle.title = isDark ? "Dark mode" : "Light mode";

  if (icon) {
    icon.className = `fa-solid ${isDark ? "fa-toggle-on" : "fa-toggle-off"} acadia-icon`;
  }
}

function updateThemeColorMeta(theme) {
  const themeColorMeta = document.querySelector("meta[name='theme-color']");

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.light);
  }
}

function applyTheme(theme) {
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
    const currentTheme = document.documentElement.getAttribute("data-acadia-theme") === "light" ? "light" : "dark";
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
  const text = getText(message, "Launch schedule source unavailable.");
  els.launchPageBody.innerHTML = renderLaunchesUnavailable(text.startsWith(ERROR_PREFIX) ? text : `${ERROR_PREFIX} ${text}`);
}

function stateMessage(message, options = {}) {
  const tone = options.tone === "warning" ? " state-message-warning" : "";
  const icon = options.tone === "warning" ? "fa-circle-exclamation" : "fa-circle-info";
  const role = options.role ? ` role="${escapeHtml(options.role)}"` : "";

  return `
    <div class="state-message acadia-alert${tone}"${role}>
      <i class="fa-solid ${icon} acadia-icon" aria-hidden="true"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function renderLaunchesUnavailable(message) {
  return `
    <div class="source-unavailable-state acadia-muted-panel" role="alert">
      <div class="source-unavailable-heading">
        <span class="source-unavailable-icon"><i class="fa-solid fa-circle-exclamation acadia-icon" aria-hidden="true"></i></span>
        <div>
          <p class="section-kicker acadia-kicker">Source checked</p>
          <h3 class="source-unavailable-title acadia-lead">Data unavailable</h3>
        </div>
      </div>
      <p class="source-unavailable-copy acadia-body acadia-text-measure-wide">${escapeHtml(message)}</p>
      <div class="source-unavailable-recovery acadia-body acadia-text-measure-wide">
        <p class="acadia-body "><strong>Recovery:</strong> Refresh again shortly or open The Space Devs source to check availability.</p>
        <p class="acadia-body "><strong>Source checked:</strong> The Space Devs launch source.</p>
      </div>
      <div class="source-unavailable-actions acadia-cluster">
        <button class="acadia-button acadia-button-secondary source-unavailable-retry" type="button" data-launches-retry>
          <i class="fa-solid fa-rotate-right acadia-icon" aria-hidden="true"></i>
          Try The Space Devs again
        </button>
        <a class="source-link acadia-button acadia-button-secondary" href="https://thespacedevs.com/llapi" target="_blank" rel="noopener noreferrer" aria-label="Open The Space Devs launch source">
          <i class="fa-solid fa-up-right-from-square acadia-icon" aria-hidden="true"></i>
          Open The Space Devs launch source
        </a>
        <a class="source-link acadia-button acadia-button-secondary" href="./index.html">
          <i class="fa-solid fa-gauge-high acadia-icon" aria-hidden="true"></i>
          Dashboard
        </a>
      </div>
    </div>
  `;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function calendarAction(launch, index, checkedAt, context) {
  const reason = LaunchCalendar.unavailableReason(launch, checkedAt);
  const helpId = `launchCalendarHelp-${context}-${index}`;
  return `<div class="acadia-copy-stack">
    <div class="acadia-cluster">
      ${launch.sourceUrl ? `<a class="source-link acadia-button acadia-button-secondary" href="${escapeHtml(launch.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open launch source for ${escapeHtml(launch.name)}">Launch source</a>` : ""}
      <button type="button" class="acadia-button acadia-button-secondary" data-launch-calendar="${index}" aria-describedby="${helpId}"${reason ? " disabled" : ""}>Save to calendar<span class="acadia-visually-hidden">: ${escapeHtml(launch.name)}</span></button>
    </div>
    <p id="${helpId}" class="acadia-small acadia-text-muted">${escapeHtml(reason || "Downloads a calendar file. Times can change; saved entries will not update.")}</p>
    <p class="acadia-small" role="status" data-calendar-result></p>
  </div>`;
}

function saveLaunchCalendar(index, button) {
  const launch = calendarSchedule.launches[index];
  const status = button.closest(".acadia-copy-stack").querySelector("[data-calendar-result]");
  const returnUrl = new URL(`./launches.html#launch-${encodeURIComponent(launch?.id || "")}`, window.location.href).href;
  const content = LaunchCalendar.build(launch, calendarSchedule.checkedAt, returnUrl);
  if (!content) {
    if (status) status.textContent = LaunchCalendar.unavailableReason(launch, calendarSchedule.checkedAt);
    return;
  }
  try {
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `apollo-launch-${launch.id}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    if (status) status.textContent = "Calendar file ready. Open it in your calendar to add this target.";
  } catch {
    if (status) status.textContent = "The calendar file could not be prepared. Try again or keep the launch source link.";
  }
}

function renderLaunches(launches, checkedAt = "") {
  calendarSchedule = { launches, checkedAt };
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
    const countdownLabel = LaunchTiming.countdown(launch);
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
      <article id="${launch.id ? `launch-${escapeHtml(encodeURIComponent(launch.id))}` : `launch-row-${index}`}" class="acadia-muted-panel launch-timeline-row${index === 0 ? " launch-timeline-row-next" : ""}" aria-labelledby="${rowTitleId}">
        <div class="launch-timeline-rail">
          <span><span class="acadia-visually-hidden">Countdown </span>${escapeHtml(countdownLabel)}</span>
        </div>
        <div class="launch-timeline-main">
          <div class="launch-timeline-header">
            <div>
              <p class="launch-timeline-when acadia-small acadia-text-muted">${escapeHtml(formatLaunchTarget(launch))}</p>
              <h3 class="launch-timeline-title acadia-lead" id="${rowTitleId}">${escapeHtml(missionLabel)}</h3>
              ${launchName.mission && missionLabel !== launchName.vehicle ? `<p class="launch-timeline-vehicle acadia-small acadia-text-muted">${escapeHtml(launchName.vehicle)}</p>` : ""}
            </div>
            <span class="launch-status-pill acadia-badge acadia-badge-grey acadia-badge-round">${escapeHtml(launch.status)}</span>
          </div>
          <div class="launch-timeline-facts acadia-small acadia-text-muted">
            <span><i class="fa-solid fa-location-dot acadia-icon" aria-hidden="true"></i>${escapeHtml(launchLocation)}</span>
            <span><i class="fa-regular fa-clock acadia-icon" aria-hidden="true"></i>${escapeHtml(launchWindowSummary)}</span>
          </div>
          <details class="data-details acadia-accordion-item launch-details launch-timeline-details">
            <summary class="acadia-accordion-summary" aria-label="Show mission details for ${escapeHtml(launch.name)}">Mission details</summary>
            <div class="data-detail-panel acadia-accordion-panel">
              <p class="acadia-body ">${escapeHtml(truncateText(launch.details, 360))}</p>
              ${detailRows ? `<dl class="detail-list">${detailRows}</dl>` : ""}
            </div>
          </details>
          ${calendarAction(launch, index, checkedAt, "schedule")}
        </div>
      </article>
    `;
  }).join("");
  const nextLaunchFacts = [
    ["Target", formatLaunchTarget(nextLaunch)],
    ["Countdown", LaunchTiming.countdown(nextLaunch)],
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

  els.launchPageBody.innerHTML = `
    <section class="next-launch-spotlight acadia-muted-panel" aria-labelledby="nextLaunchTitle">
      <div class="next-launch-media acadia-thumbnail">
        ${nextLaunch.imageUrl
          ? `<img src="${escapeHtml(nextLaunch.imageUrl)}" alt="${escapeHtml(formatLaunchImageAlt(nextLaunch, nextLaunchName))}">`
          : `<div class="launch-page-media-placeholder"><i class="fa-solid fa-rocket acadia-icon" aria-hidden="true"></i></div>`}
      </div>
      <div class="next-launch-content">
        <div class="next-launch-heading">
          <div>
            <p class="section-kicker acadia-kicker">Next SpaceX launch</p>
            <h2 class="next-launch-title acadia-heading-small" id="nextLaunchTitle">
              ${escapeHtml(getLaunchMissionLabel(nextLaunchName))}
              ${nextLaunchName.mission ? `<span>${escapeHtml(nextLaunchName.vehicle)}</span>` : ""}
            </h2>
          </div>
          <span class="launch-status-pill acadia-badge acadia-badge-grey acadia-badge-round">${escapeHtml(nextLaunch.status)}</span>
        </div>
        <div class="next-launch-keyfacts">${nextLaunchFacts}</div>
        <p class="acadia-body launch-page-summary">${escapeHtml(truncateText(nextLaunch.details, 300))}</p>
        ${nextLaunchWindow ? `<p class="acadia-small acadia-text-muted">${escapeHtml(nextLaunchWindow)}</p>` : ""}
        ${calendarAction(nextLaunch, 0, checkedAt, "spotlight")}
      </div>
    </section>
    <section class="launch-timeline-section" aria-labelledby="upcomingLaunchesTitle">
      <div class="launch-timeline-section-header">
        <div>
          <p class="section-kicker acadia-kicker">Upcoming launches</p>
          <h2 class="section-title acadia-heading-small" id="upcomingLaunchesTitle">Next missions to watch</h2>
        </div>
        <p class="launch-count acadia-badge acadia-badge-grey acadia-badge-round">${launches.length} upcoming SpaceX launches</p>
      </div>
      <div class="launch-timeline-list">${scheduleRows}</div>
    </section>
  `;
}

function openSavedMission() {
  if (!window.location.hash.startsWith("#launch-")) return;
  // An unavailable source cannot establish that a saved mission is absent.
  if (!calendarSchedule.checkedAt) return;
  const mission = document.getElementById(window.location.hash.slice(1));
  if (mission) {
    mission.querySelector("details").open = true;
    const title = mission.querySelector("h3");
    title.tabIndex = -1;
    title.focus();
  } else {
    const status = document.querySelector("#launchCalendarStatus");
    if (status) { status.hidden = false; status.textContent = "The saved mission is not in this upcoming list. Check its original source for schedule changes."; }
  }
}

async function loadLaunches({ restoreRetryFocus = false } = {}) {
  const retryTrigger = restoreRetryFocus ? document.querySelector("[data-launches-retry]") : null;
  const retryHadFocus = retryTrigger && document.activeElement === retryTrigger;
  setLaunchPageStatus("Loading launch schedule.");
  const calendarStatus = document.querySelector("#launchCalendarStatus");
  if (calendarStatus) { calendarStatus.textContent = ""; calendarStatus.hidden = true; }
  setBusy(els.launchPageBody, true);

  if (els.refreshButton) {
    els.refreshButton.disabled = true;
    els.refreshButton.innerHTML = REFRESHING_BUTTON_HTML;
  }

  try {
    const data = await fetchJson(LAUNCHES_API);
    renderLaunches(normalizeLaunches(data), data.checkedAt);
    setLaunchPageStatus("Launch schedule loaded.");
    setLaunchesUpdated();
  } catch (error) {
    calendarSchedule = { launches: [], checkedAt: "" };
    setError("Launch schedule source unavailable. Try refreshing in a moment.");
    setLaunchPageStatus("Data unavailable. Launch schedule source unavailable.");
    setLaunchesUpdated(formatLastChecked());
  } finally {
    setBusy(els.launchPageBody, false);

    if (els.refreshButton) {
      els.refreshButton.disabled = false;
      els.refreshButton.innerHTML = REFRESH_BUTTON_HTML;
    }
    // Replacing the result panel removes its focused retry button. Restore the
    // equivalent control, unless the user has moved elsewhere while waiting.
    if (retryHadFocus && (document.activeElement === document.body || document.activeElement === retryTrigger)) {
      (document.querySelector("[data-launches-retry]") || els.refreshButton)?.focus();
    }
  }
}

if (els.refreshButton) {
  els.refreshButton.addEventListener("click", loadLaunches);
  els.refreshButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      loadLaunches();
    }
  });
}

document.addEventListener("click", (event) => {
  const calendarButton = event.target.closest("[data-launch-calendar]");
  if (calendarButton && !calendarButton.disabled) saveLaunchCalendar(Number(calendarButton.dataset.launchCalendar), calendarButton);
  if (event.target.closest("[data-launches-retry]")) {
    loadLaunches({ restoreRetryFocus: true });
  }
});

initThemeControl();
window.addEventListener("hashchange", openSavedMission);
loadLaunches().then(openSavedMission);
