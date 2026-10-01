// Launch-day editorial semantics are Apollo-owned; UI primitives are Acadia.
function getCrewedLaunchDayState(payload, now = new Date()) {
  const current = new Date(now);
  const checked = Date.parse(payload?.checkedAt);
  if (!Array.isArray(payload?.launches) || !Number.isFinite(checked) ||
      +current - checked < -60000 || +current - checked > 30 * 60000) {
    throw new Error("Crewed launch schedule is unavailable or stale");
  }
  const today = value => {
    const date = new Date(value);
    return Number.isFinite(+date) && date.getFullYear() === current.getFullYear() &&
      date.getMonth() === current.getMonth() && date.getDate() === current.getDate();
  };
  return payload.launches.filter(launch => launch.crewed === true && today(launch.dateUtc) &&
    /^(second|minute|hour|day)$/i.test(launch.datePrecision || "") &&
    !/cancel/i.test(launch.status || ""))
    .sort((a, b) => Date.parse(a.dateUtc) - Date.parse(b.dateUtc))
    .map(launch => {
      const completed = [3, 4, 7].includes(launch.statusId) || /success|failure/i.test(launch.status || "");
      const held = [5, 6].includes(launch.statusId) || /hold|scrub|abort/i.test(launch.status || "");
      const elapsed = Date.parse(launch.dateUtc) <= +current;
      return { ...launch, completed, held,
        timingLabel: completed ? "Launch time" : held ? "Previous target" : "Target launch",
        timingNote: completed ? "Launch outcome reported by the source."
          : held ? "The launch is on hold or scrubbed. Check mission updates for a new target."
          : elapsed ? "The target time has passed. Check coverage for the latest status."
          : "Launch times can change. Follow coverage for the latest updates." };
    });
}

function crewedLaunchFeatureHtml(launches, checkedAt) {
  return launches.map((launch, index) => {
    const title = getText(launch.missionName) || splitLaunchName(launch.name).mission || launch.name;
    const image = safeHttpUrl(launch.imageUrl);
    const watch = safeHttpUrl(launch.watchUrl);
    const source = safeHttpUrl(launch.missionUrl) || safeHttpUrl(launch.sourceUrl);
    const id = `crewedLaunch${index}`;
    const timing = /^day$/i.test(launch.datePrecision) ? formatDate(launch.dateUtc) :
      new Date(launch.dateUtc).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
    return `<article class="acadia-card acadia-surface apollo-crewed-hero" aria-labelledby="${id}Title">
      <div class="acadia-panel-spacious acadia-stack apollo-crewed-copy">
        <div class="acadia-cluster">
          <p class="acadia-kicker">Human spaceflight · Today</p>
          <span class="acadia-badge acadia-badge-grey">${escapeHtml(launch.status)}</span>
        </div>
        <div class="acadia-copy-stack">
          <h2 id="${id}Title" class="acadia-display" tabindex="-1">${escapeHtml(title)}</h2>
          <p class="acadia-body acadia-text-muted">${escapeHtml(launch.provider)}${launch.vehicle ? ` · ${escapeHtml(launch.vehicle)}` : ""}</p>
          ${launch.destination ? `<p class="acadia-heading-small">${escapeHtml(launch.destination)}</p>` : ""}
        </div>
        ${launch.details ? `<p class="acadia-body acadia-text-measure">${escapeHtml(launch.details)}</p>` : ""}
        <div class="acadia-copy-stack">
          <p class="acadia-body"><strong>${escapeHtml(launch.timingLabel)}</strong> · ${escapeHtml(timing)}${/^day$/i.test(launch.datePrecision) ? " · Time not confirmed" : ""}</p>
          ${launch.location ? `<p class="acadia-small acadia-text-muted">${escapeHtml(launch.location)}</p>` : ""}
          <p class="acadia-small acadia-text-muted">${escapeHtml(launch.timingNote)}</p>
        </div>
        ${launch.crew?.length ? `<p class="acadia-small"><strong>Launch crew</strong> · ${launch.crew.map(member => escapeHtml(member.name)).join(" · ")}</p>` : ""}
        <div class="acadia-cluster">
          ${watch ? `<a id="${id}Watch" class="acadia-button acadia-button-primary" href="${escapeHtml(watch)}" target="_blank" rel="noopener noreferrer">${launch.completed ? "Watch launch coverage" : "Watch coverage"}<span class="acadia-visually-hidden"> (opens in a new tab)</span></a>` : ""}
          ${source ? `<a id="${id}Source" class="acadia-button ${watch ? "acadia-button-secondary" : "acadia-button-primary"}" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Mission updates<span class="acadia-visually-hidden"> (opens in a new tab)</span></a>` : ""}
        </div>
        <p class="acadia-small acadia-text-muted">The Space Devs · Schedule checked ${escapeHtml(new Date(checkedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }))}</p>
      </div>
      ${image ? `<figure class="apollo-crewed-media">
        <img class="acadia-thumbnail" src="${escapeHtml(image)}" alt="${escapeHtml(getText(launch.imageDescription, `Mission image for ${title}`))}" onerror="this.closest('figure').hidden = true; this.closest('article').classList.add('apollo-crewed-no-image')">
        <figcaption class="acadia-small acadia-text-muted">${escapeHtml(getText(launch.imageDescription, "Mission image"))}${launch.imageCredit ? ` · ${escapeHtml(launch.imageCredit)}` : ""}${safeHttpUrl(launch.imageLicenseUrl) ? ` · <a href="${escapeHtml(safeHttpUrl(launch.imageLicenseUrl))}" target="_blank" rel="noopener noreferrer">Image licence<span class="acadia-visually-hidden"> (opens in a new tab)</span></a>` : ""}</figcaption>
      </figure>` : ""}
    </article>`;
  }).join("");
}

