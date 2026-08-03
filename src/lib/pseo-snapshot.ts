/**
 * PSEO SSR snapshot — ALWAYS live from calculateMaterials.
 * Never freeze volumes/rebar/formwork in DB: DB holds route params only.
 * When the calc kernel changes, every indexable leaf picks it up on next request.
 */

import {
  calculateMaterials,
  formatCurrency,
  type ExtendedCalculationResult,
} from '@/lib/calculator';
import { paramsToCalculatorState } from '@/lib/meta';
import {
  buildLongTailPack,
  type LongTailPack,
  type SeoSection,
} from '@/lib/pseo-content';
import { DEFAULT_PSEO_PRICES, resolvePseoRegion } from '@/lib/pseo-region';
import type { PseoRoute, StructureType } from '@/lib/types';

/** Bump when snapshot contract changes; leaves stay live via calculateMaterials. */
export const PSEO_CALC_BRIDGE = 'live-calculateMaterials' as const;

const STRUCTURE_RU: Record<
  StructureType,
  { nom: string; gen: string; tip: string }
> = {
  slab: {
    nom: 'плитный фундамент',
    gen: 'плитного фундамента',
    tip: 'Для плиты критичны толщина, двойная сетка и подготовка основания; запас бетона 3–7% на укладку.',
  },
  strip: {
    nom: 'ленточный фундамент',
    gen: 'ленточного фундамента',
    tip: 'Для ленты уточните ширину подошвы, глубину промерзания и схему внутренних несущих осей.',
  },
  beam: {
    nom: 'монолитная балка',
    gen: 'монолитной балки',
    tip: 'Для балки/колонны важны сечение, продольные стержни и шаг хомутов. Квадратное сечение в модели — опалубка по 4 граням (колонна/пилон).',
  },
  pier: {
    nom: 'свайный фундамент',
    gen: 'свайного фундамента',
    tip: 'Число свай и ростверк зависят от нагрузки и грунта; ориентир по шагу поля уточняйте по изысканиям.',
  },
  wall: {
    nom: 'подпорная стена',
    gen: 'подпорной стены',
    tip: 'Для стены учтите высоту, толщину, двустороннюю опалубку и давление грунта с обратной засыпкой.',
  },
};

export type PseoFaq = { q: string; a: string };

export type PseoSnapshot = {
  structureLabel: string;
  dimsLabel: string;
  grade: string;
  regionLabel: string | null;
  regionLocative: string | null;
  concreteVolumeM3: number;
  rebarWeightKg: number;
  formworkAreaM2: number;
  totalRub: string;
  concretePrice: number;
  rebarPrice: number;
  formworkPrice: number;
  soilUtilizationPct: number;
  coverMm: number;
  rebarStockBarsApprox: number;
  rebarWastePct: number;
  faqs: PseoFaq[];
  sections: SeoSection[];
  longTail: LongTailPack;
  disclaimer: string;
  calculation: ExtendedCalculationResult;
  guideNote: string;
  /** Always live engine — not a DB-cached volume. */
  calcBridge: typeof PSEO_CALC_BRIDGE;
};

function rebarFaqLine(
  route: PseoRoute,
  calculation: ExtendedCalculationResult
): string {
  const p = route.params;
  const long =
    p.long_bars === 4 || p.long_bars === 6 || p.long_bars === 8
      ? p.long_bars
      : p.layers >= 3
        ? 8
        : p.layers >= 2
          ? 6
          : 4;
  const stirrup =
    typeof p.stirrup_d === 'number' && p.stirrup_d >= 6
      ? `хомуты Ø${p.stirrup_d} мм, `
      : '';

  if (route.structure_type === 'beam' || route.structure_type === 'strip') {
    return `Каркас Ø${p.rebar_d} мм, ${long} продольных, ${stirrup}шаг хомутов ${p.rebar_step} мм. Масса ≈ ${calculation.rebarWeightKg} кг; ориентир по хлыстам 11,7 м: ${calculation.rebarStockBarsApprox} шт (отход ~${calculation.rebarWastePct}%). Защитный слой ≈ ${calculation.coverMm} мм.`;
  }

  return `Каркас Ø${p.rebar_d} мм, шаг ${p.rebar_step} мм, слоёв: ${p.layers}. Масса ≈ ${calculation.rebarWeightKg} кг; ориентир по хлыстам 11,7 м: ${calculation.rebarStockBarsApprox} шт (отход ~${calculation.rebarWastePct}%). Защитный слой ≈ ${calculation.coverMm} мм.`;
}

