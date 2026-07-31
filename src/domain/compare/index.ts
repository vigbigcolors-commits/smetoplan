import { calculateMaterials, type ExtendedCalcOptions } from '@/lib/calculator';
import { getStructurePreset } from '@/lib/calculator-routes';
import type {
  ConcreteSpec,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from '@/lib/types';

export interface StructureCompareRow {
  structureType: StructureType;
  label: string;
  concreteVolumeM3: number;
  rebarWeightKg: number;
  totalCost: number;
  soilPressureKpa: number;
  soilUtilizationPct: number;
}

const COMPARE_TYPES: StructureType[] = ['slab', 'strip', 'pier'];

/**
 * Side-by-side estimate for same building footprint (L×W) —
 * uses structure presets for depth/rebar typical of each type.
 */
export function compareFoundationOptions(
  lengthM: number,
  widthM: number,
  concreteSpec: ConcreteSpec,
  prices: MaterialPrices,
  unitSystem: UnitSystem,
  safetyFactor: number,
  options: ExtendedCalcOptions = {}
): StructureCompareRow[] {
  return COMPARE_TYPES.map((type) => {
    const preset = getStructurePreset(type);
    const dimensions = {
      ...preset.dimensions,
      length: lengthM,
      width: type === 'beam' || type === 'wall' ? preset.dimensions.width : widthM,
    };
    // Strip/pier need plan footprint as L×W
    if (type === 'strip' || type === 'pier' || type === 'slab') {
      dimensions.length = lengthM;
      dimensions.width = widthM;
    }
    const rebar: RebarSpec = preset.rebarSpec;
    const r = calculateMaterials(
      type,
      dimensions,
      { ...concreteSpec, grade: preset.concreteSpec.grade },
      rebar,
      prices,
      unitSystem,
      safetyFactor,
      {
        ...options,
        stripLayout: type === 'strip' ? options.stripLayout ?? 'perimeter_plus_one' : undefined,
      }
    );
    return {
      structureType: type,
      label: preset.label,
      concreteVolumeM3: r.concreteVolumeM3,
      rebarWeightKg: r.rebarWeightKg,
      totalCost: r.itemizedCosts.total,
      soilPressureKpa: r.soilPressureKpa,
      soilUtilizationPct: r.soilUtilizationPct,
    };
  });
}
