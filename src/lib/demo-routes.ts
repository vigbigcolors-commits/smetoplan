import type {
  IntentCluster,
  PseoRoute,
  PseoRouteParams,
  StructureType,
} from './types';

/** Homepage demo slugs — work even if Postgres/Podman is down. */
const DEMO_ROUTES: Record<
  string,
  {
    structureType: StructureType;
    intent: IntentCluster;
    title: string;
    h1: string;
    description: string;
    params: PseoRouteParams;
  }
> = {
  'kalkulyator-plitnogo-fundamenta-12x8-m300': {
    structureType: 'slab',
    intent: 'kalkulyator',
    title: 'Калькулятор плитного фундамента 12×8 м бетон М300 — смета онлайн | Smetoplan',
    h1: 'Калькулятор плитного фундамента 12×8 м',
    description:
      'Онлайн-расчёт монолитной плиты 12×8×0.4 м: объём бетона М300, арматура Ø12, опалубка и смета в рублях по СП 63.13330.',
    params: {
      length: 12,
      width: 8,
      depth: 0.4,
      grade: 'M300',
      rebar_d: 12,
      rebar_step: 200,
      layers: 2,
      pW: 0.5,
      pH: 0.3,
    },
  },
  'raschet-lentochnogo-fundamenta-15x10-m300': {
    structureType: 'strip',
    intent: 'raschet',
    title: 'Расчёт ленточного фундамента 15×10 м М300 — смета арматуры | Smetoplan',
    h1: 'Расчёт ленточного фундамента 15×10 м',
    description:
      'Инженерный расчёт ленты с внутренним несущим: объём бетона, каркас Ø14, давление на грунт и BOM.',
    params: {
      length: 15,
      width: 10,
      depth: 1.0,
      grade: 'M300',
      rebar_d: 14,
      rebar_step: 150,
      layers: 2,
      ribbon_w: 0.4,
    },
  },
  'smeta-monolitnoj-plity-10x8-armatura-12': {
    structureType: 'slab',
    intent: 'smeta',
    title: 'Смета монолитной плиты 10×8 м арматура Ø12 — онлайн | Smetoplan',
    h1: 'Смета монолитной плиты 10×8 с арматурой Ø12',
    description:
      'Готовая ведомость материалов: бетон, цемент, песок, щебень, арматура А500С Ø12 шаг 200 мм.',
    params: {
      length: 10,
      width: 8,
      depth: 0.35,
      grade: 'M250',
      rebar_d: 12,
      rebar_step: 200,
      layers: 2,
      pW: 0.4,
      pH: 0.25,
    },
  },
  'online-kalkulyator-svajnogo-fundamenta-10x8': {
    structureType: 'pier',
    intent: 'online',
    title: 'Онлайн калькулятор свайного фундамента 10×8 — расчёт ростверка | Smetoplan',
    h1: 'Онлайн-калькулятор свайно-ростверкового фундамента 10×8',
    description:
      'Расчёт числа свай, объёма бетона и арматурных каркасов с опциональным ростверком.',
    params: {
      length: 10,
      width: 8,
      depth: 1.2,
      grade: 'M300',
      rebar_d: 12,
      rebar_step: 200,
      layers: 1,
      pier: 0.4,
      grillage_h: 0.4,
    },
  },
  'kalkulyator-podpornoj-steny-10x25-m250': {
    structureType: 'wall',
    intent: 'kalkulyator',
    title: 'Калькулятор подпорной стены 10×2.5 м бетон М250 | Smetoplan',
    h1: 'Калькулятор подпорной стены высотой 2.5 м',
    description:
      'Расчёт монолитной подпорной стены: объём, двойная сетка Ø12, опалубка двух сторон.',
    params: {
      length: 10,
      width: 0.3,
      depth: 2.5,
      grade: 'M250',
      rebar_d: 12,
      rebar_step: 150,
      layers: 2,
    },
  },
  'raschet-balki-6m-armatura-16-m350': {
    structureType: 'beam',
    intent: 'raschet',
    title: 'Расчёт монолитной балки 6 м арматура Ø16 М350 | Smetoplan',
    h1: 'Расчёт монолитной балки пролётом 6 м',
    description:
      'Объём бетона М350, продольная арматура Ø16 и хомуты с шагом 200 мм по СП 63.13330.',
    params: {
      length: 6,
      width: 0.4,
      depth: 0.6,
      grade: 'M350',
      rebar_d: 16,
      rebar_step: 150,
      layers: 3,
    },
  },
};

export function getDemoRouteBySlug(slug: string): PseoRoute | null {
  const demo = DEMO_ROUTES[slug];
  if (!demo) return null;

  return {
    id: 0,
    slug,
    structure_type: demo.structureType,
    intent_cluster: demo.intent,
    title_template: demo.title,
    h1_template: demo.h1,
    description: demo.description,
    params: demo.params,
    layout_variant: 1,
    show_rebar: true,
    show_bom: true,
    show_cad: true,
    show_ai: true,
    show_contractors: true,
    region_slug: 'moskva',
    material_sku: null,
    formula_code: null,
    is_published: true,
    publish_date: new Date().toISOString(),
  };
}

export function listDemoRoutesForHub(hub: {
  kind: 'structure' | 'region';
  structureType?: StructureType;
  slug: string;
}): Array<{ slug: string; h1: string; hint: string }> {
  return Object.entries(DEMO_ROUTES)
    .filter(([, d]) => {
      if (hub.kind === 'structure') return d.structureType === hub.structureType;
      return true;
    })
    .map(([slug, d]) => ({
      slug,
      h1: d.h1,
      hint: `${d.params.length}×${d.params.width}×${d.params.depth} м · ${d.params.grade}`,
    }));
}