function initCrewedLaunchFeature() {
  const feature = document.querySelector("#crewedLaunchFeature");
  if (!feature) return;
  let payload = null;
  let sequence = 0;
  let controller = null;
  let lastAttempt = 0;
  let failed = false;
  let renderedHtml = "";

  function render() {
    let launches = [];
    if (payload) {
      try { launches = getCrewedLaunchDayState(payload); }
      catch { failed = true; payload = null; }
    }
    const html = failed ? `<div class="acadia-alert"><span>Today’s crewed launch schedule is unavailable.</span> <button id="crewedLaunchRetry" class="acadia-button acadia-button-secondary" type="button">Retry launch schedule</button></div>`
      : launches.length ? crewedLaunchFeatureHtml(launches, payload.checkedAt) : "";
    if (html === renderedHtml) return;
    const active = feature.contains(document.activeElement) ? document.activeElement : null;
    const activeId = active?.id;
    const activeHref = active?.getAttribute("href");
    feature.innerHTML = html;
    feature.hidden = !html;
    renderedHtml = html;
    if (active) {
      const replacement = activeId ? document.getElementById(activeId) : null;
      (replacement && replacement.getAttribute("href") === activeHref ? replacement :
        document.querySelector("#crewedLaunch0Title") || document.querySelector("#briefHeadline"))?.focus({ preventScroll: true });
    }
    // Keep the ordinary brief useful instead of repeating today's hero mission.
    dashboardData.crewedLaunches = launches;
    renderSpaceBrief();
  }

  async function refresh() {
    const requestId = ++sequence;
    lastAttempt = Date.now();
    controller?.abort();
    controller = new AbortController();
    const currentController = controller;
    const timeout = window.setTimeout(() => currentController.abort(), 15000);
    feature.setAttribute("aria-busy", "true");
    try {
      const response = await fetch("/api/launches?scope=crewed", { signal: currentController.signal });
      if (!response.ok) throw new Error("Schedule unavailable");
      const next = await response.json();
      getCrewedLaunchDayState(next);
      if (requestId !== sequence) return;
      payload = next;
      failed = false;
    } catch {
      if (requestId !== sequence) return;
      payload = null;
      failed = true;
    } finally {
      window.clearTimeout(timeout);
      if (requestId === sequence) {
        feature.setAttribute("aria-busy", "false");
        render();
      }
    }
  }
  feature.addEventListener("click", event => {
    if (event.target.closest("#crewedLaunchRetry")) refresh();
  });
  [els.refreshButton, els.refreshButtonMobile].filter(Boolean).forEach(button => {
    button.addEventListener("click", refresh);
    // The existing dashboard handles keyboard activation with preventDefault.
    button.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") refresh();
    });
  });
  // Re-evaluate the date/status as time passes; fetch at most once per 15 min.
  window.setInterval(() => {
    if (document.visibilityState === "hidden") return;
    render();
    if (Date.now() - lastAttempt >= 15 * 60000) refresh();
  }, 60000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      render();
      if (Date.now() - lastAttempt >= 15 * 60000) refresh();
    }
  });
  refresh();
}

initCrewedLaunchFeature();
