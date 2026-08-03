import type { PriceRegionId } from '@/domain/norms/tables';
import { PRICE_REGIONS } from '@/domain/norms/tables';
import type { MaterialPrices } from '@/lib/types';

export type PseoRegionMeta = {
  priceId: PriceRegionId;
  label: string;
  genitive: string;
  /** Short locative for titles: «в Москве и МО» */
  locative: string;
};

/**
 * Canonical PSEO/SEO region slugs — 1:1 with PRICE_REGIONS.
 * No alias that silently remaps another city onto foreign prices.
 */
export const PSEO_CANONICAL_SLUGS = [
  'moskva',
  'spb',
  'krasnodar',
  'ekaterinburg',
  'novosibirsk',
] as const;

export type PseoCanonicalSlug = (typeof PSEO_CANONICAL_SLUGS)[number];

const CANONICAL: Record<PseoCanonicalSlug, PseoRegionMeta> = {
  moskva: {
    priceId: 'moscow',
    label: 'Москва и МО',
    genitive: 'Москвы и МО',
    locative: 'в Москве и МО',
  },
  spb: {
    priceId: 'spb',
    label: 'Санкт-Петербург и ЛО',
    genitive: 'Санкт-Петербурга и ЛО',
    locative: 'в Санкт-Петербурге и ЛО',
  },
  krasnodar: {
    priceId: 'krasnodar',
    label: 'Краснодарский край',
    genitive: 'Краснодарского края',
    locative: 'в Краснодарском крае',
  },
  ekaterinburg: {
    priceId: 'ekaterinburg',
    label: 'Екатеринбург / Урал',
    genitive: 'Екатеринбурга',
    locative: 'в Екатеринбурге',
  },
  novosibirsk: {
    priceId: 'novosibirsk',
    label: 'Новосибирск / Сибирь',
    genitive: 'Новосибирска',
    locative: 'в Новосибирске',
  },
};

/** Legacy aliases that resolve to the same city (never to another region). */
const ALIASES: Record<string, PseoCanonicalSlug> = {
  moscow: 'moskva',
  'sankt-peterburg': 'spb',
  'saint-petersburg': 'spb',
};

/** Full map for hubs / resolve — canonical + safe aliases only. */
export const PSEO_REGION_MAP: Record<string, PseoRegionMeta> = {
  ...CANONICAL,
  moscow: CANONICAL.moskva,
};

export function isPseoCanonicalSlug(slug: string): slug is PseoCanonicalSlug {
  return (PSEO_CANONICAL_SLUGS as readonly string[]).includes(slug);
}

export function canonicalizePseoRegionSlug(
  regionSlug: string | null | undefined
): PseoCanonicalSlug | null {
  if (!regionSlug) return null;
  const key = regionSlug.toLowerCase().trim();
  if (isPseoCanonicalSlug(key)) return key;
  return ALIASES[key] ?? null;
}

export function resolvePseoRegion(regionSlug: string | null | undefined): {
  slug: PseoCanonicalSlug;
  priceId: PriceRegionId;
  label: string;
  genitive: string;
  locative: string;
  prices: MaterialPrices;
} | null {
  const slug = canonicalizePseoRegionSlug(regionSlug);
  if (!slug) return null;
  const meta = CANONICAL[slug];
  return {
    slug,
    priceId: meta.priceId,
    label: meta.label,
    genitive: meta.genitive,
    locative: meta.locative,
    prices: { ...PRICE_REGIONS[meta.priceId].prices },
  };
}

/** Fallback only for interactive calculator UI — never for indexable PSEO. */
export const DEFAULT_PSEO_PRICES: MaterialPrices = {
  ...PRICE_REGIONS.moscow.prices,
};
