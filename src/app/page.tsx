import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { HomeHero } from '@/components/home/HomeHero';
import { CalculatorCatalog } from '@/components/home/CalculatorCatalog';
import { MidVisualStory } from '@/components/home/MidVisualStory';
import { HowItWorks } from '@/components/home/HowItWorks';
import { HomeCta, SmetaShowcase } from '@/components/home/SmetaShowcase';
import { HomeEeatBlock } from '@/components/home/HomeEeatBlock';
import { HomeAnswerFirst } from '@/components/home/HomeAnswerFirst';
import { HomeExperienceTeaser } from '@/components/home/HomeExperienceTeaser';
import { HomeSeoCluster } from '@/components/home/HomeSeoCluster';
import { getSiteUrl } from '@/lib/site-url';
import { formatEngineUpdated } from '@/lib/seo-freshness';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: 'Smetoplan — калькуляторы фундамента, чертежи и сметы онлайн',
  description:
    'Онлайн-расчёт плитного и ленточного фундамента: живые эталоны в HTML, чертёж, смета в ₽. Без заявки. Методика и опыт ядра открыты.',
  alternates: { canonical: site },
  openGraph: {
    title: 'Smetoplan — калькуляторы фундамента и сметы',
    description:
      'Эталоны из живого ядра, региональные цены, PDF и ссылка на расчёт. Не КЖ и не оферта РБУ.',
    url: site,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Smetoplan',
  },
  robots: { index: true, follow: true },
  other: {
    'smetoplan:engine': formatEngineUpdated(),
    'smetoplan:prices': formatPriceAsOf(PRICE_TABLE_AS_OF),
  },
};

export default function HomePage() {
  return (
    <div className="bg-[#0E1624]">
      <SiteHeader />
      <HomeHero />
      <HomeAnswerFirst />
      <CalculatorCatalog />
      <MidVisualStory />
      <HowItWorks />
      <SmetaShowcase />
      <HomeExperienceTeaser />
      <HomeEeatBlock />
      <HomeCta />
      <HomeSeoCluster />
      <SiteFooter />
    </div>
  );
}
