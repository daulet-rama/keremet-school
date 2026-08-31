import { SplitReveal } from "./SplitReveal";
import { Slot } from "./primitives";
import { HeroMotion } from "./HeroMotion";

/**
 * Герой — типографический, без автоплей-видео. Это не экономия, а вывод
 * из исследования.
 *
 * Видео в герое стоит у Eton, Harrow, Winchester, Rugby, Wellington, Choate,
 * Groton, Lawrenceville, Dulwich, Hotchkiss. Исключений ровно два — и оба
 * показательны: у Phillips Academy Andover героем работает интерактивная
 * сетка статистики, а у Institut auf dem Rosenberg, самой дорогой школы мира,
 * в разметке главной нет ни одного тега <video>. Самая дорогая школа —
 * единственная, которая не запускает фильм вам в лицо.
 *
 * Побочная выгода: LCP — это текст. Не картинка, не видео. Быстрее не бывает.
 */
export function Hero({
  brand,
  hero,
}: {
  brand: { name: string; latin: string; since: string };
  hero: {
    eyebrow: string;
    title: string[];
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
    media: { ratio: string; caption: string; spec: string };
  };
}) {
  return (
    <section className="hero" id="top" data-label="Начало">
      <HeroMotion />
      <div className="wrap railed hero__inner">
        <div className="hero__text">
          <p className="kicker" data-hero-in>
            {hero.eyebrow}
          </p>

          {/* Настоящий h1 с настоящим текстом.
              У Harrow, Exeter, Groton, Lawrenceville и Collegiate в h1
              стоит слово «Home»; у Brighton, Dulwich и Trinity NYC он пуст.
              Это самый устойчивый провал сектора — и самый дешёвый в починке. */}
          <SplitReveal as="h1" className="display hero__title">
            {hero.title.map((line) => (
              <span className="hero__line" key={line}>
                {line}{" "}
              </span>
            ))}
          </SplitReveal>

          <p className="lead hero__lead" data-hero-in>
            {hero.lead}
          </p>

          <div className="hero__actions" data-hero-in>
            <a href="#visit" className="btn btn--primary">
              {hero.ctaPrimary}
            </a>
            <a href="#admissions" className="btn btn--ghost">
              {hero.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="hero__aside" data-hero-in>
          <Slot
            ratio={hero.media.ratio}
            caption={hero.media.caption}
            spec={hero.media.spec}
          />
          <p className="hero__meta">
            <span>{brand.latin}</span>
            <span>{brand.since}</span>
          </p>
        </div>
      </div>

      <p className="hero__scroll" aria-hidden="true">
        {hero.scroll}
      </p>
    </section>
  );
}
