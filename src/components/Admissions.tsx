import { SplitReveal } from "./SplitReveal";
import { Note, Slot } from "./primitives";

export function Admissions({
  data,
}: {
  data: {
    kicker: string;
    title: string;
    deadline: string;
    steps: { n: string; title: string; body: string; meta: string }[];
    feesTitle: string;
    feesBody: string;
    feesNote: string;
    feesRows: { level: string; value: string }[];
    scholarship: string;
    officerTitle: string;
    officer: {
      name: string;
      role: string;
      line: string;
      capacity: string;
      capacityLabel: string;
      whatsapp: string;
      portraitSpec: string;
    };
    officerNote: string;
  };
}) {
  return (
    <section className="section" id="admissions" data-label="Поступление">
      <div className="wrap railed">
        <p className="kicker">{data.kicker}</p>
        <div className="life__head">
          <SplitReveal as="h2" className="h2">
            {data.title}
          </SplitReveal>
          <p className="deadline">{data.deadline}</p>
        </div>

        <ol className="steps grid grid--4">
          {data.steps.map((s) => (
            <li className="step reveal" key={s.n}>
              <p className="step__n">{s.n}</p>
              <h3 className="h3 step__title">{s.title}</h3>
              <p className="step__body">{s.body}</p>
              <p className="step__meta">{s.meta}</p>
            </li>
          ))}
        </ol>

        {/* Стоимость на главной.
            Большинство изученных школ прячет цену за формой заявки. Открытая
            цена — сильный сигнал уважения к времени родителя и редкое
            конкурентное отличие в этом рынке. */}
        <div className="fees">
          <div className="fees__intro">
            <h3 className="h3">{data.feesTitle}</h3>
            <p className="lead">{data.feesBody}</p>
            <p className="small">{data.scholarship}</p>
          </div>
          <div className="fees__table">
            <dl>
              {data.feesRows.map((r) => (
                <div className="fees__row" key={r.level}>
                  <dt>{r.level}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            <Note>{data.feesNote}</Note>
          </div>
        </div>

        {/* Один человек с именем и лицом вместо «нашей приёмной комиссии». */}
        <div className="officer">
          <div className="officer__portrait">
            <Slot ratio="4 / 5" caption={data.officer.portraitSpec} />
          </div>
          <div className="officer__body">
            <p className="kicker">{data.officerTitle}</p>
            <h3 className="h3 officer__name">{data.officer.name}</h3>
            <p className="officer__role">{data.officer.role}</p>
            <p className="lead officer__line">{data.officer.line}</p>
            <p className="officer__capacity">
              <span className="officer__number">{data.officer.capacity}</span>
              <span className="officer__caplabel">
                {data.officer.capacityLabel}
              </span>
            </p>
            <a className="btn btn--primary" href="#visit">
              {data.officer.whatsapp}
            </a>
            <Note>{data.officerNote}</Note>
          </div>
        </div>
      </div>
    </section>
  );
}
