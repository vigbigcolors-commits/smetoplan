import type {
  ConcreteSpec,
  DimensionState,
  RebarSpec,
  StructureType,
} from '@/lib/types';

/** Clean product URL — not PSEO dimension slugs. */
export const CALCULATOR_PATH = '/kalkulyator';

const STRUCTURE_TYPES: StructureType[] = [
  'slab',
  'strip',
  'beam',
  'pier',
  'wall',
];

export function isStructureType(value: string | undefined | null): value is StructureType {
  return !!value && (STRUCTURE_TYPES as string[]).includes(value);
}

/** `/kalkulyator` or `/kalkulyator?type=strip` */
export function calculatorHref(type?: StructureType): string {
  if (!type) return CALCULATOR_PATH;
  return `${CALCULATOR_PATH}?type=${type}`;
}

export interface StructurePreset {
  structureType: StructureType;
  dimensions: DimensionState;
  rebarSpec: RebarSpec;
  concreteSpec: ConcreteSpec;
  label: string;
  h1: string;
  description: string;
}

const DEFAULT_CONCRETE: ConcreteSpec = {
  grade: 'M300',
  cementBagKg: 50,
  customPricePerM3: 4200,
};

export function getStructurePreset(type: StructureType): StructurePreset {
  switch (type) {
    case 'slab':
      return {
        structureType: 'slab',
        label: 'Плитный фундамент',
        h1: 'Калькулятор плитного фундамента',
        description:
          'Задайте габариты плиты, марку бетона и арматуру — получите объёмы, чертёж и ориентировочную смету.',
        dimensions: {
          length: 12,
          width: 8,
          depth: 0.4,
          perimeterThickeningWidth: 0.5,
          perimeterThickeningDepth: 0.3,
        },
        concreteSpec: { ...DEFAULT_CONCRETE },
        rebarSpec: {
          diameterMm: 12,
          spacingMm: 200,
          layers: 2,
          customPricePerTon: 62000,
        },
      };
    case 'strip':
      return {
        structureType: 'strip',
        label: 'Ленточный фундамент',
        h1: 'Калькулятор ленточного фундамента',
        description:
          'Контур здания и ширина ленты: объём бетона, арматура и смета. Схему осей можно менять в панели параметров.',
        dimensions: {
          length: 12,
          width: 8,
          depth: 1.0,
          perimeterThickeningWidth: 0.4,
          perimeterThickeningDepth: 0,
        },
        concreteSpec: { ...DEFAULT_CONCRETE },
        rebarSpec: {
          diameterMm: 10,
          spacingMm: 300,
          layers: 2,
          longitudinalBars: 6,
          customPricePerTon: 62000,
        },
      };
    case 'beam':
      return {
        structureType: 'beam',
        label: 'Балка / колонна',
        h1: 'Калькулятор балки и колонны',
        description:
          'Пролёт, сечение и продольная арматура — объём бетона, масса А500С и смета.',
        dimensions: {
          length: 6,
          width: 0.4,
          depth: 0.6,
          perimeterThickeningWidth: 0,
          perimeterThickeningDepth: 0,
        },
        concreteSpec: {
          grade: 'M350',
          cementBagKg: 50,
          customPricePerM3: 4500,
        },
        rebarSpec: {
          diameterMm: 16,
          spacingMm: 200,
          layers: 2,
          longitudinalBars: 4,
          customPricePerTon: 62000,
        },
      };
    case 'pier':
      return {
        structureType: 'pier',
        label: 'Сваи и плита',
        h1: 'Калькулятор свайно-плитного фундамента',
        description:
          'Плита по плану + поле свай: объём бетона, сетка плиты, каркасы свай и смета.',
        dimensions: {
          length: 10,
          width: 10,
          depth: 3.0,
          perimeterThickeningWidth: 0.3,
          perimeterThickeningDepth: 0.3,
        },
        concreteSpec: { ...DEFAULT_CONCRETE },
        rebarSpec: {
          diameterMm: 12,
          spacingMm: 200,
          layers: 2,
          customPricePerTon: 62000,
        },
      };
    case 'wall':
      return {
        structureType: 'wall',
        label: 'Подпорная стена',
        h1: 'Калькулятор подпорной стены',
        description:
          'Длина, толщина и высота стены: опалубка двух сторон, двойная сетка и смета.',
        dimensions: {
          length: 10,
          width: 0.3,
          depth: 2.5,
          perimeterThickeningWidth: 0,
          perimeterThickeningDepth: 0,
        },
        concreteSpec: {
          grade: 'M250',
          cementBagKg: 50,
          customPricePerM3: 4000,
        },
        rebarSpec: {
          diameterMm: 12,
          spacingMm: 150,
          layers: 2,
          customPricePerTon: 62000,
        },
      };
  }
}
