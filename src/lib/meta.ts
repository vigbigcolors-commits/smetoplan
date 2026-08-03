import type {
  ConcreteSpec,
  IntentCluster,
  PseoRouteParams,
  RebarSpec,
  StructureType,
} from './types';
import { resolvePseoRegion } from '@/lib/pseo-region';

function layersToLongBars(layers: 1 | 2 | 3): 4 | 6 | 8 {
  if (layers >= 3) return 8;
  if (layers >= 2) return 6;
  return 4;
}

const INTENT_VERBS: Record<IntentCluster, string[]> = {
  kalkulyator: ['Калькулятор', 'Онлайн-калькулятор', 'Интерактивный расчёт'],
  raschet: ['Расчёт', 'Инженерный расчёт', 'Технический расчёт'],
  smeta: ['Смета', 'Ведомость материалов', 'Сметный расчёт'],
  online: ['Онлайн-расчёт', 'Расчёт онлайн', 'Быстрый онлайн-расчёт'],
};

const STRUCTURE_LABELS: Record<StructureType, string[]> = {
  slab: ['плитного фундамента', 'монолитной плиты', 'фундаментной плиты'],
  strip: ['ленточного фундамента', 'монолитной ленты', 'ленты фундамента'],
  beam: ['монолитной балки', 'балки / колонны', 'несущих балок'],
  pier: ['свайного фундамента', 'свайно-ростверкового фундамента', 'свайного поля'],
  wall: ['подпорной стены', 'цокольной стены', 'монолитной стены'],
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length];
}

export function buildMetaFromRoute(input: {
  slug: string;
  structureType: StructureType;
  intent: IntentCluster;
  params: PseoRouteParams;
  regionSlug?: string | null;
  titleOverride?: string;
  h1Override?: string;
  descriptionOverride?: string;
}): { title: string; h1: string; description: string } {
  if (input.titleOverride && input.h1Override && input.descriptionOverride) {
    return {
      title: input.titleOverride,
      h1: input.h1Override,
      description: input.descriptionOverride,
    };
  }

  const seed = hashSeed(input.slug);
  const verb = pick(INTENT_VERBS[input.intent], seed, 3);
  const structure = pick(STRUCTURE_LABELS[input.structureType], seed, 7);
  const dims = `${input.params.length}×${input.params.width}`;
  const grade = input.params.grade;
  const regionMeta = resolvePseoRegion(input.regionSlug);
  const regionTitle = regionMeta ? ` — ${regionMeta.label}` : '';
  const regionLoc = regionMeta ? regionMeta.locative : 'по справочнику Smetoplan';

  const rebarPart =
    input.params.layers > 0 && input.params.rebar_d > 0
      ? `, арматура Ø${input.params.rebar_d}`
      : ' без армирования';

  const title =
    input.titleOverride ??
    `${verb} ${structure} ${dims} м бетон ${grade}${rebarPart}${regionTitle} | Smetoplan`;

  const h1 =
    input.h1Override ??
    `${verb} ${structure} ${dims} м${regionTitle}`;

  const description =
    input.descriptionOverride ??
    `${verb} ${structure} ${dims}×${input.params.depth} м (${grade}): объём бетона,${
      input.params.layers > 0 ? ` арматура Ø${input.params.rebar_d},` : ''
    } опалубка и смета ${regionLoc}. Справочные цены, не оферта РБУ.`;

  return { title, h1, description };
}

export function paramsToCalculatorState(params: PseoRouteParams): {
  dimensions: {
    length: number;
    width: number;
    depth: number;
    perimeterThickeningWidth: number;
    perimeterThickeningDepth: number;
  };
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  coverMm: number;
} {
  const rawLayers = params.layers > 0 ? params.layers : 1;
  const layers = Math.min(3, Math.max(1, rawLayers)) as 1 | 2 | 3;
  const diameterMm = params.rebar_d > 0 ? params.rebar_d : 12;
  const longBars =
    params.long_bars === 4 || params.long_bars === 6 || params.long_bars === 8
      ? params.long_bars
      : layersToLongBars(layers);
  const stirrup =
    typeof params.stirrup_d === 'number' &&
    Number.isFinite(params.stirrup_d) &&
    params.stirrup_d >= 6 &&
    params.stirrup_d <= 16
      ? Math.round(params.stirrup_d)
      : undefined;
  const coverMm =
    typeof params.cover_mm === 'number' &&
    Number.isFinite(params.cover_mm) &&
    params.cover_mm >= 20 &&
    params.cover_mm <= 80
      ? params.cover_mm
      : 40;

  return {
    dimensions: {
      length: params.length,
      width: params.width,
      depth: params.depth,
      perimeterThickeningWidth: params.pW ?? params.ribbon_w ?? params.pier ?? 0,
      perimeterThickeningDepth: params.pH ?? params.grillage_h ?? 0,
    },
    concreteSpec: {
      grade: params.grade,
      cementBagKg: 50,
      customPricePerM3: 0,
    },
    rebarSpec: {
      diameterMm,
      spacingMm: params.rebar_step || 200,
      layers,
      longitudinalBars: longBars,
      ...(stirrup != null ? { stirrupDiameterMm: stirrup } : {}),
      customPricePerTon: 0,
    },
    coverMm,
  };
}
