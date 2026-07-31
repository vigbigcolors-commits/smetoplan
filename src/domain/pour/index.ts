export interface PourScheduleInput {
  concreteVolumeM3: number;
  /** Mixer payload, m³ */
  mixerVolumeM3: number;
  /** Placement rate, m³/h (pump or chute) */
  placeRateM3PerHour: number;
  /** Mixture workable life, hours */
  workabilityHours: number;
  airTempC: number;
  /** Optional: number of pour catches (захватки); 0 = auto */
  catchCount?: number;
}

export type PourRisk = 'ok' | 'watch' | 'high';

export interface PourScheduleResult {
  trips: number;
  pourHours: number;
  catchCount: number;
  volumePerCatchM3: number;
  hoursPerCatch: number;
  coldJointRisk: PourRisk;
  workabilityNote: string;
  startWindowHint: string;
  notes: string[];
}

function riskFromHours(
  hoursPerCatch: number,
  workabilityHours: number,
  airTempC: number
): PourRisk {
  let life = workabilityHours;
  if (airTempC >= 28) life *= 0.7;
  else if (airTempC >= 22) life *= 0.85;
  else if (airTempC <= 5) life *= 0.9;
  if (hoursPerCatch > life * 1.05) return 'high';
  if (hoursPerCatch > life * 0.75) return 'watch';
  return 'ok';
}

/**
 * Pour / RBU tempo map from volume — foreman planning, not a lab certificate.
 */
export function computePourSchedule(input: PourScheduleInput): PourScheduleResult {
  const V = Math.max(0.1, input.concreteVolumeM3);
  const mixer = Math.max(1, input.mixerVolumeM3);
  const rate = Math.max(1, input.placeRateM3PerHour);
  const life = Math.max(0.5, input.workabilityHours);
  const trips = Math.ceil(V / mixer);
  const pourHours = Math.round((V / rate) * 10) / 10;

  let catchCount = input.catchCount && input.catchCount > 0
    ? Math.round(input.catchCount)
    : Math.max(1, Math.ceil(pourHours / Math.max(0.5, life * 0.8)));
  catchCount = Math.min(catchCount, Math.max(1, trips));

  const volumePerCatchM3 = Math.round((V / catchCount) * 100) / 100;
  const hoursPerCatch = Math.round((volumePerCatchM3 / rate) * 10) / 10;
  const coldJointRisk = riskFromHours(hoursPerCatch, life, input.airTempC);

  const notes: string[] = [
    `${trips} рейсов миксера по ${mixer} м³ (округление вверх).`,
    `Темп укладки ${rate} м³/ч → ~${pourHours} ч чистого времени.`,
  ];
  if (input.airTempC >= 28) {
    notes.push('Жара ≥28°C: живучесть смеси сокращена в оценке риска шва.');
  }
  if (coldJointRisk === 'high') {
    notes.push('Риск холодного шва высокий — уменьшите захватку или ускорьте подачу.');
  } else if (coldJointRisk === 'watch') {
    notes.push('Контролируйте стык захваток: время близко к живучести смеси.');
  }

  const startWindowHint =
    coldJointRisk === 'high'
      ? 'Старт только при подтверждённом графике миксеров и насоса'
      : input.airTempC >= 25
        ? 'Предпочтительно утро / вечер; укрытие и полив после схватывания'
        : 'Обычное дневное окно при стабильной подаче РБУ';

  const workabilityNote = `Живучесть ориентир ${life} ч (ввод). При высокой t° фактическая короче.`;

  return {
    trips,
    pourHours,
    catchCount,
    volumePerCatchM3,
    hoursPerCatch,
    coldJointRisk,
    workabilityNote,
    startWindowHint,
    notes,
  };
}
