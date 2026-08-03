import type { EngineeringCheck } from '@/domain/checks';
import type { RebarPiece } from '@/domain/rebar';
import type { StructureType } from '@/lib/types';

/**
 * CalcIntegrity — единый сторож рассинхрона модулей.
 * Геометрия / арматура / склад сшиваются явными инвариантами, а не «на глаз».
 */

export type IntegritySeverity = 'ok' | 'warn' | 'fail';

export interface IntegrityFinding {
  id: string;
  severity: IntegritySeverity;
  title: string;
  detail: string;
  /** Числа для тестов и UI */
  metrics?: Record<string, number>;
}

export interface IntegrityReport {
  ok: boolean;
  findings: IntegrityFinding[];
}

export interface IntegrityAuditInput {
  structureType: StructureType;
  lengthM: number;
  widthM: number;
  depthM: number;
  ribbonWidthM?: number;
  stripLengthM: number;
  concreteVolumeM3: number;
  formworkAreaM2: number;
  contactAreaM2: number;
  /** Ось, которую реально использовал модуль арматуры (должна = stripLengthM). */
  rebarAxisLengthM?: number;
  stirrupStepMm: number;
  longitudinalBarsInSection: number;
  stockLengthM: number;
  lapMm: number;
  pieces: RebarPiece[];
  rebarWeightKg: number;
  stockByDiameter: Array<{ diameterMm: number; bars: number; weightKg: number }>;
  safetyFactor: number;
}

function findPiece(pieces: RebarPiece[], mark: string): RebarPiece | undefined {
  return pieces.find((p) => p.mark === mark);
}

function approxEqual(a: number, b: number, rel = 0.02, abs = 0.05): boolean {
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b), 1e-9));
}

/**
 * Полный аудит одного расчёта. Детерминированный, без I/O.
 * Любой fail = клиент рискует переплатить за фантомный металл/бетон.
 */
export function auditCalculationIntegrity(
  input: IntegrityAuditInput
): IntegrityReport {
  const findings: IntegrityFinding[] = [];

  // 1) Склад ↔ дашборд массы
  const stockMass = input.stockByDiameter.reduce((s, r) => s + r.weightKg, 0);
  if (input.stockByDiameter.length > 0) {
    const drift = Math.abs(stockMass - input.rebarWeightKg);
    findings.push({
      id: 'stock-mass-coherent',
      severity: drift <= 1.5 ? 'ok' : 'fail',
      title: 'Склад и масса арматуры',
      detail:
        drift <= 1.5
          ? `Закупка по Ø (${stockMass.toFixed(1)} кг) = дашборд (${input.rebarWeightKg} кг).`
          : `Кассовый разрыв: склад ${stockMass.toFixed(1)} кг ≠ дашборд ${input.rebarWeightKg} кг.`,
      metrics: { stockMass, dashboardKg: input.rebarWeightKg, drift },
    });
  }

  if (input.structureType === 'strip') {
    auditStrip(input, findings);
  }

  if (input.structureType === 'beam') {
    auditBeam(input, findings);
  }

  const ok = findings.every((f) => f.severity !== 'fail');
  return { ok, findings };
}

function auditStrip(input: IntegrityAuditInput, findings: IntegrityFinding[]): void {
  const axisGeo = Math.max(0, input.stripLengthM);
  const axisRebar =
    input.rebarAxisLengthM != null && input.rebarAxisLengthM > 0
      ? input.rebarAxisLengthM
      : axisGeo;

  // 2) Арматура должна пить ту же ось, что геометрия отдала
  findings.push({
    id: 'strip-axis-contract',
    severity: approxEqual(axisGeo, axisRebar, 0.001, 0.01) ? 'ok' : 'fail',
    title: 'Контракт оси: геометрия → арматура',
    detail: approxEqual(axisGeo, axisRebar, 0.001, 0.01)
      ? `Ось ${axisGeo.toFixed(2)} м передана в каркас без искажения.`
      : `Арматура считала ${axisRebar.toFixed(2)} м при геометрии ${axisGeo.toFixed(2)} м — запрещённый fallback/двойной контур.`,
    metrics: { axisGeo, axisRebar },
  });

  const stepM = Math.max(0.1, input.stirrupStepMm / 1000);
  const stirrup = findPiece(input.pieces, 'Х1');
  const long = findPiece(input.pieces, 'А1');

  // 3) Хомуты покрывают ось, а не фантом 2×(L+W)
  if (stirrup && axisGeo > 0) {
    const coveredM = Math.max(0, (stirrup.count - 1) * stepM);
    const expectedCount = Math.max(2, Math.ceil(axisGeo / stepM) + 1);
    const ratio = coveredM / axisGeo;
    const countOk = stirrup.count === expectedCount;
    const spanOk = ratio <= 1.12 && ratio >= 0.75;
    findings.push({
      id: 'strip-stirrup-span',
      severity: countOk && spanOk ? 'ok' : 'fail',
      title: 'Хомуты ↔ ось ленты',
      detail:
        countOk && spanOk
          ? `Ось ${axisGeo.toFixed(1)} м · хомуты ${stirrup.count} шт · покрытие ${coveredM.toFixed(1)} м (шаг ${Math.round(stepM * 1000)} мм).`
          : `РАССИНХРОН хомутов: ось ${axisGeo.toFixed(1)} м, факт ${stirrup.count} шт (ожид. ${expectedCount}), покрытие ${coveredM.toFixed(1)} м.`,
      metrics: {
        axisGeo,
        coveredM,
        stirrupCount: stirrup.count,
        expectedCount,
        ratio,
      },
    });
  }

  // 4) Продольные: суммарный погонаж / N_сечения ≈ ось (с запасом на нахлёст)
  if (long && axisGeo > 0 && input.longitudinalBarsInSection > 0) {
    const totalLongM = (long.lengthMm / 1000) * long.count;
    const runM = totalLongM / input.longitudinalBarsInSection;
    // С нахлёстами runM чуть больше оси — потолок 1.35×, пол 0.9×
    const ratio = runM / axisGeo;
    const ok = ratio <= 1.4 && ratio >= 0.85;
    findings.push({
      id: 'strip-longitudinal-run',
      severity: ok ? 'ok' : 'fail',
      title: 'Продольные ↔ ось ленты',
      detail: ok
        ? `Погон на нитку ≈ ${runM.toFixed(1)} м при оси ${axisGeo.toFixed(1)} м (${long.count} стержней, ${input.longitudinalBarsInSection} в сечении).`
        : `Продольные покрывают ≈ ${runM.toFixed(1)} м нитки при оси ${axisGeo.toFixed(1)} м — похоже на удвоение контура.`,
      metrics: { axisGeo, runM, longCount: long.count, ratio },
    });
  }

  // 5) Анти-галлюцинация сплошной траншеи: бетон ≈ L×w×H, ось не должна быть 2×(L+W)
  const rawVol = input.concreteVolumeM3 / Math.max(1.001, input.safetyFactor);
  const prismVol = input.lengthM * input.widthM * input.depthM;
  const solidLike = approxEqual(rawVol, prismVol, 0.03, 0.15);
  const closedPhantom = 2 * (input.lengthM + input.widthM);
  if (solidLike && axisGeo > 0) {
    const looksPhantom = axisGeo >= closedPhantom * 0.9;
    const expectAxis = Math.max(input.lengthM, input.widthM);
    findings.push({
      id: 'strip-solid-axis',
      severity: looksPhantom
        ? 'fail'
        : approxEqual(axisGeo, expectAxis, 0.02, 0.05)
          ? 'ok'
          : 'warn',
      title: 'Сплошная лента: ось = длина траншеи',
      detail: looksPhantom
        ? `Бетон как призма ${prismVol.toFixed(2)} м³, но ось ${axisGeo.toFixed(1)} м ≈ периметр ${closedPhantom.toFixed(1)} м — фантомный контур.`
        : `Сплошной массив: ось ${axisGeo.toFixed(1)} м (ожид. ≈ ${expectAxis.toFixed(1)} м).`,
      metrics: { rawVol, prismVol, axisGeo, closedPhantom, expectAxis },
    });
  }

  // 6) Объём не нулевой при положительной оси
  if (axisGeo > 1 && input.concreteVolumeM3 < 0.05) {
    findings.push({
      id: 'strip-volume-present',
      severity: 'fail',
      title: 'Ось без бетона',
      detail: `Ось ${axisGeo.toFixed(1)} м при объёме ${input.concreteVolumeM3} м³.`,
      metrics: { axisGeo, volume: input.concreteVolumeM3 },
    });
  }
}

function auditBeam(input: IntegrityAuditInput, findings: IntegrityFinding[]): void {
  const stirrup = findPiece(input.pieces, 'Х1');
  const stepM = Math.max(0.1, input.stirrupStepMm / 1000);
  const L = input.lengthM;
  if (stirrup && L > 0) {
    const expected = Math.max(2, Math.ceil(L / stepM) + 1);
    findings.push({
      id: 'beam-stirrup-span',
      severity: stirrup.count === expected ? 'ok' : 'warn',
      title: 'Хомуты балки ↔ длина',
      detail: `L=${L.toFixed(2)} м → ожид. ${expected} хомутов, факт ${stirrup.count}.`,
      metrics: { L, expected, actual: stirrup.count },
    });
  }
}

/** Findings → панель инженерных проверок (fail/warn/pass). */
export function integrityToEngineeringChecks(
  report: IntegrityReport
): EngineeringCheck[] {
  return report.findings.map((f) => ({
    id: `integrity:${f.id}`,
    title: f.title,
    status:
      f.severity === 'ok' ? 'pass' : f.severity === 'warn' ? 'warn' : 'fail',
    detail: f.detail,
    normHint: 'Инвариант Smetoplan · CalcIntegrity',
  }));
}
