import type { StructureType } from '@/lib/types';
import { PSEO_REGION_MAP } from '@/lib/pseo-region';

export type StructureHub = {
  kind: 'structure';
  slug: string;
  structureType: StructureType;
  title: string;
  h1: string;
  description: string;
  intro: string;
};

export type RegionHub = {
  kind: 'region';
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
};

export type PseoHub = StructureHub | RegionHub;

export const STRUCTURE_HUBS: StructureHub[] = [
  {
    kind: 'structure',
    slug: 'plitnyy-fundament',
    structureType: 'slab',
    title: 'Калькулятор плитного фундамента — размеры и смета | Smetoplan',
    h1: 'Калькулятор плитного фундамента',
    description:
      'Подбор размера плиты, марки бетона и арматуры: объёмы, раскрой и ориентировочная смета онлайн.',
    intro:
      'Выберите типовой размер или откройте полный калькулятор. Каждая карточка — готовый расчёт с цифрами, не пустой шаблон.',
  },
  {
    kind: 'structure',
    slug: 'lentochnyy-fundament',
    structureType: 'strip',
    title: 'Калькулятор ленточного фундамента — контур и смета | Smetoplan',
    h1: 'Калькулятор ленточного фундамента',
    description:
      'Расчёт ленты по контуру здания: бетон, арматура, давление на грунт и ведомость материалов.',
    intro:
      'Ниже — опубликованные варианты ленты разных габаритов. Схему внутренних осей можно уточнить в калькуляторе.',
  },
  {
    kind: 'structure',
    slug: 'svaynyy-fundament',
    structureType: 'pier',
    title: 'Калькулятор свайного фундамента — ростверк и объёмы | Smetoplan',
    h1: 'Калькулятор свайного фундамента',
    description:
      'Ориентир по числу свай, объёму бетона и каркасам с опциональным ростверком.',
    intro:
      'Карточки ведут на детальные расчёты. Шаг свай и ростверк настраиваются в панели параметров.',
  },
  {
    kind: 'structure',
    slug: 'monolitnaya-balka',
    structureType: 'beam',
    title: 'Калькулятор монолитной балки — пролёт и арматура | Smetoplan',
    h1: 'Калькулятор монолитной балки',
    description:
      'Объём бетона, продольная арматура и хомуты для типовых пролётов.',
    intro:
      'Выберите пролёт и сечение. Расчёт сметный — не заменяет КЖ по СП 63.',
  },
  {
    kind: 'structure',
    slug: 'podpornaya-stena',
    structureType: 'wall',
    title: 'Калькулятор подпорной стены — высота и смета | Smetoplan',
    h1: 'Калькулятор подпорной стены',
    description:
      'Монолитная стена: объём, двойная сетка, опалубка двух сторон и ориентир сметы.',
    intro:
      'Ниже варианты по длине и высоте. Условия грунта и нагрузки уточняйте отдельно.',
  },
];

export const REGION_HUBS: RegionHub[] = Object.entries(PSEO_REGION_MAP)
  .filter(([slug]) => !['moscow', 'krasnodar'].includes(slug))
  .map(([slug, meta]) => ({
    kind: 'region' as const,
    slug,
    title: `Калькулятор фундамента — цены ${meta.label} | Smetoplan`,
    h1: `Расчёт фундамента: цены ${meta.label}`,
    description: `Онлайн-смета бетона и арматуры со справочными ценами для региона «${meta.label}».`,
    intro: `Ниже — опубликованные расчёты с региональным ориентиром цен для ${meta.genitive}. Цифры справочные, не оферта РБУ.`,
  }));

const HUB_BY_SLUG: Record<string, PseoHub> = Object.fromEntries(
  [...STRUCTURE_HUBS, ...REGION_HUBS].map((h) => [h.slug, h])
);

export function getHubBySlug(slug: string): PseoHub | null {
  return HUB_BY_SLUG[slug] ?? null;
}

export function isReservedHubSlug(slug: string): boolean {
  return slug in HUB_BY_SLUG;
}

export function allHubSlugs(): string[] {
  return Object.keys(HUB_BY_SLUG);
}
