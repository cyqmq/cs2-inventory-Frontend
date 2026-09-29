const { readdirSync, readFileSync } = require("fs");
const { gzipSync } = require("zlib");
const { join } = require("path");

const d = "build/client/assets";
const patterns = [/english-/, /schinese-/, /tchinese-/, /german-/, /portuguese-/, /spanish-/, /french-/, /japanese-/];
for (const re of patterns) {
  const name = readdirSync(d).find((x) => re.test(x));
  const raw = readFileSync(join(d, name));
  console.log(name, "gzip", (gzipSync(raw, { level: 9 }).length / 1024).toFixed(1), "KB");
}