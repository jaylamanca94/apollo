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
  const start = html.search(/<div class="apollo-primary-links acadia-nav" aria-label="Apollo pages">/);
  const end = html.search(/<div class="apollo-navbar-actions/);

  return start >= 0 && end > start ? html.slice(start, end) : "";
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
    const nav = getTagByAttribute(html, "nav", "class", "apollo-topbar");
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
    const nav = getTagByAttribute(html, "nav", "class", "apollo-topbar");
    const navGroup = getTagByAttribute(html, "div", "class", "apollo-primary-links");
    const main = getTagByAttribute(html, "main", "id", page.skipTarget);
    const pageHeader = getTagByAttribute(html, "header", "class", "apollo-page-header");
    const refreshButton = getTagByAttribute(html, "button", "id", page.refreshButtonId);

    assert.ok(hasClass(app, "acadia-app"));
    assert.ok(hasClass(nav, "acadia-chrome"));
    assert.ok(hasClass(navGroup, "acadia-nav"));
    assert.ok(hasClass(main, "acadia-shell"));
    assert.ok(hasClass(pageHeader, "acadia-page-header"));
    assert.ok(hasClass(pageHeader, "acadia-surface"));
    assert.ok(hasClass(pageHeader, "acadia-panel"));
    assert.ok(hasClass(refreshButton, "acadia-button"));
    assert.ok(hasClass(refreshButton, "acadia-button-primary"));

    const topLevelNavItems = [
      ...getTags(html, "a").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class"))),
      ...getTags(html, "button").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class")))
    ];

    for (const navItem of topLevelNavItems) {
      assert.ok(hasClass(navItem, "acadia-nav-item"), "Top-level nav items should use Acadia nav anatomy");
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
  const css = readProjectFile("styles.css");

  assert.match(css, /\.apollo-skip-link\s*\{/);
  assert.match(css, /\.apollo-skip-link:focus/);
  assert.match(css, /transform:\s*translateY\(0\);/);
});

test("ISS map is exposed as a named interactive region", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /class="iss-status-summary"/);
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
  const css = readProjectFile("styles.css");

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition-duration:\s*0\.01ms !important;/);
  assert.match(css, /\.apollo-app \.btn:not\(\.apollo-refresh-button\):hover,\s*\n\s*\.apollo-app \.btn:not\(\.apollo-refresh-button\):focus-visible/);
  assert.match(css, /\.launch-card:hover,\s*\n\s*\.launch-show-all:hover/);
  assert.match(css, /transform:\s*none !important;/);
});

test("web manifest points to the current SVG favicon", () => {
  const manifest = JSON.parse(readProjectFile("site.webmanifest"));
  const iconSources = manifest.icons.map((icon) => icon.src);

  assert.deepEqual(iconSources, ["assets/favicon.svg"]);
  assert.equal(manifest.icons[0].type, "image/svg+xml");
  assert.equal(manifest.icons[0].sizes, "any");
  assert.equal(manifest.icons[0].purpose, "any maskable");
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

  assert.match(html, /\bid="recentActivityBody"/);
  assert.match(html, /\bid="watchItemsBody"/);
  assert.match(html, /\bid="sourceStatusBody"/);
  assert.match(html, /Data Sources/);

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
  assert.match(js, /label:\s*"Partial data"/);
  assert.match(js, /label:\s*"Data unavailable"/);
  assert.match(js, /setDashboardFreshness\(statuses, checkedAt\)/);
});

test("detail pages render intentional unavailable source states", () => {
  const appJs = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(appJs, /function unavailableStateMarkup/);
  assert.match(appJs, /NASA image did not load/);
  assert.match(appJs, /Near-Earth asteroid list did not load/);
  assert.match(appJs, /Space-weather conditions did not load/);
  assert.match(launchesJs, /function renderLaunchesUnavailable/);
  assert.match(launchesJs, /Launch schedule did not load/);
  assert.match(launchesJs, /setLaunchesUpdated\(formatLastChecked\(\)\)/);
  assert.doesNotMatch(launchesJs, /Last updated: Signal lost/);
});

test("sky anomaly results use qualitative evidence and explicit assumptions", () => {
  const js = readProjectFile("app.js");

  assert.doesNotMatch(js, /\/100 fit/);
  assert.doesNotMatch(js, /Fit scores reflect/);
  assert.match(js, /Planned source gap/);
  assert.match(js, /Connected source match/);
  assert.match(js, /browser-local time/);
  assert.match(js, /Location "\$\{escapeHtml\(location\)\}" is descriptive context/);
  assert.match(js, /not doing location-aware overhead, aircraft, planet, fireball, or UAP matching yet/);
});

