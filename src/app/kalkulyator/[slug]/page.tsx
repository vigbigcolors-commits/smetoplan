import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConstructixApp from '@/components/calculator/ConstructixApp';
import { PseoSeoBlock } from '@/components/pseo/PseoSeoBlock';
import { PseoHubView } from '@/components/pseo/PseoHubView';
import { getDemoRouteBySlug } from '@/lib/demo-routes';
import { buildMetaFromRoute, paramsToCalculatorState } from '@/lib/meta';
import {
  bumpViewCount,
  getPublishedRouteBySlug,
  listPublishedByRegion,
  listPublishedByStructure,
  listRelatedPublished,
} from '@/lib/pseo';
import { getHubBySlug } from '@/lib/pseo-hubs';
import { resolvePseoRegion } from '@/lib/pseo-region';
import { DEMO_HUB_LINKS, type HubLink } from '@/lib/pseo-demo-hub';
import {
  evaluatePseoIndexability,
  routeToGateInput,
} from '@/lib/pseo-quality';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveRoute(slug: string) {
  try {
    const route = await getPublishedRouteBySlug(slug);
    if (route) return route;
  } catch {
    // Postgres/Podman down — fall through to local demo map
  }
  return getDemoRouteBySlug(slug);
}

const NOINDEX: Metadata['robots'] = { index: false, follow: false };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru';

  const hub = getHubBySlug(slug);
  if (hub) {
    return {
      title: hub.title,
      description: hub.description,
      alternates: { canonical: `${site}/kalkulyator/${hub.slug}` },
      openGraph: {
        title: hub.title,
        description: hub.description,
        url: `${site}/kalkulyator/${hub.slug}`,
        type: 'website',
        locale: 'ru_RU',
      },
      robots: { index: true, follow: true },
    };
  }

  const route = await resolveRoute(slug);
  if (!route) {
    return { title: 'Страница не найдена | Smetoplan', robots: NOINDEX };
  }

  const gate = evaluatePseoIndexability(routeToGateInput(route));
  if (!gate.ok) {
    return {
      title: 'Страница недоступна для индекса | Smetoplan',
      robots: NOINDEX,
    };
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

  const hub = getHubBySlug(slug);
  if (hub) {
    let links: HubLink[] = [];
    try {
      if (hub.kind === 'structure') {
        const rows = await listPublishedByStructure(hub.structureType, 36);
        links = rows.map((r) => ({
          slug: r.slug,
          label: r.h1,
          hint: r.dims,
        }));
      } else {
        const rows = await listPublishedByRegion(hub.slug, 36);
        links = rows.map((r) => ({
          slug: r.slug,
          label: r.h1,
          hint: r.dims,
        }));
      }
    } catch {
      links = [];
    }
    // Always merge starters so hub is never empty before drip
    const starters = DEMO_HUB_LINKS(hub);
    const seen = new Set(links.map((l) => l.slug || l.href || l.label));
    for (const s of starters) {
      const key = s.slug || s.href || s.label;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(s);
    }
    return <PseoHubView hub={hub} links={links} />;
  }

  const route = await resolveRoute(slug);

  if (!route) {
    notFound();
  }

  // ALWAYS: unique calc + FAQ/regional snapshot — otherwise 404 (not thin index)
  const gate = evaluatePseoIndexability(routeToGateInput(route));
  if (!gate.ok) {
    notFound();
  }

  if (route.id > 0) {
    void bumpViewCount(slug).catch(() => undefined);
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

  const snapshot = gate.snapshot;
  const region = resolvePseoRegion(route.region_slug);
  const state = paramsToCalculatorState(route.params);

  let related: Array<{ slug: string; label: string }> = [];
  try {
    related = await listRelatedPublished(route, 6);
  } catch {
    related = [];
  }

  const prices = region?.prices;

  return (
    <div className="bg-[linear-gradient(180deg,#F4F7FA_0%,#FFFFFF_28%,#F8FAFC_100%)]">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <PseoSeoBlock
          h1={meta.h1}
          description={meta.description}
          snapshot={snapshot}
          structureType={route.structure_type}
          related={related}
        />
      </div>
      <ConstructixApp
        initial={{
          structureType: route.structure_type,
          dimensions: state.dimensions,
          concreteSpec: {
            ...state.concreteSpec,
            customPricePerM3: prices?.concretePerM3 ?? 4200,
          },
          rebarSpec: {
            ...state.rebarSpec,
            customPricePerTon: prices?.rebarPerTon ?? 62000,
          },
          prices: prices ?? undefined,
          priceRegionId: region?.priceId,
          deferHeavyUi: true,
          h1: undefined,
          description: undefined,
        }}
      />
    </div>
  );
}
