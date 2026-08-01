import type { MaterialPrices } from '@/lib/types';
import {
  PRICE_REGIONS,
  type PriceRegionId,
} from '@/domain/norms/tables';
import { formatPriceAsOf, PRICE_SOURCE_NOTE } from '@/lib/trust-sources';
import {
  getRegionalPricesWithMedian,
  PRICE_BAND_DISCLAIMER,
} from '@/lib/region-medians';

export type { PriceRegionId };
export * from './suppliers';

/** Prefer /ceny feed medians when present, else handbook PRICE_REGIONS. */
export function getRegionalPrices(regionId: PriceRegionId): MaterialPrices {
  const m = getRegionalPricesWithMedian(regionId);
  return {
    concretePerM3: m.concretePerM3,
    rebarPerTon: m.rebarPerTon,
    formworkPerM2: m.formworkPerM2,
    sandPerTon: m.sandPerTon,
    gravelPerTon: m.gravelPerTon,
  };
}

export interface RegionalLineCost {
  id: string;
  label: string;
  unit: string;
  unitPrice: number;
  qty: number;
  qtyLabel: string;
  lineTotal: number;
}

export interface RegionalSupplySnapshot {
  regionId: PriceRegionId;
  regionLabel: string;
  prices: MaterialPrices;
  lines: RegionalLineCost[];
  materialsTotal: number;
  /** Other regions — same unit prices only, for honest comparison */
  peerRegions: Array<{
    id: PriceRegionId;
    label: string;
    concretePerM3: number;
    rebarPerTon: number;
  }>;
  disclaimer: string;
}

/**
 * Honest regional supply snapshot from PRICE_REGIONS + live calc quantities.
 * No fake plants, ratings, or discount theatre.
 */
export function buildRegionalSupplySnapshot(
  regionId: PriceRegionId,
  qty: {
    concreteVolumeM3: number;
    rebarWeightKg: number;
    formworkAreaM2: number;
    sandTons: number;
    gravelTons: number;
  },
  /** Active prices (may be user-edited in workspace) */
  activePrices?: MaterialPrices
): RegionalSupplySnapshot {
  const meta = PRICE_REGIONS[regionId];
  const medianMeta = getRegionalPricesWithMedian(regionId);
  const prices = activePrices ? { ...activePrices } : getRegionalPrices(regionId);

  const lines: RegionalLineCost[] = [
    {
      id: 'concrete',
      label: 'Бетон (ориентир прайса)',
      unit: 'м³',
      unitPrice: prices.concretePerM3,
      qty: qty.concreteVolumeM3,
      qtyLabel: `${qty.concreteVolumeM3} м³`,
      lineTotal: Math.round(qty.concreteVolumeM3 * prices.concretePerM3),
    },
    {
      id: 'rebar',
      label: 'Арматура (ориентир прайса)',
      unit: 'т',
      unitPrice: prices.rebarPerTon,
      qty: Math.round((qty.rebarWeightKg / 1000) * 1000) / 1000,
      qtyLabel: `${qty.rebarWeightKg} кг`,
      lineTotal: Math.round((qty.rebarWeightKg / 1000) * prices.rebarPerTon),
    },
    {
      id: 'formwork',
      label: 'Опалубка / аренда ориентир',
      unit: 'м²',
      unitPrice: prices.formworkPerM2,
      qty: qty.formworkAreaM2,
      qtyLabel: `${qty.formworkAreaM2} м²`,
      lineTotal: Math.round(qty.formworkAreaM2 * prices.formworkPerM2),
    },
    {
      id: 'sand',
      label: 'Песок (если самозамес)',
      unit: 'т',
      unitPrice: prices.sandPerTon,
      qty: qty.sandTons,
      qtyLabel: `${qty.sandTons} т`,
      lineTotal: Math.round(qty.sandTons * prices.sandPerTon),
    },
    {
      id: 'gravel',
      label: 'Щебень (если самозамес)',
      unit: 'т',
      unitPrice: prices.gravelPerTon,
      qty: qty.gravelTons,
      qtyLabel: `${qty.gravelTons} т`,
      lineTotal: Math.round(qty.gravelTons * prices.gravelPerTon),
    },
  ];

  const materialsTotal = lines
    .filter((l) => l.id === 'concrete' || l.id === 'rebar' || l.id === 'formwork')
    .reduce((s, l) => s + l.lineTotal, 0);

  const peerRegions = (Object.keys(PRICE_REGIONS) as PriceRegionId[]).map((id) => {
    const p = getRegionalPrices(id);
    return {
      id,
      label: PRICE_REGIONS[id].label,
      concretePerM3: p.concretePerM3,
      rebarPerTon: p.rebarPerTon,
    };
  });

  return {
    regionId,
    regionLabel: meta.label,
    prices,
    lines,
    materialsTotal,
    peerRegions,
    disclaimer: `${PRICE_SOURCE_NOTE} ${PRICE_BAND_DISCLAIMER} Дата ориентира: ${formatPriceAsOf(medianMeta.asOf)} (${medianMeta.asOf}, ${medianMeta.source === 'feed_median' ? 'медиана /ceny' : 'справочник'}).`,
  };
}
