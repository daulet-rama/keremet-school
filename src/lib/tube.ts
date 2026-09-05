/**
 * Построение трубчатой геометрии вдоль кривой.
 *
 * В ogl нет TubeGeometry — и это ровно та сделка, ради которой стоило
 * уходить с three.js: собственный построитель занимает сотню строк, тогда
 * как ради готового класса пришлось бы тащить весь рендерер three. По
 * замерам исследования каталог geometries в three — 3,4 КБ из 527, а
 * рендерер — 66% веса. Платить 118 КБ gzip за 3,4 КБ функциональности
 * бессмысленно.
 *
 * Кадры считаются параллельным переносом: наивный подход через
 * фиксированную «верхнюю» ось даёт скручивание трубки на вертикальных
 * участках, где касательная почти совпадает с этой осью, — а у орнамента
 * такие участки основные.
 */

type V3 = [number, number, number];

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function norm(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Один сегмент сплайна Катмулла–Рома с натяжением. */
function catmullRom(p0: V3, p1: V3, p2: V3, p3: V3, t: number, tension: number): V3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const v0 = scale(sub(p2, p0), tension);
  const v1 = scale(sub(p3, p1), tension);
  const a = add(add(scale(sub(p1, p2), 2), v0), v1);
  const b = add(add(scale(sub(p2, p1), 3), scale(v0, -2)), scale(v1, -1));
  return add(add(add(scale(a, t3), scale(b, t2)), scale(v0, t)), p1);
}

/** Равномерная выборка кривой по опорным точкам. */
export function sampleCurve(
  points: V3[],
  samples: number,
  tension = 0.5
): V3[] {
  const n = points.length;
  const out: V3[] = [];
  const segs = n - 1;

  for (let i = 0; i < samples; i++) {
    const u = (i / (samples - 1)) * segs;
    const seg = Math.min(Math.floor(u), segs - 1);
    const t = u - seg;
    const p0 = points[Math.max(seg - 1, 0)];
    const p1 = points[seg];
    const p2 = points[seg + 1];
    const p3 = points[Math.min(seg + 2, n - 1)];
    out.push(catmullRom(p0, p1, p2, p3, t, tension));
  }
  return out;
}

export type TubeData = {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
  index: Uint16Array;
};

export function buildTube(
  curve: V3[],
  radius: number,
  radialSegments: number
): TubeData {
  const n = curve.length;

  // Касательные
  const tangents: V3[] = curve.map((_, i) => {
    const a = curve[Math.max(i - 1, 0)];
    const b = curve[Math.min(i + 1, n - 1)];
    return norm(sub(b, a));
  });

  // Стартовая нормаль: любая ось, наименее сонаправленная с касательной,
  // иначе на вертикальном участке векторное произведение выродится в ноль.
  const t0 = tangents[0];
  const seed: V3 =
    Math.abs(t0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let nrm = norm(cross(seed, t0));

  const normals: V3[] = [];
  const binormals: V3[] = [];

  for (let i = 0; i < n; i++) {
    const t = tangents[i];
    // Параллельный перенос: снимаем составляющую вдоль касательной.
    nrm = norm(sub(nrm, scale(t, dot(nrm, t))));
    normals.push(nrm);
    binormals.push(norm(cross(t, nrm)));
  }

  const ring = radialSegments + 1; // шов дублируется ради непрерывных uv
  const vertCount = n * ring;
  const position = new Float32Array(vertCount * 3);
  const normal = new Float32Array(vertCount * 3);
  const uv = new Float32Array(vertCount * 2);

  let vi = 0;
  let ui = 0;
  for (let i = 0; i < n; i++) {
    const p = curve[i];
    const N = normals[i];
    const B = binormals[i];
    for (let j = 0; j < ring; j++) {
      const a = (j / radialSegments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const nx = N[0] * cos + B[0] * sin;
      const ny = N[1] * cos + B[1] * sin;
      const nz = N[2] * cos + B[2] * sin;

      position[vi] = p[0] + nx * radius;
      position[vi + 1] = p[1] + ny * radius;
      position[vi + 2] = p[2] + nz * radius;
      normal[vi] = nx;
      normal[vi + 1] = ny;
      normal[vi + 2] = nz;
      vi += 3;

      uv[ui] = i / (n - 1);
      uv[ui + 1] = j / radialSegments;
      ui += 2;
    }
  }

  const index = new Uint16Array((n - 1) * radialSegments * 6);
  let ii = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ring + j;
      const b = a + ring;
      index[ii++] = a;
      index[ii++] = b;
      index[ii++] = a + 1;
      index[ii++] = b;
      index[ii++] = b + 1;
      index[ii++] = a + 1;
    }
  }

  return { position, normal, uv, index };
}
