import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import "../globals.css";
import "../sections.css";
import {
  HTML_LANG,
  SHIPPED_LOCALES,
  SITE_URL,
  alternatesFor,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { SmoothScroll } from "@/components/SmoothScroll";

/**
 * ШРИФТЫ — самое важное техническое решение проекта.
 *
 * Оба файла самостоятельно захостены и собраны из АПСТРИМ-бинарников
 * репозитория google/fonts, а не взяты с fonts.googleapis.com.
 *
 * Причина конкретна и проверена: апстримный Playfair Display содержит 659
 * глифов, включая все девять казахских букв в обоих регистрах. Тот же самый
 * Playfair, отданный CDN Google, — 330 глифов, и в нём НЕТ ә ғ қ ң ө ү һ.
 * Ломается не шрифт, ломается конвейер сабсеттинга. Запрос вообще без
 * параметра subset отдаёт латиницу и ничего больше.
 *
 * Оба файла порезаны одним проходом pyftsubset: латиница + полная кириллица
 * + казахские буквы + казахская латиница 2021 в ОДНОМ файле. Разделять на
 * latin/cyrillic/cyrillic-ext нельзя — на казахском тексте это даёт
 * подгрузку двух файлов и мигание.
 *
 * Итог: 177 КБ на две вариативные гарнитуры и три письменности.
 * Для сравнения, у Haileybury Almaty на этом месте 7,61 МБ сырых .ttf.
 *
 * adjustFontFallback у next/font сам считает size-adjust и ascent-override
 * для локального запасного шрифта — это снимает скачок вёрстки при подмене.
 */
const display = localFont({
  src: "../../fonts/PlayfairDisplay-var.woff2",
  variable: "--font-display",
  weight: "400 900",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const text = localFont({
  src: "../../fonts/Onest-var.woff2",
  variable: "--font-text",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

export function generateStaticParams() {
  return SHIPPED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      // Взаимные АБСОЛЮТНЫЕ hreflang с корректным субтегом.
      // Из всего исследованного рынка это делает правильно ровно один сайт:
      // остальные пишут hreflang="kz" — это код страны, язык называется "kk",
      // и Google молча выбрасывает такую аннотацию.
      languages: alternatesFor(),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: HTML_LANG[locale],
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || !SHIPPED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  return (
    <html lang={HTML_LANG[locale]} className={`${display.variable} ${text.variable}`}>
      <body data-notes="on">
        <a className="skip" href="#main">
          Перейти к содержимому
        </a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
