export type AcceptanceStatus = 'ok' | 'watch' | 'reject_hint';

export interface AcceptanceInput {
  /** Declared class/grade on waybill, e.g. B25 / M300 */
  declaredGrade: string;
  /** Expected from calc */
  expectedGrade: string;
  slumpCm: number;
  mixTempC: number;
  travelMinutes: number;
  airTempC: number;
  hasAdmixtureNote: boolean;
  /** From pour schedule workability, hours */
  workabilityHours: number;
}

export interface AcceptanceCheck {
  id: string;
  title: string;
  status: AcceptanceStatus;
  detail: string;
}

export interface AcceptanceResult {
  checks: AcceptanceCheck[];
  overall: AcceptanceStatus;
  summary: string;
}

function normalizeGrade(g: string): string {
  return g.replace(/\s+/g, '').toUpperCase();
}

/**
 * Waybill acceptance checklist — orientation for the foreman, not lab compliance.
 */
export function evaluateConcreteAcceptance(input: AcceptanceInput): AcceptanceResult {
  const checks: AcceptanceCheck[] = [];
  const decl = normalizeGrade(input.declaredGrade);
  const exp = normalizeGrade(input.expectedGrade);
  const gradeOk =
    decl.includes(exp) ||
    exp.includes(decl) ||
    (decl.includes('B25') && exp.includes('M300')) ||
    (decl.includes('M300') && exp.includes('B25')) ||
    (decl.includes('B22') && exp.includes('M300'));

  checks.push({
    id: 'grade',
    title: 'Марка / класс по накладной',
    status: gradeOk ? 'ok' : 'reject_hint',
    detail: gradeOk
      ? `Накладная «${input.declaredGrade}» согласуется с заказом «${input.expectedGrade}».`
      : `Расхождение: накладная «${input.declaredGrade}», в расчёте «${input.expectedGrade}». Уточните у РБУ.`,
  });

  const slumpOk = input.slumpCm >= 5 && input.slumpCm <= 16;
  checks.push({
    id: 'slump',
    title: 'Осадка конуса',
    status: slumpOk ? 'ok' : 'watch',
    detail: slumpOk
      ? `${input.slumpCm} см — в типичном рабочем диапазоне для монолита.`
      : `${input.slumpCm} см — вне 5…16 см; проверьте удобоукладываемость и добавки.`,
  });

  let mixStatus: AcceptanceStatus = 'ok';
  let mixDetail = `${input.mixTempC}°C — нормальный диапазон смеси.`;
  if (input.mixTempC < 5) {
    mixStatus = 'reject_hint';
    mixDetail = `${input.mixTempC}°C — слишком холодно для укладки без спецмер.`;
  } else if (input.mixTempC > 32) {
    mixStatus = 'watch';
    mixDetail = `${input.mixTempC}°C — высокая температура смеси; ускоренное схватывание.`;
  }
  checks.push({
    id: 'mix-temp',
    title: 'Температура смеси',
    status: mixStatus,
    detail: mixDetail,
  });

  const lifeMin = input.workabilityHours * 60;
  let travelStatus: AcceptanceStatus = 'ok';
  let travelDetail = `В пути ${input.travelMinutes} мин при живучести ~${lifeMin.toFixed(0)} мин.`;
  if (input.travelMinutes > lifeMin) {
    travelStatus = 'reject_hint';
    travelDetail = `В пути ${input.travelMinutes} мин > живучести ~${lifeMin.toFixed(0)} мин — риск потери удобоукладываемости.`;
  } else if (input.travelMinutes > lifeMin * 0.75) {
    travelStatus = 'watch';
    travelDetail = `В пути ${input.travelMinutes} мин — близко к пределу живучести (~${lifeMin.toFixed(0)} мин).`;
  }
  if (input.airTempC >= 28 && input.travelMinutes > lifeMin * 0.5) {
    travelStatus = travelStatus === 'ok' ? 'watch' : travelStatus;
    travelDetail += ' Жара ускоряет потерю живучести.';
  }
  checks.push({
    id: 'travel',
    title: 'Время в пути',
    status: travelStatus,
    detail: travelDetail,
  });

  checks.push({
    id: 'admix',
    title: 'Добавки в накладной',
    status: input.hasAdmixtureNote ? 'ok' : 'watch',
    detail: input.hasAdmixtureNote
      ? 'Отмечены добавки — сверьте тип (пластификатор / противоморозные).'
      : 'Добавки не отмечены — при жаре/морозе уточните у РБУ.',
  });

  checks.push({
    id: 'disclaimer',
    title: 'Статус',
    status: 'ok',
    detail:
      'Чек-лист приёмки на объекте. Не заменяет акты лаборатории и требования проекта.',
  });

  const worst = checks.reduce<AcceptanceStatus>((acc, c) => {
    if (c.id === 'disclaimer') return acc;
    if (c.status === 'reject_hint' || acc === 'reject_hint') return 'reject_hint';
    if (c.status === 'watch' || acc === 'watch') return 'watch';
    return acc;
  }, 'ok');

  const summary =
    worst === 'reject_hint'
      ? 'Есть критичные замечания — не начинайте укладку без решения прораба/РБУ.'
      : worst === 'watch'
        ? 'Можно принимать с контролем пунктов «внимание».'
        : 'По введённым данным замечаний нет.';

  return { checks, overall: worst, summary };
}
