import type {
  ConcreteSpec,
  IntentCluster,
  PseoRouteParams,
  StructureType,
} from './types';

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
  const region = input.regionSlug
    ? ` — ${input.regionSlug.replace(/-/g, ' ')}`
    : '';

  const rebarPart =
    input.params.layers > 0 && input.params.rebar_d > 0
      ? `, арматура Ø${input.params.rebar_d}`
      : ' без армирования';

  const title =
    input.titleOverride ??
    `${verb} ${structure} ${dims} м бетон ${grade}${rebarPart}${region} | Smetoplan`;

  const h1 =
    input.h1Override ??
    `${verb} ${structure} ${dims} м`;

  const description =
    input.descriptionOverride ??
    `${verb} ${structure} ${dims}×${input.params.depth} м (${grade}): объём бетона,${
      input.params.layers > 0 ? ` арматура Ø${input.params.rebar_d},` : ''
    } опалубка и смета в рублях. Чертёж и BOM онлайн по СП 63.13330.`;

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
  rebarSpec: {
    diameterMm: number;
    spacingMm: number;
    layers: 1 | 2 | 3;
    customPricePerTon: number;
  };
} {
  const rawLayers = params.layers > 0 ? params.layers : 1;
  const layers = Math.min(3, Math.max(1, rawLayers)) as 1 | 2 | 3;
  const diameterMm = params.rebar_d > 0 ? params.rebar_d : 12;
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
      customPricePerTon: 0,
    },
  };
}
