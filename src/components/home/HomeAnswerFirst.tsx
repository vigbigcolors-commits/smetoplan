import Link from 'next/link';
import { getStructureHubBenchmark } from '@/lib/hub-benchmarks';
import { formatEngineUpdated } from '@/lib/seo-freshness';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';

/** Idea 1: answer-first live etalons in HTML on the homepage. */
export function HomeAnswerFirst() {
  const slab = getStructureHubBenchmark('slab');
  const strip = getStructureHubBenchmark('strip');
  if (!slab || !strip) return null;

  return (
    <section
      id="etalony"
      className="relative bg-white py-8 sm:py-10"
      aria-labelledby="etalony-h2"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B86C3B]">
            Ответ сразу · живое ядро
          </p>
          <h2
            id="etalony-h2"
            className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-[#0E1624] sm:text-3xl"
          >
            Сколько бетона и арматуры —{' '}
            <span className="text-[#3D6494]">цифры в HTML</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Эталоны считаются тем же движком, что калькулятор и PSEO. Ядро
            обновлено {formatEngineUpdated()}. Прайс-ориентир на{' '}
            {formatPriceAsOf(PRICE_TABLE_AS_OF)}.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[
            {
              hub: '/kalkulyator/plitnyy-fundament',
              b: slab,
            },
            {
              hub: '/kalkulyator/lentochnyy-fundament',
              b: strip,
            },
          ].map(({ hub, b }) => (
            <article
              key={hub}
              className="overflow-hidden border border-slate-800 bg-[#0E1624] text-white"
            >
              <div className="border-b border-slate-700 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/90">
                  {b.eyebrow}
                </p>
                <h3 className="mt-1 text-lg font-extrabold tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {b.answerLine}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
                {b.kpis.map((k) => (
                  <div key={k.label} className="bg-[#0E1624] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      {k.label}
                    </div>
                    <div className="mt-0.5 font-mono text-xl font-extrabold text-sky-300">
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 px-5 py-4">
                <div className="font-mono text-lg font-extrabold text-emerald-300">
                  {b.totalRubLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={b.calcHref}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-extrabold text-[#0B132B] hover:bg-sky-400"
                  >
                    {b.calcCta}
                  </Link>
                  <Link
                    href={hub}
                    className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold text-white hover:border-sky-500"
                  >
                    Хаб
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
