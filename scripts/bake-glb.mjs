/**
 * Запекание GLB в компактный модуль на этапе сборки.
 *
 * Зачем не грузить GLB в рантайме: полноценный загрузчик glTF весит
 * больше, чем сама наша сцена на ogl (17 КБ). Здесь мы один раз, при
 * сборке, вытаскиваем только то, что реально нужно — позиции, нормали
 * и индексы — применяем трансформации узлов, центрируем, нормируем
 * размер и пишем base64-модуль. В рантайме остаётся простое
 * декодирование: ни сетевого запроса, ни разбора спецификации.
 *
 * Запуск: node scripts/bake-glb.mjs <вход.glb> <выход.ts> [целевой_размер]
 */
import { readFileSync, writeFileSync } from "node:fs";

const [inPath, outPath, sizeArg] = process.argv.slice(2);
const TARGET = Number(sizeArg || 10); // желаемый габарит в мировых единицах

/* ------------------------------------------------ разбор контейнера */

const buf = readFileSync(inPath);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("не GLB");

let off = 12;
let gltf = null;
let bin = null;
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) gltf = JSON.parse(data.toString("utf8"));
  if (type === 0x004e4942) bin = data;
  off += 8 + len;
  off += (4 - (off % 4)) % 4;
}
if (!gltf) throw new Error("нет JSON-чанка");

/* ------------------------------------------------ доступ к данным */

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(i) {
  const a = gltf.accessors[i];
  const bv = gltf.bufferViews[a.bufferView];
  const Ctor = COMP[a.componentType];
  const n = NUM[a.type];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
  // Чередующиеся буферы (byteStride) читаем поэлементно, иначе получим кашу.
  const stride = bv.byteStride;
  if (stride && stride !== n * Ctor.BYTES_PER_ELEMENT) {
    const out = new Ctor(a.count * n);
    for (let k = 0; k < a.count; k++) {
      const src = new Ctor(bin.buffer, bin.byteOffset + start + k * stride, n);
      out.set(src, k * n);
    }
    return out;
  }
  return new Ctor(bin.buffer, bin.byteOffset + start, a.count * n);
}

/* ------------------------------------------------ матрицы */

function mulMat4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}

function trs(node) {
  if (node.matrix) return Float32Array.from(node.matrix);
  const t = node.translation || [0, 0, 0];
  const q = node.rotation || [0, 0, 0, 1];
  const s = node.scale || [1, 1, 1];
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return Float32Array.from([
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ]);
}

/* ------------------------------------------------ обход сцены */

const positions = [];
const normals = [];
const indices = [];
let vOffset = 0;

function visit(nodeIndex, parent) {
  const node = gltf.nodes[nodeIndex];
  const world = mulMat4(parent, trs(node));

  if (node.mesh != null) {
    for (const prim of gltf.meshes[node.mesh].primitives) {
      if (prim.attributes.POSITION == null) continue;
      const pos = readAccessor(prim.attributes.POSITION);
      const nrm = prim.attributes.NORMAL != null ? readAccessor(prim.attributes.NORMAL) : null;
      const count = pos.length / 3;

      for (let k = 0; k < count; k++) {
        const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
        positions.push(
          world[0] * x + world[4] * y + world[8] * z + world[12],
          world[1] * x + world[5] * y + world[9] * z + world[13],
          world[2] * x + world[6] * y + world[10] * z + world[14]
        );
        if (nrm) {
          // Нормали поворачиваем без переноса. Неравномерного масштаба
          // в этих моделях нет, поэтому обратной транспонированной не нужно.
          const nx = nrm[k * 3], ny = nrm[k * 3 + 1], nz = nrm[k * 3 + 2];
          let ax = world[0] * nx + world[4] * ny + world[8] * nz;
          let ay = world[1] * nx + world[5] * ny + world[9] * nz;
          let az = world[2] * nx + world[6] * ny + world[10] * nz;
          const l = Math.hypot(ax, ay, az) || 1;
          normals.push(ax / l, ay / l, az / l);
        } else {
          normals.push(0, 1, 0);
        }
      }

      if (prim.indices != null) {
        const idx = readAccessor(prim.indices);
        for (let k = 0; k < idx.length; k++) indices.push(idx[k] + vOffset);
      } else {
        for (let k = 0; k < count; k++) indices.push(k + vOffset);
      }
      vOffset += count;
    }
  }

  for (const child of node.children || []) visit(child, world);
}

const scene = gltf.scenes[gltf.scene || 0];
const identity = Float32Array.from([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
for (const n of scene.nodes) visit(n, identity);

/* ------------------------------------------------ центрирование и масштаб */

let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
  minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
  minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
  minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
}
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
const k = TARGET / extent;

const pos32 = new Float32Array(positions.length);
for (let i = 0; i < positions.length; i += 3) {
  pos32[i] = (positions[i] - cx) * k;
  pos32[i + 1] = (positions[i + 1] - cy) * k;
  pos32[i + 2] = (positions[i + 2] - cz) * k;
}
const nrm32 = Float32Array.from(normals);

if (vOffset > 65535) throw new Error("вершин больше 65535 — Uint16 не хватит: " + vOffset);
const idx16 = Uint16Array.from(indices);

/* ------------------------------------------------ вывод */

const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString("base64");

const src = `/* Сгенерировано scripts/bake-glb.mjs из ${inPath.replace(/\\\\/g, "/")}.
   Не редактировать вручную — пересобирается скриптом.
   Вершин: ${vOffset}, треугольников: ${idx16.length / 3}. */
import { decodeBaked } from "@/lib/baked";

export const MODEL = decodeBaked(
  ${JSON.stringify(b64(pos32))},
  ${JSON.stringify(b64(nrm32))},
  ${JSON.stringify(b64(idx16))}
);
`;

writeFileSync(outPath, src, "utf8");

console.log("  вершин:        " + vOffset.toLocaleString());
console.log("  треугольников: " + (idx16.length / 3).toLocaleString());
console.log("  габарит до:    " + extent.toFixed(3) + " -> " + TARGET);
console.log("  модуль:        " + (src.length / 1024).toFixed(1) + " КБ (base64)");
