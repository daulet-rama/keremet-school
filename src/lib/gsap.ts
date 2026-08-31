"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

/**
 * Регистрация плагинов ровно один раз.
 *
 * SplitText и DrawSVG раньше были платными (GSAP Club). С переходом GSAP
 * под Webflow они бесплатны и лежат в том же публичном npm-пакете —
 * проверено: node_modules/gsap/SplitText.js и DrawSVGPlugin.js на месте.
 * Ключ, токен и приватный реестр не нужны.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);
}

/** Пользователь попросил меньше движения на уровне ОС. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP };
