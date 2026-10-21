const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const apiHandlers = {
  "/api/apod": require("../api/apod"),
  "/api/health": require("../api/health"),
  "/api/iss": require("../api/iss"),
  "/api/launches": require("../api/launches"),
  "/api/neo": require("../api/neo"),
  "/api/people": require("../api/people"),
  "/api/space-weather": require("../api/space-weather")
};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

// The checkout contains private development files. Only these browser entry
// points and media/font directories belong to the preview's public surface.
const publicFiles = new Set([
  "/index.html", "/iss.html", "/launches.html", "/weather.html",
  "/asteroids.html", "/gallery.html", "/anomalies.html",
  "/app.js", "/app-shell.js", "/launches.js", "/crewed-launches.js",
  "/launch-timing.js", "/launch-calendar.js", "/styles.css",
  "/site.webmanifest", "/vendor/acadia/acadia.css"
]);

function getStaticFilePath(pathname, root = projectRoot) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  if (/[\\\x00%]/.test(requestedPath) || requestedPath.split("/").some(part => part.startsWith("."))) {
    return null;
  }

  const publicAsset = /^\/(?:assets|vendor\/acadia\/assets)\/.+\.(?:png|jpe?g|svg)$/.test(requestedPath);
  const publicFont = /^\/vendor\/acadia\/fonts\/[^/]+\.(?:woff2|ttf)$/.test(requestedPath);
  if (!publicFiles.has(requestedPath) && !publicAsset && !publicFont) return null;

  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(resolvedRoot, `.${requestedPath}`);
  if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

function sendPlainText(response, statusCode, message) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(message);
}

function serveStatic(request, response, pathname, root) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    sendPlainText(response, 405, "Use GET or HEAD for static files.");
    return;
  }

  const filePath = getStaticFilePath(pathname, root);

  // Reject links at every component, including links within the public tree.
  // This preview assumes a trusted checkout, not concurrently hostile writers.
  try {
    if (!filePath) throw new Error("Non-public path");
    let current = path.resolve(root);
    for (const component of path.relative(current, filePath).split(path.sep)) {
      current = path.join(current, component);
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error("Symbolic link");
    }
    if (!fs.statSync(filePath).isFile()) throw new Error("Not a file");
  } catch {
    sendPlainText(response, 404, "Not found.");
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", contentTypes[path.extname(filePath)] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) sendPlainText(response, 404, "Not found.");
    else response.destroy();
  });
  stream.pipe(response);
}

async function handleLocalPreviewRequest(request, response, options = {}) {
  const root = options.root || projectRoot;
  const handlers = options.apiHandlers || apiHandlers;

  let requestUrl;
  let pathname;
  try {
    const target = request.url || "/";
    if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")) throw new Error("Invalid request target");
    // Host is untrusted and is not needed to route local requests.
    requestUrl = new URL(target, "http://localhost");
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    sendPlainText(response, 400, "Invalid request URL.");
    return;
  }
  const handler = handlers[pathname];

  if (handler) {
    request.query = Object.fromEntries(requestUrl.searchParams.entries());

    try {
      await handler(request, response);
    } catch (error) {
      sendPlainText(response, 500, "Local API handler failed.");
    }
    return;
  }

  serveStatic(request, response, pathname, root);
}

function createLocalPreviewServer(options = {}) {
  return http.createServer((request, response) => handleLocalPreviewRequest(request, response, options));
}

function parseListenArguments(args) {
  const hostIndex = args.indexOf("--host");
  const portIndex = args.indexOf("--port");
  const host = hostIndex >= 0 ? args[hostIndex + 1] : "127.0.0.1";
  const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4173;

  return {
    host: host || "127.0.0.1",
    port: Number.isInteger(port) && port > 0 ? port : 4173
  };
}

if (require.main === module) {
  const { host, port } = parseListenArguments(process.argv.slice(2));
  const server = createLocalPreviewServer();

  server.listen(port, host, () => {
    console.log(`Apollo local function preview listening on http://${host}:${port}`);
  });
}

module.exports = {
  createLocalPreviewServer,
  getStaticFilePath,
  handleLocalPreviewRequest,
  parseListenArguments
};
