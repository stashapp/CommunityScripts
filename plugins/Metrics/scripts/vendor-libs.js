#!/usr/bin/env node
/* Copies the third-party UMD bundles we depend on out of node_modules and
 * into assets/lib/, where the Stash UI can serve them. Run automatically by
 * `npm install` (postinstall) or manually via `npm run vendor`.
 *
 * Stash plugins cannot reach the npm registry at runtime — the browser only
 * sees files inside the plugin directory — so the vendor step is mandatory
 * before installing the plugin into Stash. */

"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "assets", "lib");
fs.mkdirSync(out, { recursive: true });

const targets = [
  // [package, sub-path inside node_modules, output filename]
  ["chart.js", "dist/chart.umd.js", "chart.umd.min.js"],
  ["chartjs-plugin-datalabels", "dist/chartjs-plugin-datalabels.min.js", "chartjs-plugin-datalabels.min.js"],
  ["chartjs-chart-matrix", "dist/chartjs-chart-matrix.min.js", "chartjs-chart-matrix.min.js"],
  // SheetJS is also used Node-side by backend/excel.js, but vendoring the
  // browser UMD lets future versions add an in-browser "Export current view"
  // button without needing to re-bundle anything.
  ["xlsx", "dist/xlsx.full.min.js", "xlsx.full.min.js"],
];

let ok = 0;
for (const [pkg, sub, dest] of targets) {
  const src = path.join(root, "node_modules", pkg, sub);
  if (!fs.existsSync(src)) {
    // Try the non-minified path some packages publish.
    const alt = src.replace(".min.js", ".js");
    if (!fs.existsSync(alt)) {
      console.warn("[vendor] missing", pkg, "— run `npm install` first.");
      // Write a tiny placeholder so the manifest's <script> tag doesn't 404.
      const placeholder = "/* placeholder — " + pkg + " not yet vendored. Run `npm install && npm run vendor`. */";
      fs.writeFileSync(path.join(out, dest), placeholder, "utf8");
      continue;
    }
    fs.copyFileSync(alt, path.join(out, dest));
    console.log("[vendor] copied", pkg, "(non-min)", "→", dest);
    ok++;
    continue;
  }
  fs.copyFileSync(src, path.join(out, dest));
  console.log("[vendor] copied", pkg, "→", dest);
  ok++;
}

if (!ok) {
  console.warn("[vendor] no libraries vendored — placeholders were written so the plugin still loads.");
  process.exit(0);
}
console.log("[vendor] done.");
