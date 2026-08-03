import { calculateMaterials } from '@/lib/calculator';
import { getRegionalPrices } from '@/domain/markets';
import { COVER_DEFAULT_MM } from '@/domain/norms/tables';
import { calculatorHref } from '@/lib/calculator-routes';
import type { StructureType } from '@/lib/types';

export type HubBenchmarkKpi = {
  label: string;
  value: string;
  unit?: string;
};

export type HubBenchmark = {
  /** Short label under H1 */
  eyebrow: string;
  /** e.g. «Плита 10×12×0.3 м» */
  title: string;
  /** One-line answer for snipers */
  answerLine: string;
  assumptions: string[];
  kpis: HubBenchmarkKpi[];
  totalRubLabel: string;
  calcHref: string;
  calcCta: string;
  disclaimer: string;
};

function formatRub(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

function formatKg(n: number): string {
  return Math.round(n).toLocaleString('ru-RU');
}

/** Live numbers from the same engine as /kalkulyator — no hardcoded volumes. */
export function getStructureHubBenchmark(
  structureType: StructureType
): HubBenchmark | null {
  const prices = getRegionalPrices('moscow');
  const concrete = {
    grade: 'M300' as const,
    cementBagKg: 50 as const,
    customPricePerM3: prices.concretePerM3,
  };

  if (structureType === 'slab') {
    const r = calculateMaterials(
      'slab',
      {
        length: 10,
        width: 12,
        depth: 0.3,
        perimeterThickeningWidth: 0,
        perimeterThickeningDepth: 0,
      },
      concrete,
      {
        diameterMm: 12,
        spacingMm: 200,
        layers: 2,
        customPricePerTon: prices.rebarPerTon,
      },
      prices,
      'metric',
      1.15,
      { coverMm: COVER_DEFAULT_MM, stockLengthM: 11.7 }
    );
    return {
      eyebrow: 'Эталонный расчёт · Москва (справочник)',
      title: 'Плита 10×12×0,3 м',
      answerLine: `Ориентир: ${r.concreteVolumeM3} м³ бетона М300 (${r.concreteClassB}), арматура ≈ ${formatKg(r.rebarWeightKg)} кг, смета материалов ≈ ${formatRub(r.itemizedCosts.total)}.`,
      assumptions: [
        'Габариты 10×12 м, толщина 0,3 м, без рёбер жёсткости',
        'Сетка Ø12, шаг 200 мм, 2 слоя, запас объёма 15%',
        'Хлыст 11,7 м; цены — справочник региона «Москва и МО»',
      ],
      kpis: [
        { label: 'Бетон', value: String(r.concreteVolumeM3), unit: 'м³' },
        { label: 'Арматура', value: formatKg(r.rebarWeightKg), unit: 'кг' },
        { label: 'Опалубка', value: String(r.formworkAreaM2), unit: 'м²' },
        {
          label: 'Хлыстов ≈',
          value: String(r.rebarStockBarsApprox),
          unit: 'шт',
        },
      ],
      totalRubLabel: formatRub(r.itemizedCosts.total),
      calcHref: calculatorHref('slab'),
      calcCta: 'Открыть плиту в калькуляторе',
      disclaimer:
        'Ориентир ±15–25%, не КП РБУ и не раздел КЖ. Подставьте свои размеры — цифры пересчитаются тем же движком.',
    };
  }

  if (structureType === 'strip') {
    const r = calculateMaterials(
      'strip',
      {
        length: 10,
        width: 12,
        depth: 1.0,
        perimeterThickeningWidth: 0.4,
        perimeterThickeningDepth: 0,
      },
      concrete,
      {
        diameterMm: 12,
        spacingMm: 300,
        layers: 2,
        longitudinalBars: 6,
        customPricePerTon: prices.rebarPerTon,
      },
      prices,
      'metric',
      1.15,
      {
        coverMm: COVER_DEFAULT_MM,
        stockLengthM: 11.7,
        stripLayout: 'perimeter',
      }
    );
    return {
      eyebrow: 'Эталонный расчёт · Москва (справочник)',
      title: 'Лента 10×12 м · ширина 0,4 м · H=1,0 м',
      answerLine: `Ориентир по контуру: ${r.concreteVolumeM3} м³ бетона М300 (${r.concreteClassB}), арматура ≈ ${formatKg(r.rebarWeightKg)} кг, длина оси ≈ ${r.stripLengthM} м, смета ≈ ${formatRub(r.itemizedCosts.total)}.`,
      assumptions: [
        'Прямоугольный контур 10×12 м без внутренних осей',
        'Ширина ленты 0,4 м, высота 1,0 м, запас объёма 15%',
        'Каркас: 6Ø12 продольных + хомуты; цены Москва и МО',
      ],
      kpis: [
        { label: 'Бетон', value: String(r.concreteVolumeM3), unit: 'м³' },
        { label: 'Арматура', value: formatKg(r.rebarWeightKg), unit: 'кг' },
        { label: 'Ось ленты', value: String(r.stripLengthM), unit: 'м' },
        { label: 'Опалубка', value: String(r.formworkAreaM2), unit: 'м²' },
      ],
      totalRubLabel: formatRub(r.itemizedCosts.total),
      calcHref: calculatorHref('strip'),
      calcCta: 'Открыть ленту в калькуляторе',
      disclaimer:
        'Без внутренних несущих объём меньше реального дома. Добавьте оси в калькуляторе. Не заменяет проект КЖ и ИГИ.',
    };
  }

  return null;
}
