import Link from 'next/link';
import {
  ENGINE_UPDATED_AT,
  formatEngineUpdated,
} from '@/lib/seo-freshness';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';

/** Idea 7: visible freshness without spam. */
export function FreshnessMeta({
  className = '',
  showOpytLink = true,
}: {
  className?: string;
  showOpytLink?: boolean;
}) {
  return (
    <p
      className={`text-xs leading-relaxed text-slate-500 ${className}`.trim()}
    >
      <span className="font-semibold text-slate-600">Актуальность. </span>
      Ядро:{' '}
      <time dateTime={ENGINE_UPDATED_AT}>{formatEngineUpdated()}</time>
      {' · '}
      прайс:{' '}
      <time dateTime={PRICE_TABLE_AS_OF}>
        {formatPriceAsOf(PRICE_TABLE_AS_OF)}
      </time>
      {showOpytLink ? (
        <>
          {' · '}
          <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
            опыт ядра
          </Link>
        </>
      ) : null}
    </p>
  );
}
