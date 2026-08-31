"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Month = { kk: string; ru: string; temp: string };

const W = 1200;
const H = 190;
const PAD_X = 16;
const TOP = 26;
const BOTTOM = 140;

/** "−31°" → -31 */
function parseTemp(t: string): number {
  return Number(t.replace("°", "").replace("−", "-").replace("+", ""));
}

/**
 * Гладкая кривая через точки: средние точки как опорные, сегменты —
 * квадратичные кривые. Даёт мягкую линию без выбросов, в отличие от
 * наивного Catmull-Rom, который на резком январском провале «выстреливает».
 */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y}, ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` Q ${last.x} ${last.y}, ${last.x} ${last.y}`;
  return d;
}

/**
 * Температурная кривая года.
 *
 * Тот же язык линии, что у орнамента, но проведённый по данным. Здесь он
 * решает конкретную проблему: без фотографий «Бір жыл» — это двенадцать
 * пустых кадров, и раздел выглядит как отсутствие материала. Кривая даёт
 * ему содержание уже сейчас и объясняет замысел лучше любого текста:
 * видно, что за окном действительно происходит год.
 *
 * Когда появятся настоящие снимки, кривая останется — она их подписывает.
 */
export function YearCurve({
  months,
  label,
}: {
  months: Month[];
  label: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);

  const temps = months.map((m) => parseTemp(m.temp));
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const span = max - min || 1;

  const pts = temps.map((t, i) => ({
    x: PAD_X + (i * (W - PAD_X * 2)) / (temps.length - 1),
    y: TOP + ((max - t) / span) * (BOTTOM - TOP),
  }));

  const zeroY = TOP + ((max - 0) / span) * (BOTTOM - TOP);

  useGSAP(
    () => {
      const el = line.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { drawSVG: "0% 100%" });
        return;
      }

      gsap.fromTo(
        el,
        { drawSVG: "0% 0%" },
        {
          drawSVG: "0% 100%",
          duration: 1.8,
          ease: "power2.inOut",
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        }
      );

      gsap.from(root.current!.querySelectorAll(".curve__dot"), {
        scale: 0,
        transformOrigin: "center",
        duration: 0.5,
        ease: "back.out(2)",
        stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
      });
    },
    { scope: root }
  );

  return (
    <figure className="curve" ref={root}>
      <figcaption className="curve__label small">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
        <title>{label}</title>

        {/* нулевая изотерма — единственная опорная линия */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--night-line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        <path
          ref={line}
          d={smoothPath(pts)}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />

        {pts.map((p, i) => (
          <circle
            key={i}
            className="curve__dot"
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="var(--accent)"
          />
        ))}
      </svg>

      {/* Значения — обычным текстом, а не внутри SVG: так они масштабируются
          вместе с остальной типографикой и остаются доступны для чтения. */}
      <ol className="curve__scale">
        {months.map((m) => (
          <li key={m.ru}>
            <span className="curve__temp">{m.temp}</span>
            <span className="curve__month">{m.kk.slice(0, 3)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
