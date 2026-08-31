"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ornamentPath, RAIL_WIDTH, UNIT_HEIGHT } from "@/lib/ornament";

const UNITS = 2;

/**
 * Крупный орнамент в герое + хореография входа.
 *
 * Мотив қошқар мүйіз уже работает на левом рельсе, но там он шириной
 * 64 пикселя и живёт на полях. Здесь тот же самый путь взят в большом
 * масштабе и поставлен ЗА заголовком: фирменный знак перестаёт быть
 * украшением поля и становится подложкой первого экрана.
 *
 * Вход разложен во времени, а не показан разом: линия прочерчивается,
 * следом поднимается надзаголовок, затем строки заголовка (их ведёт
 * SplitText), затем подводка и кнопки. Разница между «страница появилась»
 * и «страница собралась» — это и есть ощущение сделанности.
 *
 * При prefers-reduced-motion ничего не проигрывается: всё сразу на месте.
 */
export function HeroMotion() {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const targets = gsap.utils.toArray<HTMLElement>("[data-hero-in]");

      if (reduced) {
        if (path.current) gsap.set(path.current, { drawSVG: "0% 100%" });
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        // Ждём шрифты: заголовок в Playfair, и если стартовать раньше
        // подмены, строки разъедутся прямо во время анимации.
        delay: 0.08,
      });

      if (path.current) {
        tl.fromTo(
          path.current,
          { drawSVG: "0% 0%" },
          { drawSVG: "0% 100%", duration: 2.1, ease: "power2.inOut" },
          0
        );
      }

      tl.fromTo(
        targets,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.11 },
        0.35
      );
    },
    { scope: root }
  );

  return (
    <div className="hero__ornament" ref={root} aria-hidden="true">
      <svg
        viewBox={`0 0 ${RAIL_WIDTH} ${UNIT_HEIGHT * UNITS}`}
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <path
          d={ornamentPath(UNITS)}
          stroke="var(--accent)"
          strokeWidth="0.9"
          strokeLinecap="round"
          ref={path}
        />
      </svg>
    </div>
  );
}
