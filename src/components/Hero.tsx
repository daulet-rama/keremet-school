import { SplitReveal } from "./SplitReveal";
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
 * Побочная выгода: LCP — это текст. Не картинка, не видео. Быстрее не бывает,
 * и трёхмерная сцена справа этого не меняет: она грузится отдельным чанком
 * уже после того, как заголовок отрисован.
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

          <p className="hero__meta" data-hero-in>
            <span>{brand.latin}</span>
            <span>{brand.since}</span>
          </p>
        </div>

        {/* Правая половина отдана трёхмерному орнаменту.
            Раньше здесь стояла заглушка под фотографию — бежевый
            прямоугольник, самый безжизненный элемент первого экрана,
            вдобавок разрезавший объект пополам. Кадр из съёмочного ТЗ
            переехал в раздел «День в школе», где фотографии и место. */}
      </div>

      <p className="hero__scroll" aria-hidden="true">
        {hero.scroll}
      </p>
    </section>
  );
}
