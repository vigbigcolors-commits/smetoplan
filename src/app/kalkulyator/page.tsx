import type { Metadata } from 'next';
import ConstructixApp from '@/components/calculator/ConstructixApp';
import {
  getStructurePreset,
  isStructureType,
} from '@/lib/calculator-routes';
import { getSiteUrl } from '@/lib/site-url';

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { type } = await searchParams;
  const structureType = isStructureType(type) ? type : 'slab';
  const preset = getStructurePreset(structureType);
  const site = getSiteUrl();

  return {
    title: `${preset.h1} — смета онлайн | Smetoplan`,
    description: preset.description,
    // Always clean canonical — ?type= is UI state, not a separate document.
    alternates: {
      canonical: `${site}/kalkulyator`,
    },
    openGraph: {
      title: preset.h1,
      description: preset.description,
      url: `${site}/kalkulyator`,
      type: 'website',
      locale: 'ru_RU',
    },
    robots: { index: true, follow: true },
  };
}

export default async function CalculatorPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const structureType = isStructureType(type) ? type : 'slab';
  const preset = getStructurePreset(structureType);

  return (
    <ConstructixApp
      initial={{
        structureType: preset.structureType,
        dimensions: preset.dimensions,
        concreteSpec: preset.concreteSpec,
        rebarSpec: preset.rebarSpec,
        h1: preset.h1,
        description: preset.description,
        showSeoStrip: true,
      }}
    />
  );
}
