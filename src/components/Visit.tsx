"use client";

import { useState } from "react";
import { SplitReveal } from "./SplitReveal";
import { Note } from "./primitives";

/**
 * Форма визита.
 *
 * Четыре поля. Из исследования конверсии приёмных кампаний: длина формы —
 * первый убийца заявки, а «запись на визит» конвертирует лучше, чем
 * абстрактное «оставить заявку», потому что предлагает конкретное действие
 * с понятным объёмом обязательств.
 *
 * Отправка намеренно заблокирована и показывает состояние успеха: на
 * демонстрации перед заказчиком ничего не должно улетать в пустоту.
 * Подключение к CRM — одна строка в onSubmit.
 */
export function Visit({
  data,
}: {
  data: {
    title: string;
    body: string;
    button: string;
    alt: string;
    formNote: string;
    fields: {
      name: string;
      phone: string;
      grade: string;
      submit: string;
      success: string;
      demo: string;
    };
  };
}) {
  const [sent, setSent] = useState(false);

  return (
    <section
      className="section section--night visit"
      id="visit"
      data-label="Визит"
    >
      <div className="wrap railed visit__inner">
        <div className="visit__text">
          <SplitReveal as="h2" className="h2">
            {data.title}
          </SplitReveal>
          <p className="lead visit__lead">{data.body}</p>
          <p className="small">{data.alt}</p>
        </div>

        <div className="visit__form">
          {sent ? (
            <div className="visit__success" role="status">
              <p className="h3">{data.fields.success}</p>
              <p className="small visit__demo">{data.fields.demo}</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="field">
                <span className="field__label">{data.fields.name}</span>
                <input className="field__input" name="name" required />
              </label>
              <label className="field">
                <span className="field__label">{data.fields.phone}</span>
                <input
                  className="field__input"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+7"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">{data.fields.grade}</span>
                <input className="field__input" name="grade" required />
              </label>
              <button className="btn btn--primary visit__submit" type="submit">
                {data.fields.submit}
              </button>
            </form>
          )}
          <Note>{data.formNote}</Note>
        </div>
      </div>
    </section>
  );
}
