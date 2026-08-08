import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ENGINE_UPDATED_AT,
  KERNEL_CHANGELOG,
  formatEngineUpdated,
} from '@/lib/seo-freshness';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: 'Опыт ядра расчёта — как Smetoplan чинит геометрию и смету',
  description:
    'Журнал реального опыта: почему опалубка колонны 9,6 м², как ловили фантомный контур ленты и почему PSEO всегда live из ядра.',
  alternates: { canonical: `${site}/opyt` },
  openGraph: {
    title: 'Опыт ядра Smetoplan',
    description:
      'Уникальный Experience для EEAT: разборы багов калькулятора, которые влияют на смету.',
    url: `${site}/opyt`,
    type: 'article',
    locale: 'ru_RU',
  },
};

export default function OpytPage() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Опыт ядра расчёта Smetoplan',
    dateModified: ENGINE_UPDATED_AT,
    datePublished: KERNEL_CHANGELOG[KERNEL_CHANGELOG.length - 1]?.date,
    author: { '@type': 'Organization', name: 'Smetoplan', url: site },
    publisher: { '@type': 'Organization', name: 'Smetoplan', url: site },
    mainEntityOfPage: `${site}/opyt`,
    inLanguage: 'ru-RU',
  };

  return (
    <LegalPageShell
      title="Опыт ядра расчёта"
      lead={`Не рекламные слоганы, а журнал инженерных правок. Ядро обновлено ${formatEngineUpdated()} (${ENGINE_UPDATED_AT}). Каждая запись меняла цифры в смете.`}
    >
      <JsonLd data={articleLd} />

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Зачем эта страница</h2>
        <p className="mt-2">
          Поисковики и люди ценят опыт (Experience): как продукт ошибался и что
          исправил. Ниже — случаи, из‑за которых смета могла занизить опалубку или
          раздуть арматуру. Связано с{' '}
          <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
            методикой
          </Link>{' '}
          и живым калькулятором.
        </p>
      </section>

      {KERNEL_CHANGELOG.map((e) => (
        <section key={e.date + e.title}>
          <h2 className="text-lg font-bold text-[#0B132B]">{e.title}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">
            <time dateTime={e.date}>{e.date}</time>
          </p>
          <p className="mt-2">{e.body}</p>
          {e.href ? (
            <p className="mt-2">
              <Link href={e.href} className="font-semibold text-[#1F5A8E] hover:underline">
                Открыть связанный расчёт →
              </Link>
            </p>
          ) : null}
        </section>
      ))}

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Забрать результат с собой</h2>
        <p className="mt-2">
          В калькуляторе пакет «Готово»: PDF, .txt для РБУ и ссылка на расчёт —
          без заявки и звонка. Это и есть продукт: цифры на месте, документ у вас.
        </p>
        <p className="mt-2">
          <Link href="/kalkulyator" className="font-semibold text-[#1F5A8E] hover:underline">
            Открыть калькулятор
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
