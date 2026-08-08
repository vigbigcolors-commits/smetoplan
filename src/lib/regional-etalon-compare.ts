import { calculateMaterials } from '@/lib/calculator';
import { getRegionalPrices } from '@/domain/markets';
import { COVER_DEFAULT_MM } from '@/domain/norms/tables';
import type { PriceRegionId } from '@/domain/norms/tables';
import { CENY_REGIONS } from '@/lib/ceny-regions';
import { PRICE_REGIONS } from '@/domain/norms/tables';

export type RegionalEtalonRow = {
  regionId: PriceRegionId;
  cenySlug: string;
  label: string;
  concretePerM3: number;
  rebarPerTon: number;
  totalRub: number;
  concreteVolumeM3: number;
  rebarWeightKg: number;
};

/** Same slab geometry, live prices per region — money SEO without thin clones. */
export function compareSlabEtalonAcrossRegions(): {
  title: string;
  assumptions: string[];
  rows: RegionalEtalonRow[];
} {
  const dims = {
    length: 10,
    width: 12,
    depth: 0.3,
    perimeterThickeningWidth: 0,
    perimeterThickeningDepth: 0,
  };
  const rebar = {
    diameterMm: 12,
    spacingMm: 200,
    layers: 2 as const,
    customPricePerTon: 0,
  };

  const rows: RegionalEtalonRow[] = CENY_REGIONS.map((ceny) => {
    const regionId = ceny.regionId;
    const prices = getRegionalPrices(regionId);
    const r = calculateMaterials(
      'slab',
      dims,
      {
        grade: 'M300',
        cementBagKg: 50,
        customPricePerM3: prices.concretePerM3,
      },
      { ...rebar, customPricePerTon: prices.rebarPerTon },
      prices,
      'metric',
      1.15,
      { coverMm: COVER_DEFAULT_MM, stockLengthM: 11.7 }
    );
    return {
      regionId,
      cenySlug: ceny.slug,
      label: PRICE_REGIONS[regionId]?.label || ceny.label,
      concretePerM3: prices.concretePerM3,
      rebarPerTon: prices.rebarPerTon,
      totalRub: Math.round(r.itemizedCosts.total),
      concreteVolumeM3: r.concreteVolumeM3,
      rebarWeightKg: Math.round(r.rebarWeightKg),
    };
  }).sort((a, b) => a.totalRub - b.totalRub);

  return {
    title: 'Плита 10×12×0,3 м · М300 · Ø12 / 200 / 2 слоя',
    assumptions: [
      'Одна геометрия и один каркас во всех регионах',
      'Объёмы из живого ядра Smetoplan, цены — справочник региона',
      'Не оферта РБУ; сравнивайте с /ceny и заводом',
    ],
    rows,
  };
}
