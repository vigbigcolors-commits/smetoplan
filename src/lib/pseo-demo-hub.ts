import type { PseoHub } from '@/lib/pseo-hubs';
import type { StructureType } from '@/lib/types';
import { listDemoRoutesForHub } from '@/lib/demo-routes';
import { calculatorHref } from '@/lib/calculator-routes';

export type HubLink = {
  slug?: string;
  href?: string;
  label: string;
  hint?: string;
};

/** Curated sizes so hubs are never empty before drip fills Postgres. */
const STRUCTURE_STARTERS: Record<
  StructureType,
  Array<{ label: string; hint: string; demoSlug?: string }>
> = {
  slab: [
    {
      label: 'Плита 12×8 м М300',
      hint: 'демо · готовый расчёт',
      demoSlug: 'kalkulyator-plitnogo-fundamenta-12x8-m300',
    },
    {
      label: 'Плита 10×8 м Ø12',
      hint: 'демо · смета',
      demoSlug: 'smeta-monolitnoj-plity-10x8-armatura-12',
    },
    { label: 'Плита 8×6 м', hint: 'открыть калькулятор' },
    { label: 'Плита 14×10 м', hint: 'открыть калькулятор' },
    { label: 'Плита 16×12 м', hint: 'открыть калькулятор' },
  ],
  strip: [
    {
      label: 'Лента 15×10 м М300',
      hint: 'демо · расчёт',
      demoSlug: 'raschet-lentochnogo-fundamenta-15x10-m300',
    },
    { label: 'Лента 12×8 м', hint: 'открыть калькулятор' },
    { label: 'Лента 12×10 м', hint: 'открыть калькулятор' },
    { label: 'Лента 16×12 м', hint: 'открыть калькулятор' },
  ],
  pier: [
    {
      label: 'Сваи 10×8 м',
      hint: 'демо · ростверк',
      demoSlug: 'online-kalkulyator-svajnogo-fundamenta-10x8',
    },
    { label: 'Сваи 12×8 м', hint: 'открыть калькулятор' },
    { label: 'Сваи 12×10 м', hint: 'открыть калькулятор' },
  ],
  beam: [
    {
      label: 'Балка 6 м Ø16',
      hint: 'демо · М350',
      demoSlug: 'raschet-balki-6m-armatura-16-m350',
    },
    { label: 'Балка 5 м', hint: 'открыть калькулятор' },
    { label: 'Балка 8 м', hint: 'открыть калькулятор' },
  ],
  wall: [
    {
      label: 'Стена 10×2.5 м',
      hint: 'демо · М250',
      demoSlug: 'kalkulyator-podpornoj-steny-10x25-m250',
    },
    { label: 'Стена 8×2 м', hint: 'открыть калькулятор' },
    { label: 'Стена 12×3 м', hint: 'открыть калькулятор' },
  ],
};

const REGION_STARTERS: HubLink[] = [
  {
    slug: 'kalkulyator-plitnogo-fundamenta-12x8-m300',
    label: 'Плита 12×8 — старт расчёта',
    hint: 'затем смените регион в панели',
  },
  {
    slug: 'raschet-lentochnogo-fundamenta-15x10-m300',
    label: 'Лента 15×10 — старт расчёта',
    hint: 'региональные цены в калькуляторе',
  },
  {
    href: calculatorHref('slab'),
    label: 'Калькулятор плиты',
    hint: 'задать регион вручную',
  },
  {
    href: calculatorHref('strip'),
    label: 'Калькулятор ленты',
    hint: 'задать регион вручную',
  },
];

/** Fallback hub cards when DB is empty/down — always has live links. */
export function DEMO_HUB_LINKS(hub: PseoHub): HubLink[] {
  const demos = listDemoRoutesForHub(hub).map((r) => ({
    slug: r.slug,
    label: r.h1,
    hint: r.hint,
  }));

  if (hub.kind === 'structure') {
    const starters = STRUCTURE_STARTERS[hub.structureType].map((s) =>
      s.demoSlug
        ? { slug: s.demoSlug, label: s.label, hint: s.hint }
        : {
            href: calculatorHref(hub.structureType),
            label: s.label,
            hint: s.hint,
          }
    );
    const openCalc: HubLink = {
      href: calculatorHref(hub.structureType),
      label: `Открыть полный калькулятор`,
      hint: hub.h1,
    };
    return dedupeLinks([...demos, ...starters, openCalc]);
  }

  return dedupeLinks([
    ...demos,
    ...REGION_STARTERS,
    {
      href: calculatorHref(),
      label: 'Открыть калькулятор',
      hint: hub.h1,
    },
  ]);
}

function dedupeLinks(links: HubLink[]): HubLink[] {
  const seen = new Set<string>();
  const out: HubLink[] = [];
  for (const l of links) {
    const key = l.slug || l.href || l.label;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}
