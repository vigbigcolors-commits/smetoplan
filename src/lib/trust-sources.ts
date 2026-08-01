/** Honest attribution for estimate-grade prices and norms. */

export const PRICE_TABLE_AS_OF = '2026-08-01';

export const PRICE_SOURCE_NOTE =
  'Ориентир Smetoplan: медиана публичных котировок /ceny по региону (с запасным справочником). Не оферта завода и не коммерческое КП.';

export const NORM_SOURCES = [
  {
    code: 'СП 63.13330',
    role: 'Железобетон: ориентиры защитного слоя, μs,min, нахлёста',
  },
  {
    code: 'СП 22.13330',
    role: 'Основания: ориентир расчётного сопротивления R (не заменяет ИГИ)',
  },
  {
    code: 'ГОСТ 27751',
    role: 'Рамка ответственности: оценка ≠ проект КЖ',
  },
] as const;

export function formatPriceAsOf(isoDate = PRICE_TABLE_AS_OF): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
