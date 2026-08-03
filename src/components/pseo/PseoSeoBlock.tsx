import Link from 'next/link';
import type { PseoSnapshot } from '@/lib/pseo-snapshot';
import { calculatorHref } from '@/lib/calculator-routes';
import { cenyHref } from '@/lib/ceny-regions';
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
  regionSlug,
}: {
  h1: string;
  description: string;
  snapshot: PseoSnapshot;
  structureType: StructureType;
  related: Array<{ slug: string; label: string }>;
  regionSlug?: string | null;
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

  const cenyLink = regionSlug
    ? cenyHref(regionSlug)
    : snapshot.regionLabel
      ? '/ceny/moskva'
      : '/ceny';

  return (
    <article className="mb-6 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      <header className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Smetoplan · {snapshot.longTail.breadcrumbsLabel}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
          {h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      </header>

      <section aria-labelledby="pseo-result-h2">
        <h2
          id="pseo-result-h2"
          className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl"
        >
          Результат расчёта: {snapshot.structureLabel} {snapshot.dimsLabel}
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B132B] text-white">
          <div className="border-b border-slate-700/80 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-300">
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
          ) : null}
          <div className="border-t border-slate-700/80 px-4 py-3 sm:px-5">
            <PseoLandingCta snapshot={snapshot} />
          </div>
          <p className="border-t border-slate-700/80 px-4 py-2.5 text-[11px] leading-relaxed text-slate-500 sm:px-5">
            {snapshot.disclaimer}
          </p>
        </div>
        <TrustSourcesNote regionLabel={snapshot.regionLabel} />
      </section>

      {snapshot.sections.map((section) => (
        <section key={section.h2} className="max-w-3xl">
          <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
            {section.h2}
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">
          Цены поставщиков и полный калькулятор
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Смета выше — справочник Smetoplan
          {snapshot.regionLocative ? ` ${snapshot.regionLocative}` : ''}. Сверьте с
          публичными котировками РБУ и металлобаз, затем уточните КП.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={cenyLink}
            className="inline-flex rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1F5A8E]"
          >
            Сравнить поставщиков
          </Link>
          <Link
            href={calculatorHref(structureType)}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A] hover:border-[#3D6494]"
          >
            Открыть полный калькулятор
          </Link>
          <Link
            href="/metodika"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A] hover:border-[#3D6494]"
          >
            Методика
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="pseo-faq-h2"
        className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5"
      >
        <h2
          id="pseo-faq-h2"
          className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl"
        >
          Частые вопросы по {snapshot.structureLabel} {snapshot.dimsLabel}
        </h2>
        <dl className="mt-4 space-y-4">
          {snapshot.faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-bold text-slate-800 sm:text-[15px]">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <PseoGuideIndex snapshot={snapshot} />

      {related.length > 0 ? (
        <nav
          aria-label="Похожие расчёты"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 sm:px-5"
        >
          <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">
            Похожие long-tail расчёты
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
        </nav>
      ) : null}
    </article>
  );
}
