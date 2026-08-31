"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitReveal } from "./SplitReveal";

type Stage = { years: string; name: string; body: string; points: string[] };

/**
 * Единственная закреплённая секция на странице.
 *
 * Из исследования: закреплённое скролл-повествование — самый уместный для
 * образования приём, потому что у школы действительно есть последовательность,
 * которую нужно рассказать (двенадцать лет), а не просто набор блоков.
 * И ровно поэтому она здесь одна: пиннинг на каждой секции убивает смысл
 * полосы прокрутки как индикатора длины страницы.
 *
 * Горизонтальная прокрутка включается ТОЛЬКО на широких экранах и только при
 * отсутствии запроса на уменьшенное движение. Всё остальное время это
 * обычный вертикальный список — потому что горизонталь ломает клавиатурную
 * постраничную прокрутку и мучительна на трекпаде.
 */
export function Pathway({
  data,
}: {
  data: { kicker: string; title: string; hint: string; stages: Stage[] };
}) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 940px) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = track.current;
          const section = root.current;
          if (!el || !section) return;

          const distance = () =>
            Math.max(0, el.scrollWidth - window.innerWidth * 0.82);

          gsap.to(el, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance() + window.innerHeight * 0.6}`,
              pin: true,
              scrub: 0.7,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // Пиннинг растягивает документ, поэтому он должен пересчитаться
              // раньше всех остальных триггеров на странице.
              refreshPriority: 1,
              onUpdate: (self) => {
                if (bar.current) {
                  bar.current.style.transform = `scaleX(${self.progress})`;
                }
              },
            },
          });
        }
      );

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section
      className="section pathway"
      id="pathway"
      data-label="Программа"
      ref={root}
    >
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <SplitReveal as="h2" className="h2 section__title">
          {data.title}
        </SplitReveal>
        <p className="small pathway__hint">{data.hint}</p>
        <div className="pathway__progress" aria-hidden="true">
          <span className="pathway__bar" ref={bar} />
        </div>
      </div>

      {/* Трек лежит внутри обычного .wrap.railed — так его левый край
          автоматически совпадает с колонкой заголовка. Считать отступ
          через 100vw нельзя: 100vw включает полосу прокрутки, а
          центрирование контейнера — нет, и появляется расхождение
          в половину её ширины. Вправо трек выходит за край: у секции
          overflow: hidden. */}
      <div className="wrap railed pathway__viewport">
      <ol className="pathway__track" ref={track}>
        {data.stages.map((stage, i) => (
          <li className="stage" key={stage.name}>
            <p className="stage__index">{String(i + 1).padStart(2, "0")}</p>
            <p className="stage__years">{stage.years}</p>
            <h3 className="h3 stage__name">{stage.name}</h3>
            <p className="stage__body">{stage.body}</p>
            <ul className="stage__points">
              {stage.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
