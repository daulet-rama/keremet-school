"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Lenis — плавная прокрутка.
 *
 * Почему Lenis, а не Locomotive: Locomotive v4 транслировал контейнер вместо
 * настоящей прокрутки и ломал поиск по странице, якорные ссылки, скринридеры,
 * position:sticky и scroll-snap. Lenis лерпит НАСТОЯЩЕЕ значение прокрутки,
 * поэтому всё перечисленное продолжает работать. Спор закрыт самой
 * библиотекой: Locomotive v5 переписан поверх Lenis.
 *
 * Выключается при prefers-reduced-motion: сглаживание прокрутки — это ровно
 * тот эффект, от которого людей укачивает.
 */
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
