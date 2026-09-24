const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.join(__dirname, "..");

const allHtmlPages = [
  "index.html",
  "iss.html",
  "launches.html",
  "asteroids.html",
  "weather.html",
  "gallery.html",
  "anomalies.html"
];

const v1NavLinks = [
  { href: "./index.html", label: "Dashboard" },
  { href: "./iss.html", label: "ISS" },
  { href: "./launches.html", label: "Launches" },
  { href: "./gallery.html", label: "Gallery" }
];

const watchNavLinks = [
  { href: "./weather.html", label: "Weather", page: "weather.html" },
  { href: "./asteroids.html", label: "Asteroids", page: "asteroids.html" },
  { href: "./anomalies.html", label: "Anomalies", page: "anomalies.html" }
];

const publicPageNavLinks = [
  { href: "./index.html", label: "Dashboard" },
  { href: "./iss.html", label: "ISS" },
  { href: "./launches.html", label: "Launches" },
  { href: "./weather.html", label: "Weather" },
  { href: "./asteroids.html", label: "Asteroids" },
  { href: "./gallery.html", label: "Gallery" },
  { href: "./anomalies.html", label: "Anomalies" }
];

const dashboardNavLinks = [
  { href: "#dashboard", label: "Dashboard" },
  ...publicPageNavLinks.slice(1)
];

const pages = [
  {
    file: "index.html",
    name: "dashboard",
    skipTarget: "dashboard",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "Dashboard",
    expectedNavLinks: dashboardNavLinks,
    controlledIds: [
      "quickStatsBody",
      "spaceBriefBody",
      "recentActivityBody",
      "watchItemsBody",
      "sourceStatusBody"
    ]
  },
  {
    file: "iss.html",
    name: "ISS page",
    skipTarget: "iss-content",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "ISS",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["issBody", "peopleBody"]
  },
  {
    file: "launches.html",
    name: "launches page",
    skipTarget: "launch-content",
    headingId: "launchesTitle",
    statusId: "launchPageStatus",
    refreshButtonId: "launchesRefreshButton",
    activeNavLabel: "Launches",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["launchPageBody"]
  },
  {
    file: "asteroids.html",
    name: "asteroids page",
    skipTarget: "asteroids-content",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "Asteroids",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["neoRiskAlert", "neoBody"]
  },
  {
    file: "weather.html",
    name: "weather page",
    skipTarget: "weather-content",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "Weather",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["spaceWeatherBody"]
  },
  {
    file: "gallery.html",
    name: "gallery page",
    skipTarget: "gallery-content",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "Gallery",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["apodBody"]
  },
  {
    file: "anomalies.html",
    name: "anomalies page",
    skipTarget: "anomalies-content",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    activeNavLabel: "Anomalies",
    expectedNavLinks: publicPageNavLinks,
    controlledIds: ["skyAnomaliesBody"]
  }
];

function readProjectFile(file) {
  return fs.readFileSync(path.join(rootDir, file), "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTagByAttribute(html, tagName, attrName, attrValue) {
  const attr = `${escapeRegExp(attrName)}=["'][^"']*\\b${escapeRegExp(attrValue)}\\b[^"']*["']`;
  const pattern = new RegExp(`<${tagName}\\b(?=[^>]*${attr})[^>]*>`, "i");
  const match = html.match(pattern);
  return match ? match[0] : "";
}

function getTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(pattern) || [];
}

