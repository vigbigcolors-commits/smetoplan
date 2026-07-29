import { query } from './db';
import type { PseoRoute, PseoRouteParams, StructureType, IntentCluster } from './types';

type PseoRow = {
  id: number;
  slug: string;
  structure_type: StructureType;
  intent_cluster: IntentCluster;
  title_template: string;
  h1_template: string;
  description: string;
  params: PseoRouteParams;
  layout_variant: number;
  show_rebar: boolean;
  show_bom: boolean;
  show_cad: boolean;
  show_ai: boolean;
  show_contractors: boolean;
  region_slug: string | null;
  material_sku: string | null;
  formula_code: string | null;
  is_published: boolean;
  publish_date: Date | string | null;
};

function mapRow(row: PseoRow): PseoRoute {
  return {
    id: row.id,
    slug: row.slug,
    structure_type: row.structure_type,
    intent_cluster: row.intent_cluster,
    title_template: row.title_template,
    h1_template: row.h1_template,
    description: row.description,
    params: row.params,
    layout_variant: Math.min(5, Math.max(1, row.layout_variant)) as 1 | 2 | 3 | 4 | 5,
    show_rebar: row.show_rebar,
    show_bom: row.show_bom,
    show_cad: row.show_cad,
    show_ai: row.show_ai,
    show_contractors: row.show_contractors,
    region_slug: row.region_slug,
    material_sku: row.material_sku,
    formula_code: row.formula_code,
    is_published: row.is_published,
    publish_date: row.publish_date
      ? new Date(row.publish_date).toISOString()
      : null,
  };
}

/** Published & due routes only — unpublished must 404 for crawlers. */
export async function getPublishedRouteBySlug(
  slug: string
): Promise<PseoRoute | null> {
  const { rows } = await query<PseoRow>(
    `SELECT *
     FROM pseo_routes
     WHERE slug = $1
       AND is_published = TRUE
       AND publish_date IS NOT NULL
       AND publish_date <= NOW()
     LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function listPublishedSlugs(limit = 50_000): Promise<
  Array<{ slug: string; publish_date: string; priority: number }>
> {
  const { rows } = await query<{
    slug: string;
    publish_date: Date;
    priority: number;
  }>(
    `SELECT slug, publish_date, priority
     FROM pseo_routes
     WHERE is_published = TRUE
       AND publish_date IS NOT NULL
       AND publish_date <= NOW()
     ORDER BY priority DESC, publish_date DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    slug: r.slug,
    publish_date: new Date(r.publish_date).toISOString(),
    priority: r.priority,
  }));
}

/**
 * Drip-feed: activate 200–300 unpublished routes per day.
 * Random batch size in [min, max] prevents predictable crawl patterns.
 */
export async function dripFeedPublish(
  minCount: number,
  maxCount: number
): Promise<{ published: number; slugs: string[] }> {
  const lo = Math.max(1, Math.min(minCount, maxCount));
  const hi = Math.max(lo, Math.max(minCount, maxCount));
  const batchSize = lo + Math.floor(Math.random() * (hi - lo + 1));

  const { rows } = await query<{ id: number; slug: string }>(
    `WITH picked AS (
       SELECT id, slug
       FROM pseo_routes
       WHERE is_published = FALSE
       ORDER BY priority DESC, id ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE pseo_routes r
     SET is_published = TRUE,
         publish_date = NOW(),
         last_sitemap_at = NOW()
     FROM picked
     WHERE r.id = picked.id
     RETURNING r.id, r.slug`,
    [batchSize]
  );

  await query(
    `INSERT INTO sitemap_builds (urls_count, batch_published, meta)
     SELECT
       (SELECT COUNT(*)::int FROM pseo_routes
         WHERE is_published = TRUE AND publish_date <= NOW()),
       $1,
       jsonb_build_object('slugs', $2::jsonb)`,
    [rows.length, JSON.stringify(rows.map((r) => r.slug))]
  );

  return { published: rows.length, slugs: rows.map((r) => r.slug) };
}

export async function bumpViewCount(slug: string): Promise<void> {
  await query(
    `UPDATE pseo_routes SET view_count = view_count + 1 WHERE slug = $1`,
    [slug]
  );
}
