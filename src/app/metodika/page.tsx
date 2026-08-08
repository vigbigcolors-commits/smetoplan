import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  formatPriceAsOf,
  NORM_SOURCES,
  PRICE_SOURCE_NOTE,
  PRICE_TABLE_AS_OF,
} from '@/lib/trust-sources';
import {
  ENGINE_UPDATED_AT,
  KERNEL_CHANGELOG,
  formatEngineUpdated,
} from '@/lib/seo-freshness';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: 'Методика и источники — как Smetoplan считает бетон и смету',
  description:
    'Белая книга расчёта: геометрия, арматура, опалубка, СП/ГОСТ, региональный прайс, границы КЖ. Дата ядра и прайса открыты.',
  alternates: { canonical: `${site}/metodika` },
  openGraph: {
    title: 'Методика Smetoplan',
    description: 'Прозрачная цепочка: геометрия → материалы → ориентир ₽.',
    url: `${site}/metodika`,
    type: 'article',
    locale: 'ru_RU',
  },
};

export default function MetodikaPage() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Методика и источники Smetoplan',
    dateModified: ENGINE_UPDATED_AT,
    datePublished: '2025-01-01',
    author: { '@type': 'Organization', name: 'Smetoplan', url: site },
    publisher: { '@type': 'Organization', name: 'Smetoplan', url: site },
    mainEntityOfPage: `${site}/metodika`,
    inLanguage: 'ru-RU',
    about: [
      'Расчёт объёма бетона',
      'Арматура и опалубка',
      'Сметный ориентир материалов',
    ],
  };

  return (
    <LegalPageShell
      title="Методика и источники"
      lead={`Прозрачность расчёта — основа доверия. Ядро обновлено ${formatEngineUpdated()}. Прайс-ориентир на ${formatPriceAsOf(PRICE_TABLE_AS_OF)}.`}
    >
      <JsonLd data={articleLd} />

      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <span className="font-bold text-slate-800">Свежесть. </span>
        Движок: <time dateTime={ENGINE_UPDATED_AT}>{ENGINE_UPDATED_AT}</time>
        {' · '}
        Прайс:{' '}
        <time dateTime={PRICE_TABLE_AS_OF}>{PRICE_TABLE_AS_OF}</time>
        {' · '}
        <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
          журнал опыта ядра
        </Link>
      </p>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Цепочка расчёта</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Габариты конструкции → геометрия и объём бетона (углы ленты без двойного счёта).</li>
          <li>Схема армирования → масса, раскрой на хлысты, нахлёст.</li>
          <li>Опалубка: плита/лента/стена — по модели; квадратная колонна — 4 грани.</li>
          <li>Региональный прайс Smetoplan → смета в рублях.</li>
          <li>Котировки на /ceny — рядом для сравнения, без подмены сметы.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Формулы порядка величины</h2>
        <ul className="mt-2 space-y-2 font-mono text-sm text-slate-700">
          <li>Плита: V ≈ L × W × H (+ рёбра, если заданы)</li>
          <li>Лента: V ≈ длина_оси × ширина_ленты × H (ось из пятна, не 2×(L+W) для траншеи)</li>
          <li>Колонна квадрат: опалубка ≈ 4 × a × L</li>
          <li>Балка прямоугольная: опалубка ≈ (2H + W) × L</li>
          <li>Стена трапеция: V ≈ L × H × (tверх + tподошва) / 2</li>
        </ul>
        <p className="mt-2 text-sm text-slate-600">
          Точные числа всегда из{' '}
          <Link href="/kalkulyator" className="font-semibold text-[#1F5A8E] hover:underline">
            калькулятора
          </Link>
          ; школьная «ось×ширина×высота» может расходиться с моделью углов.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Нормативные ориентиры</h2>
        <ul className="mt-2 space-y-2">
          {NORM_SOURCES.map((n) => (
            <li key={n.code} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="font-mono text-sm font-bold text-[#0B132B]">{n.code}</span>
              <p className="mt-1 text-sm text-slate-600">{n.role}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Цены</h2>
        <p className="mt-2">{PRICE_SOURCE_NOTE}</p>
        <p className="mt-2 text-sm text-slate-500">
          Дата таблицы ориентира: {formatPriceAsOf(PRICE_TABLE_AS_OF)} ({PRICE_TABLE_AS_OF}).
          Сравнение одной плиты по регионам — на{' '}
          <Link href="/ceny" className="font-semibold text-[#1F5A8E] hover:underline">
            /ceny
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Changelog ядра (якорь)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Краткие правки, из‑за которых менялись цифры сметы. Полный разбор — на{' '}
          <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
            /opyt
          </Link>
          .
        </p>
        <ul className="mt-3 space-y-3">
          {KERNEL_CHANGELOG.slice(0, 3).map((e) => (
            <li key={e.date + e.title} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="font-mono text-xs text-slate-500">
                <time dateTime={e.date}>{e.date}</time>
              </p>
              <p className="mt-1 font-semibold text-[#0B132B]">{e.title}</p>
              <p className="mt-1 text-sm text-slate-600">{e.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">PSEO и хабы</h2>
        <p className="mt-2">
          Long-tail и хабы не хранят замороженный объём в базе: SSR вызывает то же
          ядро. Индекс и калькулятор не разъезжаются после правок геометрии.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Границы</h2>
        <p className="mt-2">
          Сервис не выполняет МКЭ, не штампует соответствие СП и не подбирает
          завод под объект. HELPER помогает с параметрами интерфейса — это не
          заключение конструктора. Юридически см.{' '}
          <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
            disclaimer
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Забрать результат</h2>
        <p className="mt-2">
          Пакет «Готово» в калькуляторе: PDF + спецификация .txt + ссылка на расчёт.
          Без заявки и ожидания менеджера.
        </p>
        <p className="mt-2">
          <Link href="/kalkulyator" className="font-semibold text-[#1F5A8E] hover:underline">
            Открыть калькулятор →
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
