/** Immutable reference tables for Russian construction norms (estimate-grade helpers). */

export const CONCRETE_DENSITY_KG_M3 = 2450;

/** Typical handbook mix proportions kg/m³ (not formal mix design). */
export const MIX_BY_GRADE: Record<
  string,
  { cement: number; sand: number; gravel: number; classB: string }
> = {
  M150: { cement: 260, sand: 730, gravel: 1180, classB: 'B12.5' },
  M200: { cement: 310, sand: 690, gravel: 1160, classB: 'B15' },
  M250: { cement: 350, sand: 650, gravel: 1150, classB: 'B20' },
  M300: { cement: 380, sand: 610, gravel: 1140, classB: 'B22.5' },
  M350: { cement: 420, sand: 570, gravel: 1120, classB: 'B25' },
  M400: { cement: 460, sand: 530, gravel: 1100, classB: 'B30' },
};

/** Default soil design resistance R, kPa (СП 22 typical sandy/clayey mid-range). */
export const DEFAULT_SOIL_RESISTANCE_KPA = 200;

/** Conservative handbook R by soil type (СП 22 orientative — not ИГИ). */
export const SOIL_TYPES = [
  {
    id: 'sand_coarse',
    label: 'Пески крупные / гравелистые',
    rKpa: 350,
    note: 'СП 22 ориентир, сухие',
  },
  {
    id: 'sand_medium',
    label: 'Пески средней крупности',
    rKpa: 250,
    note: 'СП 22 ориентир',
  },
  {
    id: 'sand_fine',
    label: 'Пески мелкие / пылеватые',
    rKpa: 150,
    note: 'СП 22 ориентир, осторожно',
  },
  {
    id: 'clay_hard',
    label: 'Глины твёрдые / полутвёрдые',
    rKpa: 300,
    note: 'СП 22 ориентир',
  },
  {
    id: 'clay_plastic',
    label: 'Глины тугопластичные',
    rKpa: 200,
    note: 'СП 22 ориентир (часто по умолчанию)',
  },
  {
    id: 'clay_soft',
    label: 'Глины мягкопластичные / илы',
    rKpa: 100,
    note: 'Консервативно — нужны ИГИ',
  },
  {
    id: 'fill_unknown',
    label: 'Насыпь / неизвестно',
    rKpa: 100,
    note: 'Минимальный ориентир до ИГИ',
  },
] as const;

export type SoilTypeId = (typeof SOIL_TYPES)[number]['id'];

export function getSoilType(id: SoilTypeId | string) {
  return SOIL_TYPES.find((s) => s.id === id) ?? SOIL_TYPES[4];
}

/** Snow load regions (СП 20.13330) — characteristic sg, kPa. */
export const SNOW_REGIONS: Record<
  string,
  { label: string; sgKpa: number }
> = {
  I: { label: 'I (юг)', sgKpa: 0.8 },
  II: { label: 'II', sgKpa: 1.2 },
  III: { label: 'III (Москва+)', sgKpa: 1.8 },
  IV: { label: 'IV', sgKpa: 2.4 },
  V: { label: 'V (север)', sgKpa: 3.2 },
};

/** Market price regions — handbook fallback when /ceny median missing (mid-2026 RUB). */
export const PRICE_REGIONS = {
  moscow: {
    label: 'Москва и МО',
    soilDefaultId: 'clay_plastic' as SoilTypeId,
    snowDefault: 'III',
    prices: {
      concretePerM3: 6200,
      rebarPerTon: 72000,
      sandPerTon: 1400,
      gravelPerTon: 2500,
      formworkPerM2: 950,
    },
  },
  spb: {
    label: 'Санкт-Петербург и ЛО',
    soilDefaultId: 'clay_plastic' as SoilTypeId,
    snowDefault: 'III',
    prices: {
      concretePerM3: 5800,
      rebarPerTon: 70000,
      sandPerTon: 1300,
      gravelPerTon: 2300,
      formworkPerM2: 900,
    },
  },
  krasnodar: {
    label: 'Краснодарский край',
    soilDefaultId: 'clay_hard' as SoilTypeId,
    snowDefault: 'I',
    prices: {
      concretePerM3: 4800,
      rebarPerTon: 65000,
      sandPerTon: 1000,
      gravelPerTon: 1800,
      formworkPerM2: 720,
    },
  },
  ekaterinburg: {
    label: 'Екатеринбург / Урал',
    soilDefaultId: 'sand_medium' as SoilTypeId,
    snowDefault: 'IV',
    prices: {
      concretePerM3: 5200,
      rebarPerTon: 68000,
      sandPerTon: 1100,
      gravelPerTon: 2000,
      formworkPerM2: 780,
    },
  },
  novosibirsk: {
    label: 'Новосибирск / Сибирь',
    soilDefaultId: 'clay_plastic' as SoilTypeId,
    snowDefault: 'IV',
    prices: {
      concretePerM3: 5400,
      rebarPerTon: 69000,
      sandPerTon: 1150,
      gravelPerTon: 2100,
      formworkPerM2: 800,
    },
  },
} as const;

export type PriceRegionId = keyof typeof PRICE_REGIONS;

/** Minimum reinforcement ratio μs,min for slabs/walls (СП 63 orientative). */
export const MU_S_MIN = 0.001;

/** Protective cover defaults by exposure, mm (СП 63 orientative). */
export const COVER_DEFAULT_MM = 40;

/** Typical rebar stock length, mm (11.7 m). */
export const REBAR_STOCK_LENGTH_MM = 11700;

/**
 * Lap length estimate ≈ max(40Ø, 300mm) for tension A500C in B22.5+ —
 * estimate helper, not a substitute for СП 63 clause calculation.
 */
export function estimateLapMm(diameterMm: number): number {
  return Math.max(300, Math.round(40 * diameterMm));
}

/** Linear steel density kg/m = Ø² × π/4 × 7850e-9 ≈ Ø² × 0.006165 */
export function rebarLinearDensityKgM(diameterMm: number): number {
  return diameterMm * diameterMm * 0.006165;
}
