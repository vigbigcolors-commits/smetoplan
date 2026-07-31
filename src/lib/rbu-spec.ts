import type { ExtendedCalculationResult } from '@/lib/calculator';
import type { PseoSnapshot } from '@/lib/pseo-snapshot';

/** Shared .txt spec for RBU — landing CTA and QuoteModal. */
export function buildRbuSpecText(input: {
  regionLabel: string;
  concreteGrade: string;
  concreteVolumeM3: number;
  rebarWeightKg: number;
  formworkAreaM2: number;
  totalLabel: string;
  dimsLabel?: string;
  structureLabel?: string;
  rebarLines?: string[];
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    location?: string;
    deliveryDate?: string;
  };
}): string {
  const c = input.contact ?? {};
  const lines = [
    'SMETOPLAN — заявка / спецификация для РБУ',
    input.structureLabel ? `Конструкция: ${input.structureLabel}` : '',
    input.dimsLabel ? `Габариты: ${input.dimsLabel}` : '',
    `Регион: ${input.regionLabel}`,
    `Марка бетона: ${input.concreteGrade}`,
    `Объём бетона: ${input.concreteVolumeM3} м³`,
    `Арматура: ${input.rebarWeightKg} кг`,
    `Опалубка: ${input.formworkAreaM2} м²`,
    `Смета материалов ориентир: ${input.totalLabel}`,
    '',
    'Раскрой арматуры:',
    ...(input.rebarLines && input.rebarLines.length > 0
      ? input.rebarLines
      : ['(откройте калькулятор — ведомость стержней ниже на странице)']),
    '',
    c.name || c.phone || c.email
      ? `Контакт: ${c.name || '—'} | ${c.phone || '—'} | ${c.email || '—'}`
      : 'Контакт: укажите при отправке на РБУ',
    c.location ? `Адрес объекта: ${c.location}` : '',
    c.deliveryDate ? `Планируемая дата заливки: ${c.deliveryDate}` : '',
    '',
    'Файл для отправки на РБУ. Не является договором или офертой Smetoplan.',
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function snapshotToSpecText(snapshot: PseoSnapshot): string {
  const pieces = snapshot.calculation.rebarPieces || [];
  return buildRbuSpecText({
    regionLabel: snapshot.regionLabel || 'базовый ориентир',
    concreteGrade: snapshot.grade,
    concreteVolumeM3: snapshot.concreteVolumeM3,
    rebarWeightKg: snapshot.rebarWeightKg,
    formworkAreaM2: snapshot.formworkAreaM2,
    totalLabel: snapshot.totalRub,
    dimsLabel: snapshot.dimsLabel,
    structureLabel: snapshot.structureLabel,
    rebarLines: pieces.map(
      (p) =>
        `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}; m=${Math.round(p.weightKg * 10) / 10}кг`
    ),
  });
}

export function calculationToSpecText(
  calculation: ExtendedCalculationResult,
  opts: { regionLabel: string; concreteGrade: string; currencyTotal: string }
): string {
  return buildRbuSpecText({
    regionLabel: opts.regionLabel,
    concreteGrade: opts.concreteGrade,
    concreteVolumeM3: calculation.concreteVolumeM3,
    rebarWeightKg: calculation.rebarWeightKg,
    formworkAreaM2: calculation.formworkAreaM2,
    totalLabel: opts.currencyTotal,
    rebarLines: (calculation.rebarPieces || []).map(
      (p) =>
        `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}; m=${Math.round(p.weightKg * 10) / 10}кг`
    ),
  });
}

export const OPEN_QUOTE_EVENT = 'smetoplan:open-quote';
