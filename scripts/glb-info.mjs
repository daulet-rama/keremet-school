/**
 * Разбор GLB без библиотек: заголовок + JSON-чанк.
 *
 * Нужен, чтобы ДО интеграции понять, что внутри файла: сколько вершин,
 * есть ли нормали, сколько материалов и текстур. Модель со стока может
 * оказаться миллионом треугольников с четырьмя 4K-текстурами — на сайт
 * такое не ставят, и узнать это лучше сразу.
 */
import { readFileSync } from "node:fs";

const path = process.argv[2];
const buf = readFileSync(path);

const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) throw new Error("не GLB (нет magic glTF)");
const total = buf.readUInt32LE(8);

let off = 12;
let json = null;
let binLen = 0;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
  if (type === 0x004e4942) binLen = len;
  off += 8 + len + ((4 - ((off + 8 + len) % 4)) % 4);
  if (len === 0) break;
}

const g = json;
const acc = g.accessors || [];
let verts = 0;
let tris = 0;
let hasNormal = false;
let hasUV = false;

for (const m of g.meshes || []) {
  for (const p of m.primitives || []) {
    if (p.attributes.POSITION != null) verts += acc[p.attributes.POSITION].count;
    if (p.attributes.NORMAL != null) hasNormal = true;
    if (p.attributes.TEXCOORD_0 != null) hasUV = true;
    if (p.indices != null) tris += acc[p.indices].count / 3;
  }
}

console.log("  файл:        " + (buf.length / 1024).toFixed(1) + " КБ (заявлено " + (total / 1024).toFixed(1) + ")");
console.log("  бинарь:      " + (binLen / 1024).toFixed(1) + " КБ");
console.log("  мешей:       " + (g.meshes || []).length + ", узлов: " + (g.nodes || []).length);
console.log("  вершин:      " + verts.toLocaleString());
console.log("  треугольников: " + Math.round(tris).toLocaleString());
console.log("  нормали:     " + (hasNormal ? "есть" : "НЕТ"));
console.log("  uv:          " + (hasUV ? "есть" : "нет"));
console.log("  материалов:  " + (g.materials || []).length + ", текстур: " + (g.images || []).length);
if (g.asset) console.log("  генератор:   " + (g.asset.generator || "—"));
