import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalculatorWorkspace } from '@/components/calculator/CalculatorWorkspace';
import { buildMetaFromRoute, paramsToCalculatorState } from '@/lib/meta';
import { bumpViewCount, getPublishedRouteBySlug } from '@/lib/pseo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = await getPublishedRouteBySlug(slug).catch(() => null);
  if (!route) {
    return { title: 'Страница не найдена | Smetoplan' };
  }

  const meta = buildMetaFromRoute({
    slug: route.slug,
    structureType: route.structure_type,
    intent: route.intent_cluster,
    params: route.params,
    regionSlug: route.region_slug,
    titleOverride: route.title_template,
    h1Override: route.h1_template,
    descriptionOverride: route.description,
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru';

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${site}/kalkulyator/${route.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${site}/kalkulyator/${route.slug}`,
      type: 'website',
      locale: 'ru_RU',
    },
    robots: { index: true, follow: true },
  };
}

export default async function PseoCalculatorPage({ params }: PageProps) {
  const { slug } = await params;
  const route = await getPublishedRouteBySlug(slug).catch(() => null);

  // Anti-ban: unpublished / future routes → hard 404 (no soft redirect, no thin shell)
  if (!route) {
    notFound();
  }

  void bumpViewCount(slug).catch(() => undefined);

  const meta = buildMetaFromRoute({
    slug: route.slug,
    structureType: route.structure_type,
    intent: route.intent_cluster,
    params: route.params,
    regionSlug: route.region_slug,
    titleOverride: route.title_template,
    h1Override: route.h1_template,
    descriptionOverride: route.description,
  });

  const state = paramsToCalculatorState(route.params);
  const showRebar =
    route.show_rebar && route.params.layers > 0 && route.params.rebar_d > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: meta.h1,
    description: meta.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculatorWorkspace
        initial={{
          structureType: route.structure_type,
          dimensions: state.dimensions,
          concreteSpec: state.concreteSpec,
          rebarSpec: showRebar
            ? state.rebarSpec
            : { ...state.rebarSpec, layers: 0, diameterMm: 0 },
          h1: meta.h1,
          description: meta.description,
          flags: {
            showRebar,
            showBom: route.show_bom,
            showCad: route.show_cad,
            showAi: route.show_ai,
            showContractors: route.show_contractors,
            layoutVariant: route.layout_variant,
          },
        }}
      />
    </>
  );
}