export function buildPseoSnapshot(route: PseoRoute): PseoSnapshot {
  const state = paramsToCalculatorState(route.params);
  const region = resolvePseoRegion(route.region_slug);
  const prices = region?.prices ?? DEFAULT_PSEO_PRICES;

  const concreteSpec = {
    ...state.concreteSpec,
    customPricePerM3: prices.concretePerM3,
  };
  const rebarSpec = {
    ...state.rebarSpec,
    customPricePerTon: prices.rebarPerTon,
  };

  // Live kernel only — same path as /kalkulyator. No frozen DB volumes.
  const calculation = calculateMaterials(
    route.structure_type,
    state.dimensions,
    concreteSpec,
    rebarSpec,
    prices,
    'metric',
    1.15,
    {
      coverMm: state.coverMm,
      soilResistanceKpa: 250,
      stockLengthM: 11.7,
    }
  );

  const st = STRUCTURE_RU[route.structure_type];
  const dimsLabel = `${route.params.length}×${route.params.width}×${route.params.depth} м`;
  const grade = route.params.grade;
  const hasRebar = route.params.layers > 0 && route.params.rebar_d > 0;
  const regionLabel = region?.label ?? null;
  const regionLocative = region?.locative ?? null;
  const regionBit = regionLabel ? `региона «${regionLabel}»` : 'базового ориентира';

  const baseFaqs: PseoFaq[] = [
    {
      q: `Сколько бетона нужно на ${st.nom} ${dimsLabel}?`,
      a: `По геометрии этой страницы объём бетона ≈ ${calculation.concreteVolumeM3} м³ марки ${grade}. ${st.tip} Запас на потери при укладке заложите отдельно (обычно 3–7%).`,
    },
    {
      q: hasRebar
        ? `Какая арматура заложена для ${dimsLabel}?`
        : `Есть ли арматура в этом расчёте?`,
      a: hasRebar
        ? rebarFaqLine(route, calculation)
        : `В этой конфигурации армирование отключено (только бетон и опалубка). Для несущих конструкций включите диаметр и слои в калькуляторе.`,
    },
    {
      q: `Какая ориентировочная смета на ${st.gen} ${route.params.length}×${route.params.width} м?`,
      a: `Оценка материалов ≈ ${formatCurrency(calculation.itemizedCosts.total, 'RUB')} по ценам ${regionBit}: бетон ${prices.concretePerM3.toLocaleString('ru-RU')} ₽/м³, арматура ${prices.rebarPerTon.toLocaleString('ru-RU')} ₽/т, опалубка ${prices.formworkPerM2.toLocaleString('ru-RU')} ₽/м². Это не коммерческое КП РБУ.`,
    },
    region
      ? {
          q: `Почему цены именно для ${region.genitive}?`,
          a: `Страница привязана к справочнику Smetoplan для «${region.label}». Цифры — среднерыночный ориентир, не прайс конкретного завода. Актуальную отгрузку сверяйте на /ceny и у поставщика.`,
        }
      : {
          q: 'Можно ли посчитать с региональными ценами?',
          a: 'Да. Откройте расчёт с регионом в URL или выберите регион в панели — смета пересчитается по справочным ценам Smetoplan.',
        },
    {
      q: `Какая площадь опалубки и нагрузка на грунт для ${dimsLabel}?`,
      a: `Опалубка ≈ ${calculation.formworkAreaM2} м². Ориентир использования несущей способности грунта ≈ ${calculation.soilUtilizationPct}% при принятом сопротивлении в модели. Это проверка порядка величины, не расчёт оснований по СП 22.`,
    },
    {
      q: 'Это замена проекту КЖ / расчёту оснований?',
      a: 'Нет. Smetoplan даёт сметную оценку объёмов и ориентировочные проверки (покрытие, грунт, раскрой). Рабочая документация КЖ и основания — по СП 63.13330 / СП 22.13330 и данным изысканий.',
    },
  ];

  const partial: PseoSnapshot = {
    structureLabel: st.nom,
    dimsLabel,
    grade,
    regionLabel,
    regionLocative,
    concreteVolumeM3: calculation.concreteVolumeM3,
    rebarWeightKg: calculation.rebarWeightKg,
    formworkAreaM2: calculation.formworkAreaM2,
    totalRub: formatCurrency(calculation.itemizedCosts.total, 'RUB'),
    concretePrice: prices.concretePerM3,
    rebarPrice: prices.rebarPerTon,
    formworkPrice: prices.formworkPerM2,
    soilUtilizationPct: calculation.soilUtilizationPct,
    coverMm: calculation.coverMm,
    rebarStockBarsApprox: calculation.rebarStockBarsApprox,
    rebarWastePct: calculation.rebarWastePct,
    faqs: baseFaqs,
    sections: [],
    longTail: { sections: [], extraFaqs: [], breadcrumbsLabel: '' },
    disclaimer: region
      ? `Результат — сметная оценка для «${region.label}» (живой расчёт ядра калькулятора). Не заменяет раздел КЖ, расчёт оснований и коммерческое предложение поставщика.`
      : 'Результат — сметная оценка материалов и ориентиры по нормам (живой расчёт ядра калькулятора). Не заменяет раздел КЖ, расчёт оснований и коммерческое предложение поставщика.',
    calculation,
    guideNote: st.tip,
    calcBridge: PSEO_CALC_BRIDGE,
  };

  const longTail = buildLongTailPack({
    structureType: route.structure_type,
    params: route.params,
    regionLabel,
    regionLocative,
    snapshot: partial,
  });

  return {
    ...partial,
    faqs: [...baseFaqs, ...longTail.extraFaqs],
    sections: longTail.sections,
    longTail,
  };
}
