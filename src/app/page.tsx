import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { HomeHero } from '@/components/home/HomeHero';
import { CalculatorCatalog } from '@/components/home/CalculatorCatalog';
import { MidVisualStory } from '@/components/home/MidVisualStory';
import { HowItWorks } from '@/components/home/HowItWorks';
import { HomeCta, SmetaShowcase } from '@/components/home/SmetaShowcase';

export const metadata: Metadata = {
  title: 'Smetoplan — калькуляторы фундамента, чертежи и сметы онлайн',
  description:
    'Онлайн-расчёт плитного и ленточного фундамента, свай, балок и стен: живой чертёж, расход материалов и смета в рублях.',
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
      <HomeCta />
      <SiteFooter />
    </div>
  );
}
