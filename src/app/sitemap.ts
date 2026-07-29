import type { MetadataRoute } from 'next';
import { listPublishedSlugs } from '@/lib/pseo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sitemap rebuilds dynamically from published pseo_routes only.
 * Cron drip-feed flips is_published → URLs appear here within the same day.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru';

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: site,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
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
