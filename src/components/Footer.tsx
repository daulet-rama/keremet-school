import Link from "next/link";
import { Note, OrnamentMark } from "./primitives";
import { LOCALE_LABEL, SHIPPED_LOCALES, type Locale } from "@/i18n/config";

export function Footer({
  brand,
  data,
  locale,
}: {
  brand: { name: string; latin: string; descriptor: string };
  locale: Locale;
  data: {
    address: string;
    addressNote: string;
    phone: string;
    email: string;
    socialTitle: string;
    social: { label: string; href: string; note?: string }[];
    legal: string;
    langLabel: string;
    colophonTitle: string;
    colophonNote: string;
    colophon: { k: string; v: string }[];
  };
}) {
  return (
    <footer className="footer">
      <div className="wrap railed">
        <div className="footer__top">
          <div className="footer__brand">
            <OrnamentMark size={28} />
            <p className="footer__name">{brand.name}</p>
            <p className="small">{brand.descriptor}</p>
          </div>

          <div className="footer__col">
            <p className="footer__label">{data.address}</p>
            <p className="small">{data.phone}</p>
            <p className="small">{data.email}</p>
            <Note>{data.addressNote}</Note>
          </div>

          <div className="footer__col">
            <p className="footer__label">{data.socialTitle}</p>
            <ul className="footer__social">
              {data.social.map((s) => (
                <li key={s.label}>
                  <a className="link-underline" href={s.href}>
                    {s.label}
                  </a>
                  {s.note ? <span className="small"> — {s.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <p className="footer__label">{data.langLabel}</p>
            <ul className="footer__langs">
              {SHIPPED_LOCALES.map((l) => (
                <li key={l}>
                  {/* next/link, а не <a>: только он подставляет basePath.
                      На GitHub Pages сайт живёт по /keremet-school/, и голая
                      ссылка "/ru" уехала бы в корень домена — в 404. */}
                  <Link
                    className="link-underline"
                    href={`/${l}`}
                    aria-current={l === locale ? "page" : undefined}
                  >
                    {LOCALE_LABEL[l]}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="small footer__langnote">
              Казахский и английский подключаются добавлением словаря — вёрстка
              и шрифты к ним уже готовы.
            </p>
          </div>
        </div>

        {/* Колофон.
            Ни один сайт из изученных — ни Eton, ни Летово, ни казахстанские —
            не публикует колофон и не датирует материалы. Датированное издание
            делает устаревание заметным школе раньше, чем родителю. */}
        <div className="colophon">
          <p className="footer__label">{data.colophonTitle}</p>
          <dl className="colophon__list">
            {data.colophon.map((c) => (
              <div className="colophon__row" key={c.k}>
                <dt>{c.k}</dt>
                <dd>{c.v}</dd>
              </div>
            ))}
          </dl>
          <Note>{data.colophonNote}</Note>
        </div>

        <p className="footer__legal small">{data.legal}</p>
      </div>
    </footer>
  );
}
