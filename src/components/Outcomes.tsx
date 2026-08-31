"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitReveal } from "./SplitReveal";
import { Note } from "./primitives";

type Item = { value: string; suffix: string; label: string };
type Row = { label: string; meta: string; count: number };

/**
 * Блок доказательств — вторым, сразу после героя.
 *
 * Обоснование позиции из исследования: Milton Academy кладёт таблицу
 * результатов под раздел Admission, а не под Academics — результат
 * работает входом в решение, а не справкой в глубине сайта.
 *
 * ЧТО именно доказывается, зависит от школы. Керемет заканчивается седьмым
 * классом и существует три года, поэтому поступлений в вузы у неё нет и
 * быть не может — вместо них здесь рост по годам. Для молодой школы это
 * честнее и сильнее: рост читается как «сюда идут и отсюда не уходят»,
 * тогда как проценты поступления ей просто неоткуда взять.
 *
 * Формат тот же и работает для любых рядов: семантическая таблица с полосой
 * в ячейке, плюс дата выгрузки — её не публикует ни одна школа из изученных,
 * а без неё цифру нельзя проверить.
 */
export function Outcomes({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    note: string;
    items: Item[];
    ledgerTitle: string;
    ledgerCaption: string;
    ledgerNote: string;
    ledgerHead: { label: string; meta: string; count: string };
    ledger: Row[];
    shareLabel: string;
    shareNote: string;
  };
}) {
  const root = useRef<HTMLElement>(null);
  const max = Math.max(...data.ledger.map((r) => r.count));

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) return;

      // Счётчики: только там, где значение действительно числовое.
      root.current?.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });

      // Полосы в ячейках растут от нуля.
      gsap.from(root.current!.querySelectorAll(".ledger__bar"), {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: root.current!.querySelector(".ledger"),
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: root }
  );

  return (
    <section
      className="section section--band"
      id="outcomes"
      data-label="Рост"
      ref={root}
    >
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <SplitReveal as="h2" className="h2 section__title">
          {data.title}
        </SplitReveal>

        <ul className="proof grid grid--4">
          {data.items.map((item) => {
            const numeric = /^\d+$/.test(item.value);
            return (
              <li className="proof__item reveal" key={item.label}>
                <p className="proof__value">
                  {numeric ? (
                    <span data-count={item.value}>0</span>
                  ) : (
                    <span>{item.value}</span>
                  )}
                  <span className="proof__suffix">{item.suffix}</span>
                </p>
                <p className="proof__label">{item.label}</p>
              </li>
            );
          })}
        </ul>

        <Note>{data.note}</Note>

        <div className="ledger">
          <div className="ledger__head">
            <h3 className="h3">{data.ledgerTitle}</h3>
            <button className="btn btn--ghost ledger__share" type="button">
              {data.shareLabel}
            </button>
          </div>

          <table className="ledger__table">
            <caption className="ledger__caption">{data.ledgerCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{data.ledgerHead.label}</th>
                <th scope="col" className="ledger__country">
                  {data.ledgerHead.meta}
                </th>
                <th scope="col" className="ledger__num">
                  {data.ledgerHead.count}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="ledger__country">{row.meta}</td>
                  <td className="ledger__num">
                    <span
                      className="ledger__bar"
                      style={{ width: `${(row.count / max) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="ledger__count">{row.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Note>{data.ledgerNote}</Note>
          <Note>{data.shareNote}</Note>
        </div>
      </div>
    </section>
  );
}