function getAttribute(tag, attrName) {
  const match = tag.match(new RegExp(`\\b${escapeRegExp(attrName)}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function getElementByClass(html, tagName, className) {
  const pattern = new RegExp(`<${tagName}\\b(?=[^>]*\\bclass=["'][^"']*\\b${escapeRegExp(className)}\\b)[\\s\\S]*?<\\/${tagName}>`, "i");
  const match = html.match(pattern);
  return match ? match[0] : "";
}

function getHeaderPrimaryNav(html) {
  return getElementByClass(html, "nav", "acadia-navbar");
}

function hasClass(tag, className) {
  return getAttribute(tag, "class").split(/\s+/).includes(className);
}

function isNavDestination(tag) {
  const className = getAttribute(tag, "class");
  return /\bapollo-nav-link\b/.test(className) || /\bapollo-nav-menu-item\b/.test(className);
}

for (const page of pages) {
  test(`${page.name} has named landmarks and skip navigation`, () => {
    const html = readProjectFile(page.file);
    const skipLink = getTagByAttribute(html, "a", "class", "apollo-skip-link");
    const nav = getTagByAttribute(html, "nav", "class", "acadia-navbar");
    const main = getTagByAttribute(html, "main", "id", page.skipTarget);
    const heading = getTagByAttribute(html, "h1", "id", page.headingId);

    assert.equal(getAttribute(skipLink, "href"), `#${page.skipTarget}`);
    assert.equal(getAttribute(nav, "aria-label"), "Primary");
    assert.equal(getAttribute(main, "aria-labelledby"), page.headingId);
    assert.ok(heading, `${page.file} should expose a heading for its main landmark`);
  });

  test(`${page.name} exposes primary page navigation`, () => {
    const html = readProjectFile(page.file);

    for (const link of page.expectedNavLinks) {
      const navLink = getTags(html, "a").find((tag) => {
        return getAttribute(tag, "href") === link.href && isNavDestination(tag);
      });

      assert.ok(navLink, `${page.file} should include ${link.label} in primary navigation`);

      if (link.label === page.activeNavLabel) {
        assert.equal(getAttribute(navLink, "aria-current"), "page");
      }
    }
  });

  test(`${page.name} composes Acadia primitives before Apollo adapters`, () => {
    const html = readProjectFile(page.file);
    const app = getTagByAttribute(html, "div", "class", "apollo-app");
    const nav = getTagByAttribute(html, "nav", "class", "acadia-navbar");
    const navGroup = getTagByAttribute(html, "div", "class", "acadia-navbar-links");
    const main = getTagByAttribute(html, "main", "id", page.skipTarget);
    const pageHeader = getTagByAttribute(html, "header", "class", "apollo-page-header");
    const refreshButton = getTagByAttribute(html, "button", "id", page.refreshButtonId);

    assert.ok(hasClass(app, "acadia-app"));
    assert.ok(hasClass(nav, "acadia-navbar"));
    assert.ok(hasClass(navGroup, "acadia-navbar-links"));
    assert.ok(hasClass(main, "acadia-shell"));
    assert.ok(hasClass(pageHeader, "acadia-page-header"));
    assert.ok(hasClass(pageHeader, "acadia-surface"));
    assert.ok(hasClass(pageHeader, page.file === "index.html" ? "acadia-panel" : "acadia-panel-dense"));
    assert.ok(hasClass(refreshButton, "acadia-button"));
    assert.ok(hasClass(refreshButton, "acadia-button-primary"));

    const topLevelNavItems = [
      ...getTags(html, "a").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class"))),
      ...getTags(html, "button").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class")))
    ];

    for (const navItem of topLevelNavItems) {
      assert.ok(["acadia-navbar-link", "acadia-tablet-navigation-link", "acadia-mobile-tab"].some((name) => hasClass(navItem, name)), "Top-level nav items should use Acadia nav anatomy");
    }
  });

  test(`${page.name} refresh control describes and controls dynamic regions`, () => {
    const html = readProjectFile(page.file);
    const status = getTagByAttribute(html, "div", "id", page.statusId);
    const button = getTagByAttribute(html, "button", "id", page.refreshButtonId);
    const controlledIds = getAttribute(button, "aria-controls").split(/\s+/).filter(Boolean);

    assert.equal(getAttribute(status, "aria-live"), "polite");
    assert.equal(getAttribute(status, "aria-atomic"), "true");
    assert.equal(getAttribute(button, "aria-describedby"), page.statusId);
    assert.deepEqual(controlledIds, page.controlledIds);

    for (const id of page.controlledIds) {
      const region = getTagByAttribute(html, "div", "id", id);
      assert.equal(getAttribute(region, "aria-live"), "polite", `${id} should announce updates`);
      assert.equal(getAttribute(region, "aria-busy"), "true", `${id} should start busy while data loads`);
    }
  });

  test(`${page.name} exposes current app icons`, () => {
    const html = readProjectFile(page.file);
    const iconLinks = getTags(html, "link").filter((tag) => getAttribute(tag, "rel") === "icon");
    const touchIcon = getTags(html, "link").find((tag) => getAttribute(tag, "rel") === "apple-touch-icon");

    assert.ok(
      iconLinks.some((tag) => getAttribute(tag, "href") === "./assets/favicon.svg" && getAttribute(tag, "type") === "image/svg+xml"),
      `${page.file} should expose the SVG favicon`
    );
    assert.equal(getAttribute(touchIcon || "", "href"), "./assets/apollo-app-icon-light.png");
  });
}

test("skip link has a visible focus treatment", () => {
  const css = readProjectFile("vendor/acadia/acadia.css");
  assert.match(css, /\.acadia-skip-link:focus-visible/);
  assert.match(css, /transform:\s*translateY\(0\);/);
});

test("ISS map is exposed as a named interactive region", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /class="iss-status-summary acadia-muted-panel"/);
  assert.match(js, /id="issOrbitalBriefText"/);
  assert.match(js, /Normal Operations/);
  assert.match(js, /Current Position/);
  assert.match(js, /Orbital Snapshot/);
  assert.match(js, /Over \$\{escapeHtml\(issRegion\)\}/);
  assert.match(js, /id="issMap" role="region" aria-label="Interactive map showing the current ISS position above Earth"/);
  assert.doesNotMatch(js, /id="issMap" role="img"/);
});

test("ISS status summary stacks and wraps operational metrics", () => {
  const css = readProjectFile("styles.css");
  const statusSummaryRule = css.match(/\.iss-status-summary\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const statusLineRule = css.match(/\.iss-status-line\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const statusMetricRule = css.match(/\.iss-status-line span\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(statusSummaryRule, /grid-template-columns:\s*minmax\(0,\s*1fr\);/);
  assert.match(statusSummaryRule, /align-items:\s*start;/);
  assert.match(statusLineRule, /flex-wrap:\s*wrap;/);
  assert.match(statusLineRule, /justify-content:\s*flex-start;/);
  assert.match(statusMetricRule, /max-width:\s*100%;/);
  assert.match(statusMetricRule, /overflow-wrap:\s*anywhere;/);
});

test("repeated disclosure controls receive item-specific accessible names", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /aria-label="Read full description for \$\{title\}"/);
  assert.match(js, /aria-label="Show mission details for \$\{escapeHtml\(launch\.name\)\}"/);
  assert.match(js, /aria-label="Show approach details for \$\{escapeHtml\(item\.name\)\}"/);
});

test("nonessential interface motion respects reduced motion preferences", () => {
  const shared = readProjectFile("vendor/acadia/acadia.css");
  const local = readProjectFile("styles.css");
  assert.match(shared, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(local, /@keyframes|animation:|transition:/, "Product must not fork shared motion");
});

test("web manifest points to the current SVG favicon", () => {
  const manifest = JSON.parse(readProjectFile("site.webmanifest"));
  const iconSources = manifest.icons.map((icon) => icon.src);

  assert.deepEqual(iconSources, ["assets/favicon.svg"]);
  assert.equal(manifest.icons[0].type, "image/svg+xml");
  assert.equal(manifest.icons[0].sizes, "any");
  assert.equal(manifest.icons[0].purpose, "any maskable");
});

test("Vercel responses include baseline browser hardening headers", () => {
  const config = JSON.parse(readProjectFile("vercel.json"));
  const headers = config.headers?.find((entry) => entry.source === "/(.*)")?.headers || [];
  const valuesByName = Object.fromEntries(headers.map((header) => [header.key, header.value]));

  assert.match(valuesByName["Content-Security-Policy"] || "", /base-uri 'self'/);
  assert.match(valuesByName["Content-Security-Policy"] || "", /frame-ancestors 'self'/);
  assert.match(valuesByName["Content-Security-Policy"] || "", /object-src 'none'/);
  assert.match(valuesByName["Permissions-Policy"] || "", /camera=\(\)/);
  assert.equal(valuesByName["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(valuesByName["X-Content-Type-Options"], "nosniff");
});

test("Apollo brand mark uses the satellite icon on every page", () => {
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    const brand = getElementByClass(html, "a", "navbar-brand");

    assert.match(brand, /\bfa-satellite\b/, `${file} should use the satellite brand icon`);
    assert.doesNotMatch(brand, /\bfa-rocket\b/, `${file} should not use the launch icon as the brand mark`);
  }
});

test("dashboard stops at command-center panels instead of duplicating detail pages", () => {
  const html = readProjectFile("index.html");
  const js = readProjectFile("app.js");

  assert.match(html, /\bid="commandPanels"/);
  assert.match(html, /\bid="recentActivityPanel"/);
  assert.match(html, /\bid="recentActivityBody"/);
  assert.match(html, /\bid="watchItemsBody"/);
  assert.match(html, /\bid="sourceStatusBody"/);
  assert.match(html, /Data Sources/);
  assert.match(js, /hasMeaningfulRecentActivity = rows\.some\(\(row\) => row\.label !== "ISS"\)/);
  assert.match(js, /recentActivityPanel\.hidden = !hasMeaningfulRecentActivity/);
  assert.match(js, /apollo-command-grid-single/);

  for (const removedRegion of ["issBody", "peopleBody", "launchBody", "neoBody", "spaceWeatherBody", "apodBody", "skyAnomaliesBody"]) {
    assert.doesNotMatch(html, new RegExp(`\\bid="${removedRegion}"`), `dashboard should not include ${removedRegion}`);
  }
});

test("dashboard source state avoids overclaiming during partial loads", () => {
  const html = readProjectFile("index.html");
  const js = readProjectFile("app.js");

  assert.match(html, /data-source-state="loading"/);
  assert.doesNotMatch(html, /<span>Live data<\/span>/);
  assert.match(js, /function getSourceStateFamily\(statuses\)/);
  assert.match(js, /pending:\s*"Checking"/);
  assert.match(js, /label:\s*"Partial data"/);
  assert.match(js, /label:\s*"Data unavailable"/);
  assert.match(js, /function updateDynamicRegionsFromStatuses\(statuses, checkedAt = new Date\(\), options = \{\}\)/);
});

test("dashboard source status routes an unavailable source into Apollo recovery", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /id: "apod",[\s\S]*?detailHref: "\.\/gallery\.html"/);
  assert.match(js, /id: "neo",[\s\S]*?detailHref: "\.\/asteroids\.html"/);
  assert.match(js, /feed\.state !== "ok" && feed\.detailHref/);
  assert.match(js, /aria-label="Open \$\{escapeHtml\(feed\.label\)\} details in Apollo"/);
  assert.match(js, /Open details/);
});

test("detail pages render intentional unavailable source states", () => {
  const appJs = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(appJs, /function unavailableStateMarkup/);
  assert.match(appJs, /title = "Data unavailable"/);
  assert.match(appJs, /Apollo cannot reach the current Astronomy Picture of the Day/);
  assert.match(appJs, /Apollo cannot reach the current NASA NeoWs close-approach list/);
  assert.match(appJs, /Apollo cannot reach the current NOAA SWPC K-index and notices/);
  assert.match(appJs, /Apollo cannot reach the current ISS position/);
  assert.match(appJs, /Apollo cannot reach the current crew roster/);
  assert.match(appJs, /<p class="section-kicker acadia-kicker">Source checked<\/p>/);
  assert.match(appJs, /<strong>Recovery:<\/strong>/);
  assert.match(appJs, /Open \$\{escapeHtml\(label\)\} source/);
  assert.match(appJs, /aria-label="Open \$\{escapeHtml\(label\)\} source"/);
  assert.match(appJs, /data-source-retry="\$\{escapeHtml\(sourceId \|\| ""\)\}"/);
  assert.match(appJs, /Try \$\{escapeHtml\(label\)\} again/);
  assert.match(appJs, /function restoreSourceRetryFocus\(sourceId\)[\s\S]*?document\.querySelector\(`\[data-source-retry="\$\{sourceId\}"\]`\)[\s\S]*?\(retry \|\| els\.refreshButton\)\?\.focus\(\);/);
  assert.match(appJs, /const retry = event\.target\.closest\("\[data-source-retry\]"\);[\s\S]*?loadDashboard\(\{ focusRetrySourceId: retry\.dataset\.sourceRetry \}\);/);
  assert.match(appJs, /document\.addEventListener\("keydown", \(event\) => \{[\s\S]*?const retry = event\.target\.closest\("\[data-source-retry\]"\);[\s\S]*?event\.key === "Enter" \|\| event\.key === " "[\s\S]*?event\.preventDefault\(\);[\s\S]*?loadDashboard\(\{ focusRetrySourceId: retry\.dataset\.sourceRetry \}\);/);
  assert.doesNotMatch(appJs, /href="\.\/iss\.html"[\s\S]*?ISS[\s\S]*?<\/a>\n\s*<\/div>\n\s*<\/div>\n\s*`;\n}\n\nfunction setSourceUnavailable/);
  assert.match(launchesJs, /function renderLaunchesUnavailable/);
  assert.match(launchesJs, /Data unavailable/);
  assert.match(launchesJs, /The Space Devs launch source/);
  assert.match(launchesJs, /Open The Space Devs launch source/);
  assert.match(launchesJs, /aria-label="Open The Space Devs launch source"/);
  assert.match(launchesJs, /data-launches-retry/);
  assert.match(launchesJs, /Try The Space Devs again/);
  assert.match(launchesJs, /event\.target\.closest\("\[data-launches-retry\]"\)[\s\S]*?loadLaunches\(\)/);
  assert.match(launchesJs, /setLaunchesUpdated\(formatLastChecked\(\)\)/);
  assert.doesNotMatch(launchesJs, /Last updated: Signal lost/);
});

test("sky anomaly results use qualitative evidence and explicit assumptions", () => {
  const js = readProjectFile("app.js");
  const html = readProjectFile("anomalies.html");

  assert.doesNotMatch(js, /\/100 fit/);
  assert.doesNotMatch(js, /Fit scores reflect/);
  assert.match(js, /Planned source gap/);
  assert.match(js, /Connected source match/);
  assert.match(js, /browser-local time/);
  assert.match(js, /Location "\$\{escapeHtml\(location\)\}" is descriptive context/);
  assert.match(js, /not doing location-aware overhead, aircraft, planet, fireball, or UAP matching yet/);
  assert.match(js, /function getLaunchMatchLevel\(hoursFromObservation\)/);
  assert.match(js, /if \(hoursFromObservation > 0\) \{\s*return "context";\s*\}/);
  assert.match(js, /Upcoming launch context/);
  assert.match(js, /not an explanatory match/);
  assert.match(html, /Time is interpreted in browser-local terms unless you specify otherwise\./);
  assert.match(html, /Typed location is descriptive context; Apollo does not yet do overhead, aircraft, planet, fireball, satellite, or UAP matching from it\./);
});

test("sky anomaly form keeps native submit semantics", () => {
  const js = readProjectFile("app.js");
  const html = readProjectFile("anomalies.html");

  assert.match(html, /<form class="sky-anomaly-form" id="skyAnomalyForm">/);
  assert.match(html, /<button class="sky-anomaly-submit acadia-button acadia-button-brand" type="submit">/);
  assert.match(html, /<label class="acadia-choice(?: is-compact)?"><input type="radio" name="movement" value="straight"><span>Straight line<\/span><\/label>/);
  assert.match(html, /<label class="acadia-choice(?: is-compact)?"><input type="radio" name="brightness" value="bright"><span>Bright<\/span><\/label>/);
  assert.match(html, /<label class="acadia-choice(?: is-compact)?"><input type="radio" name="duration" value="seconds"><span>Seconds<\/span><\/label>/);
  assert.match(js, /function focusSkyAnomalyResult\(\)[\s\S]*?heading\.focus\(\{ preventScroll: true \}\);[\s\S]*?heading\.scrollIntoView\(\{ block: "start", behavior: "auto" \}\);/);
  assert.match(js, /function renderSkyExplanation\(\{ focus = false \} = \{\}\)/);
  assert.match(js, /<h3 class="sky-anomaly-result-title acadia-heading-small" tabindex="-1">Sighting context<\/h3>/);
  assert.match(js, /els\.skyAnomalyForm\?\.addEventListener\("submit", \(event\) => \{\s*event\.preventDefault\(\);\s*renderSkyExplanation\(\{ focus: true \}\);/);
  assert.match(js, /els\.skyAnomalyForm\?\.addEventListener\("keydown", \(event\) => \{/);
  assert.match(js, /const radio = event\.target\.closest\("input\[type='radio'\]"\);/);
  assert.match(js, /radio\.click\(\);/);
  assert.match(js, /els\.skyAnomalyForm\.requestSubmit\(\);/);
});

test("sky anomaly overview reflects connected source readiness", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /function getSkyContextSourceRows\(\)/);
  assert.match(js, /function getSkyOverviewState\(contextRows\)/);
  assert.match(js, /headline:\s*"Sources ready"/);
  assert.match(js, /headline:\s*"Partial source context"/);
  assert.match(js, /headline:\s*"Sources unavailable"/);
  assert.match(js, /Loaded connected source/);
  assert.match(js, /Connected source unavailable/);
  assert.match(js, /Unavailable connected sources and planned imports limit this pre-submit check/);
  assert.match(js, /Connected context is unavailable; Apollo can only compare visible traits against planned source gaps/);
  assert.doesNotMatch(js, /<h3 class="sky-anomaly-result-title acadia-heading-small">Sources ready<\/h3>/);
});

test("sky anomaly evidence ranks connected source context before planned gaps", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /function getSkyCandidatePriority\(candidate\)/);
  assert.match(js, /\/planned\/i\.test\(source\)[\s\S]*?return 3;/);
  assert.match(js, /state === "unknown"[\s\S]*?return 2;/);
  assert.match(js, /return 1;/);
  assert.match(js, /const priorityDelta = getSkyCandidatePriority\(left\) - getSkyCandidatePriority\(right\);/);
  assert.match(js, /return priorityDelta \|\| right\.sortScore - left\.sortScore;/);
  assert.match(js, /const plannedGaps = getSkyConfidenceCandidates\(rows, traits, \{ includeOnlyPlanned: true \}\);/);
  assert.match(js, /id="skyPlannedGapsTitle">Planned source gaps<\/h4>/);
  assert.match(js, /Connected sources are unavailable, so Apollo cannot list known-context explanations/);
});

test("watch items prioritize loaded signals before source unavailable rows", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /const availableRows = \[\];/);
  assert.match(js, /const limitationRows = \[\];/);
  assert.match(js, /label:\s*"ISS track"/);
  assert.match(js, /label:\s*"Orbital presence"/);
  assert.match(js, /label:\s*"Source unavailable"/);
  assert.match(js, /return \[\.\.\.availableRows, \.\.\.limitationRows\];/);
});

test("freshness copy separates successful updates from failed checks", () => {
  const appJs = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(appJs, /function formatLastChecked\(date = new Date\(\)\)/);
  assert.match(appJs, /isDashboardPage\(\) \? formatLastChecked\(checkedAt\)/);
  assert.match(launchesJs, /function formatLastChecked\(date = new Date\(\)\)/);
  assert.doesNotMatch(appJs, /Signal lost/);
  assert.doesNotMatch(launchesJs, /Signal lost/);
});

test("shared refresh controls support explicit keyboard activation", () => {
  const js = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(js, /\[els\.refreshButton, els\.refreshButtonMobile\]\.filter\(Boolean\)\.forEach\(\(button\) => \{[\s\S]*?button\.addEventListener\("keydown", \(event\) => \{[\s\S]*?event\.key === "Enter" \|\| event\.key === " "[\s\S]*?event\.preventDefault\(\);[\s\S]*?loadDashboard\(\);/);
  assert.match(launchesJs, /els\.refreshButton\.addEventListener\("keydown", \(event\) => \{[\s\S]*?event\.key === "Enter" \|\| event\.key === " "[\s\S]*?event\.preventDefault\(\);[\s\S]*?loadLaunches\(\);/);
});

test("header primary nav exposes five named destinations without a generic overflow", () => {
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    for (const presentation of ["acadia-navbar", "acadia-tablet-navigation", "acadia-mobile-tabbar"]) {
      const nav = getElementByClass(html, "nav", presentation);
      assert.equal(getTags(nav, "a").filter((tag) => hasClass(tag, "apollo-nav-link")).length, 4);
      assert.equal(getTags(nav, "summary").length, 1);
      assert.match(nav, /aria-label="Watch"/);
      for (const link of watchNavLinks) assert.ok(nav.includes(`href="${link.href}"`));
      assert.doesNotMatch(nav, /data-bs-toggle|>More</);
    }
  }
});

test("watch pages keep the grouped destination active without becoming More", () => {
  for (const link of watchNavLinks) {
    const html = readProjectFile(link.page);
    assert.equal((html.match(/data-current-group="true"/g) || []).length, 3);
    for (const navClass of ["acadia-navbar", "acadia-tablet-navigation", "acadia-mobile-tabbar"]) {
      const nav = getElementByClass(html, "nav", navClass);
      const current = getTags(nav, "a").filter((tag) => getAttribute(tag, "aria-current") === "page");
      assert.equal(current.length, 1);
      assert.equal(getAttribute(current[0], "href"), link.href);
    }
  }
});

test("theme toggles use Acadia icon action anatomy on every page", () => {
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    const toggle = getElementByClass(html, "button", "apollo-theme-toggle");
    const toggleTag = toggle.match(/<button\b[^>]*>/i)?.[0] || "";

    assert.ok(toggle, `${file} should include the compact theme toggle`);
    assert.equal(getAttribute(toggleTag, "id"), "themeToggle");
    assert.equal(getAttribute(toggleTag, "type"), "button");
    assert.ok(hasClass(toggleTag, "acadia-icon-action"), `${file} should use the Acadia icon action primitive`);
    assert.ok(hasClass(toggleTag, "acadia-theme-toggle"), `${file} should use the Acadia theme toggle primitive`);
    assert.match(toggle, /\bfa-toggle-on\b/, `${file} should render the Acadia toggle icon before JavaScript runs`);
  }
});

test("refresh loading copy stays source-neutral across shared pages", () => {
  const appJs = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(appJs, /const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner acadia-activity-indicator is-small" aria-hidden="true"><\/span><span>Refreshing data<\/span>`;/);
  assert.match(launchesJs, /const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner acadia-activity-indicator is-small" aria-hidden="true"><\/span><span>Refreshing data<\/span>`;/);
  assert.doesNotMatch(appJs, /Preparing launch/);
  assert.doesNotMatch(launchesJs, /<span>Preparing launch<\/span>/);

  for (const file of allHtmlPages.filter((page) => page !== "launches.html")) {
    const html = readProjectFile(file);
    assert.match(html, /app\.js\?v=1.2.0/, `${file} should load the current shared app script`);
  }

  assert.match(readProjectFile("launches.html"), /launches\.js\?v=1.1.0/);
});

test("internal pages use compact headers instead of dashboard-scale heroes", () => {
  for (const file of allHtmlPages.filter((file) => file !== "index.html")) {
    const html = readProjectFile(file);
    assert.match(html, /apollo-page-title acadia-title/);
    assert.match(html, /acadia-page-header acadia-surface acadia-panel-dense/);
  }
});

test("primary nav row does not clip compact destinations", () => {
  const css = readProjectFile("vendor/acadia/acadia.css");
  assert.match(css, /\.acadia-navbar\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(css, /\.acadia-action-menu/);
});

test("mobile dock stays viewport-bottom anchored", () => {
  const css = readProjectFile("vendor/acadia/acadia.css");
  assert.match(css, /\.acadia-mobile-tabbar\.is-fixed\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    assert.match(html, /apollo-mobile-dock acadia-mobile-tabbar is-fixed/);
    assert.match(html, /acadia-mobile-dock-safe-area/);
  }
});

test("mobile Watch menu opens as navigation above the dock", () => {
  const css = readProjectFile("styles.css");
  const js = readProjectFile("app-shell.js");
  assert.match(css, /\.apollo-mobile-dock \.apollo-nav-menu\s*\{[^}]*bottom:/);
  assert.match(js, /event.key === "Escape"/);
  assert.match(js, /window.addEventListener\("scroll"/);
  assert.doesNotMatch(js, /bootstrap/);
});

test("mobile nav exposes clear names while hiding icon glyphs", () => {
  const destinations = ["Dashboard", "ISS", "Launches", "Watch", "Gallery"];

  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    const dockStart = html.search(/<nav class="apollo-mobile-dock acadia-mobile-tabbar is-fixed"/);
    const mainStart = html.search(/<main\b/);
    const mobileDock = dockStart >= 0 && mainStart > dockStart ? html.slice(dockStart, mainStart) : "";

    assert.ok(mobileDock, `${file} should include the mobile dock`);

    for (const destination of destinations) {
      assert.match(mobileDock, new RegExp(`<span>${destination}<\\/span>`), `${file} should name ${destination} in the mobile dock`);
    }

    for (const iconTag of getTags(mobileDock, "i")) {
      assert.equal(getAttribute(iconTag, "aria-hidden"), "true", `${file} mobile nav icons should be hidden from assistive technology`);
    }
  }
});

test("launch timeline exposes urgency context and current asset versions", () => {
  const html = readProjectFile("launches.html");
  const js = readProjectFile("launches.js");
  const css = readProjectFile("styles.css");

  assert.match(html, /styles\.css\?v=1.1.0/);
  assert.match(html, /launches\.js\?v=1.1.0/);
  assert.match(js, /class="acadia-muted-panel launch-timeline-row\$\{index === 0 \?\s*" launch-timeline-row-next" : ""\}" aria-labelledby="\$\{rowTitleId\}"/);
  assert.match(js, /<span class="acadia-visually-hidden">Countdown <\/span>\$\{escapeHtml\(countdownLabel\)\}/);
  assert.doesNotMatch(js, /class="launch-timeline-rail" aria-hidden="true"/);
  assert.match(css, /@media \(max-width:\s*599\.98px\)\s*\{\s*\.next-launch-media\s*\{\s*height:\s*160px;/);
});
