const API = {
  apod: "/api/apod",
  iss: "https://api.wheretheiss.at/v1/satellites/25544",
  people: "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json",
  launches: "https://api.spacexdata.com/v5/launches/upcoming",
  launchLibrary: "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?search=SpaceX&limit=5",
  neo: "/api/neo"
};

const NASA_RATE_LIMIT_MESSAGE = "NASA data is temporarily paused because NASA is limiting requests or the server API key needs attention. The rest of the dashboard is still live.";

const els = {
  refreshButton: document.querySelector("#refreshButton"),
  refreshButtonMobile: document.querySelector("#refreshButtonMobile"),
  peopleCount: document.querySelector("#peopleCount"),
  peopleUpdated: document.querySelector("#peopleUpdated"),
  peopleDetailUpdated: document.querySelector("#peopleDetailUpdated"),
  peopleBody: document.querySelector("#peopleBody"),
  issLat: document.querySelector("#issLat"),
  issUpdated: document.querySelector("#issUpdated"),
  issDetailUpdated: document.querySelector("#issDetailUpdated"),
  issBody: document.querySelector("#issBody"),
  neoCount: document.querySelector("#neoCount"),
  neoUpdated: document.querySelector("#neoUpdated"),
  neoDetailUpdated: document.querySelector("#neoDetailUpdated"),
  neoBody: document.querySelector("#neoBody"),
  launchCount: document.querySelector("#launchCount"),
  launchUpdated: document.querySelector("#launchUpdated"),
  launchDetailUpdated: document.querySelector("#launchDetailUpdated"),
  launchBody: document.querySelector("#launchBody"),
  apodUpdated: document.querySelector("#apodUpdated"),
  apodBody: document.querySelector("#apodBody")
};

