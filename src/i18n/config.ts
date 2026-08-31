/**
 * Языковая конфигурация.
 *
 * Исследование школьных сайтов Казахстана показало один системный дефект:
 * почти все объявляют hreflang="kz". Это код СТРАНЫ. Код ЯЗЫКА — "kk".
 * Google молча выбрасывает такую аннотацию, и трёхъязычие перестаёт работать
 * для поиска. Из всего рынка правильно это делает ровно один сайт.
 *
 * Второй дефект — «переведённый URL при непереведённой странице»: маршрут /kk/
 * существует, отдаёт русский текст и объявляет lang="ru". Поэтому здесь язык
 * попадает в SHIPPED_LOCALES только тогда, когда для него реально готов
 * словарь. Пустых языков в выдаче не будет.
 *
 * Чтобы включить казахский: создать dictionaries/kk.json и добавить "kk" ниже.
 */

export const ALL_LOCALES = ["kk", "ru", "en"] as const;
export type Locale = (typeof ALL_LOCALES)[number];

/** Языки, для которых существует полный словарь и которые реально отдаются. */
export const SHIPPED_LOCALES: Locale[] = ["ru"];

export const DEFAULT_LOCALE: Locale = "ru";

/** BCP 47 для атрибута lang и для hreflang. */
export const HTML_LANG: Record<Locale, string> = {
  kk: "kk",
  ru: "ru",
  en: "en",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  kk: "Қазақша",
  ru: "Русский",
  en: "English",
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daulet-rama.github.io/keremet-school";

export function isLocale(value: string): value is Locale {
  return (ALL_LOCALES as readonly string[]).includes(value);
}

/**
 * Взаимные абсолютные hreflang только для отгруженных языков + x-default.
 */
export function alternatesFor(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SHIPPED_LOCALES) {
    languages[HTML_LANG[locale]] = `${SITE_URL}/${locale}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}`;
  return languages;
}
