import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedSlugs } from '@/lib/pseo';
import { ArrowRight, Box, Layers, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Smetoplan — инженерные калькуляторы и сметы для стройки',
  description:
    'Визуальные калькуляторы фундамента с SVG-чертежами, BOM и капельной PSEO-индексацией. Расчёт бетона, арматуры и опалубки по СП.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let published: Array<{ slug: string; publish_date: string }> = [];
  try {
    published = await listPublishedSlugs(12);
  } catch {
    published = [];
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse at 20% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, #0ea5e933 0%, transparent 40%), linear-gradient(160deg, #0F172A 0%, #1e293b 55%, #0f172a 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-teal-400">
            Smetoplan.ru
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            SMETO<span className="text-sky-400">PLAN</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            Живые чертежи фундамента, точная смета и безопасный programmatic SEO —
            удержание поведенческих факторов вместо тонких клонов.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/kalkulyator/kalkulyator-plitnogo-fundamenta-12x8-m300"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-400"
            >
              Открыть калькулятор плиты
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/sitemap.xml"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:text-white"
            >
              Sitemap (drip-feed)
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Почему платформа держит ПФ</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="border-t-2 border-[#1F5A8E] pt-4">
            <Box className="mb-2 h-5 w-5 text-[#1F5A8E]" />
            <h3 className="font-bold text-slate-900">SVG + CAD в реальном времени</h3>
            <p className="mt-1 text-sm text-slate-600">
              Пользователь крутит параметры — чертёж и армирование перерисовываются мгновенно.
            </p>
          </div>
          <div className="border-t-2 border-teal-600 pt-4">
            <Layers className="mb-2 h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900">BOM со сметой в ₽</h3>
            <p className="mt-1 text-sm text-slate-600">
              Бетон, арматура, песок, щебень, опалубка и труд — готовая ведомость под CPA.
            </p>
          </div>
          <div className="border-t-2 border-emerald-600 pt-4">
            <Shield className="mb-2 h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Анти-бан drip-feed</h3>
            <p className="mt-1 text-sm text-slate-600">
              200–300 URL/сутки, неопубликованное = 404, 5 layout-вариантов DOM.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F4F4F5] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-extrabold text-[#0F172A]">
            Опубликованные калькуляторы
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Только маршруты с is_published=true и publish_date ≤ now.
          </p>
          <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {published.length === 0 && (
              <li className="px-4 py-6 font-mono text-sm text-slate-500">
                БД недоступна или ещё нет опубликованных роутов. Поднимите Podman и
                проверьте миграции.
              </li>
            )}
            {published.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/kalkulyator/${r.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-slate-50"
                >
                  <span className="font-mono text-slate-800">/kalkulyator/{r.slug}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#1F5A8E]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
