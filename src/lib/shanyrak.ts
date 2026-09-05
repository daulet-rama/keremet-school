/**
 * Шаңырақ — навершие юрты, построенное параметрически.
 *
 * Почему не скачанная модель: отдельного шаңырақ в стоках нет, он
 * встречается только в составе целой юрты, лицензии у таких моделей
 * платные или неясные, а вес готового GLB с загрузчиком glTF — сотни
 * килобайт против двух здесь. Для объекта, который целиком описывается
 * окружностью и семейством дуг, генерация — не компромисс, а точный
 * инструмент: форму можно править числом, а не перерисовывать.
 *
 * Конструкция повторяет настоящую:
 *  - сақина — внешнее кольцо;
 *  - күлдіреуіш — решётка дуг, выгнутых по сфере и образующих купол;
 *  - гнёзда под уық — короткие радиальные выступы по ободу.
 *
 * Смысловая привязка: шаңырақ держит весь купол и служит символом дома
 * и преемственности. Позиционирование школы — «первые семь лет решают
 * больше, чем все следующие», то есть речь ровно об опоре.
 */

import { buildTube, sampleCurve, type TubeData } from "./tube";

type V3 = [number, number, number];

/** Склейка нескольких трубок в одну геометрию с пересчётом индексов. */
function merge(parts: TubeData[]): TubeData {
  let vTotal = 0;
  let iTotal = 0;
  for (const p of parts) {
    vTotal += p.position.length / 3;
    iTotal += p.index.length;
  }

  const position = new Float32Array(vTotal * 3);
  const normal = new Float32Array(vTotal * 3);
  const uv = new Float32Array(vTotal * 2);
  const index = new Uint16Array(iTotal);

  let vo = 0; // смещение вершин
  let po = 0;
  let uo = 0;
  let io = 0;

  for (const p of parts) {
    position.set(p.position, po);
    normal.set(p.normal, po);
    uv.set(p.uv, uo);
    for (let k = 0; k < p.index.length; k++) index[io + k] = p.index[k] + vo;
    vo += p.position.length / 3;
    po += p.position.length;
    uo += p.uv.length;
    io += p.index.length;
  }

  return { position, normal, uv, index };
}

/** Высота точки на сферическом куполе; на ободе ровно ноль. */
function domeZ(x: number, y: number, R: number, domeR: number): number {
  const inside = Math.max(domeR * domeR - x * x - y * y, 0);
  const rim = Math.sqrt(Math.max(domeR * domeR - R * R, 0));
  return Math.sqrt(inside) - rim;
}

export type ShanyrakOptions = {
  /** Радиус внешнего кольца. */
  radius?: number;
  /** Толщина прутка. */
  thickness?: number;
  /** Радиус сферы купола: чем больше, тем площе. */
  domeRadius?: number;
  /** Число хорд в каждом из двух семейств решётки. */
  gridPerFamily?: number;
  /** Число гнёзд под уық по ободу. */
  sockets?: number;
  /** Детализация: сегментов вдоль и по окружности прутка. */
  lengthSegments?: number;
  radialSegments?: number;
};

export function buildShanyrak(opts: ShanyrakOptions = {}): TubeData {
  const R = opts.radius ?? 5;
  const t = opts.thickness ?? 0.3;
  const domeR = opts.domeRadius ?? R * 1.75;
  const perFamily = opts.gridPerFamily ?? 3;
  const sockets = opts.sockets ?? 16;
  const lenSeg = opts.lengthSegments ?? 220;
  const radSeg = opts.radialSegments ?? 8;

  const parts: TubeData[] = [];

  // --- сақина: внешнее кольцо ---
  // Замкнутая окружность строится с перехлёстом на один сегмент, иначе
  // на стыке остаётся зазор: параллельный перенос кадров работает на
  // разомкнутой кривой и не сшивает концы автоматически.
  const ringPts: V3[] = [];
  const ringSteps = 160;
  for (let i = 0; i <= ringSteps; i++) {
    const a = (i / ringSteps) * Math.PI * 2;
    ringPts.push([Math.cos(a) * R, Math.sin(a) * R, 0]);
  }
  parts.push(buildTube(ringPts, t, radSeg));

  // --- күлдіреуіш: два семейства хорд, выгнутых по куполу ---
  // Смещения подобраны так, чтобы ни одна хорда не прошла точно через
  // центр: иначе все дуги сойдутся в одной точке и купол превратится
  // в узел вместо решётки.
  const offsets: number[] = [];
  for (let i = 0; i < perFamily; i++) {
    const d = R * (0.2 + (i * 0.62) / Math.max(perFamily - 1, 1));
    offsets.push(d, -d);
  }

  const arcSteps = 48;
  for (const family of [0, 1]) {
    for (const d of offsets) {
      const half = Math.sqrt(Math.max(R * R - d * d, 0));
      if (half < R * 0.12) continue; // слишком короткий огрызок у самого обода
      const pts: V3[] = [];
      for (let i = 0; i <= arcSteps; i++) {
        const s = -half + (i / arcSteps) * half * 2;
        const x = family === 0 ? s : d;
        const y = family === 0 ? d : s;
        pts.push([x, y, domeZ(x, y, R, domeR)]);
      }
      parts.push(buildTube(sampleCurve(pts, lenSeg / 2), t * 0.72, radSeg));
    }
  }

  // --- гнёзда под уық по ободу ---
  for (let i = 0; i < sockets; i++) {
    const a = (i / sockets) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const pts: V3[] = [
      [cos * (R - t * 0.6), sin * (R - t * 0.6), 0],
      [cos * (R + t * 1.5), sin * (R + t * 1.5), -t * 0.5],
      [cos * (R + t * 2.4), sin * (R + t * 2.4), -t * 1.5],
    ];
    parts.push(buildTube(sampleCurve(pts, 14), t * 0.5, 6));
  }

  return merge(parts);
}
