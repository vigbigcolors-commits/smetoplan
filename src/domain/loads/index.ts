import { SNOW_REGIONS } from '@/domain/norms/tables';

export type SnowRegionId = keyof typeof SNOW_REGIONS;

export interface LoadInput {
  /** Building plan area L×W, m² — for dead/live/snow */
  planAreaM2: number;
  /** Foundation contact area, m² — documented but not used for load×area */
  contactAreaM2: number;
  /** Dead load from structure above foundation, kPa (кН/м²) on plan */
  buildingDeadLoadKpa: number;
  /** Live / useful load, kPa on plan */
  liveLoadKpa: number;
  snowRegion: SnowRegionId;
  /** Include snow on roof projected to plan area */
  applySnow: boolean;
  /** Self-weight of foundation concrete+rebar already in forceKnFoundation */
  foundationForceKn: number;
}

export interface LoadResult {
  buildingForceKn: number;
  snowForceKn: number;
  liveForceKn: number;
  foundationForceKn: number;
  totalForceKn: number;
  planAreaM2: number;
  notes: string[];
}

export function computeLoads(input: LoadInput): LoadResult {
  const plan = Math.max(0.2, input.planAreaM2);
  const snow = SNOW_REGIONS[input.snowRegion] ?? SNOW_REGIONS.III;
  const buildingForceKn = input.buildingDeadLoadKpa * plan;
  const liveForceKn = input.liveLoadKpa * plan;
  const snowForceKn = input.applySnow ? snow.sgKpa * plan : 0;
  const notes = [
    `Площадь плана здания: ${plan.toFixed(2)} м² (нагрузки G/Q/S)`,
    `Постоянная нагрузка здания: ${input.buildingDeadLoadKpa} кПа → ${buildingForceKn.toFixed(1)} кН`,
    `Полезная: ${input.liveLoadKpa} кПа → ${liveForceKn.toFixed(1)} кН`,
    input.applySnow
      ? `Снег регион ${input.snowRegion} (${snow.label}): ${snow.sgKpa} кПа → ${snowForceKn.toFixed(1)} кН`
      : 'Снег не учтён',
    `Собственный вес фундамента: ${input.foundationForceKn.toFixed(1)} кН`,
  ];

  return {
    buildingForceKn,
    snowForceKn,
    liveForceKn,
    foundationForceKn: input.foundationForceKn,
    totalForceKn:
      input.foundationForceKn + buildingForceKn + liveForceKn + snowForceKn,
    planAreaM2: plan,
    notes,
  };
}
