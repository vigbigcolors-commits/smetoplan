import { query } from './db';
import type { PseoRoute, StructureType, IntentCluster } from './types';
import { isReservedHubSlug } from './pseo-hubs';
import {
  evaluatePseoIndexability,
  normalizeTitle,
  paramsFingerprint,
  routeToGateInput,
  type PseoGateReason,
} from './pseo-quality';

type PseoRow = {
  id: number;
  slug: string;
  structure_type: StructureType;
  intent_cluster: IntentCluster;
  title_template: string;
  h1_template: string;
  description: string;
  params: PseoRoute['params'];
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
  quality_status?: string | null;
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

const INDEXABLE_SQL = `
  is_published = TRUE
  AND publish_date IS NOT NULL
  AND publish_date <= NOW()
  AND quality_status = 'ok'
`;

/** Crawlable leaf only: published + quality_status=ok. Hub slugs never from DB. */
export async function getPublishedRouteBySlug(
  slug: string
): Promise<PseoRoute | null> {
  if (isReservedHubSlug(slug)) return null;

  const { rows } = await query<PseoRow>(
    `SELECT *
     FROM pseo_routes
     WHERE slug = $1
       AND ${INDEXABLE_SQL.replace(/\n/g, ' ')}
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
     WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}
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

export async function listPublishedByStructure(
  structureType: StructureType,
  limit = 24
): Promise<Array<{ slug: string; h1: string; dims: string }>> {
  const { rows } = await query<{
    slug: string;
    h1_template: string;
    params: PseoRoute['params'];
  }>(
    `SELECT slug, h1_template, params
     FROM pseo_routes
     WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}
       AND structure_type = $1
     ORDER BY priority DESC, publish_date DESC
     LIMIT $2`,
    [structureType, limit]
  );
  return rows.map((r) => ({
    slug: r.slug,
    h1: r.h1_template,
    dims: `${r.params.length}×${r.params.width}×${r.params.depth} м · ${r.params.grade}`,
  }));
}

export async function listPublishedByRegion(
  regionSlug: string,
  limit = 24
): Promise<Array<{ slug: string; h1: string; dims: string }>> {
  const { rows } = await query<{
    slug: string;
    h1_template: string;
    params: PseoRoute['params'];
  }>(
    `SELECT slug, h1_template, params
     FROM pseo_routes
     WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}
       AND region_slug = $1
     ORDER BY priority DESC, publish_date DESC
     LIMIT $2`,
    [regionSlug, limit]
  );
  return rows.map((r) => ({
    slug: r.slug,
    h1: r.h1_template,
    dims: `${r.params.length}×${r.params.width} м · ${r.params.grade}`,
  }));
}

export async function listRelatedPublished(
  route: PseoRoute,
  limit = 6
): Promise<Array<{ slug: string; label: string }>> {
  const { rows } = await query<{ slug: string; h1_template: string }>(
    `SELECT slug, h1_template
     FROM pseo_routes
     WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}
       AND structure_type = $1
       AND slug <> $2
     ORDER BY
       CASE WHEN region_slug IS NOT DISTINCT FROM $3 THEN 0 ELSE 1 END,
       priority DESC,
       publish_date DESC
     LIMIT $4`,
    [route.structure_type, route.slug, route.region_slug, limit]
  );
  return rows.map((r) => ({ slug: r.slug, label: r.h1_template }));
}

/**
 * Drip-feed — ALWAYS through evaluatePseoIndexability.
 * No publish without unique fingerprint + safe calc/FAQ snapshot.
 */
export async function dripFeedPublish(
  minCount: number,
  maxCount: number
): Promise<{
  published: number;
  rejected: number;
  slugs: string[];
  rejectReasons: Record<string, number>;
}> {
  const lo = Math.max(1, Math.min(minCount, maxCount));
  const hi = Math.max(lo, Math.max(minCount, maxCount));
  const batchSize = lo + Math.floor(Math.random() * (hi - lo + 1));
  const oversample = Math.min(batchSize * 12, 4000);

  const { rows: publishedRows } = await query<PseoRow>(
    `SELECT structure_type, params, region_slug, title_template, h1_template
     FROM pseo_routes
     WHERE quality_status = 'ok'
       AND is_published = TRUE
       AND publish_date IS NOT NULL
       AND publish_date <= NOW()`
  );

  const publishedFingerprints = new Set(
    publishedRows.map((r) => paramsFingerprint(r))
  );
  const publishedTitles = new Set(
    publishedRows.map((r) => normalizeTitle(r.title_template || r.h1_template))
  );

  const { rows: candidates } = await query<PseoRow>(
    `SELECT *
     FROM pseo_routes
     WHERE is_published = FALSE
       AND COALESCE(quality_status, 'pending') = 'pending'
     ORDER BY
       CASE WHEN region_slug IS NOT NULL THEN 0 ELSE 1 END,
       CASE intent_cluster
         WHEN 'kalkulyator' THEN 0
         WHEN 'raschet' THEN 1
         WHEN 'smeta' THEN 2
         ELSE 3
       END,
       priority DESC,
       id ASC
     LIMIT $1
     FOR UPDATE SKIP LOCKED`,
    [oversample]
  );

  const toPublish: Array<{ id: number; fingerprint: string }> = [];
  const toReject: Array<{ id: number; reason: string }> = [];
  const batchFingerprints = new Set<string>();
  const rejectReasons: Record<string, number> = {};

  for (const row of candidates) {
    if (toPublish.length >= batchSize) break;

    const gate = evaluatePseoIndexability(
      routeToGateInput(mapRow(row)),
      publishedFingerprints,
      publishedTitles,
      batchFingerprints
    );

    if (!gate.ok) {
      toReject.push({ id: row.id, reason: gate.reason });
      rejectReasons[gate.reason] = (rejectReasons[gate.reason] || 0) + 1;
      continue;
    }

    batchFingerprints.add(gate.fingerprint);
    publishedFingerprints.add(gate.fingerprint);
    publishedTitles.add(normalizeTitle(row.title_template || row.h1_template));
    toPublish.push({ id: row.id, fingerprint: gate.fingerprint });
  }

  if (toReject.length > 0) {
    await query(
      `UPDATE pseo_routes
       SET quality_status = 'rejected',
           updated_at = NOW()
       WHERE id = ANY($1::bigint[])`,
      [toReject.map((r) => r.id)]
    );
  }

  if (toPublish.length === 0) {
    await query(
      `INSERT INTO sitemap_builds (urls_count, batch_published, meta)
       SELECT
         (SELECT COUNT(*)::int FROM pseo_routes WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}),
         0,
         jsonb_build_object('rejected', $1::int, 'reasons', $2::jsonb, 'gate', 'always')`,
      [toReject.length, JSON.stringify(rejectReasons)]
    );
    return {
      published: 0,
      rejected: toReject.length,
      slugs: [],
      rejectReasons,
    };
  }

  // Publish with fingerprint; DB unique index blocks race duplicates.
  const publishedSlugs: string[] = [];
  let raceDupes = 0;
  for (const item of toPublish) {
    const { rows } = await query<{ id: number; slug: string }>(
      `UPDATE pseo_routes r
       SET is_published = TRUE,
           publish_date = NOW(),
           last_sitemap_at = NOW(),
           quality_status = 'ok',
           content_fingerprint = $2,
           updated_at = NOW()
       WHERE r.id = $1
         AND r.is_published = FALSE
         AND NOT EXISTS (
           SELECT 1
           FROM pseo_routes x
           WHERE x.content_fingerprint = $2
             AND x.quality_status = 'ok'
             AND x.is_published = TRUE
             AND x.id <> $1
         )
       RETURNING r.id, r.slug`,
      [item.id, item.fingerprint]
    );
    if (rows[0]) {
      publishedSlugs.push(rows[0].slug);
    } else {
      raceDupes += 1;
      await query(
        `UPDATE pseo_routes
         SET quality_status = 'rejected',
             updated_at = NOW()
         WHERE id = $1 AND is_published = FALSE`,
        [item.id]
      );
      rejectReasons.duplicate_fingerprint =
        (rejectReasons.duplicate_fingerprint || 0) + 1;
    }
  }

  await query(
    `INSERT INTO sitemap_builds (urls_count, batch_published, meta)
     SELECT
       (SELECT COUNT(*)::int FROM pseo_routes WHERE ${INDEXABLE_SQL.replace(/\n/g, ' ')}),
       $1,
       jsonb_build_object(
         'slugs', $2::jsonb,
         'rejected', $3::int,
         'reasons', $4::jsonb,
         'gate', 'always',
         'raceDupes', $5::int
       )`,
    [
      publishedSlugs.length,
      JSON.stringify(publishedSlugs),
      toReject.length + raceDupes,
      JSON.stringify(rejectReasons),
      raceDupes,
    ]
  );

  return {
    published: publishedSlugs.length,
    rejected: toReject.length + raceDupes,
    slugs: publishedSlugs,
    rejectReasons,
  };
}

export async function bumpViewCount(slug: string): Promise<void> {
  await query(
    `UPDATE pseo_routes SET view_count = view_count + 1 WHERE slug = $1 AND quality_status = 'ok'`,
    [slug]
  );
}

export type { PseoGateReason };
