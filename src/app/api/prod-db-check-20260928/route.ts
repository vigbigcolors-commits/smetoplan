import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { searchIntentFingerprint } from '@/lib/pseo-quality';
import { isCanonicalSeoMaterialProfile } from '@/lib/pseo-seo-profiles';
import type { PseoRoute, StructureType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Row = {
  id: number;
  slug: string;
  structure_type: StructureType;
  params: PseoRoute['params'];
  region_slug: string | null;
  priority: number;
  publish_date: Date | null;
  content_fingerprint: string | null;
};

function fp(row: Row): string {
  return searchIntentFingerprint(row);
}

function publishedSort(a: Row, b: Row): number {
  const da = a.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const db = b.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return da - db || b.priority - a.priority || a.id - b.id;
}

function pendingSort(a: Row, b: Row): number {
  const ca = isCanonicalSeoMaterialProfile(a.structure_type, a.params) ? 0 : 1;
  const cb = isCanonicalSeoMaterialProfile(b.structure_type, b.params) ? 0 : 1;
  return ca - cb || b.priority - a.priority || a.id - b.id;
}

function groups(rows: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const row of rows) {
    const key = fp(row);
    const arr = m.get(key) || [];
    arr.push(row);
    m.set(key, arr);
  }
  return m;
}

function duplicateClusters(rows: Row[]): number {
  return [...groups(rows).values()].filter((g) => g.length > 1).length;
}

export async function GET() {
  try {
    const { rows: published } = await query<Row>(`
      SELECT
        id, slug, structure_type, params, region_slug,
        priority, publish_date, content_fingerprint
      FROM pseo_routes
      WHERE is_published = TRUE
        AND quality_status = 'ok'
    `);

    const { rows: pending } = await query<Row>(`
      SELECT
        id, slug, structure_type, params, region_slug,
        priority, publish_date, content_fingerprint
      FROM pseo_routes
      WHERE is_published = FALSE
        AND COALESCE(quality_status, 'pending') = 'pending'
    `);

    const currentResult = await query<{
      rejected: number;
      total: number;
    }>(`
      SELECT
        count(*) FILTER (
          WHERE quality_status = 'rejected'
        )::int AS rejected,
        count(*)::int AS total
      FROM pseo_routes
    `);

    const migrationResult = await query<{ migration_011: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM schema_migrations
        WHERE filename = '011_pseo_semantic_fingerprint.sql'
      ) AS migration_011
    `);

    const publishedGroups = groups(published);

    let publishedKeep = 0;
    let publishedReject = 0;

    for (const group of publishedGroups.values()) {
      group.sort(publishedSort);
      publishedKeep += 1;
      publishedReject += Math.max(0, group.length - 1);
    }

    let pendingKeep = 0;
    let pendingReject = 0;
    let pendingPublishedSibling = 0;
    let pendingSemanticSibling = 0;

    for (const [key, group] of groups(pending)) {
      if (publishedGroups.has(key)) {
        pendingReject += group.length;
        pendingPublishedSibling += group.length;
        continue;
      }

      group.sort(pendingSort);
      pendingKeep += 1;

      const losers = Math.max(0, group.length - 1);
      pendingReject += losers;
      pendingSemanticSibling += losers;
    }

    const publishedKeys = new Set(published.map(fp));

    return NextResponse.json({
      marker: 'smetoplan-prod-audit-20260928-v1',

      current: {
        published: published.length,
        pending: pending.length,
        rejected: currentResult.rows[0].rejected,
        total: currentResult.rows[0].total
      },

      plan: {
        publishedKeep,
        publishedReject,
        pendingKeep,
        pendingReject,
        rejectedAfter:
          currentResult.rows[0].rejected +
          publishedReject +
          pendingReject
      },

      reasons: {
        publishedSemanticSibling: publishedReject,
        pendingPublishedSibling,
        pendingSemanticSibling
      },

      audit: {
        publishedDuplicateIntents: duplicateClusters(published),
        pendingDuplicateIntents: duplicateClusters(pending),
        pendingWithPublishedSibling:
          pending.filter((row) => publishedKeys.has(fp(row))).length,
        publishedFingerprintMismatch:
          published.filter(
            (row) => row.content_fingerprint !== fp(row)
          ).length
      },

      migration011Applied:
        migrationResult.rows[0].migration_011
    });
  } catch (error) {
    return NextResponse.json(
      {
        marker: 'smetoplan-prod-audit-20260928-v1',
        error: error instanceof Error ? error.message : 'AUDIT_FAILED'
      },
      { status: 500 }
    );
  }
}