test("watch items prioritize loaded signals before source limitations", () => {
  const js = readProjectFile("app.js");

  assert.match(js, /const availableRows = \[\];/);
  assert.match(js, /const limitationRows = \[\];/);
  assert.match(js, /label:\s*"ISS track"/);
  assert.match(js, /label:\s*"Orbital presence"/);
  assert.match(js, /label:\s*"Source limitation"/);
  assert.match(js, /return \[\.\.\.availableRows, \.\.\.limitationRows\];/);
});

test("freshness copy separates successful updates from failed checks", () => {
  const appJs = readProjectFile("app.js");
  const launchesJs = readProjectFile("launches.js");

  assert.match(appJs, /function formatLastChecked\(date = new Date\(\)\)/);
  assert.match(appJs, /formatUpdated\(checkedAt\) : formatLastChecked\(checkedAt\)/);
  assert.match(launchesJs, /function formatLastChecked\(date = new Date\(\)\)/);
  assert.doesNotMatch(appJs, /Signal lost/);
  assert.doesNotMatch(launchesJs, /Signal lost/);
});

test("header primary nav exposes five named destinations without a generic overflow", () => {
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    const headerNav = getHeaderPrimaryNav(html);
    const topLevelNavItems = [
      ...getTags(headerNav, "a").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class"))),
      ...getTags(headerNav, "button").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class")))
    ];
    const watchToggle = topLevelNavItems.find((tag) => /\bapollo-nav-more-toggle\b/.test(getAttribute(tag, "class")));
    const watchToggleHtml = getElementByClass(headerNav, "button", "apollo-nav-more-toggle");

    assert.equal(topLevelNavItems.length, 5, `${file} should expose exactly five top-level primary nav items`);
    assert.ok(watchToggle, `${file} should expose Watch as the grouped navigation item`);
    assert.equal(getAttribute(watchToggle, "data-bs-toggle"), "dropdown");
    assert.match(watchToggleHtml, /<span>Watch<\/span>/);
    assert.match(watchToggleHtml, /\bfa-binoculars\b/);
    assert.doesNotMatch(headerNav, /<span>More<\/span>/);
    assert.doesNotMatch(headerNav, /\bfa-ellipsis\b/);

    for (const link of v1NavLinks) {
      const expectedHref = file === "index.html" && link.label === "Dashboard" ? "#dashboard" : link.href;
      const navItem = topLevelNavItems.find((tag) => (
        getAttribute(tag, "href") === expectedHref && /\bapollo-nav-link\b/.test(getAttribute(tag, "class"))
      ));

      assert.ok(navItem, `${file} should include ${link.label} as a v1 nav destination`);
    }

    for (const link of watchNavLinks) {
      const menuItem = getTags(html, "a").find((tag) => (
        getAttribute(tag, "href") === link.href && /\bapollo-nav-menu-item\b/.test(getAttribute(tag, "class"))
      ));

      assert.ok(menuItem, `${file} should include ${link.label} in the Watch group`);
    }
  }
});

test("watch pages keep the grouped destination active without becoming More", () => {
  for (const link of watchNavLinks) {
    const html = readProjectFile(link.page);
    const watchToggle = getElementByClass(html, "button", "apollo-nav-more-toggle");
    const watchToggleTag = watchToggle.match(/<button\b[^>]*>/i)?.[0] || "";

    assert.ok(watchToggle, `${link.page} should expose the Watch navigation group`);
    assert.equal(getAttribute(watchToggleTag, "aria-current"), "page");
    assert.match(watchToggle, /<span>Watch<\/span>/);
    assert.match(watchToggle, /\bfa-binoculars\b/);
    assert.doesNotMatch(watchToggle, /<span>More<\/span>/);
    assert.doesNotMatch(watchToggle, /\bfa-ellipsis\b/);
  }
});

