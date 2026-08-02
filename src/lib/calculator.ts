import { buildGeometry, type StripLayoutMode, type StripPlan } from '@/domain/geometry';
import { computeConcreteQuantities } from '@/domain/concrete';
import { computeRebar, type RebarPiece } from '@/domain/rebar';
import { computeLoads, type SnowRegionId } from '@/domain/loads';
import { computeSoilPressure } from '@/domain/geotechnics';
import { runEngineeringChecks, type EngineeringCheck } from '@/domain/checks';
import {
  COVER_DEFAULT_MM,
  DEFAULT_SOIL_RESISTANCE_KPA,
  type SoilTypeId,
} from '@/domain/norms/tables';
import {
  DimensionState,
  ConcreteSpec,
  RebarSpec,
  MaterialPrices,
  MaterialCalculationResult,
  StructureType,
  UnitSystem,
} from '@/lib/types';

export type { StripLayoutMode, StripPlan, SnowRegionId, EngineeringCheck, RebarPiece, SoilTypeId };

export type CalcMode = 'estimate' | 'checks';

export interface ExtendedCalcOptions {
  safetyFactor?: number;
  stripLayout?: StripLayoutMode;
  stripInnerLong?: number;
  stripInnerCross?: number;
  pierSpacingM?: number;
  coverMm?: number;
  stockLengthM?: number;
  buildingDeadLoadKpa?: number;
  liveLoadKpa?: number;
  snowRegion?: SnowRegionId;
  applySnow?: boolean;
  soilResistanceKpa?: number;
  soilTypeId?: SoilTypeId | string;
  stripPlan?: StripPlan | null;
}

export interface ExtendedCalculationResult extends MaterialCalculationResult {
  concreteClassB: string;
  mixNote: string;
  lapMm: number;
  coverMm: number;
  stripLengthM: number;
  pierCount: number;
  stripInnerLong: number;
  stripInnerCross: number;
  junctionCount: number;
  soilResistanceKpa: number;
  soilUtilizationPct: number;
  soilStatus: 'ok' | 'warning' | 'critical';
  soilTypeId?: string;
  totalForceKn: number;
  planAreaM2: number;
  contactAreaM2: number;
  geometryNotes: string[];
  rebarNotes: string[];
  loadNotes: string[];
  checks: EngineeringCheck[];
  rebarPieces: RebarPiece[];
  rebarWastePct: number;
  rebarWasteM: number;
  rebarStockBarsApprox: number;
  rebarStockLengthM: number;
  rebarStockByDiameter: Array<{ diameterMm: number; bars: number; weightKg: number }>;
}

