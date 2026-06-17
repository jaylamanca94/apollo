const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadThemeHelpers(fileName, endMarker) {
  const source = fs.readFileSync(path.join(__dirname, "..", fileName), "utf8");
  const helperSource = source.slice(0, source.indexOf(endMarker));
  const elements = {};
  const themeColorMeta = {
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  const context = {
    AbortController,
    document: {
      documentElement: {
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        }
      },
      querySelector(selector) {
        if (selector === "meta[name='theme-color']") {
          return themeColorMeta;
        }

        return elements[selector] || null;
      }
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {};
      }
    }),
    window: {
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {}
      },
      clearTimeout,
      setTimeout
    },
    URL
  };

  vm.createContext(context);
  vm.runInContext(helperSource, context);

  return context;
}

test("dashboard theme defaults safely when matchMedia is unavailable", () => {
  const { getStoredTheme } = loadThemeHelpers("app.js", "async function loadLaunches");

  assert.equal(getStoredTheme(), "light");
});

test("launches theme defaults safely when matchMedia is unavailable", () => {
  const { getStoredTheme } = loadThemeHelpers("launches.js", "function setBusy");

  assert.equal(getStoredTheme(), "light");
});

test("dashboard theme uses the system dark preference when available", () => {
  const context = loadThemeHelpers("app.js", "async function loadLaunches");
  context.window.matchMedia = () => ({ matches: true });

  assert.equal(context.getStoredTheme(), "dark");
});

test("launches theme uses the system light preference when available", () => {
  const context = loadThemeHelpers("launches.js", "function setBusy");
  context.window.matchMedia = () => ({ matches: false });

  assert.equal(context.getStoredTheme(), "light");
});

test("page startup scripts initialize theme chrome color", () => {
  for (const fileName of ["index.html", "launches.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", fileName), "utf8");

    assert.match(html, /<meta name="theme-color" content="#1F2427" id="appThemeColor">/);
    assert.match(html, /const themeColor = theme === "dark" \? "#1F2427" : "#E8EAED";/);
    assert.match(html, /themeColorMeta\?\.setAttribute\("content", themeColor\);/);
    assert.match(html, /setAttribute\("content", "#E8EAED"\);/);
  }
});

test("dashboard theme updates browser chrome color", () => {
  const context = loadThemeHelpers("app.js", "async function loadLaunches");

  context.applyTheme("dark");
  assert.equal(context.document.querySelector("meta[name='theme-color']").attributes.content, "#1F2427");

  context.applyTheme("light");
  assert.equal(context.document.querySelector("meta[name='theme-color']").attributes.content, "#E8EAED");
});

test("launches theme updates browser chrome color", () => {
  const context = loadThemeHelpers("launches.js", "function setBusy");

  context.applyTheme("dark");
  assert.equal(context.document.querySelector("meta[name='theme-color']").attributes.content, "#1F2427");

  context.applyTheme("light");
  assert.equal(context.document.querySelector("meta[name='theme-color']").attributes.content, "#E8EAED");
});
