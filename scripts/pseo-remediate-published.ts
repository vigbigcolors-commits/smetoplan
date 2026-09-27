/**
 * Deterministic semantic PSEO cleanup. Dry-run is the default.
 * Set PSEO_REMEDIATE_APPLY=1 to write the reviewed plan.
 */
import { getPool, query } from '../src/lib/db';
import { searchIntentFingerprint } from '../src/lib/pseo-quality';
import { isCanonicalSeoMaterialProfile } from '../src/lib/pseo-seo-profiles';
import type { PseoRoute, StructureType } from '../src/lib/types';

type Row = {
  id: number;
  slug: string;
  structure_type: StructureType;
  params: PseoRoute['params'];
  region_slug: string | null;
  priority: number;
  publish_date: Date | null;
};

type Plan = {
  publishedKeep: Row[];
  publishedReject: Row[];
  pendingKeep: Row[];
  pendingReject: Array<{ row: Row; reason: string }>;
};

function fingerprint(row: Row): string {
  return searchIntentFingerprint(row);
}

function byPublishedSurvivor(a: Row, b: Row): number {
  const dateA = a.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const dateB = b.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return dateA - dateB || b.priority - a.priority || a.id - b.id;
}

function byPendingSurvivor(a: Row, b: Row): number {
  const canonicalA = isCanonicalSeoMaterialProfile(a.structure_type, a.params) ? 0 : 1;
  const canonicalB = isCanonicalSeoMaterialProfile(b.structure_type, b.params) ? 0 : 1;
  return canonicalA - canonicalB || b.priority - a.priority || a.id - b.id;
}

function groupByIntent(rows: Row[]): Map<string, Row[]> {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = fingerprint(row);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
}

function buildPlan(published: Row[], pending: Row[]): Plan {
  const publishedGroups = groupByIntent(published);
  const publishedKeep: Row[] = [];
  const publishedReject: Row[] = [];
  for (const group of publishedGroups.values()) {
    group.sort(byPublishedSurvivor);
    publishedKeep.push(group[0]);
    publishedReject.push(...group.slice(1));
  }

  const pendingKeep: Row[] = [];
  const pendingReject: Array<{ row: Row; reason: string }> = [];
  for (const [key, group] of groupByIntent(pending)) {
    if (publishedGroups.has(key)) {
      pendingReject.push(
        ...group.map((row) => ({ row, reason: 'published_semantic_sibling' }))
      );
      continue;
    }
    group.sort(byPendingSurvivor);
    pendingKeep.push(group[0]);
    pendingReject.push(
      ...group.slice(1).map((row) => ({ row, reason: 'pending_semantic_sibling' }))
    );
  }
  return { publishedKeep, publishedReject, pendingKeep, pendingReject };
}

async function applyPlan(plan: Plan): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const row of plan.publishedKeep) {
      await client.query(
        `UPDATE pseo_routes
         SET content_fingerprint = $2, updated_at = NOW()
         WHERE id = $1 AND is_published = TRUE AND quality_status = 'ok'`,
        [row.id, fingerprint(row)]
      );
    }
    const publishedRejectIds = plan.publishedReject.map((row) => row.id);
    if (publishedRejectIds.length) {
      await client.query(
        `UPDATE pseo_routes
         SET is_published = FALSE, publish_date = NULL,
             quality_status = 'rejected', content_fingerprint = NULL, updated_at = NOW()
         WHERE id = ANY($1::bigint[])`,
        [publishedRejectIds]
      );
    }
    const pendingRejectIds = plan.pendingReject.map(({ row }) => row.id);
    if (pendingRejectIds.length) {
      await client.query(
        `UPDATE pseo_routes SET quality_status = 'rejected', updated_at = NOW()
         WHERE id = ANY($1::bigint[]) AND is_published = FALSE`,
        [pendingRejectIds]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const apply = process.env.PSEO_REMEDIATE_APPLY === '1';
  const { rows: published } = await query<Row>(
    `SELECT id, slug, structure_type, params, region_slug, priority, publish_date
     FROM pseo_routes WHERE is_published = TRUE AND quality_status = 'ok'`
  );
  const { rows: pending } = await query<Row>(
    `SELECT id, slug, structure_type, params, region_slug, priority, publish_date
     FROM pseo_routes
     WHERE is_published = FALSE AND COALESCE(quality_status, 'pending') = 'pending'`
  );
  const plan = buildPlan(published, pending);
  const pendingReasons = plan.pendingReject.reduce<Record<string, number>>(
    (counts, { reason }) => ({ ...counts, [reason]: (counts[reason] || 0) + 1 }),
    {}
  );

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    published: { scanned: published.length, keep: plan.publishedKeep.length, reject: plan.publishedReject.length },
    pending: { scanned: pending.length, keep: plan.pendingKeep.length, reject: plan.pendingReject.length, reasons: pendingReasons },
    preview: { publishedOkAfter: plan.publishedKeep.length, pendingAfter: plan.pendingKeep.length },
  }, null, 2));

  if (apply) await applyPlan(plan);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
