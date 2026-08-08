import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';
import { CENY_REGIONS, legacyRegionParamToSlug } from '@/lib/ceny-regions';
import { calculatorHref } from '@/lib/calculator-routes';
import { RegionalEtalonCompare } from '@/components/ceny/RegionalEtalonCompare';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ region?: string; vol?: string; rebar?: string; form?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  return {
    title: 'Цены на бетон и арматуру по регионам — сравнение поставщиков | Smetoplan',
    description:
      'Сравнение сметы одной плиты по Москве, СПб, Краснодару, Екатеринбургу и Новосибирску. Ориентир Smetoplan и котировки РБУ.',
    alternates: { canonical: `${site}/ceny` },
    openGraph: {
      title: 'Цены на бетон и арматуру | Smetoplan',
      description: `Одна геометрия — разные ₽ по регионам. Прайс на ${formatPriceAsOf(PRICE_TABLE_AS_OF)}.`,
      url: `${site}/ceny`,
      type: 'website',
      locale: 'ru_RU',
    },
  };
}

export default async function CenyHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const slug = legacyRegionParamToSlug(sp.region);
  if (slug) {
    const q = new URLSearchParams();
    if (sp.vol) q.set('vol', sp.vol);
    if (sp.rebar) q.set('rebar', sp.rebar);
    if (sp.form) q.set('form', sp.form);
    const qs = q.toString();
    redirect(qs ? `/ceny/${slug}?${qs}` : `/ceny/${slug}`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.14em] text-[#3D6494]">
          SMETOPLAN · ЦЕНЫ
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0B132B] sm:text-4xl">
          Цены на бетон и арматуру по регионам
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Реальные РБУ и металлобазы с публичными прайсами. Ниже — одна эталонная
          плита в разных регионах (живое ядро), затем хабы поставщиков. Прайс-ориентир
          на {formatPriceAsOf(PRICE_TABLE_AS_OF)}.
        </p>

        <div className="mt-10">
          <RegionalEtalonCompare />
        </div>

        <h2 className="mt-14 text-xl font-bold text-[#0B132B]">Хабы регионов</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CENY_REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={`/ceny/${r.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#3D6494] hover:shadow-md"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                /ceny/{r.slug}
              </p>
              <h2 className="mt-2 text-lg font-bold text-[#0B132B]">{r.label}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {r.description}
              </p>
              <span className="mt-4 inline-block text-sm font-bold text-[#1F5A8E]">
                Открыть сравнение →
              </span>
            </Link>
          ))}
        </div>

        <section className="mt-14 max-w-3xl text-[15px] leading-relaxed text-slate-700">
          <h2 className="text-xl font-bold text-[#0B132B]">Как пользоваться</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Посчитайте объёмы в{' '}
              <Link href={calculatorHref()} className="font-semibold text-[#1F5A8E] hover:underline">
                калькуляторе
              </Link>
              .
            </li>
            <li>Откройте региональную страницу цен — объёмы подставятся в сравнение.</li>
            <li>Отсортируйте по итогу, напишите поставщику или скачайте спецификацию.</li>
          </ol>
          <p className="mt-4 text-sm text-slate-500">
            См. также:{' '}
            <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
              методика
            </Link>
            {' · '}
            <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
              опыт ядра
            </Link>
            {' · '}
            <Link href="/kalkulyator/plitnyy-fundament" className="font-semibold text-[#1F5A8E] hover:underline">
              хаб плиты
            </Link>
            {' · '}
            <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
              disclaimer
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
