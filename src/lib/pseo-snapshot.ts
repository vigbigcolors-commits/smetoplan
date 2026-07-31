import {
  calculateMaterials,
  formatCurrency,
  type ExtendedCalculationResult,
} from '@/lib/calculator';
import { paramsToCalculatorState } from '@/lib/meta';
import { DEFAULT_PSEO_PRICES, resolvePseoRegion } from '@/lib/pseo-region';
import type { PseoRoute, StructureType } from '@/lib/types';

const STRUCTURE_RU: Record<StructureType, { nom: string; gen: string }> = {
  slab: { nom: 'плитный фундамент', gen: 'плитного фундамента' },
  strip: { nom: 'ленточный фундамент', gen: 'ленточного фундамента' },
  beam: { nom: 'монолитная балка', gen: 'монолитной балки' },
  pier: { nom: 'свайный фундамент', gen: 'свайного фундамента' },
  wall: { nom: 'подпорная стена', gen: 'подпорной стены' },
};

export type PseoFaq = { q: string; a: string };

export type PseoSnapshot = {
  structureLabel: string;
  dimsLabel: string;
  grade: string;
  regionLabel: string | null;
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
  disclaimer: string;
  calculation: ExtendedCalculationResult;
};

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

  const calculation = calculateMaterials(
    route.structure_type,
    state.dimensions,
    concreteSpec,
    rebarSpec,
    prices,
    'metric',
    1.15,
    {
      coverMm: 40,
      soilResistanceKpa: 250,
    }
  );

  const st = STRUCTURE_RU[route.structure_type];
  const dimsLabel = `${route.params.length}×${route.params.width}×${route.params.depth} м`;
  const grade = route.params.grade;
  const hasRebar = route.params.layers > 0 && route.params.rebar_d > 0;

  const faqs: PseoFaq[] = [
    {
      q: `Сколько бетона нужно на ${st.nom} ${dimsLabel}?`,
      a: `По текущим параметрам объём бетона ≈ ${calculation.concreteVolumeM3} м³ марки ${grade}. Цифра считается по геометрии конструкции; запас на потери при укладке заложите отдельно (обычно 3–7%).`,
    },
    {
      q: hasRebar
        ? `Какая арматура заложена для ${dimsLabel}?`
        : `Есть ли арматура в этом расчёте?`,
      a: hasRebar
        ? `Каркас Ø${route.params.rebar_d} мм, шаг ${route.params.rebar_step} мм, слоёв: ${route.params.layers}. Масса ≈ ${calculation.rebarWeightKg} кг, ориентир по хлыстам: ${calculation.rebarStockBarsApprox} шт (отход ~${calculation.rebarWastePct}%).`
        : `В этой конфигурации армирование отключено (только бетон и опалубка). Включите диаметр и слои в калькуляторе, если нужен каркас.`,
    },
    {
      q: `Какая ориентировочная смета на ${st.gen} ${route.params.length}×${route.params.width} м?`,
      a: `Оценка материалов ≈ ${formatCurrency(calculation.itemizedCosts.total, 'RUB')}${
        region ? ` по ценам региона «${region.label}»` : ' по базовым ориентирам цен'
      }. Это не коммерческое КП: цены на РБУ и металл меняются.`,
    },
    region
      ? {
          q: `Учтены ли цены для ${region.genitive}?`,
          a: `Да: бетон ≈ ${prices.concretePerM3.toLocaleString('ru-RU')} ₽/м³, арматура ≈ ${prices.rebarPerTon.toLocaleString('ru-RU')} ₽/т, опалубка ≈ ${prices.formworkPerM2.toLocaleString('ru-RU')} ₽/м². Это справочные ориентиры Smetoplan, не оферта завода.`,
        }
      : {
          q: 'Можно ли посчитать со региональными ценами?',
          a: 'Да. Выберите регион в панели параметров или откройте страницу с регионом в URL — смета пересчитается по справочным ценам.',
        },
    {
      q: 'Это замена проекту КЖ / расчёту оснований?',
      a: 'Нет. Smetoplan даёт сметную оценку объёмов и ориентировочные проверки (покрытие, грунт, раскрой). Рабочая документация КЖ и основания — по СП 63 / СП 22 и изысканиям.',
    },
  ];

  return {
    structureLabel: st.nom,
    dimsLabel,
    grade,
    regionLabel: region?.label ?? null,
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
    faqs,
    disclaimer:
      'Результат — сметная оценка материалов и ориентиры по нормам. Не заменяет раздел КЖ, расчёт оснований и коммерческое предложение поставщика.',
    calculation,
  };
}
