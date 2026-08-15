import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_AUTHOR, buildAuthorRef, buildPersonJsonLd } from '@/lib/author';
import {
  ENGINE_UPDATED_AT,
  KERNEL_CHANGELOG,
  formatEngineUpdated,
} from '@/lib/seo-freshness';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: `Заметки ядра — Lab Notes · ${SITE_AUTHOR.name} | Smetoplan`,
  description:
    `Field notes ${SITE_AUTHOR.name}: почему опалубка колонны 9,6 м², фантомный контур ленты и live-PSEO из ядра. Опыт продукта, не AI-блог.`,
  alternates: { canonical: `${site}/opyt` },
  openGraph: {
    title: 'Заметки ядра · Lab Notes Smetoplan',
    description:
      'Журнал инженерных правок основателя: цифры в смете менялись после каждой записи.',
    url: `${site}/opyt`,
    type: 'article',
    locale: 'ru_RU',
  },
};

export default function OpytPage() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Заметки ядра расчёта Smetoplan',
    alternativeHeadline: 'Lab Notes · опыт ядра',
    dateModified: ENGINE_UPDATED_AT,
    datePublished: KERNEL_CHANGELOG[KERNEL_CHANGELOG.length - 1]?.date,
    author: buildAuthorRef(),
    publisher: {
      '@type': 'Organization',
      name: 'Smetoplan',
      url: site,
    },
    mainEntityOfPage: `${site}/opyt`,
    inLanguage: 'ru-RU',
    about: 'Сметный калькулятор фундамента — правки геометрии и арматуры',
  };

  return (
    <LegalPageShell
      title="Заметки ядра"
      lead={`Lab Notes · ${SITE_AUTHOR.name}. Не блог под ключи — журнал правок, из‑за которых смета врала. Ядро обновлено ${formatEngineUpdated()} (${ENGINE_UPDATED_AT}).`}
    >
      <JsonLd data={buildPersonJsonLd()} />
      <JsonLd data={articleLd} />

      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <span className="font-bold text-slate-800">Автор. </span>
        {SITE_AUTHOR.name}, {SITE_AUTHOR.role.toLowerCase()}. Голос основателя и
        метод продукта — не редакционная ферма статей.{' '}
        <Link href="/o-nas" className="font-semibold text-[#1F5A8E] hover:underline">
          Об авторе
        </Link>
        {' · '}
        <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
          методика
        </Link>
        .
      </p>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Зачем Notes, а не Blog</h2>
        <p className="mt-2">
          Experience в E-E-A-T — это реальные ошибки инструмента и что с ними
          сделали. Ниже — случаи, когда смета занижала опалубку или раздувала
          арматуру. Каждая запись связана с живым калькулятором. Thin-статьи «для
          SEO» сюда не пишем: слабая страница лучше не индексировать.
        </p>
      </section>

      {KERNEL_CHANGELOG.map((e) => (
        <section key={e.date + e.title}>
          <h2 className="text-lg font-bold text-[#0B132B]">{e.title}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">
            <time dateTime={e.date}>{e.date}</time>
            {' · '}
            {SITE_AUTHOR.name}
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
        <h2 className="text-lg font-bold text-[#0B132B]">Правило индекса</h2>
        <p className="mt-2">
          Long-tail в индекс только если есть уникальная логика/данные из ядра и
          пройден quality-gate. Иначе — noindex / вне sitemap. Лучше 0 слабых
          URL, чем тысяча одинаковых.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Забрать результат</h2>
        <p className="mt-2">
          Продукт — калькулятор: пакет «Готово» (PDF + .txt + ссылка) без заявки.
          HELPER внутри инструмента помогает проставить поля из ТЗ — это не лицо
          сайта и не замена конструктору.
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
