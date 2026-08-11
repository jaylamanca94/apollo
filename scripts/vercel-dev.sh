#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
vercel_bin="$project_root/node_modules/.bin/vercel"

if [[ ! -x "$vercel_bin" ]]; then
  echo "Apollo's local Vercel CLI is unavailable. Run npm install first." >&2
  exit 1
fi

temporary_root=$(mktemp -d "${TMPDIR:-/tmp}/apollo-vercel-XXXXXX")

cleanup() {
  rm -rf "$temporary_root"
}

trap cleanup EXIT INT TERM

rsync -a --exclude='.git' --exclude='node_modules' "$project_root/" "$temporary_root/"
rsync -a "$project_root/node_modules/" "$temporary_root/node_modules/"

node -e '
  const fs = require("node:fs");
  const packagePath = process.argv[1];
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  delete packageJson.scripts.dev;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
' "$temporary_root/package.json"

cd "$temporary_root"
"$temporary_root/node_modules/.bin/vercel" dev "$@"
