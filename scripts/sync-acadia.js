// Static consumption path documented by Acadia's utilities/implementation.
// Deliberate update only: production never reads a sibling checkout.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/sync-acadia.js /path/to/reviewed/Acadia");
const root = path.resolve(source);
const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
if (git("status", "--porcelain")) throw new Error("Acadia must be clean before taking a snapshot.");
const sourcePackage = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
if (sourcePackage.name !== "@acadia/design-system") throw new Error("Expected the Acadia source repository.");
const finalDestination = path.resolve(__dirname, "../vendor/acadia");
fs.mkdirSync(path.dirname(finalDestination), { recursive: true });
const destination = fs.mkdtempSync(path.join(path.dirname(finalDestination), ".acadia-snapshot-"));
for (const name of ["acadia.css", "fonts", "assets"]) {
  fs.cpSync(path.join(root, "src", name), path.join(destination, name), { recursive: true });
}
const files = {};
function record(directory) {
  for (const name of fs.readdirSync(directory).sort()) {
    if (name === "source.json") continue;
    const file = path.join(directory, name);
    if (fs.statSync(file).isDirectory()) record(file);
    else files[path.relative(destination, file)] = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }
}
record(destination);
fs.writeFileSync(path.join(destination, "source.json"), JSON.stringify({
  package: "@acadia/design-system",
  version: sourcePackage.version,
  commit: git("rev-parse", "HEAD"),
  source: "src/acadia.css, src/fonts, src/assets",
  guide: "utilities/implementation/README.md",
  files
}, null, 2) + "\n");
// Publish only after every copy and manifest operation succeeds. Git retains the previous snapshot.
fs.rmSync(finalDestination, { recursive: true, force: true });
fs.renameSync(destination, finalDestination);
console.log(`Copied Acadia ${git("rev-parse", "--short", "HEAD")}: ${Object.keys(files).length} verified assets`);
