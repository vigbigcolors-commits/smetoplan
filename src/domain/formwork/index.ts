import type { StructureType } from '@/lib/types';

export interface FormworkInput {
  structureType: StructureType;
  formworkAreaM2: number;
  depthM: number;
  stripLengthM: number;
  /** Panel size, m */
  panelLengthM?: number;
  panelHeightM?: number;
  formworkPricePerM2: number;
  timberPricePerM3?: number;
}

export interface FormworkBom {
  sideAreaM2: number;
  panelLengthM: number;
  panelHeightM: number;
  panelsApprox: number;
  propsApprox: number;
  walersApprox: number;
  timberVolumeM3: number;
  rentCostApprox: number;
  buyTimberCostApprox: number;
  notes: string[];
}

/**
 * Parametric formwork estimate from already-computed side area.
 * Panels default 1.5×3 m (common inventory size), not a brand claim.
 */
export function computeFormworkBom(input: FormworkInput): FormworkBom {
  const panelLengthM = input.panelLengthM ?? 1.5;
  const panelHeightM = input.panelHeightM ?? 3.0;
  const panelArea = panelLengthM * Math.min(panelHeightM, Math.max(0.3, input.depthM + 0.15));
  const sideAreaM2 = Math.max(0, input.formworkAreaM2);
  const panelsApprox = Math.max(1, Math.ceil((sideAreaM2 / Math.max(0.1, panelArea)) * 1.08));
  const propsApprox =
    input.structureType === 'slab'
      ? Math.max(0, Math.ceil(sideAreaM2 / 3.5))
      : Math.max(4, Math.ceil(panelsApprox * 1.2));
  const walersApprox = Math.max(2, Math.ceil(panelsApprox * 0.5));
  const timberVolumeM3 = Math.round(sideAreaM2 * 0.025 * 1.15 * 100) / 100;
  const rentCostApprox = Math.round(sideAreaM2 * input.formworkPricePerM2);
  const timberPrice = input.timberPricePerM3 ?? 18000;
  const buyTimberCostApprox = Math.round(timberVolumeM3 * timberPrice);
  const notes: string[] = [
    `Щиты ориентир ${panelLengthM}×${Math.min(panelHeightM, input.depthM + 0.15).toFixed(2)} м (+8% запас).`,
    'Не заменяет проект опалубки; стойки/ригели — оценка для закупки.',
  ];
  if (input.stripLengthM > 0) {
    notes.push(`Осевая длина ленты ${input.stripLengthM.toFixed(1)} м → боковая опалубка 2 стороны.`);
  }
  return {
    sideAreaM2: Math.round(sideAreaM2 * 10) / 10,
    panelLengthM,
    panelHeightM,
    panelsApprox,
    propsApprox,
    walersApprox,
    timberVolumeM3,
    rentCostApprox,
    buyTimberCostApprox,
    notes,
  };
}
