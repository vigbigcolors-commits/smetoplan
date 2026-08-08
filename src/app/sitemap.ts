import type { MetadataRoute } from 'next';
import { listPublishedSlugs } from '@/lib/pseo';
import { allHubSlugs } from '@/lib/pseo-hubs';
import { allCenySlugs } from '@/lib/ceny-regions';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sitemap: static + hubs + published pseo_routes only.
 * Cron drip-feed flips is_published → URLs appear here within the same day.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: site,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${site}/kalkulyator`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${site}/ceny`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...allCenySlugs().map((slug) => ({
      url: `${site}/ceny/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    {
      url: `${site}/metodika`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${site}/opyt`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    },
    ...[
      '/o-nas',
      '/disclaimer',
      '/privacy',
      '/kontakty',
    ].map((path) => ({
      url: `${site}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.55,
    })),
    ...allHubSlugs().map((slug) => ({
      url: `${site}/kalkulyator/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];

  try {
    const routes = await listPublishedSlugs(50_000);
    const pseoEntries: MetadataRoute.Sitemap = routes.map((r) => ({
      url: `${site}/kalkulyator/${r.slug}`,
      lastModified: new Date(r.publish_date),
      changeFrequency: 'weekly' as const,
      priority: Math.min(0.9, 0.4 + r.priority / 200),
    }));
    return [...staticEntries, ...pseoEntries];
  } catch {
    return staticEntries;
  }
}
