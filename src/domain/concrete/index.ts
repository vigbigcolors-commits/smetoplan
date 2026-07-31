import {
  CONCRETE_DENSITY_KG_M3,
  MIX_BY_GRADE,
} from '@/domain/norms/tables';
import type { ConcreteSpec } from '@/lib/types';

export interface ConcreteQuantities {
  volumeM3: number;
  weightKg: number;
  cementKg: number;
  cementBags: number;
  sandTons: number;
  gravelTons: number;
  waterLiters: number;
  classB: string;
  mixNote: string;
}

export function computeConcreteQuantities(
  volumeRawM3: number,
  safetyFactor: number,
  concreteSpec: ConcreteSpec
): ConcreteQuantities {
  const volumeM3 = volumeRawM3 * safetyFactor;
  const mix = MIX_BY_GRADE[concreteSpec.grade] ?? MIX_BY_GRADE.M300;
  const cementKg = volumeM3 * mix.cement;
  return {
    volumeM3,
    weightKg: volumeM3 * CONCRETE_DENSITY_KG_M3,
    cementKg,
    cementBags: Math.ceil(cementKg / concreteSpec.cementBagKg),
    sandTons: (volumeM3 * mix.sand) / 1000,
    gravelTons: (volumeM3 * mix.gravel) / 1000,
    waterLiters: volumeM3 * (mix.cement * 0.52),
    classB: mix.classB,
    mixNote:
      'Пропорции смеси — справочные (типовой handbook). Для товарного бетона используйте заказ по марке/классу, не мешки цемента.',
  };
}
