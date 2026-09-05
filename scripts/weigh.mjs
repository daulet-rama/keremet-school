/**
 * Вес страницы по gzip, с разделением на критический путь и ленивые чанки.
 *
 * Важно мерить именно так: three.js приезжает отдельным чанком уже после
 * гидратации, поэтому он не задерживает первую отрисовку и LCP — но байты
 * пользователь всё равно скачивает, и делать вид, что их нет, нечестно.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const OUT = "out";
const html = readFileSync(join(OUT, "ru", "index.html"), "utf8");

const referenced = new Set();
for (const m of html.matchAll(/\/keremet-school(\/_next\/static\/[^"']+?\.(?:js|css|woff2))/g)) {
  referenced.add(m[1]);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const all = walk(join(OUT, "_next", "static")).filter((p) =>
  /\.(js|css|woff2)$/.test(p)
);

let critical = 0;
let lazy = 0;
const lazyBig = [];

for (const p of all) {
  const web = "/" + p.replace(/\\/g, "/").replace(/^out\//, "_next/").replace(/^out/, "");
  const rel = "/" + p.replace(/\\/g, "/").split("out/")[1];
  const buf = readFileSync(p);
  // woff2 уже сжат — повторный gzip не отражает реальность
  const size = p.endsWith(".woff2") ? buf.length : gzipSync(buf, { level: 9 }).length;
  if (referenced.has(rel)) critical += size;
  else {
    lazy += size;
    if (size > 20000) lazyBig.push([rel.split("/").pop(), size]);
  }
}

const htmlGz = gzipSync(Buffer.from(html), { level: 9 }).length;

console.log("  HTML (gzip):              " + htmlGz.toLocaleString() + " B");
console.log("  критический путь (gzip):  " + critical.toLocaleString() + " B");
console.log("  --- итого до отрисовки:   " + (htmlGz + critical).toLocaleString() + " B");
console.log("  ленивые чанки (gzip):     " + lazy.toLocaleString() + " B");
for (const [n, s] of lazyBig.sort((a, b) => b[1] - a[1]).slice(0, 4)) {
  console.log("      " + s.toLocaleString() + " B  " + n);
}
console.log("  === всё вместе:           " + (htmlGz + critical + lazy).toLocaleString() + " B");
