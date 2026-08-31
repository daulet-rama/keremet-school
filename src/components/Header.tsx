"use client";

import { useEffect, useState } from "react";
import { OrnamentMark } from "./primitives";

type NavItem = { label: string; href: string };

export function Header({
  brand,
  nav,
}: {
  brand: { name: string; descriptor: string };
  nav: { items: NavItem[]; cta: string; menuOpen: string; menuClose: string };
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape закрывает меню — базовая клавиатурная гигиена,
  // отсутствующая на большинстве изученных сайтов.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="site-header__inner wrap">
        <a href="#top" className="brand" aria-label={brand.name}>
          <OrnamentMark size={22} className="brand__mark" />
          <span className="brand__name">{brand.name}</span>
          <span className="brand__descriptor">{brand.descriptor}</span>
        </a>

        <nav className="site-nav" aria-label="Основная навигация">
          <ul className="site-nav__list">
            {nav.items.map((item) => (
              <li key={item.href}>
                <a className="link-underline" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a href="#visit" className="btn btn--primary site-header__cta">
            {nav.cta}
          </a>
          <button
            className="burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? nav.menuClose : nav.menuOpen}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className="mobile-menu"
        hidden={!open}
        onClick={() => setOpen(false)}
      >
        <ul className="mobile-menu__list wrap">
          {nav.items.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
          <li>
            <a href="#visit" className="mobile-menu__cta">
              {nav.cta}
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