export function calculateMaterials(
  structureType: StructureType,
  dimensions: DimensionState,
  concreteSpec: ConcreteSpec,
  rebarSpec: RebarSpec,
  prices: MaterialPrices,
  unitSystem: UnitSystem,
  safetyFactor: number = 1.15,
  options: ExtendedCalcOptions = {}
): ExtendedCalculationResult {
  const mFactor = unitSystem === 'imperial' ? 0.3048 : 1.0;
  const L = Math.max(0.5, dimensions.length * mFactor);
  const W = Math.max(0.05, dimensions.width * mFactor);
  const H = Math.max(0.05, dimensions.depth * mFactor);
  const pW = dimensions.perimeterThickeningWidth
    ? dimensions.perimeterThickeningWidth * mFactor
    : 0;
  const pH = dimensions.perimeterThickeningDepth
    ? dimensions.perimeterThickeningDepth * mFactor
    : 0;

  const stripLayout: StripLayoutMode =
    options.stripLayout ?? 'perimeter_plus_one';
  const coverMm = options.coverMm ?? COVER_DEFAULT_MM;
  const stockLengthM = options.stockLengthM ?? 11.7;
  const geometry = buildGeometry(structureType, {
    lengthM: L,
    widthM: W,
    depthM: H,
    auxWidthM: pW,
    auxDepthM: pH,
    stripLayout,
    stripInnerLong: options.stripInnerLong,
    stripInnerCross: options.stripInnerCross,
    pierSpacingM: options.pierSpacingM,
    stripPlan: options.stripPlan,
  });

  const planAreaM2 =
    geometry.planAreaM2 && geometry.planAreaM2 > 0
      ? geometry.planAreaM2
      : structureType === 'wall' || structureType === 'beam'
        ? L * W
        : L * W;

  const concrete = computeConcreteQuantities(
    geometry.concreteVolumeRawM3,
    safetyFactor,
    concreteSpec
  );

  const rebar = computeRebar(structureType, rebarSpec, {
    lengthM: L,
    widthM: W,
    depthM: H,
    auxWidthM: pW,
    auxDepthM: pH,
    stripLengthM: geometry.stripLengthM,
    pierCount: geometry.pierCount,
    coverMm,
    stockLengthM,
  });

  const foundationForceKn =
    ((concrete.weightKg + rebar.weightKg) * 9.81) / 1000;

  const loads = computeLoads({
    planAreaM2,
    contactAreaM2: geometry.contactAreaM2,
    buildingDeadLoadKpa: options.buildingDeadLoadKpa ?? 0,
    liveLoadKpa: options.liveLoadKpa ?? 0,
    snowRegion: options.snowRegion ?? 'III',
    applySnow: options.applySnow ?? false,
    foundationForceKn,
  });

  const geotech = computeSoilPressure({
    totalForceKn: loads.totalForceKn,
    contactAreaM2: geometry.contactAreaM2,
    soilResistanceKpa: options.soilResistanceKpa ?? DEFAULT_SOIL_RESISTANCE_KPA,
  });

  const checks = runEngineeringChecks({
    structureType,
    depthM: H,
    coverMm,
    diameterMm: rebarSpec.diameterMm,
    asProvidedMm2PerM: rebar.asProvidedMm2PerM,
    asMinMm2PerM: rebar.asMinMm2PerM,
    soilUtilizationPct: geotech.utilizationPct,
    soilStatus: geotech.status,
    lapMm: rebar.lapMm,
  });

  const concretePrice =
    concreteSpec.customPricePerM3 > 0
      ? concreteSpec.customPricePerM3
      : prices.concretePerM3;
  const rebarPrice =
    rebarSpec.customPricePerTon > 0
      ? rebarSpec.customPricePerTon
      : prices.rebarPerTon;

  const concreteCost = concrete.volumeM3 * concretePrice;
  const rebarCost = (rebar.weightKg / 1000) * rebarPrice;
  const sandGravelCost =
    concrete.sandTons * prices.sandPerTon +
    concrete.gravelTons * prices.gravelPerTon;
  const formworkCost = geometry.formworkAreaM2 * prices.formworkPerM2;
  const laborEstCost = (concreteCost + rebarCost) * 0.35;
  const totalCost =
    concreteCost + rebarCost + sandGravelCost + formworkCost + laborEstCost;

  const timberVolumeM3 = geometry.formworkAreaM2 * 0.025 * 1.15;

  return {
    concreteVolumeM3: Math.round(concrete.volumeM3 * 100) / 100,
    totalWeightTons: Math.round((concrete.weightKg / 1000) * 100) / 100,
    cementBags: concrete.cementBags,
    sandTons: Math.round(concrete.sandTons * 10) / 10,
    gravelTons: Math.round(concrete.gravelTons * 10) / 10,
    rebarLengthMeters: Math.round(rebar.lengthM),
    rebarWeightKg: Math.round(rebar.weightKg),
    bindingWireKg: Math.round(rebar.bindingWireKg * 10) / 10,
    formworkAreaM2: Math.round(geometry.formworkAreaM2 * 10) / 10,
    timberVolumeM3: Math.round(timberVolumeM3 * 100) / 100,
    waterLiters: Math.round(concrete.waterLiters),
    soilPressureKpa: geotech.soilPressureKpa,
    itemizedCosts: {
      concrete: Math.round(concreteCost),
      rebar: Math.round(rebarCost),
      sandGravel: Math.round(sandGravelCost),
      formwork: Math.round(formworkCost),
      laborEst: Math.round(laborEstCost),
      total: Math.round(totalCost),
    },
    concreteClassB: concrete.classB,
    mixNote: concrete.mixNote,
    lapMm: rebar.lapMm,
    coverMm,
    stripLengthM: geometry.stripLengthM,
    pierCount: geometry.pierCount,
    stripInnerLong: geometry.stripInnerLong,
    stripInnerCross: geometry.stripInnerCross,
    junctionCount: geometry.junctionCount,
    soilResistanceKpa: geotech.soilResistanceKpa,
    soilUtilizationPct: geotech.utilizationPct,
    soilStatus: geotech.status,
    soilTypeId: options.soilTypeId,
    totalForceKn: Math.round(loads.totalForceKn * 10) / 10,
    planAreaM2: Math.round(planAreaM2 * 100) / 100,
    contactAreaM2: Math.round(geometry.contactAreaM2 * 100) / 100,
    geometryNotes: geometry.notes,
    rebarNotes: rebar.notes,
    loadNotes: loads.notes,
    checks,
    rebarPieces: rebar.pieces,
    rebarWastePct: rebar.wastePct,
    rebarWasteM: rebar.wasteM,
    rebarStockBarsApprox: rebar.stockBarsApprox,
    rebarStockLengthM: rebar.stockLengthM,
    rebarStockByDiameter: rebar.stockByDiameter,
  };
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  AED: 'AED ',
};

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** Compact payload for AI — real calc numbers, not invented. */
export function buildAiCalcContext(result: ExtendedCalculationResult) {
  return {
    concreteVolumeM3: result.concreteVolumeM3,
    rebarWeightKg: result.rebarWeightKg,
    rebarLengthM: result.rebarLengthMeters,
    rebarWastePct: result.rebarWastePct,
    stockBarsApprox: result.rebarStockBarsApprox,
    stockByDiameter: result.rebarStockByDiameter,
    lapMm: result.lapMm,
    coverMm: result.coverMm,
    soilPressureKpa: result.soilPressureKpa,
    soilResistanceKpa: result.soilResistanceKpa,
    soilUtilizationPct: result.soilUtilizationPct,
    soilStatus: result.soilStatus,
    totalForceKn: result.totalForceKn,
    concreteClassB: result.concreteClassB,
    stripLengthM: result.stripLengthM,
    pierCount: result.pierCount,
    geometryNotes: result.geometryNotes,
    rebarNotes: result.rebarNotes,
    loadNotes: result.loadNotes,
    checks: result.checks.map((c) => ({
      id: c.id,
      status: c.status,
      title: c.title,
      detail: c.detail,
    })),
    rebarPieces: result.rebarPieces.slice(0, 12),
    costsRub: result.itemizedCosts,
  };
}
