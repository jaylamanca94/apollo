const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.join(__dirname, "..");

const pages = [
  {
    file: "index.html",
    name: "dashboard",
    skipTarget: "dashboard",
    headingId: "dashboardTitle",
    statusId: "dashboardStatus",
    refreshButtonId: "refreshButton",
    controlledIds: [
      "apodBody",
      "issBody",
      "peopleBody",
      "launchBody",
      "neoBody",
      "spaceWeatherBody",
      "sourceStatusBody"
    ]
  },
  {
    file: "launches.html",
    name: "launches page",
    skipTarget: "launch-content",
    headingId: "launchesTitle",
    statusId: "launchPageStatus",
    refreshButtonId: "launchesRefreshButton",
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

function getAttribute(tag, attrName) {
  const match = tag.match(new RegExp(`\\b${escapeRegExp(attrName)}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
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
}

test("skip link has a visible focus treatment", () => {
  const css = readProjectFile("styles.css");

  assert.match(css, /\.apollo-skip-link\s*\{/);
  assert.match(css, /\.apollo-skip-link:focus/);
  assert.match(css, /transform:\s*translateY\(0\);/);
});
