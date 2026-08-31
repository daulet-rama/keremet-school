import "server-only";
import type { Locale } from "./config";

/**
 * Словари грузятся динамически, поэтому в клиентский бандл попадает только
 * тот язык, который реально запрошен. Добавление казахского — это новый
 * файл kk.json и одна строка в SHIPPED_LOCALES; вёрстку трогать не нужно.
 */
const dictionaries = {
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
  // kk: () => import("./dictionaries/kk.json").then((m) => m.default),
  // en: () => import("./dictionaries/en.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ru"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = dictionaries[locale as keyof typeof dictionaries];
  if (!load) return dictionaries.ru();
  return load();
}
