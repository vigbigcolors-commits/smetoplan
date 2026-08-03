import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';
import { CenyClient } from '../CenyClient';
import {
  allCenySlugs,
  getCenyRegionBySlug,
} from '@/lib/ceny-regions';
import { loadMarketQuotes } from '@/lib/market-quotes';
import { calculatorHref } from '@/lib/calculator-routes';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ vol?: string; rebar?: string; form?: string }>;
}

export function generateStaticParams() {
  return allCenySlugs().map((region) => ({ region }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  const meta = getCenyRegionBySlug(region);
  if (!meta) return { title: 'Цены | Smetoplan' };
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru';
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${site}/ceny/${meta.slug}` },
    openGraph: {
      title: meta.h1,
      description: meta.description,
      url: `${site}/ceny/${meta.slug}`,
      type: 'website',
      locale: 'ru_RU',
    },
  };
}

function parseNum(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default async function CenyRegionPage({ params, searchParams }: PageProps) {
  const { region } = await params;
  const meta = getCenyRegionBySlug(region);
  if (!meta) notFound();

  const sp = await searchParams;
  const vol = parseNum(sp.vol, 12);
  const rebar = parseNum(sp.rebar, 800);
  const form = parseNum(sp.form, 40);

  const quotes = await loadMarketQuotes(meta.regionId);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru';

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: meta.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const listJsonLd =
    !quotes.empty && quotes.suppliers.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: meta.h1,
          url: `${site}/ceny/${meta.slug}`,
          numberOfItems: quotes.suppliers.length,
          itemListElement: quotes.suppliers.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Organization',
              name: s.name,
              url: s.url || undefined,
              address: s.city
                ? { '@type': 'PostalAddress', addressLocality: s.city }
                : undefined,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        {listJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
          />
        )}
        <CenyClient
          regionId={meta.regionId}
          regionSlug={meta.slug}
          h1={meta.h1}
          intro={meta.intro}
          concreteM3={vol}
          rebarKg={rebar}
          formworkM2={form}
        />
        <section className="mx-auto max-w-6xl border-t border-slate-200 px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-[#0B132B]">
            Бетон и арматура — {meta.label}
          </h2>
          <div className="mt-3 max-w-3xl space-y-4 text-[15px] leading-relaxed text-slate-700">
            {meta.seoParagraphs.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold text-[#0B132B]">{meta.howH2}</h2>
          <div className="mt-3 max-w-3xl space-y-3 text-[15px] leading-relaxed text-slate-700">
            {meta.howParagraphs.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold text-[#0B132B]">
            Частые вопросы — цены {meta.label}
          </h2>
          <dl className="mt-4 max-w-3xl space-y-4">
            {meta.faqs.map((f) => (
              <div key={f.q}>
                <dt className="text-[15px] font-bold text-slate-800">{f.q}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{f.a}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-sm text-slate-600">
            <Link
              href={calculatorHref()}
              className="font-semibold text-[#1F5A8E] hover:underline"
            >
              Рассчитать объёмы
            </Link>
            {' · '}
            <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
              Методика и источники
            </Link>
            {' · '}
            <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
              Disclaimer
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
