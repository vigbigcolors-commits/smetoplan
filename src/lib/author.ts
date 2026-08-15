import { getSiteUrl } from '@/lib/site-url';

/**
 * Real founder voice for E-E-A-T (Universal Product & PSEO Law).
 * Notes / Experience — not an AI blog farm.
 */
export const SITE_AUTHOR = {
  name: 'Vigen G.',
  nameFull: 'Vigen G.',
  role: 'Основатель Smetoplan',
  roleEn: 'Founder',
  email: 'hello@smetoplan.ru',
  methodLine:
    'Строю сметный калькулятор: живая геометрия → объёмы → ориентир ₽. Не КЖ и не оферта РБУ.',
  limits: [
    'Не выдаём штамп соответствия СП и не заменяем раздел КЖ',
    'Не подменяем инженерно-геологические изыскания',
    'HELPER — помощник полей интерфейса, не заключение конструктора',
    'Цены в смете — справочник/медиана, не коммерческое КП завода',
  ],
  productFirst:
    'Лицо сайта — калькулятор и цифры на экране. AI-чат HELPER внутри инструмента, не homepage hero.',
  notesPath: '/opyt',
  aboutPath: '/o-nas',
  methodologyPath: '/metodika',
} as const;

export function buildPersonJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site}/#author`,
    name: SITE_AUTHOR.name,
    jobTitle: SITE_AUTHOR.role,
    email: SITE_AUTHOR.email,
    url: `${site}${SITE_AUTHOR.aboutPath}`,
    worksFor: { '@id': `${site}/#organization` },
    knowsAbout: [
      'Сметный расчёт фундамента',
      'Объём бетона и арматуры',
      'Онлайн-калькуляторы конструкций',
    ],
  };
}

export function buildAuthorRef() {
  const site = getSiteUrl();
  return {
    '@type': 'Person' as const,
    '@id': `${site}/#author`,
    name: SITE_AUTHOR.name,
    url: `${site}${SITE_AUTHOR.aboutPath}`,
  };
}