test("theme toggles use Acadia icon action anatomy on every page", () => {
  const css = readProjectFile("styles.css");

  assert.match(css, /\.apollo-theme-toggle,\s*\n\.acadia-icon-action\s*\{[\s\S]*?height:\s*2\.5rem;/);
  assert.match(css, /\.apollo-theme-toggle\.is-dark,\s*\n\.acadia-theme-toggle\.is-dark\s*\{[\s\S]*?color:\s*var\(--acadia-color-primary\);/);
  assert.match(css, /\.apollo-theme-toggle \.acadia-icon,\s*\n\.acadia-theme-toggle \.acadia-icon\s*\{[\s\S]*?font-size:\s*1\.25rem;/);

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

  assert.match(appJs, /const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner" aria-hidden="true"><\/span><span>Refreshing data<\/span>`;/);
  assert.match(launchesJs, /const REFRESHING_BUTTON_HTML = `<span class="apollo-button-spinner" aria-hidden="true"><\/span><span>Refreshing data<\/span>`;/);
  assert.doesNotMatch(appJs, /Preparing launch/);
  assert.doesNotMatch(launchesJs, /<span>Preparing launch<\/span>/);

  for (const file of allHtmlPages.filter((page) => page !== "launches.html")) {
    const html = readProjectFile(file);
    assert.match(html, /app\.js\?v=clarity-copy-1/, `${file} should load the current shared app script`);
  }

  assert.match(readProjectFile("launches.html"), /launches\.js\?v=clarity-copy-1/);
});

test("internal pages use compact headers instead of dashboard-scale heroes", () => {
  const css = readProjectFile("styles.css");

  assert.match(css, /body:not\(\[data-apollo-page="dashboard"\]\) \.apollo-page-header\s*\{[\s\S]*?padding:\s*clamp\(1rem,\s*2vw,\s*1\.25rem\);/);
  assert.match(css, /body:not\(\[data-apollo-page="dashboard"\]\) \.apollo-page-title\s*\{[\s\S]*?font-size:\s*clamp\(1\.8rem,\s*2\.4vw,\s*2\.25rem\);/);
  assert.doesNotMatch(css, /\.launch-page-shell \.apollo-page-title\s*\{[\s\S]*?font-size:\s*3\.85rem;/);
});

test("primary nav row does not clip compact destinations", () => {
  const css = readProjectFile("styles.css");
  const primaryLinksRule = css.match(/\.apollo-primary-links,\s*\n\.acadia-nav\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const navMoreRule = css.match(/\.apollo-nav-more\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(primaryLinksRule, /overflow:\s*visible;/);
  assert.doesNotMatch(primaryLinksRule, /overflow-x:\s*auto;/);
  assert.match(navMoreRule, /position:\s*relative;/);
});

test("mobile dock stays viewport-bottom anchored", () => {
  const css = readProjectFile("styles.css");
  const html = readProjectFile("index.html");
  const mobileBlock = css.match(/@media \(max-width:\s*767\.98px\)\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const topbarRule = mobileBlock.match(/\.apollo-topbar\s*\{[\s\S]*?\n  \}/)?.[0] || "";
  const mobileDockRule = mobileBlock.match(/\.apollo-primary-links\.apollo-mobile-dock\s*\{[\s\S]*?\n  \}/)?.[0] || "";

  assert.match(html, /<\/nav>\s*<div class="apollo-primary-links acadia-nav apollo-mobile-dock" aria-label="Apollo pages">/);
  assert.match(css, /\.apollo-primary-links\.apollo-mobile-dock\s*\{[\s\S]*?display:\s*none;/);
  assert.match(mobileBlock, /\.apollo-topbar \.apollo-primary-links:not\(\.apollo-mobile-dock\)\s*\{[\s\S]*?display:\s*none;/);
  assert.match(topbarRule, /-webkit-backdrop-filter:\s*none;/);
  assert.match(topbarRule, /backdrop-filter:\s*none;/);
  assert.match(mobileDockRule, /position:\s*fixed;/);
  assert.match(mobileDockRule, /background:\s*var\(--acadia-mobile-nav-background\);/);
  assert.match(mobileDockRule, /border:\s*1px solid var\(--acadia-mobile-nav-border\);/);
  assert.match(mobileDockRule, /box-shadow:\s*var\(--acadia-mobile-nav-shadow\);/);
  assert.match(mobileDockRule, /color:\s*var\(--acadia-mobile-nav-color\);/);
  assert.match(mobileDockRule, /bottom:\s*calc\(var\(--acadia-mobile-tabbar-bottom,\s*1\.25rem\) \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(mobileDockRule, /top:\s*auto;/);
  assert.match(mobileBlock, /\.apollo-shell\s*\{[\s\S]*?padding:\s*28px var\(--acadia-page-margin\) calc\(8\.75rem \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(css, /html\[data-bs-theme="light"\]\s*\{[\s\S]*?--acadia-mobile-nav-background:\s*rgba\(250, 250, 252, 0\.84\);/);
  assert.match(css, /--acadia-mobile-nav-active-background:\s*rgba\(15, 23, 42, 0\.1\);/);
  assert.match(css, /--acadia-mobile-nav-focus-halo:\s*rgba\(255, 255, 255, 0\.22\);/);
});

test("launch timeline exposes urgency context and current asset versions", () => {
  const html = readProjectFile("launches.html");
  const js = readProjectFile("launches.js");

  assert.match(html, /styles\.css\?v=visual-polish-2/);
  assert.match(html, /launches\.js\?v=clarity-copy-1/);
  assert.match(js, /class="launch-timeline-row\$\{index === 0 \? " launch-timeline-row-next" : ""\}" aria-labelledby="\$\{rowTitleId\}"/);
  assert.match(js, /<span class="visually-hidden">Countdown <\/span>\$\{escapeHtml\(countdownLabel\)\}/);
  assert.doesNotMatch(js, /class="launch-timeline-rail" aria-hidden="true"/);
});
