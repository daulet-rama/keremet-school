import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Outcomes } from "@/components/Outcomes";
import { About, Life, OneYear, Teachers } from "@/components/Sections";
import { Pathway } from "@/components/Pathway";
import { Admissions } from "@/components/Admissions";
import { Visit } from "@/components/Visit";
import { Footer } from "@/components/Footer";
import { OrnamentRail } from "@/components/OrnamentRail";
import { NotesToggle } from "@/components/NotesToggle";

/**
 * Порядок разделов продиктован тем, что ищет родитель, а не тем, что
 * красиво смотрится.
 *
 * Результаты поступления стоят вторыми, сразу после героя. Обоснование —
 * Milton Academy, единственная школа в исследовании, которая кладёт таблицу
 * поступлений под раздел Admission, а не Academics: результат работает
 * входом в решение, а не справкой в глубине сайта.
 */
const SECTIONS = [
  "top",
  "outcomes",
  "about",
  "oneyear",
  "pathway",
  "life",
  "teachers",
  "admissions",
  "visit",
];

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDictionary(locale);

  return (
    <>
      <OrnamentRail sections={SECTIONS} />
      <Header brand={d.brand} nav={d.nav} />

      <main id="main">
        <Hero brand={d.brand} hero={d.hero} />
        <Outcomes data={d.outcomes} />
        <About data={d.about} />
        <OneYear data={d.oneYear} />
        <Pathway data={d.pathway} />
        <Life data={d.life} />
        <Teachers data={d.teachers} />
        <Admissions data={d.admissions} />
        <Visit data={d.cta} />
      </main>

      <Footer brand={d.brand} data={d.footer} locale={locale} />
      <NotesToggle labels={d.notes} />
    </>
  );
}
