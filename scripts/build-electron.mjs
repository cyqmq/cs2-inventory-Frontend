import { build } from "esbuild";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

// Build main process
await build({
  entryPoints: [resolve(root, "electron/main.ts")],
  outfile: resolve(root, "dist-electron/main.js"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  external: ["electron"]
});

// Build preload script
await build({
  entryPoints: [resolve(root, "electron/preload.ts")],
  outfile: resolve(root, "dist-electron/preload.js"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  external: ["electron"]
});

// Fix SPA HTML: remove streaming delimiter for non-streaming build
const htmlPath = resolve(root, "build/client/index.html");
if (existsSync(htmlPath)) {
  let html = readFileSync(htmlPath, "utf-8");
  html = html.replace(
    /<div id="splash">.*?<\/div>/s,
    ""
  );
  writeFileSync(htmlPath, html, "utf-8");
}

console.log("[build-electron] Done");
