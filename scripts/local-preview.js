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
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function getStaticFilePath(pathname, root = projectRoot) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (!filePath.startsWith(`${root}${path.sep}`)) {
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

  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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

  fs.createReadStream(filePath).pipe(response);
}

async function handleLocalPreviewRequest(request, response, options = {}) {
  const root = options.root || projectRoot;
  const handlers = options.apiHandlers || apiHandlers;

  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const handler = handlers[requestUrl.pathname];

  if (handler) {
    request.query = Object.fromEntries(requestUrl.searchParams.entries());

    try {
      await handler(request, response);
    } catch (error) {
      sendPlainText(response, 500, "Local API handler failed.");
    }
    return;
  }

  serveStatic(request, response, requestUrl.pathname, root);
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
