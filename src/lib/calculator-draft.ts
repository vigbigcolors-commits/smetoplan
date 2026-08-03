import type {
  ConcreteSpec,
  Currency,
  DimensionState,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from '@/lib/types';
import { isStructureType } from '@/lib/calculator-routes';
import type { CalcMode, SnowRegionId, StripLayoutMode } from '@/lib/calculator';
import {
  isValidStripPlan,
  type StripPlan,
} from '@/domain/geometry/strip-path';
import {
  PRICE_REGIONS,
  SOIL_TYPES,
  SNOW_REGIONS,
  type PriceRegionId,
  type SoilTypeId,
} from '@/domain/norms/tables';

export const CALCULATOR_DRAFT_KEY = 'smetoplan.calculator.draft.v1';

export interface CalculatorDraft {
  v: 1;
  structureType: StructureType;
  unitSystem: UnitSystem;
  currency: Currency;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  prices: MaterialPrices;
  safetyFactor: number;
  calcMode: CalcMode;
  stripLayout: StripLayoutMode;
  stripInnerLong: number;
  stripInnerCross: number;
  stripPlan: StripPlan;
  stripPlanCustom: boolean;
  pierSpacingM: number;
  coverMm: number;
  stockLengthM: number;
  buildingDeadLoadKpa: number;
  liveLoadKpa: number;
  priceRegionId: PriceRegionId;
  snowRegion: SnowRegionId;
  applySnow: boolean;
  soilTypeId: SoilTypeId;
  soilResistanceKpa: number;
  savedAt: number;
}

const STRUCTURE_OK = isStructureType;
const UNITS: UnitSystem[] = ['metric', 'imperial'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'RUB', 'AED'];
const GRADES: ConcreteSpec['grade'][] = [
  'M150',
  'M200',
  'M250',
  'M300',
  'M350',
  'M400',
];
const CALC_MODES: CalcMode[] = ['estimate', 'checks'];
const STRIP_LAYOUTS: StripLayoutMode[] = [
  'perimeter',
  'perimeter_plus_one',
  'perimeter_plus_cross',
  'custom',
];
const SOIL_IDS = new Set(SOIL_TYPES.map((s) => s.id));

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isDimensions(v: unknown): v is DimensionState {
  if (!v || typeof v !== 'object') return false;
  const d = v as DimensionState;
  return (
    isFiniteNumber(d.length) &&
    isFiniteNumber(d.width) &&
    isFiniteNumber(d.depth) &&
    isFiniteNumber(d.perimeterThickeningWidth) &&
    isFiniteNumber(d.perimeterThickeningDepth)
  );
}

function isConcrete(v: unknown): v is ConcreteSpec {
  if (!v || typeof v !== 'object') return false;
  const c = v as ConcreteSpec;
  return (
    GRADES.includes(c.grade) &&
    (c.cementBagKg === 25 || c.cementBagKg === 50) &&
    isFiniteNumber(c.customPricePerM3)
  );
}

function isRebar(v: unknown): v is RebarSpec {
  if (!v || typeof v !== 'object') return false;
  const r = v as RebarSpec;
  const longOk =
    r.longitudinalBars == null ||
    r.longitudinalBars === 4 ||
    r.longitudinalBars === 6 ||
    r.longitudinalBars === 8;
  const stirrupOk =
    r.stirrupDiameterMm == null ||
    (isFiniteNumber(r.stirrupDiameterMm) &&
      r.stirrupDiameterMm >= 6 &&
      r.stirrupDiameterMm <= 16);
  return (
    isFiniteNumber(r.diameterMm) &&
    isFiniteNumber(r.spacingMm) &&
    (r.layers === 1 || r.layers === 2 || r.layers === 3) &&
    isFiniteNumber(r.customPricePerTon) &&
    longOk &&
    stirrupOk
  );
}

function isPrices(v: unknown): v is MaterialPrices {
  if (!v || typeof v !== 'object') return false;
  const p = v as MaterialPrices;
  return (
    isFiniteNumber(p.concretePerM3) &&
    isFiniteNumber(p.rebarPerTon) &&
    isFiniteNumber(p.sandPerTon) &&
    isFiniteNumber(p.gravelPerTon) &&
    isFiniteNumber(p.formworkPerM2)
  );
}

export function parseCalculatorDraft(raw: unknown): CalculatorDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<CalculatorDraft>;
  if (d.v !== 1) return null;
  if (!STRUCTURE_OK(d.structureType)) return null;
  if (!d.unitSystem || !UNITS.includes(d.unitSystem)) return null;
  if (!d.currency || !CURRENCIES.includes(d.currency)) return null;
  if (!isDimensions(d.dimensions)) return null;
  if (!isConcrete(d.concreteSpec)) return null;
  if (!isRebar(d.rebarSpec)) return null;
  if (!isPrices(d.prices)) return null;
  if (!isFiniteNumber(d.safetyFactor)) return null;
  if (!d.calcMode || !CALC_MODES.includes(d.calcMode)) return null;
  if (!d.stripLayout || !STRIP_LAYOUTS.includes(d.stripLayout)) return null;
  if (!isFiniteNumber(d.stripInnerLong) || !isFiniteNumber(d.stripInnerCross)) return null;
  if (!isValidStripPlan(d.stripPlan)) return null;
  const stripPlan = d.stripPlan;
  if (typeof d.stripPlanCustom !== 'boolean') return null;
  if (!isFiniteNumber(d.pierSpacingM)) return null;
  if (!isFiniteNumber(d.coverMm) || !isFiniteNumber(d.stockLengthM)) return null;
  if (!isFiniteNumber(d.buildingDeadLoadKpa) || !isFiniteNumber(d.liveLoadKpa)) return null;
  if (!d.priceRegionId || !(d.priceRegionId in PRICE_REGIONS)) return null;
  if (!d.snowRegion || !(d.snowRegion in SNOW_REGIONS)) return null;
  if (typeof d.applySnow !== 'boolean') return null;
  if (!d.soilTypeId || !SOIL_IDS.has(d.soilTypeId)) return null;
  if (!isFiniteNumber(d.soilResistanceKpa)) return null;

  return {
    v: 1,
    structureType: d.structureType,
    unitSystem: d.unitSystem,
    currency: d.currency,
    dimensions: d.dimensions,
    concreteSpec: d.concreteSpec,
    rebarSpec: d.rebarSpec,
    prices: d.prices,
    safetyFactor: d.safetyFactor,
    calcMode: d.calcMode,
    stripLayout: d.stripLayout,
    stripInnerLong: d.stripInnerLong,
    stripInnerCross: d.stripInnerCross,
    stripPlan,
    stripPlanCustom: d.stripPlanCustom,
    pierSpacingM: d.pierSpacingM,
    coverMm: d.coverMm,
    stockLengthM: d.stockLengthM,
    buildingDeadLoadKpa: d.buildingDeadLoadKpa,
    liveLoadKpa: d.liveLoadKpa,
    priceRegionId: d.priceRegionId as PriceRegionId,
    snowRegion: d.snowRegion as SnowRegionId,
    applySnow: d.applySnow,
    soilTypeId: d.soilTypeId as SoilTypeId,
    soilResistanceKpa: d.soilResistanceKpa,
    savedAt: isFiniteNumber(d.savedAt) ? d.savedAt : Date.now(),
  };
}

export function loadCalculatorDraft(): CalculatorDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CALCULATOR_DRAFT_KEY);
    if (!raw) return null;
    return parseCalculatorDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCalculatorDraft(
  draft: Omit<CalculatorDraft, 'v' | 'savedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CalculatorDraft = {
      ...draft,
      v: 1,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(CALCULATOR_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore
  }
}
