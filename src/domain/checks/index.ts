import type { StructureType } from '@/lib/types';

export type CheckStatus = 'pass' | 'warn' | 'info' | 'fail';

export interface EngineeringCheck {
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
  normHint: string;
}

export interface ChecksInput {
  structureType: StructureType;
  depthM: number;
  coverMm: number;
  diameterMm: number;
  asProvidedMm2PerM: number;
  asMinMm2PerM: number;
  soilUtilizationPct: number;
  soilStatus: 'ok' | 'warning' | 'critical';
  lapMm: number;
}

export function runEngineeringChecks(input: ChecksInput): EngineeringCheck[] {
  const checks: EngineeringCheck[] = [];

  const coverOk = input.coverMm >= 40 || (input.structureType === 'beam' && input.coverMm >= 30);
  checks.push({
    id: 'cover',
    title: 'Защитный слой бетона',
    status: coverOk ? 'pass' : 'warn',
    detail: `a = ${input.coverMm} мм (задан). Ориентир для фундаментов ≥ 40 мм.`,
    normHint: 'СП 63.13330 (ориентир)',
  });

  const lapOk = input.lapMm >= 40 * input.diameterMm;
  checks.push({
    id: 'lap',
    title: 'Нахлёст арматуры (оценка)',
    status: lapOk ? 'info' : 'warn',
    detail: `l ≈ ${input.lapMm} мм (~40Ø). Точный расчёт анкеровки — по СП 63 для класса бетона и условий.`,
    normHint: 'СП 63.13330',
  });

  if (input.structureType === 'slab' || input.structureType === 'wall') {
    const ratio = input.asMinMm2PerM > 0 ? input.asProvidedMm2PerM / input.asMinMm2PerM : 1;
    checks.push({
      id: 'asmin',
      title: 'Минимальное армирование μs,min (оценка)',
      status: ratio >= 1 ? 'pass' : 'fail',
      detail: `As,факт ≈ ${Math.round(input.asProvidedMm2PerM)} мм²/м; As,min ≈ ${Math.round(input.asMinMm2PerM)} мм²/м (μs,min·h).`,
      normHint: 'СП 63.13330 (упрощённо)',
    });
  }

  checks.push({
    id: 'soil',
    title: 'Давление на основание',
    status:
      input.soilStatus === 'ok'
        ? 'pass'
        : input.soilStatus === 'warning'
          ? 'warn'
          : 'fail',
    detail: `Использование R: ${input.soilUtilizationPct}%`,
    normHint: 'СП 22.13330 (ориентир, нужны ИГИ)',
  });

  checks.push({
    id: 'disclaimer',
    title: 'Статус документа',
    status: 'info',
    detail:
      'Результат — сметная оценка и ориентировочные проверки. Не заменяет раздел КЖ / основания проекта.',
    normHint: 'ГОСТ 27751 — только рамка ответственности',
  });

  return checks;
}
