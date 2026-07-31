import { SMETOPLAN_PAGE_MAP } from '@/lib/ai/platform-map';
import type { PseoSnapshot } from '@/lib/pseo-snapshot';

/**
 * Plain HTML index for crawlers: where tools live on the page.
 * HELPER scrollTo does not replace this text content.
 */
export function PseoGuideIndex({ snapshot }: { snapshot: PseoSnapshot }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F172A]">
        Где что на этой странице
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Ниже — карта блоков калькулятора. Цифры уже посчитаны для{' '}
        <strong>
          {snapshot.structureLabel} {snapshot.dimsLabel}
        </strong>
        : бетон {snapshot.concreteVolumeM3} м³, арматура {snapshot.rebarWeightKg} кг,
        смета {snapshot.totalRub}. Ассистент HELPER может прокрутить к блоку, но все
        ответы ниже доступны и без него — текстом.
      </p>
      <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-slate-700">
        {SMETOPLAN_PAGE_MAP.map((a) => (
          <li key={a.id}>
            <a
              href={`#${a.id}`}
              className="font-bold text-[#1F5A8E] hover:underline"
            >
              {a.title}
            </a>
            <span className="text-slate-600"> — {a.how}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
