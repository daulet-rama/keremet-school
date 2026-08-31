"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ornamentPath, RAIL_WIDTH, UNIT_HEIGHT } from "@/lib/ornament";
import styles from "./OrnamentRail.module.css";

const UNITS = 4;

/**
 * ФИРМЕННЫЙ ЭЛЕМЕНТ.
 *
 * Орнаментальная линия прочерчивается по мере прокрутки страницы и работает
 * индикатором прогресса. Национальное входит геометрией, а не иллюстрацией —
 * это линия, а не ковёр, поэтому фольклора не возникает.
 *
 * Практическая причина, по которой выбран именно этот элемент: он не требует
 * НИ ОДНОЙ фотографии. На демонстрации без реальных снимков страница всё
 * равно выглядит законченной.
 *
 * DrawSVGPlugin раньше был платным, теперь входит в публичный пакет gsap.
 */
export function OrnamentRail({ sections }: { sections: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        // Уменьшенное движение: линия просто целиком на месте.
        gsap.set(path, { drawSVG: "0% 100%" });
      } else {
        gsap.fromTo(
          path,
          { drawSVG: "0% 0%" },
          {
            drawSVG: "0% 100%",
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
            },
          }
        );
      }

      // Указатель текущего раздела, подвешенный в поле.
      // Дешевле и полезнее декоративной смены цвета.
      //
      // onEnter/onEnterBack, а НЕ onToggle: onToggle срабатывает и на вход,
      // и на выход, поэтому при прыжке по якорю выигрывал тот триггер, что
      // отработал последним, — и подпись показывала чужой раздел.
      //
      // refreshPriority ниже, чем у закреплённой секции: пиннинг меняет
      // высоту документа, и все позиции ниже него нужно пересчитывать
      // ПОСЛЕ него, иначе границы разделов оказываются устаревшими.
      sections.forEach((name, i) => {
        const el = document.getElementById(name);
        if (!el) return;
        const index = String(i + 1).padStart(2, "0");
        const setLabel = () => {
          if (labelRef.current) {
            labelRef.current.textContent = `${index} — ${
              el.dataset.label ?? name
            }`;
          }
        };
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          refreshPriority: -1,
          onEnter: setLabel,
          onEnterBack: setLabel,
        });
      });
    },
    { scope: root, dependencies: [sections] }
  );

  return (
    <div className={styles.rail} ref={root} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${RAIL_WIDTH} ${UNIT_HEIGHT * UNITS}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Бледный след — путь целиком, чтобы линия читалась как маршрут */}
        <path
          d={ornamentPath(UNITS)}
          stroke="var(--line-strong)"
          strokeWidth="1"
          opacity="0.45"
          vectorEffect="non-scaling-stroke"
        />
        {/* Прочерчиваемая линия.
            Толще следа под ней: контраст между пройденным и оставшимся
            должен читаться боковым зрением, не требуя присматриваться.
            non-scaling-stroke обязателен — viewBox растянут по высоте
            под 100vh, и без него линия поехала бы по толщине. */}
        <path
          ref={pathRef}
          d={ornamentPath(UNITS)}
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className={styles.label} ref={labelRef}>
        01 — Начало
      </span>
    </div>
  );
}
