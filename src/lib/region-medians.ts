import type { MaterialPrices } from '@/lib/types';
import {
  PRICE_REGIONS,
  type PriceRegionId,
} from '@/domain/norms/tables';
import { PRICE_TABLE_AS_OF } from '@/lib/trust-sources';
import mediansFile from '../../data/region-price-medians.json';

export const PRICE_BAND_LOW_PCT = 15;
export const PRICE_BAND_HIGH_PCT = 25;

export const PRICE_BAND_DISCLAIMER =
  `Ориентир бюджета ±${PRICE_BAND_LOW_PCT}–${PRICE_BAND_HIGH_PCT}% к рынку. Не коммерческое КП и не оферта РБУ — актуальный прайс, доставку и добавки уточняйте у завода.`;

export interface RegionMedianPrices extends MaterialPrices {
  regionId: PriceRegionId;
  asOf: string;
  sampleN: { concrete: number; rebar: number };
  source: 'feed_median' | 'handbook';
}

interface MediansFileShape {
  asOf: string;
  regions: Record<
    string,
    {
      concretePerM3: number;
      rebarPerTon: number;
      formworkPerM2: number;
      sandPerTon: number;
      gravelPerTon: number;
      sampleN?: { concrete?: number; rebar?: number };
    }
  >;
}

const FILE = mediansFile as MediansFileShape;

export function medianOf(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return Math.round(nums[mid]);
  return Math.round((nums[mid - 1] + nums[mid]) / 2);
}

export function handbookPrices(regionId: PriceRegionId): MaterialPrices {
  return { ...PRICE_REGIONS[regionId].prices };
}

/** Sync overlay: JSON medians from /ceny feed, else handbook. */
export function getRegionalPricesWithMedian(regionId: PriceRegionId): RegionMedianPrices {
  const handbook = handbookPrices(regionId);
  const row = FILE.regions[regionId];
  if (!row) {
    return {
      ...handbook,
      regionId,
      asOf: PRICE_TABLE_AS_OF,
      sampleN: { concrete: 0, rebar: 0 },
      source: 'handbook',
    };
  }
  return {
    concretePerM3: row.concretePerM3 || handbook.concretePerM3,
    rebarPerTon: row.rebarPerTon || handbook.rebarPerTon,
    formworkPerM2: row.formworkPerM2 || handbook.formworkPerM2,
    sandPerTon: row.sandPerTon || handbook.sandPerTon,
    gravelPerTon: row.gravelPerTon || handbook.gravelPerTon,
    regionId,
    asOf: FILE.asOf || PRICE_TABLE_AS_OF,
    sampleN: {
      concrete: row.sampleN?.concrete ?? 0,
      rebar: row.sampleN?.rebar ?? 0,
    },
    source: 'feed_median',
  };
}

export function formatPriceBand(total: number): { low: number; high: number } {
  return {
    low: Math.round(total * (1 - PRICE_BAND_LOW_PCT / 100)),
    high: Math.round(total * (1 + PRICE_BAND_HIGH_PCT / 100)),
  };
}
