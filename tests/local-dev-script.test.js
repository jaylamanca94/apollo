const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { Writable } = require("node:stream");
const test = require("node:test");
const { getStaticFilePath, handleLocalPreviewRequest, parseListenArguments } = require("../scripts/local-preview");

const projectRoot = path.join(__dirname, "..");

async function previewRequest(url, options = {}, method = "GET") {
  const chunks = [];
  const headers = {};
  const response = new Writable({ write(chunk, encoding, next) { chunks.push(chunk); next(); } });
  response.setHeader = (name, value) => { headers[name] = value; };
  const finished = new Promise((resolve, reject) => {
    response.on("finish", resolve);
    response.on("error", reject);
  });
  await handleLocalPreviewRequest({ headers: {}, method, url }, response, options);
  await finished;
  return { status: response.statusCode, headers, body: Buffer.concat(chunks).toString() };
}

test("preview serves every page and its local scripts, styles, icons and CSS resources", async () => {
  const pages = ["index", "iss", "launches", "weather", "asteroids", "gallery", "anomalies"];
  const urls = new Set(["/", "/site.webmanifest", "/vendor/acadia/assets/thumbnail-orbit.png"]);
  for (const page of pages) {
    const url = `/${page}.html`;
    urls.add(url);
    const html = fs.readFileSync(path.join(projectRoot, `${page}.html`), "utf8");
    for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
      urls.add(new URL(match[1], `http://localhost${url}`).pathname + new URL(match[1], `http://localhost${url}`).search);
    }
  }
  for (const stylesheet of ["/styles.css", "/vendor/acadia/acadia.css"]) {
    const css = fs.readFileSync(path.join(projectRoot, stylesheet), "utf8");
    for (const match of css.matchAll(/url\("?(\.\/[^"\)]+)"?\)/g)) {
      urls.add(new URL(match[1], `http://localhost${stylesheet}`).pathname);
    }
  }
  for (const url of urls) {
    const result = await previewRequest(url);
    assert.equal(result.status, 200, url);
    assert.ok(result.body.length > 0, url);
    assert.equal(result.headers["Cache-Control"], "no-store", url);
  }
  const head = await previewRequest("/app.js?v=1.4.2", {}, "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body, "");
  assert.equal(head.headers["Content-Type"], "text/javascript; charset=utf-8");
  const font = await previewRequest("/vendor/acadia/fonts/Geist-Variable.woff2");
  assert.equal(font.headers["Content-Type"], "font/woff2");
});

test("preview denies private checkout files without reading their contents", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "apollo-preview-private-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const privatePaths = [".env", ".env.local", ".git/config", ".vercel/project.json", ".local/probe.json", "api/_nasa.js", "api/neo.js", "scripts/local-preview.js", "tests/probe.js", "docs/probe.html", "package.json", "package-lock.json", "README.md", "node_modules/probe/index.js", "vendor/acadia/source.json", "assets/.hidden.svg", "assets/probe.json", "assets/probe.js"];
  for (const name of privatePaths) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), "synthetic-private-sentinel");
    const result = await previewRequest(`/${name}`, { root, apiHandlers: {} });
    assert.equal(result.status, 404, name);
    assert.equal(result.headers["Cache-Control"], "no-store", name);
    assert.doesNotMatch(result.body, /synthetic-private-sentinel/, name);
  }
});

test("preview rejects encoded private paths, malformed targets and traversal", async () => {
  for (const url of ["/%2eenv.local", "/%61pi/_nasa.js", "/assets/%2e%2e/.env", "/assets%2f..%2f.env", "/%252eenv", "/assets/../package.json", "/assets/%5c..%5c.env", "/assets/%00.svg", "/assets/", "/missing.svg"]) {
    const result = await previewRequest(url);
    assert.equal(result.status, 404, url);
  }
  for (const url of ["/%", "/%ZZ", "/%E0%A4", "//other.example/app.js", "http://other.example/app.js", "/\\other.example/app.js"]) {
    const result = await previewRequest(url);
    assert.equal(result.status, 400, url);
    assert.equal(result.headers["Cache-Control"], "no-store", url);
  }
});

test("preview denies symlinked public files and directories", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "apollo-preview-links-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "apollo-preview-outside-"));
  t.after(() => { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(outside, { recursive: true, force: true }); });
  fs.writeFileSync(path.join(outside, "probe.svg"), "synthetic-private-sentinel");
  fs.symlinkSync(path.join(outside, "probe.svg"), path.join(root, "app.js"));
  fs.mkdirSync(path.join(root, "assets"));
  fs.symlinkSync(path.join(outside, "probe.svg"), path.join(root, "assets", "probe.svg"));
  fs.symlinkSync(outside, path.join(root, "assets", "linked"));
  fs.symlinkSync(path.join(outside, "missing"), path.join(root, "assets", "broken.svg"));
  for (const url of ["/app.js", "/assets/probe.svg", "/assets/linked/probe.svg", "/assets/broken.svg"]) {
    const result = await previewRequest(url, { root });
    assert.equal(result.status, 404, url);
    assert.doesNotMatch(result.body, /synthetic-private-sentinel/, url);
  }
});

test("preview keeps API method handling and static method rejection separate", async () => {
  const options = { apiHandlers: { "/api/probe": async (request, response) => {
    response.statusCode = 200;
    response.end(JSON.stringify({ method: request.method, query: request.query }));
  } } };
  const api = await previewRequest("/api/probe?scope=crewed", options, "POST");
  assert.deepEqual(JSON.parse(api.body), { method: "POST", query: { scope: "crewed" } });
  const rejected = await previewRequest("/index.html", options, "POST");
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.Allow, "GET, HEAD");
});

test("local Vercel development uses the documented project command", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  const script = fs.readFileSync(path.join(projectRoot, "scripts", "vercel-dev.sh"), "utf8");
  const readme = fs.readFileSync(path.join(projectRoot, "README.md"), "utf8");

  assert.equal(packageJson.scripts.dev, "bash ./scripts/vercel-dev.sh");
  assert.equal(packageJson.scripts["vercel:dev"], "bash ./scripts/vercel-dev.sh");
  assert.match(script, /mktemp -d/);
  assert.match(script, /rsync -a --exclude='\.git' --exclude='node_modules'/);
  assert.match(script, /delete packageJson\.scripts\.dev/);
  assert.match(script, /trap cleanup EXIT INT TERM/);
  assert.match(readme, /npm run dev/);
});

test("local function preview invokes local API handlers with parsed query values", async () => {
  const headers = {};
  const response = {
    body: "",
    end(body) {
      this.body = body;
    },
    setHeader(name, value) {
      headers[name] = value;
    }
  };
  const request = {
    headers: {},
    method: "GET",
    url: "/api/probe?state=loaded"
  };

  await handleLocalPreviewRequest(request, response, {
    apiHandlers: {
      "/api/probe": async (request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ query: request.query }));
      }
    }
  });

  assert.equal(headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(response.body), { query: { state: "loaded" } });
});

test("local function preview rejects paths outside the project and parses listen options", () => {
  assert.equal(getStaticFilePath("/../package.json"), null);
  assert.equal(getStaticFilePath("/iss.html"), path.join(projectRoot, "iss.html"));
  assert.deepEqual(parseListenArguments(["--host", "0.0.0.0", "--port", "4181"]), {
    host: "0.0.0.0",
    port: 4181
  });
  assert.deepEqual(parseListenArguments(["--port", "invalid"]), {
    host: "127.0.0.1",
    port: 4173
  });
});
