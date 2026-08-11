const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { getStaticFilePath, handleLocalPreviewRequest, parseListenArguments } = require("../scripts/local-preview");

const projectRoot = path.join(__dirname, "..");

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
