import Link from 'next/link';
import type { PseoSnapshot } from '@/lib/pseo-snapshot';
import { calculatorHref } from '@/lib/calculator-routes';
import type { StructureType } from '@/lib/types';
import { PseoLandingCta } from '@/components/pseo/PseoLandingCta';
import { PseoGuideIndex } from '@/components/pseo/PseoGuideIndex';
import { TrustSourcesNote } from '@/components/pseo/TrustSourcesNote';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';

export function PseoSeoBlock({
  h1,
  description,
  snapshot,
  structureType,
  related,
}: {
  h1: string;
  description: string;
  snapshot: PseoSnapshot;
  structureType: StructureType;
  related: Array<{ slug: string; label: string }>;
}) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: snapshot.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: h1,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
  };

  return (
    <section className="mb-6 space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      <header className="max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
          {h1}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B132B] text-white shadow-xl">
        <div className="border-b border-slate-700/80 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Готовый расчёт по параметрам страницы
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {snapshot.structureLabel} · {snapshot.dimsLabel} · {snapshot.grade}
            {snapshot.regionLabel ? ` · ${snapshot.regionLabel}` : ''}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-800/60 sm:grid-cols-4">
          {[
            { k: 'Бетон', v: `${snapshot.concreteVolumeM3} м³` },
            { k: 'Арматура', v: `${snapshot.rebarWeightKg} кг` },
            { k: 'Опалубка', v: `${snapshot.formworkAreaM2} м²` },
            { k: 'Смета', v: snapshot.totalRub },
          ].map((it) => (
            <div key={it.k} className="bg-[#0B132B] px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {it.k}
              </div>
              <div className="mt-0.5 font-mono text-base font-extrabold text-sky-200">
                {it.v}
              </div>
            </div>
          ))}
        </div>
        {snapshot.regionLabel ? (
          <div className="border-t border-slate-700/80 px-4 py-2.5 text-[11px] text-slate-400 sm:px-5">
            Цены «{snapshot.regionLabel}» на{' '}
            <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>: бетон{' '}
            {snapshot.concretePrice.toLocaleString('ru-RU')} ₽/м³ · арматура{' '}
            {snapshot.rebarPrice.toLocaleString('ru-RU')} ₽/т · опалубка{' '}
            {snapshot.formworkPrice.toLocaleString('ru-RU')} ₽/м²
          </div>
        ) : (
          <div className="border-t border-slate-700/80 px-4 py-2.5 text-[11px] text-slate-400 sm:px-5">
            Базовый ориентир цен на{' '}
            <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>
          </div>
        )}
        <div className="border-t border-slate-700/80 px-4 py-3 sm:px-5">
          <PseoLandingCta snapshot={snapshot} />
        </div>
        <p className="border-t border-slate-700/80 px-4 py-2.5 text-[11px] leading-relaxed text-slate-500 sm:px-5">
          {snapshot.disclaimer}
        </p>
      </div>

      <TrustSourcesNote regionLabel={snapshot.regionLabel} />

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F172A]">
          Частые вопросы
        </h2>
        <dl className="mt-3 space-y-3">
          {snapshot.faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-bold text-slate-800">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <PseoGuideIndex snapshot={snapshot} />

      {related.length > 0 ? (
        <nav
          aria-label="Похожие расчёты"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5"
        >
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F172A]">
            Похожие расчёты
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/kalkulyator/${r.slug}`}
                  className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#1F5A8E] hover:border-[#3D6494]"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={calculatorHref(structureType)}
            className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-[#1F5A8E]"
          >
            Открыть полный калькулятор →
          </Link>
        </nav>
      ) : null}
    </section>
  );
}
