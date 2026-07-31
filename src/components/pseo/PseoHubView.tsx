import Link from 'next/link';
import type { PseoHub } from '@/lib/pseo-hubs';
import { STRUCTURE_HUBS, REGION_HUBS } from '@/lib/pseo-hubs';
import { calculatorHref } from '@/lib/calculator-routes';
import type { HubLink } from '@/lib/pseo-demo-hub';

export function PseoHubView({
  hub,
  links,
}: {
  hub: PseoHub;
  links: HubLink[];
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Smetoplan · каталог расчётов
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A]">
          {hub.h1}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{hub.intro}</p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {links.map((l) => {
          const href = l.href || (l.slug ? `/kalkulyator/${l.slug}` : calculatorHref());
          return (
            <Link
              key={href + l.label}
              href={href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#3D6494] hover:shadow-md"
            >
              <div className="text-sm font-bold text-[#0F172A]">{l.label}</div>
              {l.hint ? (
                <div className="mt-1 font-mono text-xs text-slate-500">{l.hint}</div>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Типы конструкций
          </h2>
          <ul className="mt-3 space-y-1.5">
            {STRUCTURE_HUBS.map((h) => (
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
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Регионы
          </h2>
          <ul className="mt-3 space-y-1.5">
            {REGION_HUBS.map((h) => (
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
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={
            hub.kind === 'structure' ? calculatorHref(hub.structureType) : calculatorHref()
          }
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
        <Link
          href="/ceny/moskva"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0F172A] hover:border-[#3D6494]"
        >
          Москва · прайс
        </Link>
      </div>
    </div>
  );
}
