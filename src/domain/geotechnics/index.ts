import { DEFAULT_SOIL_RESISTANCE_KPA } from '@/domain/norms/tables';

export interface GeotechInput {
  totalForceKn: number;
  contactAreaM2: number;
  /** Design soil resistance R, kPa */
  soilResistanceKpa: number;
}

export interface GeotechResult {
  soilPressureKpa: number;
  soilResistanceKpa: number;
  utilizationPct: number;
  status: 'ok' | 'warning' | 'critical';
  notes: string[];
}

export function computeSoilPressure(input: GeotechInput): GeotechResult {
  const area = Math.max(0.2, input.contactAreaM2);
  const R = input.soilResistanceKpa > 0 ? input.soilResistanceKpa : DEFAULT_SOIL_RESISTANCE_KPA;
  const soilPressureKpa = input.totalForceKn / area;
  const utilizationPct = Math.round((soilPressureKpa / R) * 1000) / 10;
  let status: GeotechResult['status'] = 'ok';
  if (utilizationPct >= 100) status = 'critical';
  else if (utilizationPct >= 70) status = 'warning';

  return {
    soilPressureKpa: Math.round(soilPressureKpa * 10) / 10,
    soilResistanceKpa: R,
    utilizationPct,
    status,
    notes: [
      `σ = N / A = ${input.totalForceKn.toFixed(1)} кН / ${area.toFixed(2)} м²`,
      `R (задано) = ${R} кПа — справочно, не замена инженерно-геологических изысканий`,
      status === 'ok'
        ? 'σ < 0.7·R — запас по ориентиру'
        : status === 'warning'
          ? 'σ ≥ 0.7·R — требуется проверка геотехником'
          : 'σ ≥ R — критично, не используйте как основание решения',
    ],
  };
}
