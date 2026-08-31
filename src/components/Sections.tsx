import { SplitReveal } from "./SplitReveal";
import { Note, OrnamentMark, Slot } from "./primitives";
import { YearCurve } from "./YearCurve";

/* ------------------------------------------------------------------ О школе */

export function About({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    body: string[];
    pillars: { title: string; body: string }[];
  };
}) {
  return (
    <section className="section" id="about" data-label="О школе">
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <div className="about">
          <SplitReveal as="h2" className="h2 about__title">
            {data.title}
          </SplitReveal>
          <div className="about__body">
            {data.body.map((p) => (
              <p className="lead about__para" key={p.slice(0, 24)}>
                {p}
              </p>
            ))}
          </div>
        </div>

        <ul className="pillars grid grid--3">
          {data.pillars.map((p) => (
            <li className="pillar reveal" key={p.title}>
              <OrnamentMark size={22} className="pillar__mark" />
              <h3 className="h3 pillar__title">{p.title}</h3>
              <p className="pillar__body">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Бір жыл */

/**
 * ФИРМЕННЫЙ КОНТЕНТ.
 *
 * Одно окно, снятое двенадцать раз за год. Снимок кампуса на закате есть
 * у каждой школы в исследовании и не значит ничего; год с одной точки
 * невозможно скопировать — его можно только прожить.
 *
 * Для демонстрации без фотографий это лучший из возможных разделов:
 * двенадцать пустых кадров с подписанными месяцами читаются как замысел,
 * а не как отсутствие материала. И школа получает выполнимое ТЗ —
 * двенадцать выездов по двадцать минут за год.
 */
export function OneYear({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    lead: string;
    concept: string;
    note: string;
    monthsLabel: string;
    curveLabel: string;
    months: { kk: string; ru: string; temp: string }[];
  };
}) {
  return (
    <section
      className="section section--night"
      id="oneyear"
      data-label="Бір жыл"
    >
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <div className="oneyear__head">
          <SplitReveal as="h2" className="h2">
            {data.title}
          </SplitReveal>
          <div>
            <p className="lead">{data.lead}</p>
            <p className="small oneyear__concept">{data.concept}</p>
          </div>
        </div>

        <YearCurve months={data.months} label={data.curveLabel} />

        <p className="oneyear__label small">{data.monthsLabel}</p>
        <ol className="contactsheet">
          {data.months.map((m) => (
            <li className="frame reveal" key={m.ru}>
              <div className="frame__plate">
                <OrnamentMark size={18} className="frame__mark" />
              </div>
              <p className="frame__month">
                <span className="frame__kk">{m.kk}</span>
                <span className="frame__ru">{m.ru}</span>
              </p>
              <p className="frame__temp">{m.temp}</p>
            </li>
          ))}
        </ol>

        <Note>{data.note}</Note>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- День в школе */

export function Life({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    lead: string;
    slots: { ratio: string; caption: string; spec: string; tag: string }[];
    videoNote: string;
  };
}) {
  return (
    <section className="section" id="life" data-label="День в школе">
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <div className="life__head">
          <SplitReveal as="h2" className="h2">
            {data.title}
          </SplitReveal>
          <p className="lead">{data.lead}</p>
        </div>

        <div className="life__grid">
          {data.slots.map((s, i) => (
            <div className={`life__cell life__cell--${i + 1} reveal`} key={s.tag}>
              <Slot
                ratio={s.ratio}
                caption={s.caption}
                spec={s.spec}
                tag={s.tag}
              />
            </div>
          ))}
        </div>

        <Note>{data.videoNote}</Note>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Учителя */

export function Teachers({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    lead: string;
    note: string;
    items: {
      name: string;
      subject: string;
      credential: string;
      detail: string;
    }[];
    portraitSpec: string;
  };
}) {
  return (
    <section
      className="section section--band"
      id="teachers"
      data-label="Учителя"
    >
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <div className="life__head">
          <SplitReveal as="h2" className="h2">
            {data.title}
          </SplitReveal>
          <p className="lead">{data.lead}</p>
        </div>

        <ul className="teachers grid grid--4">
          {data.items.map((t, i) => (
            <li className="teacher reveal" key={i}>
              <Slot ratio="4 / 5" caption={data.portraitSpec} />
              <h3 className="teacher__name">{t.name}</h3>
              <p className="teacher__subject">{t.subject}</p>
              <p className="teacher__credential">{t.credential}</p>
              <p className="teacher__detail">{t.detail}</p>
            </li>
          ))}
        </ul>

        <Note>{data.note}</Note>
      </div>
    </section>
  );
}
