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

const overflowNavLinks = [
  { href: "./asteroids.html", label: "Asteroids" },
  { href: "./gallery.html", label: "Gallery" },
  { href: "./anomalies.html", label: "Anomalies" }
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
    expectedNavLinks: [
      { href: "#dashboard", label: "Dashboard" },
      { href: "./iss.html", label: "ISS" },
      { href: "./launches.html", label: "Launches" },
      { href: "./asteroids.html", label: "Asteroids" },
      { href: "./weather.html", label: "Weather" },
      { href: "./gallery.html", label: "Gallery" },
      { href: "./anomalies.html", label: "Anomalies" }
    ],
    controlledIds: [
      "quickStatsBody",
      "spaceBriefBody",
      "recentActivityBody",
      "watchItemsBody"
    ]
  },
  {
    file: "launches.html",
    name: "launches page",
    skipTarget: "launch-content",
    headingId: "launchesTitle",
    statusId: "launchPageStatus",
    refreshButtonId: "launchesRefreshButton",
    activeNavLabel: "Launches",
    expectedNavLinks: [
      { href: "./index.html", label: "Dashboard" },
      { href: "./iss.html", label: "ISS" },
      { href: "./launches.html", label: "Launches" },
      { href: "./asteroids.html", label: "Asteroids" },
      { href: "./weather.html", label: "Weather" },
      { href: "./gallery.html", label: "Gallery" },
      { href: "./anomalies.html", label: "Anomalies" }
    ],
    controlledIds: ["launchPageBody"]
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

  for (const removedRegion of ["issBody", "peopleBody", "launchBody", "neoBody", "spaceWeatherBody", "apodBody", "skyAnomaliesBody", "sourceStatusBody"]) {
    assert.doesNotMatch(html, new RegExp(`\\bid="${removedRegion}"`), `dashboard should not include ${removedRegion}`);
  }
});

test("header primary nav uses a More dropdown when page count exceeds five", () => {
  for (const file of allHtmlPages) {
    const html = readProjectFile(file);
    const topLevelNavItems = [
      ...getTags(html, "a").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class"))),
      ...getTags(html, "button").filter((tag) => /\bapollo-nav-link\b/.test(getAttribute(tag, "class")))
    ];
    const moreToggle = topLevelNavItems.find((tag) => /\bapollo-nav-more-toggle\b/.test(getAttribute(tag, "class")));

    assert.ok(topLevelNavItems.length <= 5, `${file} should not expose more than five top-level primary nav items`);
    assert.ok(moreToggle, `${file} should expose overflow pages through a More dropdown`);
    assert.equal(getAttribute(moreToggle, "data-bs-toggle"), "dropdown");

    for (const link of overflowNavLinks) {
      const menuItem = getTags(html, "a").find((tag) => (
        getAttribute(tag, "href") === link.href && /\bapollo-nav-menu-item\b/.test(getAttribute(tag, "class"))
      ));

      assert.ok(menuItem, `${file} should include ${link.label} in the More dropdown`);
    }
  }
});

test("More dropdown can render outside the primary nav row", () => {
  const css = readProjectFile("styles.css");
  const primaryLinksRule = css.match(/\.apollo-primary-links,\s*\n\.acadia-nav\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const navMoreRule = css.match(/\.apollo-nav-more\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(primaryLinksRule, /overflow:\s*visible;/);
  assert.doesNotMatch(primaryLinksRule, /overflow-x:\s*auto;/);
  assert.match(navMoreRule, /position:\s*relative;/);
});

test("launch timeline exposes urgency context and current asset versions", () => {
  const html = readProjectFile("launches.html");
  const js = readProjectFile("launches.js");

  assert.match(html, /styles\.css\?v=launch-timeline-a11y-1/);
  assert.match(html, /launches\.js\?v=launch-timeline-a11y-1/);
  assert.match(js, /class="launch-timeline-row\$\{index === 0 \? " launch-timeline-row-next" : ""\}" aria-labelledby="\$\{rowTitleId\}"/);
  assert.match(js, /<span class="visually-hidden">Countdown <\/span>\$\{escapeHtml\(countdownLabel\)\}/);
  assert.doesNotMatch(js, /class="launch-timeline-rail" aria-hidden="true"/);
});