function formatUpdated(date = new Date()) {
  return `Updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatNumber(value, options = {}) {
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

function setTimestamp(elements, value = formatUpdated()) {
  elements.forEach((element) => {
    element.textContent = value;
  });
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
    const data = await fetchJson(API.apod);
    const title = escapeHtml(data.title || "Astronomy Picture of the Day");
    const mediaUrl = safeHttpUrl(data.url);
    const media = mediaUrl && data.media_type === "image"
      ? `<img class="img-fluid rounded apod-media mb-3" src="${mediaUrl}" alt="${title}">`
      : mediaUrl
        ? `<div class="ratio ratio-16x9 mb-3"><iframe class="rounded" src="${mediaUrl}" title="${title}" allowfullscreen></iframe></div>`
        : "";

    els.apodBody.innerHTML = `
      ${media}
      <h3 class="h5 fw-semibold mb-1">${title}</h3>
      <p class="text-secondary small mb-2">${data.date ? formatDate(data.date) : "Today"}</p>
      <p class="mb-0">${escapeHtml(data.explanation || "No description available.")}</p>
    `;
    setTimestamp([els.apodUpdated]);
  } catch (error) {
    setError(els.apodBody, getApiErrorMessage(error, "NASA APOD is unavailable right now. This feature card will update again when NASA responds, and the rest of the dashboard remains live."));
    els.apodUpdated.textContent = "Error";
  }
}

async function loadIss() {
  try {
    const data = await fetchJson(API.iss);
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const updated = formatUpdated();

    els.issLat.innerHTML = Number.isFinite(latitude) && Number.isFinite(longitude)
      ? `<span>${formatNumber(latitude, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span><span class="coordinate-divider"> / </span><span>${formatNumber(longitude, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>`
      : "--";
    setTimestamp([els.issUpdated, els.issDetailUpdated], updated);
    els.issBody.innerHTML = `
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
  } catch (error) {
    els.issLat.textContent = "--";
    els.issUpdated.textContent = "Error";
    els.issDetailUpdated.textContent = "Error";
    setError(els.issBody, "Could not load the ISS location right now.");
  }
}

async function loadPeople() {
  try {
    const data = await fetchJson(API.people);
    const people = Array.isArray(data.people) ? data.people : [];
    const updated = formatUpdated();

    els.peopleCount.textContent = people.length || "--";
    setTimestamp([els.peopleUpdated, els.peopleDetailUpdated], updated);

    if (!people.length) {
      els.peopleBody.innerHTML = stateMessage("No crew data available.");
      return;
    }

    els.peopleBody.innerHTML = `
      <ul class="list-group list-group-flush">
        ${people.map((person) => `
          <li class="list-group-item px-0 py-3 d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3">
            <span class="fw-semibold">${escapeHtml(person.name)}</span>
            <span class="text-secondary text-sm-end">${escapeHtml(person.craft || "Spacecraft unknown")}</span>
          </li>
        `).join("")}
      </ul>
    `;
  } catch (error) {
    els.peopleCount.textContent = "--";
    els.peopleUpdated.textContent = "Error";
    els.peopleDetailUpdated.textContent = "Error";
    setError(els.peopleBody, "Could not load people-in-space data right now.");
  }
}

async function loadLaunches() {
  try {
    let launches = [];

    try {
      const data = await fetchJson(API.launches);
      launches = Array.isArray(data)
        ? data.sort((a, b) => new Date(a.date_utc) - new Date(b.date_utc)).slice(0, 5)
        : [];
    } catch (error) {
      const fallbackData = await fetchJson(API.launchLibrary);
      launches = Array.isArray(fallbackData.results)
        ? fallbackData.results.map((launch) => ({
            name: launch.name,
            date_utc: launch.net,
            upcoming: true,
            details: launch.mission?.description || launch.status?.name,
            links: { patch: { small: launch.image?.thumbnail_url || launch.image?.image_url } }
          }))
        : [];
    }
    const updated = formatUpdated();

    els.launchCount.textContent = launches.length || "--";
    setTimestamp([els.launchUpdated, els.launchDetailUpdated], updated);

    if (!launches.length) {
      els.launchBody.innerHTML = stateMessage("No upcoming SpaceX launches are available from the current data source.");
      return;
    }

    els.launchBody.innerHTML = `
      <div class="list-group list-group-flush">
        ${launches.map((launch) => {
          const patchUrl = safeHttpUrl(launch.links?.patch?.small);
          const badge = launch.upcoming
            ? `<span class="badge text-bg-primary">Upcoming</span>`
            : `<span class="badge text-bg-secondary">${launch.success ? "Success" : "Completed"}</span>`;
          return `
            <article class="list-group-item px-0 py-3">
              <div class="d-flex gap-3">
                ${patchUrl ? `<img src="${patchUrl}" alt="" width="44" height="44" class="d-none d-sm-block">` : ""}
                <div class="flex-grow-1">
                  <div class="d-flex flex-column flex-sm-row justify-content-sm-between gap-2">
                    <h3 class="h6 mb-0">${escapeHtml(launch.name)}</h3>
                    <div>${badge}</div>
                  </div>
                  <p class="text-secondary small mb-2">${formatDate(launch.date_utc)}</p>
                  <p class="mb-0 text-body-secondary">${escapeHtml(launch.details || "No mission details available.")}</p>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  } catch (error) {
    els.launchCount.textContent = "--";
    els.launchUpdated.textContent = "Error";
    els.launchDetailUpdated.textContent = "Error";
    setError(els.launchBody, "Could not load upcoming SpaceX launches right now. Other dashboard sections remain available.");
  }
}

async function loadNeo() {
  try {
    const date = todayIso();
    const data = await fetchJson(`${API.neo}?date=${date}`);
    const asteroids = data.near_earth_objects?.[date] || [];
    const hazardous = asteroids.filter((item) => item.is_potentially_hazardous_asteroid).length;
    const closest = asteroids
      .map((item) => Number(item.close_approach_data?.[0]?.miss_distance?.kilometers))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0];
    const updated = formatUpdated();

    els.neoCount.textContent = asteroids.length || "0";
    setTimestamp([els.neoUpdated, els.neoDetailUpdated], updated);
    els.neoBody.innerHTML = `
      <div class="metadata-grid mb-3">
        <div>
          <p class="text-secondary small mb-1">Asteroids listed today</p>
          <p class="fw-semibold mb-0">${asteroids.length}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Potentially hazardous</p>
          <p class="fw-semibold mb-0">${hazardous}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Closest approach</p>
          <p class="fw-semibold mb-0">${Number.isFinite(closest) ? `${Math.round(closest).toLocaleString()} km` : "Unavailable"}</p>
        </div>
        <div>
          <p class="text-secondary small mb-1">Date window</p>
          <p class="fw-semibold mb-0">${formatDate(date)}</p>
        </div>
      </div>
      ${asteroids.length ? `
        <ul class="list-group list-group-flush">
          ${asteroids.slice(0, 4).map((item) => `
            <li class="list-group-item px-0 py-3 d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3">
              <span>${escapeHtml(item.name)}</span>
              <span class="text-secondary text-sm-end">${Math.round(Number(item.estimated_diameter.kilometers.estimated_diameter_max) * 1000)} m max</span>
            </li>
          `).join("")}
        </ul>
      ` : stateMessage("No near-Earth objects reported for today.")}
    `;
  } catch (error) {
    els.neoCount.textContent = "--";
    els.neoUpdated.textContent = "Error";
    els.neoDetailUpdated.textContent = "Error";
    setError(els.neoBody, getApiErrorMessage(error, "NASA asteroid data is unavailable right now. Other live sections remain available."));
  }
}

async function loadDashboard() {
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
loadDashboard();
