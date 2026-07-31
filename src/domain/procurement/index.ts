import type { RebarPiece } from '@/domain/rebar';
import type { FormworkBom } from '@/domain/formwork';

export interface ProcurementInput {
  concreteVolumeM3: number;
  rebarPieces: RebarPiece[];
  rebarWeightKg: number;
  bindingWireKg: number;
  stockBarsApprox: number;
  stockLengthM: number;
  diameterMm: number;
  coverMm: number;
  formwork: FormworkBom;
  contactAreaM2: number;
  planAreaM2: number;
}

export interface BuyItem {
  id: string;
  category: string;
  name: string;
  qty: number;
  unit: string;
  note: string;
}

export interface BuyTomorrowList {
  items: BuyItem[];
  generatedAtHint: string;
}

/**
 * Site buy-list from real calc numbers — what the foreman takes to the base.
 */
export function buildBuyTomorrowList(input: ProcurementInput): BuyTomorrowList {
  const items: BuyItem[] = [];

  items.push({
    id: 'concrete',
    category: 'Бетон',
    name: `Смесь под заказ (объём с запасом)`,
    qty: input.concreteVolumeM3,
    unit: 'м³',
    note: 'Согласовать марку/класс с РБУ и окном заливки',
  });

  items.push({
    id: 'rebar-stock',
    category: 'Арматура',
    name: `Хлысты Ø${input.diameterMm} L=${input.stockLengthM} м`,
    qty: input.stockBarsApprox,
    unit: 'шт',
    note: `≈ ${input.rebarWeightKg} кг по раскрою`,
  });

  for (const p of input.rebarPieces.slice(0, 8)) {
    items.push({
      id: `piece-${p.mark}`,
      category: 'Раскрой',
      name: `${p.mark}: ${p.lengthMm} мм`,
      qty: p.count,
      unit: 'шт',
      note: p.role || 'Заготовка на объекте',
    });
  }

  items.push({
    id: 'wire',
    category: 'Арматура',
    name: 'Проволока вязальная Ø1.2',
    qty: Math.max(1, Math.ceil(input.bindingWireKg)),
    unit: 'кг',
    note: 'Ориентир от массы каркаса',
  });

  const spacers = Math.max(
    20,
    Math.ceil((input.contactAreaM2 + input.planAreaM2 * 0.15) / 0.5)
  );
  items.push({
    id: 'spacers',
    category: 'Фиксаторы',
    name: `Фиксаторы защитного слоя ${input.coverMm} мм`,
    qty: spacers,
    unit: 'шт',
    note: 'Шаг ориентир ~0.5 м² / шт',
  });

  const filmM2 = Math.ceil(input.planAreaM2 * 1.15);
  items.push({
    id: 'film',
    category: 'Уход',
    name: 'Плёнка ПЭ для ухода за бетоном',
    qty: filmM2,
    unit: 'м²',
    note: '+15% на нахлёсты',
  });

  items.push({
    id: 'panels',
    category: 'Опалубка',
    name: `Щиты ${input.formwork.panelLengthM}×${input.formwork.panelHeightM} м (ориентир)`,
    qty: input.formwork.panelsApprox,
    unit: 'шт',
    note: 'Аренда или пиломатериал — см. ведомость опалубки',
  });

  items.push({
    id: 'props',
    category: 'Опалубка',
    name: 'Стойки / упоры',
    qty: input.formwork.propsApprox,
    unit: 'шт',
    note: 'Оценка под площадь боков',
  });

  const boardM = Math.max(4, Math.ceil(input.formwork.timberVolumeM3 * 40));
  items.push({
    id: 'board',
    category: 'Пиломатериал',
    name: 'Доска на маяки / подкладки',
    qty: boardM,
    unit: 'м.п.',
    note: 'Грубая оценка от объёма пиломатериала',
  });

  return {
    items,
    generatedAtHint: 'Список ориентировочный — сверяйте с раскроем и накладными',
  };
}

export function buyListToText(list: BuyTomorrowList, title: string): string {
  const lines = [
    title,
    list.generatedAtHint,
    '─'.repeat(40),
    ...list.items.map(
      (i) =>
        `[${i.category}] ${i.name}: ${i.qty} ${i.unit}${i.note ? ` — ${i.note}` : ''}`
    ),
    '─'.repeat(40),
    'Smetoplan.ru',
  ];
  return lines.join('\n');
}
