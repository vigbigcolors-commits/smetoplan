import { getSiteUrl } from '@/lib/site-url';
import {
  formatPriceAsOf,
  NORM_SOURCES,
  PRICE_SOURCE_NOTE,
  PRICE_TABLE_AS_OF,
} from '@/lib/trust-sources';

export type SiteFaq = { q: string; a: string };

/** Homepage + calculator EEAT FAQ — unique useful answers, not doorway fluff. */
export const HOME_FAQS: SiteFaq[] = [
  {
    q: 'Что считает калькулятор Smetoplan?',
    a: 'Объём бетона, массу и раскрой арматуры, площадь опалубки и ориентировочную смету материалов в рублях для плиты, ленты, свай, балки/колонны и подпорной стены. Чертёж и смета пересчитываются сразу при смене размеров.',
  },
  {
    q: 'Это замена проекту КЖ или расчёту оснований?',
    a: 'Нет. Smetoplan — сметный ориентир для прораба и сметчика: порядок цифр до визита к конструктору. Рабочая документация КЖ и основания — по СП 63.13330 / СП 22.13330 и данным изысканий.',
  },
  {
    q: 'Откуда цены в смете?',
    a: `${PRICE_SOURCE_NOTE} Дата таблицы: ${formatPriceAsOf(PRICE_TABLE_AS_OF)}. Актуальные котировки поставщиков смотрите на /ceny — они не подменяют ориентир калькулятора.`,
  },
  {
    q: 'Нужна ли заявка, чтобы увидеть результат?',
    a: 'Нет. Расчёт, чертёж и смета доступны сразу на странице — без ожидания менеджера. Пакет «Готово» в калькуляторе: PDF, .txt для РБУ и ссылка на расчёт — уносите сами.',
  },
  {
    q: 'Какие нормы использует методика?',
    a: `Справочно: ${NORM_SOURCES.map((n) => `${n.code} (${n.role})`).join('; ')}. Это рамка ориентира, не штамп соответствия СП.`,
  },
  {
    q: 'Чем главная отличается от хабов конструкций?',
    a: 'Главная — вход в продукт. Хабы вроде /kalkulyator/plitnyy-fundament дают ответ по типовому запросу с эталоном и FAQ; калькулятор /kalkulyator — рабочий инструмент уточнения размеров.',
  },
];

export const CALCULATOR_FAQS: SiteFaq[] = [
  {
    q: 'Как пользоваться калькулятором?',
    a: 'Выберите тип конструкции сверху, задайте габариты, марку бетона и арматуру. Справа обновятся чертёж, объёмы и смета. HELPER может проставить параметры из текстового ТЗ.',
  },
  {
    q: 'Почему цифры отличаются от «ось × ширина × высота»?',
    a: 'Для ленты углы не считаются дважды: модель идёт по пятну и ширине ленты. Для квадратной колонны опалубка — 4 грани. Эталоны сверяйте с живым ядром, а не с упрощённой школьной формулой.',
  },
  {
    q: 'Можно ли считать с региональными ценами?',
    a: 'Да. Выберите регион в панели или откройте /ceny — ориентир сметы берётся из справочника Smetoplan; котировки поставщиков показываются отдельно.',
  },
  {
    q: 'Результат — коммерческое КП завода?',
    a: 'Нет. Это ориентир для спецификации. Финальный прайс, доставку и минимальную партию подтверждает РБУ или база.',
  },
  {
    q: 'Как забрать расчёт с собой?',
    a: 'Кнопка «Готово» / PDF: скачайте PDF-смету, .txt для РБУ и скопируйте ссылку на те же параметры. Без заявки и звонка.',
  },
];

export function buildFaqJsonLd(faqs: SiteFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function buildOrganizationJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: 'Smetoplan',
    alternateName: ['Сметоплан', 'Smetoplan.ru'],
    url: site,
    logo: {
      '@type': 'ImageObject',
      url: `${site}/Images/smetoplan-logo.png`,
    },
    image: `${site}/Images/smetoplan-logo.png`,
    description:
      'Онлайн-калькуляторы фундаментов и конструкций: живой чертёж, объёмы материалов и ориентировочная смета без заявки.',
    email: 'hello@smetoplan.ru',
    foundingDate: '2025',
    slogan: 'Смета на месте — без заявки',
    brand: { '@type': 'Brand', name: 'Smetoplan' },
    knowsAbout: [
      'Расчёт плитного фундамента',
      'Расчёт ленточного фундамента',
      'Смета бетона и арматуры',
      'Опалубка монолитных конструкций',
      'Региональные цены на бетон',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Russia',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@smetoplan.ru',
      contactType: 'customer support',
      availableLanguage: ['Russian'],
      url: `${site}/kontakty`,
    },
    sameAs: [`${site}/o-nas`, `${site}/metodika`, `${site}/opyt`],
  };
}

export function buildWebSiteJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    name: 'Smetoplan',
    url: site,
    inLanguage: 'ru-RU',
    publisher: { '@id': `${site}/#organization` },
    about: { '@id': `${site}/#organization` },
  };
}

export function buildSoftwareAppJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Калькулятор Smetoplan',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${site}/kalkulyator`,
    description:
      'Онлайн-расчёт бетона, арматуры, опалубки и сметы для фундамента и монолитных конструкций.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
  };
}
