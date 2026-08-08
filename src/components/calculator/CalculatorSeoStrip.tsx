import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { TrustSourcesNote } from '@/components/pseo/TrustSourcesNote';
import {
  CALCULATOR_FAQS,
  buildFaqJsonLd,
  buildSoftwareAppJsonLd,
} from '@/lib/site-seo';
import { getStructureHubBenchmark } from '@/lib/hub-benchmarks';
import type { StructureType } from '@/lib/types';

/** Compact title under header — tools stay first. */
export function CalculatorSeoTitle({
  h1,
  description,
}: {
  h1: string;
  description: string;
}) {
  return (
    <header className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        Smetoplan · рабочий калькулятор
      </p>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">
        {h1}
      </h1>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm leading-snug text-slate-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}

/** Full EEAT/FAQ block — render at the bottom, after the workspace. */
export function CalculatorSeoStrip({
  structureType,
}: {
  structureType: StructureType;
}) {
  const benchmark = getStructureHubBenchmark(structureType);

  return (
    <section
      className="mt-10 border-t border-slate-200 pt-8"
      aria-labelledby="calc-seo-footer"
    >
      <JsonLd data={buildSoftwareAppJsonLd()} />
      <JsonLd data={buildFaqJsonLd(CALCULATOR_FAQS)} />

      <h2
        id="calc-seo-footer"
        className="text-lg font-extrabold tracking-tight text-[#0F172A]"
      >
        Методика, эталон и вопросы
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
        Результат сразу на экране: объёмы, чертёж и ориентир сметы без заявки. Не
        заменяет раздел КЖ. Ниже — эталон ядра, источники и FAQ.
      </p>

      {benchmark ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] text-white">
          <div className="border-b border-slate-700 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/90">
              {benchmark.eyebrow}
            </p>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">
              {benchmark.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
              {benchmark.answerLine}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
            {benchmark.kpis.map((k) => (
              <div key={k.label} className="bg-[#0F172A] px-3 py-3 sm:px-4">
                <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400">
                  {k.label}
                </div>
                <div className="mt-0.5 font-mono text-lg font-extrabold text-sky-300">
                  {k.value}
                  {k.unit ? (
                    <span className="ml-1 text-[10px] font-normal text-slate-400">
                      {k.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
            {benchmark.disclaimer}{' '}
            <Link href="/metodika" className="font-semibold text-sky-400 hover:underline">
              Методика
            </Link>
          </p>
        </div>
      ) : null}

      <nav
        className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#1F5A8E]"
        aria-label="Связанные разделы"
      >
        <Link href="/kalkulyator/plitnyy-fundament" className="hover:underline">
          Плитный фундамент
        </Link>
        <Link href="/kalkulyator/lentochnyy-fundament" className="hover:underline">
          Ленточный фундамент
        </Link>
        <Link href="/ceny" className="hover:underline">
          Цены
        </Link>
        <Link href="/metodika" className="hover:underline">
          Методика
        </Link>
        <Link href="/o-nas" className="hover:underline">
          О нас
        </Link>
      </nav>

      <div className="mt-4 max-w-3xl">
        <TrustSourcesNote compact />
      </div>

      <div className="mt-5 max-w-3xl">
        <h3 className="text-sm font-extrabold text-[#0F172A]">
          Частые вопросы по калькулятору
        </h3>
        <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
          {CALCULATOR_FAQS.map((f) => (
            <details key={f.q} className="group py-2.5">
              <summary className="cursor-pointer list-none text-sm font-bold text-[#0B132B] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {f.q}
                  <span className="shrink-0 font-mono text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-1.5 pr-6 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
