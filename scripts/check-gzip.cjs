const { readdirSync, readFileSync } = require("fs");
const { gzipSync } = require("zlib");
const { join } = require("path");

const dir = process.argv[2];
const files = readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
const sizes = files.map((name) => {
  const raw = readFileSync(join(dir, name));
  return { name, raw: raw.length, gzip: gzipSync(raw, { level: 9 }).length };
});

const langPrefixes = /^(thai|greek|bulgarian|russian|ukrainian|japanese|vietnamese|koreana|turkish|polish|french|italian|schinese|tchinese|brazilian|spanish|latam|german|portuguese|english|czech|danish|dutch|finnish|hungarian|indonesian|norwegian|romanian|swedish)-/;
const langs = sizes.filter((s) => langPrefixes.test(s.name));
const main = sizes.filter((s) => !langPrefixes.test(s.name));

const kb = (n) => (n / 1024).toFixed(1) + " KB";
function total(list) {
  return list.reduce((a, s) => a + s.gzip, 0);
}

console.log("=== MAIN chunks (gzip) ===");
for (const s of [...main].sort((a, b) => b.gzip - a.gzip).slice(0, 10)) {
  console.log(s.name.padEnd(40), "raw", kb(s.raw).padStart(10), "gzip", kb(s.gzip).padStart(10));
}
console.log("MAIN gzip total:", kb(total(main)));

console.log("\n=== Language chunks (gzip) — largest 5 ===");
for (const s of [...langs].sort((a, b) => b.gzip - a.gzip).slice(0, 5)) {
  console.log(s.name.padEnd(40), "raw", kb(s.raw).padStart(10), "gzip", kb(s.gzip).padStart(10));
}
console.log("LANG gzip total (all langs):", kb(total(langs)));