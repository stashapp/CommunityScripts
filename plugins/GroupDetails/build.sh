#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="${SCRIPT_DIR}/assets"
OUT_FILE="${SCRIPT_DIR}/images.js"

if [[ ! -d "${ASSET_DIR}" ]]; then
  echo "error: assets directory not found: ${ASSET_DIR}" >&2
  echo "create it and add PNG files, then run this script again." >&2
  exit 1
fi

shopt -s nullglob
pngs=("${ASSET_DIR}"/*.png)
shopt -u nullglob

if [[ ${#pngs[@]} -eq 0 ]]; then
  echo "error: no PNG files found in ${ASSET_DIR}" >&2
  exit 1
fi

python3 - "${ASSET_DIR}" "${OUT_FILE}" <<'PY'
import base64
import pathlib
import sys

asset_dir = pathlib.Path(sys.argv[1])
out_file = pathlib.Path(sys.argv[2])

# Deterministic ordering for clean diffs.
files = sorted(asset_dir.glob("*.png"), key=lambda p: p.name.lower())

lines = [
    '"use strict";',
    "(function () {",
    "  var MAP = {",
]

for p in files:
    b64 = base64.b64encode(p.read_bytes()).decode("ascii")
    lines.append(f'    "{p.name}": "data:image/png;base64,{b64}",')

lines.extend([
    "  };",
    "  window.GroupDetailsImages = MAP;",
    "})();",
    "",
])

out_file.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out_file} with {len(files)} image(s)")
PY
