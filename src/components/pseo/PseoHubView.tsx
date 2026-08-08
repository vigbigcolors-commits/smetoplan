import Link from 'next/link';
import type { PseoHub } from '@/lib/pseo-hubs';
import { STRUCTURE_HUBS, REGION_HUBS } from '@/lib/pseo-hubs';
import { calculatorHref } from '@/lib/calculator-routes';
import type { HubLink } from '@/lib/pseo-demo-hub';
import { getStructureHubBenchmark } from '@/lib/hub-benchmarks';
import { FreshnessMeta } from '@/components/seo/FreshnessMeta';

export function PseoHubView({
  hub,
  links,
}: {
  hub: PseoHub;
  links: HubLink[];
}) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: hub.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const benchmark =
    hub.kind === 'structure'
      ? getStructureHubBenchmark(hub.structureType)
      : null;

  const primaryCalcHref =
    hub.kind === 'structure'
      ? benchmark?.calcHref || calculatorHref(hub.structureType)
      : calculatorHref();

  const siblingHubs = STRUCTURE_HUBS.filter(
    (h) => !(hub.kind === 'structure' && h.slug === hub.slug)
  );

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {benchmark ? 'Smetoplan · ответ по запросу' : 'Smetoplan · каталог расчётов'}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A]">
          {hub.h1}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{hub.intro}</p>
        <FreshnessMeta className="mt-3" />
      </header>

      {benchmark ? (
        <section
          className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] text-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.65)]"
          aria-labelledby="hub-benchmark-h2"
        >
          <div className="border-b border-slate-700 px-4 py-4 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/90">
              {benchmark.eyebrow}
            </p>
            <h2
              id="hub-benchmark-h2"
              className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl"
            >
              {benchmark.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              {benchmark.answerLine}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
            {benchmark.kpis.map((k) => (
              <div key={k.label} className="bg-[#0F172A] px-4 py-4 sm:px-5">
                <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400">
                  {k.label}
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold text-sky-300 sm:text-2xl">
                  {k.value}
                  {k.unit ? (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {k.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-700 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400">
                Ориентир сметы материалов
              </div>
              <div className="mt-0.5 font-mono text-2xl font-extrabold text-emerald-300">
                {benchmark.totalRubLabel}
              </div>
              <ul className="mt-2 space-y-0.5 text-[11px] leading-snug text-slate-400">
                {benchmark.assumptions.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={benchmark.calcHref}
                className="inline-flex rounded-xl bg-sky-500 px-5 py-3 text-sm font-extrabold text-[#0B132B] hover:bg-sky-400"
              >
                {benchmark.calcCta}
              </Link>
              <Link
                href="/ceny"
                className="inline-flex rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:border-sky-500"
              >
                Сравнить регионы ₽
              </Link>
            </div>
          </div>
          <p className="border-t border-slate-800 px-4 py-3 text-[11px] leading-relaxed text-slate-500 sm:px-6">
            {benchmark.disclaimer}
          </p>
        </section>
      ) : null}

      {!benchmark ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={primaryCalcHref}
            className="inline-flex rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white hover:bg-[#1F5A8E]"
          >
            Открыть калькулятор
          </Link>
          <Link
            href="/ceny"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0F172A] hover:border-[#3D6494]"
          >
            Цены и поставщики
          </Link>
        </div>
      ) : null}

      {hub.sections.map((section) => (
        <section key={section.h2} className="mt-10 max-w-3xl">
          <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">
            {section.h2}
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">
          Частые вопросы
        </h2>
        <dl className="mt-4 space-y-4">
          {hub.faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-bold text-slate-800">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {benchmark ? (
        <section className="mt-10 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 sm:px-5">
          <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">
            Забрать результат с собой
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            В калькуляторе пакет «Готово»: PDF-смета, .txt для РБУ и ссылка на те же
            параметры. Без заявки и звонка — унесите цифры в переписку сами.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={benchmark.calcHref}
              className="inline-flex rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white hover:bg-[#1F5A8E]"
            >
              {benchmark.calcCta}
            </Link>
            <Link
              href="/ceny"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0F172A] hover:border-[#3D6494]"
            >
              Цены по регионам
            </Link>
          </div>
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="mt-10" aria-labelledby="hub-catalog-h2">
          <h2
            id="hub-catalog-h2"
            className="text-lg font-extrabold tracking-tight text-[#0F172A]"
          >
            Другие готовые размеры
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Дополнительные URL с фиксированными габаритами — если нужен конкретный long-tail.
            Основной путь: эталон → калькулятор со своими цифрами.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {links.map((l) => {
              const href =
                l.href || (l.slug ? `/kalkulyator/${l.slug}` : calculatorHref());
              return (
                <Link
                  key={href + l.label}
                  href={href}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#3D6494]"
                >
                  <div className="text-sm font-bold text-[#0F172A]">{l.label}</div>
                  {l.hint ? (
                    <div className="mt-1 font-mono text-xs text-slate-500">{l.hint}</div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-10 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Хабы конструкций
          </h2>
          <ul className="mt-3 space-y-1.5">
            {siblingHubs.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/kalkulyator/${h.slug}`}
                  className="text-sm font-semibold text-[#1F5A8E] hover:underline"
                >
                  {h.h1.replace(/^Калькулятор\s+/i, '')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Регионы и цены
          </h2>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href="/ceny" className="text-sm font-semibold text-[#1F5A8E] hover:underline">
                Сравнение одной плиты по регионам
              </Link>
            </li>
            {REGION_HUBS.slice(0, 5).map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/kalkulyator/${h.slug}`}
                  className="text-sm font-semibold text-[#1F5A8E] hover:underline"
                >
                  {h.h1}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Доверие
          </h2>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href="/metodika" className="text-sm font-semibold text-[#1F5A8E] hover:underline">
                Методика и источники
              </Link>
            </li>
            <li>
              <Link href="/opyt" className="text-sm font-semibold text-[#1F5A8E] hover:underline">
                Опыт ядра
              </Link>
            </li>
            <li>
              <Link href="/kalkulyator" className="text-sm font-semibold text-[#1F5A8E] hover:underline">
                Рабочий калькулятор
              </Link>
            </li>
            <li>
              <Link href="/o-nas" className="text-sm font-semibold text-[#1F5A8E] hover:underline">
                О нас
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
