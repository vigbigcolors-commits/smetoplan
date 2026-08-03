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
    title:
      'Калькулятор плитного фундамента 12×8 м бетон М300 арматура Ø12 — Москва и МО | Smetoplan',
    h1: 'Калькулятор плитного фундамента 12×8 м — Москва и МО',
    description:
      'Онлайн-расчёт монолитной плиты 12×8×0.4 м (М300), арматура Ø12 шаг 200 мм, 2 слоя: объём бетона, опалубка и смета в Москве и МО. Справочные цены Smetoplan, не оферта РБУ.',
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
    intent: 'kalkulyator',
    title:
      'Калькулятор ленточного фундамента 15×10 м М300 арматура Ø14 — Москва и МО | Smetoplan',
    h1: 'Калькулятор ленточного фундамента 15×10 м — Москва и МО',
    description:
      'Инженерный расчёт ленты 15×10×1.0 м (М300), каркас Ø14 шаг 150 мм: объём бетона, давление на грунт и смета в Москве и МО. Справочник Smetoplan, не КП завода.',
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
    intent: 'kalkulyator',
    title:
      'Калькулятор монолитной плиты 10×8 м арматура Ø12 — Москва и МО | Smetoplan',
    h1: 'Калькулятор монолитной плиты 10×8 м — Москва и МО',
    description:
      'Готовая смета плиты 10×8×0.35 м (М250), арматура А500С Ø12 шаг 200 мм, 2 слоя: бетон, опалубка и ориентир стоимости в Москве и МО.',
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
    intent: 'kalkulyator',
    title: 'Калькулятор свайного фундамента 10×8 м — Москва и МО | Smetoplan',
    h1: 'Калькулятор свайно-ростверкового фундамента 10×8 м — Москва и МО',
    description:
      'Расчёт свайного поля 10×8×1.2 м (М300), каркасы Ø12 и ростверк: объёмы бетона и арматуры со справочными ценами Москвы и МО.',
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
    title:
      'Калькулятор подпорной стены 10×2.5 м М250 — Москва и МО | Smetoplan',
    h1: 'Калькулятор подпорной стены 10×2.5 м — Москва и МО',
    description:
      'Монолитная подпорная стена 10×0.3×2.5 м (М250), двойная сетка Ø12: объём, опалубка двух сторон и смета в Москве и МО.',
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
    intent: 'kalkulyator',
    title:
      'Калькулятор монолитной балки 6 м арматура Ø16 М350 — Москва и МО | Smetoplan',
    h1: 'Калькулятор монолитной балки 6 м — Москва и МО',
    description:
      'Балка пролётом 6 м сечением 0.4×0.6 м (М350), продольная арматура Ø16: объём бетона, хомуты и смета в Москве и МО по справочнику Smetoplan.',
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
      hint: `${d.params.length}×${d.params.width}×${d.params.depth} м · ${d.params.grade} · Москва`,
    }));
}
