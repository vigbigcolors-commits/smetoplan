import Link from 'next/link';
import { compareSlabEtalonAcrossRegions } from '@/lib/regional-etalon-compare';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';

/** Idea 4: regional money compare — one geometry, many ₽ */
export function RegionalEtalonCompare({
  compact,
}: {
  compact?: boolean;
}) {
  const data = compareSlabEtalonAcrossRegions();

  return (
    <section
      className={compact ? 'mt-10' : 'mt-0'}
      aria-labelledby="region-compare-h2"
    >
      <h2
        id="region-compare-h2"
        className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#0B132B] sm:text-2xl"
      >
        Одна плита — смета по регионам
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
        {data.title}. Объёмы одинаковые; меняются только справочные цены.
        Ориентир на {formatPriceAsOf(PRICE_TABLE_AS_OF)}.
      </p>
      <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
        {data.assumptions.map((a) => (
          <li key={a}>· {a}</li>
        ))}
      </ul>

      <div className="mt-5 overflow-x-auto border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Регион</th>
              <th className="px-3 py-3">Бетон ₽/м³</th>
              <th className="px-3 py-3">Арматура ₽/т</th>
              <th className="px-3 py-3">Смета ориентир</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, i) => (
              <tr key={row.regionId} className={i === 0 ? 'bg-emerald-50/60' : ''}>
                <td className="px-3 py-3 font-semibold text-[#0B132B]">
                  {row.label}
                  {i === 0 ? (
                    <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">
                      ниже
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-mono text-slate-700">
                  {row.concretePerM3.toLocaleString('ru-RU')}
                </td>
                <td className="px-3 py-3 font-mono text-slate-700">
                  {row.rebarPerTon.toLocaleString('ru-RU')}
                </td>
                <td className="px-3 py-3 font-mono font-bold text-[#0B132B]">
                  {row.totalRub.toLocaleString('ru-RU')} ₽
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/ceny/${row.cenySlug}`}
                    className="text-xs font-bold text-[#1F5A8E] hover:underline"
                  >
                    /ceny/{row.cenySlug}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Объём эталона ≈ {data.rows[0]?.concreteVolumeM3} м³ бетона · арматура ≈{' '}
        {data.rows[0]?.rebarWeightKg.toLocaleString('ru-RU')} кг во всех строках.
      </p>
    </section>
  );
}
