import type { PriceRegionId } from '@/domain/norms/tables';
import { PRICE_REGIONS } from '@/domain/norms/tables';
import type { MaterialPrices } from '@/lib/types';

/** PSEO region_slug (generator) → price table + human label. */
export const PSEO_REGION_MAP: Record<
  string,
  { priceId: PriceRegionId; label: string; genitive: string }
> = {
  moskva: { priceId: 'moscow', label: 'Москва и МО', genitive: 'Москвы и МО' },
  moscow: { priceId: 'moscow', label: 'Москва и МО', genitive: 'Москвы и МО' },
  spb: { priceId: 'spb', label: 'Санкт-Петербург и ЛО', genitive: 'Санкт-Петербурга' },
  kazan: {
    priceId: 'krasnodar',
    label: 'Казань / Поволжье',
    genitive: 'Казани и Поволжья',
  },
  krasnodar: {
    priceId: 'krasnodar',
    label: 'Краснодарский край',
    genitive: 'Краснодарского края',
  },
  ekaterinburg: {
    priceId: 'ekaterinburg',
    label: 'Екатеринбург / Урал',
    genitive: 'Екатеринбурга',
  },
  novosibirsk: {
    priceId: 'novosibirsk',
    label: 'Новосибирск / Сибирь',
    genitive: 'Новосибирска',
  },
};

export function resolvePseoRegion(regionSlug: string | null | undefined): {
  slug: string;
  priceId: PriceRegionId;
  label: string;
  genitive: string;
  prices: MaterialPrices;
} | null {
  if (!regionSlug) return null;
  const key = regionSlug.toLowerCase().trim();
  const hit = PSEO_REGION_MAP[key];
  if (!hit) return null;
  return {
    slug: key,
    priceId: hit.priceId,
    label: hit.label,
    genitive: hit.genitive,
    prices: { ...PRICE_REGIONS[hit.priceId].prices },
  };
}

export const DEFAULT_PSEO_PRICES: MaterialPrices = {
  concretePerM3: 4200,
  rebarPerTon: 62000,
  sandPerTon: 900,
  gravelPerTon: 1800,
  formworkPerM2: 700,
};
