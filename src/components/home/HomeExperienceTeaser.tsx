import Link from 'next/link';
import { KERNEL_CHANGELOG, formatEngineUpdated } from '@/lib/seo-freshness';

/** Idea 2: original Experience teaser → /opyt */
export function HomeExperienceTeaser() {
  const top = KERNEL_CHANGELOG.slice(0, 2);

  return (
    <section
      id="opyt"
      className="relative bg-[#0E1624] py-8 text-white sm:py-10"
      aria-labelledby="opyt-h2"
    >
      <div className="blueprint-grid-violet absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/90">
              Опыт · Experience
            </p>
            <h2
              id="opyt-h2"
              className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug sm:text-3xl"
            >
              Как мы чинили ядро — не маркетинговые обещания
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Уникальный опыт продукта: реальные баги геометрии и Helper, из‑за
              которых смета врала. Ядро обновлено {formatEngineUpdated()}.
            </p>
          </div>
          <Link
            href="/opyt"
            className="inline-flex shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-slate-100"
          >
            Весь журнал опыта →
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {top.map((e) => (
            <li key={e.date + e.title} className="border-l-2 border-sky-400/50 pl-4">
              <time className="font-mono text-[11px] text-slate-400" dateTime={e.date}>
                {e.date}
              </time>
              <h3 className="mt-1 text-base font-bold text-white">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{e.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
