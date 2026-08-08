import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { HomeHero } from '@/components/home/HomeHero';
import { CalculatorCatalog } from '@/components/home/CalculatorCatalog';
import { MidVisualStory } from '@/components/home/MidVisualStory';
import { HowItWorks } from '@/components/home/HowItWorks';
import { HomeCta, SmetaShowcase } from '@/components/home/SmetaShowcase';
import { HomeEeatBlock } from '@/components/home/HomeEeatBlock';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: 'Smetoplan — калькуляторы фундамента, чертежи и сметы онлайн',
  description:
    'Онлайн-расчёт плитного и ленточного фундамента, свай, балок и стен: живой чертёж, расход материалов и смета в рублях. Без заявки — результат сразу на экране.',
  alternates: { canonical: site },
  openGraph: {
    title: 'Smetoplan — калькуляторы фундамента и сметы',
    description:
      'Живой чертёж, объёмы бетона и арматуры, ориентир сметы. Методика и источники открыты.',
    url: site,
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Smetoplan',
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <div className="bg-[#0E1624]">
      <SiteHeader />
      <HomeHero />
      <CalculatorCatalog />
      <MidVisualStory />
      <HowItWorks />
      <SmetaShowcase />
      <HomeEeatBlock />
      <HomeCta />
      <SiteFooter />
    </div>
  );
}
