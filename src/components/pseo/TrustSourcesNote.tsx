import {
  formatPriceAsOf,
  NORM_SOURCES,
  PRICE_SOURCE_NOTE,
  PRICE_TABLE_AS_OF,
} from '@/lib/trust-sources';

export function TrustSourcesNote({
  regionLabel,
  compact,
}: {
  regionLabel?: string | null;
  compact?: boolean;
}) {
  return (
    <aside
      className={
        compact
          ? 'text-[11px] leading-relaxed text-slate-500'
          : 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-relaxed text-slate-600 sm:px-5'
      }
    >
      <p>
        <span className="font-bold text-slate-700">Источники. </span>
        Цены: {PRICE_SOURCE_NOTE}
        {regionLabel ? ` Регион отображения: «${regionLabel}».` : ''} Дата таблицы:{' '}
        <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>.
      </p>
      <p className={compact ? 'mt-1' : 'mt-2'}>
        <span className="font-bold text-slate-700">Нормы (ориентир). </span>
        {NORM_SOURCES.map((n) => `${n.code} — ${n.role}`).join('; ')}.
      </p>
    </aside>
  );
}
