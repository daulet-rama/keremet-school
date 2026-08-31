"use client";

import { createElement, useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Раскрытие заголовка построчно из-под обреза.
 *
 * Почему именно маскированные строки, а не побуквенный стаггер: строчная
 * маска переживает уменьшенное движение (сократил длительность — эффект
 * всё ещё читается), переживает загрузку шрифта и не трогает семантику
 * отдельных букв. Побуквенный стаггер — на один заголовок на странице,
 * при входе, и никогда на повторном скролле.
 *
 * SplitText 3.13+ сам расставляет aria-label на контейнере и aria-hidden
 * на сгенерированных строках, поэтому скринридер читает исходный текст,
 * а не набор обрывков. Это снимает главную историческую причину не
 * использовать разбиение текста на институциональном сайте.
 *
 * autoSplit пересобирает разбиение после загрузки веб-шрифта и на ресайзе —
 * без него получаешь classic CLS на первом экране.
 */
export function SplitReveal({
  as = "h2",
  className,
  children,
  delay = 0,
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self: { lines: Element[] }) => {
          el.classList.add("is-split");
          return gsap.from(self.lines, {
            yPercent: 108,
            duration: 0.95,
            ease: "power3.out",
            stagger: 0.075,
            delay,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          });
        },
      });

      return () => {
        split.revert();
        el.classList.remove("is-split");
      };
    },
    { scope: ref }
  );

  return createElement(as, { ref, className }, children);
}
