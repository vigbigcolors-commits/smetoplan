import { PRICE_REGIONS, type PriceRegionId } from '@/domain/norms/tables';

export interface CenyRegionMeta {
  slug: string;
  regionId: PriceRegionId;
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  seoBody: string;
}

/** SEO path slug → internal PriceRegionId */
export const CENY_REGIONS: CenyRegionMeta[] = [
  {
    slug: 'moskva',
    regionId: 'moscow',
    label: PRICE_REGIONS.moscow.label,
    h1: 'Цены на бетон и арматуру в Москве и МО',
    title: 'Цены на бетон и арматуру в Москве — сравнение РБУ и магазинов | Smetoplan',
    description:
      'Сравните котировки РБУ и металлобаз Москвы и МО по вашему объёму. Ориентир Smetoplan и контакты поставщиков.',
    intro:
      'Ориентир сметы — таблица Smetoplan. Ниже котировки из ежедневного фида: РБУ, магазины и опт. Без фейковых рейтингов.',
    seoBody:
      'В Москве и Московской области стоимость товарного бетона и арматуры заметно зависит от удалённости РБУ, марки и доставки. Smetoplan показывает региональный ориентир для сметы и отдельный слой сравнения поставщиков по вашему объёму из калькулятора. Актуальный прайс и условия отгрузки всегда уточняйте у выбранного завода.',
  },
  {
    slug: 'sankt-peterburg',
    regionId: 'spb',
    label: PRICE_REGIONS.spb.label,
    h1: 'Цены на бетон и арматуру в Санкт-Петербурге и ЛО',
    title: 'Цены на бетон и арматуру в СПб — сравнение поставщиков | Smetoplan',
    description:
      'Котировки бетона и арматуры в Санкт-Петербурге и Ленинградской области. Сравнение по объёму расчёта.',
    intro:
      'Сравните РБУ и базы СПб/ЛО с ориентиром Smetoplan. Смета в калькуляторе не подменяется котировками.',
    seoBody:
      'В Санкт-Петербурге и Ленинградской области цены на бетон и прокат зависят от логистики и сезона. Используйте калькулятор Smetoplan для объёмов, затем сравните котировки поставщиков региона и отправьте спецификацию напрямую.',
  },
  {
    slug: 'krasnodar',
    regionId: 'krasnodar',
    label: PRICE_REGIONS.krasnodar.label,
    h1: 'Цены на бетон и арматуру в Краснодарском крае',
    title: 'Цены на бетон и арматуру в Краснодаре — поставщики | Smetoplan',
    description:
      'Ориентир и котировки бетона/арматуры по Краснодарскому краю. Сравнение РБУ и магазинов.',
    intro:
      'Южный регион: сравните поставщиков с ориентиром Smetoplan и напишите по объёму из расчёта.',
    seoBody:
      'В Краснодарском крае стоимость материалов часто ниже столичных ориентиров, но доставка и доступность марки имеют значение. Smetoplan даёт справочный прайс региона и слой сравнения реальных котировок из фида.',
  },
  {
    slug: 'ekaterinburg',
    regionId: 'ekaterinburg',
    label: PRICE_REGIONS.ekaterinburg.label,
    h1: 'Цены на бетон и арматуру в Екатеринбурге / Урал',
    title: 'Цены на бетон и арматуру на Урале — сравнение | Smetoplan',
    description:
      'Бетон и арматура в Екатеринбурге и на Урале: ориентир Smetoplan и сравнение поставщиков.',
    intro:
      'Сравните котировки уральских РБУ и баз с региональным ориентиром сметы.',
    seoBody:
      'На Урале прайс на бетон и арматуру зависит от локальных РБУ и металлобаз. Страница помогает сопоставить итог по вашему объёму с ориентиром Smetoplan и связаться с поставщиком.',
  },
  {
    slug: 'novosibirsk',
    regionId: 'novosibirsk',
    label: PRICE_REGIONS.novosibirsk.label,
    h1: 'Цены на бетон и арматуру в Новосибирске / Сибирь',
    title: 'Цены на бетон и арматуру в Новосибирске — поставщики | Smetoplan',
    description:
      'Котировки и ориентир по бетону и арматуре в Новосибирске. Сравнение поставщиков по объёму.',
    intro:
      'Сибирский регион: ориентир сметы и сравнение котировок из фида без подмены цифр калькулятора.',
    seoBody:
      'В Новосибирске и Сибири логистика сильнее влияет на итоговую цену поставки. Smetoplan считает объёмы в калькуляторе и показывает сравнение котировок рядом — для быстрой заявки на РБУ или базу.',
  },
];

const bySlug = new Map(CENY_REGIONS.map((r) => [r.slug, r]));
const byRegionId = new Map(CENY_REGIONS.map((r) => [r.regionId, r]));

export function getCenyRegionBySlug(slug: string): CenyRegionMeta | undefined {
  return bySlug.get(slug);
}

export function getCenyRegionById(regionId: PriceRegionId): CenyRegionMeta {
  return byRegionId.get(regionId) ?? CENY_REGIONS[0]!;
}

export function allCenySlugs(): string[] {
  return CENY_REGIONS.map((r) => r.slug);
}

export function cenyHref(
  regionIdOrSlug: PriceRegionId | string,
  volume?: { vol?: number; rebar?: number; form?: number },
): string {
  const meta =
    bySlug.get(regionIdOrSlug) ??
    byRegionId.get(regionIdOrSlug as PriceRegionId) ??
    CENY_REGIONS[0]!;
  const q = new URLSearchParams();
  if (volume?.vol != null && volume.vol > 0) q.set('vol', String(volume.vol));
  if (volume?.rebar != null && volume.rebar > 0) q.set('rebar', String(volume.rebar));
  if (volume?.form != null && volume.form > 0) q.set('form', String(volume.form));
  const qs = q.toString();
  return qs ? `/ceny/${meta.slug}?${qs}` : `/ceny/${meta.slug}`;
}

/** Map legacy ?region=moscow → SEO slug */
export function legacyRegionParamToSlug(region?: string | null): string | null {
  if (!region) return null;
  if (bySlug.has(region)) return region;
  const meta = byRegionId.get(region as PriceRegionId);
  return meta?.slug ?? null;
}
