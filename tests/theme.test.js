const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadThemeHelpers(fileName, endMarker) {
  const source = fs.readFileSync(path.join(__dirname, "..", fileName), "utf8");
  const helperSource = source.slice(0, source.indexOf(endMarker));
  const elements = {};
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
