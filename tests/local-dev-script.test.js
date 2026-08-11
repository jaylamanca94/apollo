const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

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
