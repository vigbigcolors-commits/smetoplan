import {
  calculateMaterials,
  type ExtendedCalcOptions,
  type ExtendedCalculationResult,
} from '@/lib/calculator';
import type {
  ConcreteSpec,
  DimensionState,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from '@/lib/types';

export interface SensitivityScenario {
  id: string;
  label: string;
  result: ExtendedCalculationResult;
  deltaVolumeM3: number;
  deltaRebarKg: number;
  deltaCost: number;
  deltaSoilPct: number;
}

export interface SensitivityInput {
  structureType: StructureType;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  prices: MaterialPrices;
  unitSystem: UnitSystem;
  safetyFactor: number;
  options: ExtendedCalcOptions;
}

function withSoil(
  options: ExtendedCalcOptions,
  factor: number
): ExtendedCalcOptions {
  const base = options.soilResistanceKpa ?? 200;
  return { ...options, soilResistanceKpa: Math.round(base * factor) };
}

function withLoads(
  options: ExtendedCalcOptions,
  factor: number
): ExtendedCalcOptions {
  return {
    ...options,
    buildingDeadLoadKpa: (options.buildingDeadLoadKpa ?? 0) * factor,
    liveLoadKpa: (options.liveLoadKpa ?? 0) * factor,
  };
}

function run(
  input: SensitivityInput,
  options: ExtendedCalcOptions,
  concrete: ConcreteSpec
): ExtendedCalculationResult {
  return calculateMaterials(
    input.structureType,
    input.dimensions,
    concrete,
    input.rebarSpec,
    input.prices,
    input.unitSystem,
    input.safetyFactor,
    options
  );
}

function row(
  id: string,
  label: string,
  base: ExtendedCalculationResult,
  result: ExtendedCalculationResult
): SensitivityScenario {
  return {
    id,
    label,
    result,
    deltaVolumeM3: Math.round((result.concreteVolumeM3 - base.concreteVolumeM3) * 100) / 100,
    deltaRebarKg: Math.round(result.rebarWeightKg - base.rebarWeightKg),
    deltaCost: Math.round(result.itemizedCosts.total - base.itemizedCosts.total),
    deltaSoilPct: Math.round(result.soilUtilizationPct - base.soilUtilizationPct),
  };
}

/**
 * Sensitivity table: soil R, loads, concrete grade — same engine, no duplicate math.
 */
export function runSensitivityScenarios(
  input: SensitivityInput
): SensitivityScenario[] {
  const base = run(input, input.options, input.concreteSpec);
  const scenarios: SensitivityScenario[] = [
    row('base', 'База', base, base),
    row('r-20', 'R грунта −20%', base, run(input, withSoil(input.options, 0.8), input.concreteSpec)),
    row('r-10', 'R грунта −10%', base, run(input, withSoil(input.options, 0.9), input.concreteSpec)),
    row('r+10', 'R грунта +10%', base, run(input, withSoil(input.options, 1.1), input.concreteSpec)),
    row('load-15', 'Нагрузки −15%', base, run(input, withLoads(input.options, 0.85), input.concreteSpec)),
    row('load+15', 'Нагрузки +15%', base, run(input, withLoads(input.options, 1.15), input.concreteSpec)),
  ];

  const grade = input.concreteSpec.grade.toUpperCase();
  if (grade.includes('300') || grade.includes('B22') || grade.includes('B25')) {
    const up: ConcreteSpec = {
      ...input.concreteSpec,
      grade: 'M350',
      customPricePerM3: Math.round(input.concreteSpec.customPricePerM3 * 1.06),
    };
    scenarios.push(row('c30', 'Марка → M350 (+6% цена)', base, run(input, input.options, up)));
  } else {
    const down: ConcreteSpec = {
      ...input.concreteSpec,
      grade: 'M300',
      customPricePerM3: Math.round(input.concreteSpec.customPricePerM3 * 0.94),
    };
    scenarios.push(row('c25', 'Марка → M300 (−6% цена)', base, run(input, input.options, down)));
  }

  return scenarios;
}
