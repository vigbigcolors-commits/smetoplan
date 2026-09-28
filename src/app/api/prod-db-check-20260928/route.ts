import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createHash } from 'node:crypto';
import { searchIntentFingerprint } from '@/lib/pseo-quality';
import { isCanonicalSeoMaterialProfile } from '@/lib/pseo-seo-profiles';
import type { PseoRoute, StructureType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const TOKEN_HASH = '16f4a727dbb14a0b59ce455b4e151396aa32c899554b27f88849109de1d6f3df';
const MARKER = 'smetoplan-prod-maint-20260928-v1';
const BACKUP = 'pseo_routes_backup_20260928_semantic';

const EXPECTED = {
  published: 195,
  pending: 2781,
  rejected: 4,
  total: 2980,
  publishedKeep: 36,
  publishedReject: 159,
  pendingKeep: 296,
  pendingReject: 2485,
  rejectedAfter: 2648,
};

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

type DbCounts = {
  published: number;
  pending: number;
  rejected: number;
  total: number;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function fingerprint(row: Row): string {
  return searchIntentFingerprint(row);
}

function byPublishedSurvivor(a: Row, b: Row): number {
  const da = a.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const db = b.publish_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return da - db || b.priority - a.priority || Number(a.id) - Number(b.id);
}

function byPendingSurvivor(a: Row, b: Row): number {
  const ca = isCanonicalSeoMaterialProfile(a.structure_type, a.params) ? 0 : 1;
  const cb = isCanonicalSeoMaterialProfile(b.structure_type, b.params) ? 0 : 1;
  return ca - cb || b.priority - a.priority || Number(a.id) - Number(b.id);
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

function duplicateClusters(rows: Row[]): number {
  return [...groupByIntent(rows).values()]
    .filter((group) => group.length > 1).length;
}

function authorized(request: Request): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token) return false;

  const actual = createHash('sha256')
    .update(token)
    .digest('hex');

  return actual === TOKEN_HASH;
}

async function connectWithRetry(): Promise<Client> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL_NOT_SET');
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 20_000,
    });

    try {
      await client.connect();
      await client.query(`SET statement_timeout = '120s'`);
      return client;
    } catch (error) {
      lastError = error;

      try {
        await client.end();
      } catch {}

      if (attempt < 4) {
        await sleep(attempt * 1500);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('DATABASE_CONNECT_FAILED');
}

async function loadRows(client: Client) {
  const published = await client.query<Row>(`
    SELECT
      id, slug, structure_type, params, region_slug,
      priority, publish_date, content_fingerprint
    FROM pseo_routes
    WHERE is_published = TRUE
      AND quality_status = 'ok'
  `);

  const pending = await client.query<Row>(`
    SELECT
      id, slug, structure_type, params, region_slug,
      priority, publish_date, content_fingerprint
    FROM pseo_routes
    WHERE is_published = FALSE
      AND COALESCE(quality_status, 'pending') = 'pending'
  `);

  return {
    published: published.rows,
    pending: pending.rows,
  };
}

async function counts(client: Client): Promise<DbCounts> {
  const result = await client.query<DbCounts>(`
    SELECT
      count(*) FILTER (
        WHERE is_published = TRUE
          AND quality_status = 'ok'
      )::int AS published,

      count(*) FILTER (
        WHERE is_published = FALSE
          AND COALESCE(quality_status, 'pending') = 'pending'
      )::int AS pending,

      count(*) FILTER (
        WHERE quality_status = 'rejected'
      )::int AS rejected,

      count(*)::int AS total

    FROM pseo_routes
  `);

  return result.rows[0];
}

function buildPlan(published: Row[], pending: Row[]) {
  const publishedGroups = groupByIntent(published);

  const publishedKeep: Row[] = [];
  const publishedReject: Row[] = [];

  for (const group of publishedGroups.values()) {
    group.sort(byPublishedSurvivor);
    publishedKeep.push(group[0]);
    publishedReject.push(...group.slice(1));
  }

  const pendingKeep: Row[] = [];
  const pendingReject: Row[] = [];

  for (const [key, group] of groupByIntent(pending)) {
    if (publishedGroups.has(key)) {
      pendingReject.push(...group);
      continue;
    }

    group.sort(byPendingSurvivor);
    pendingKeep.push(group[0]);
    pendingReject.push(...group.slice(1));
  }

  return {
    publishedKeep,
    publishedReject,
    pendingKeep,
    pendingReject,
  };
}

async function semanticAudit(client: Client) {
  const rows = await loadRows(client);
  const current = await counts(client);

  const publishedKeys = new Set(
    rows.published.map(fingerprint)
  );

  return {
    current,

    publishedDuplicateIntents:
      duplicateClusters(rows.published),

    pendingDuplicateIntents:
      duplicateClusters(rows.pending),

    pendingWithPublishedSibling:
      rows.pending.filter((row) =>
        publishedKeys.has(fingerprint(row))
      ).length,

    publishedFingerprintMismatch:
      rows.published.filter(
        (row) =>
          row.content_fingerprint !== fingerprint(row)
      ).length,
  };
}

export async function GET() {
  return NextResponse.json({
    marker: MARKER,
    ready: true,
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { marker: MARKER, ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let client: Client | null = null;

  try {
    client = await connectWithRetry();

    const before = await counts(client);

    // Idempotency: request may have succeeded while HTTP response was lost.
    if (
      before.published === EXPECTED.publishedKeep &&
      before.pending === EXPECTED.pendingKeep &&
      before.rejected === EXPECTED.rejectedAfter &&
      before.total === EXPECTED.total
    ) {
      const audit = await semanticAudit(client);

      const migration = await client.query<{ ok: boolean }>(`
        SELECT EXISTS (
          SELECT 1
          FROM schema_migrations
          WHERE filename = '011_pseo_semantic_fingerprint.sql'
        ) AS ok
      `);

      const valid =
        audit.publishedDuplicateIntents === 0 &&
        audit.pendingDuplicateIntents === 0 &&
        audit.pendingWithPublishedSibling === 0 &&
        audit.publishedFingerprintMismatch === 0 &&
        migration.rows[0].ok;

      return NextResponse.json({
        marker: MARKER,
        ok: valid,
        alreadyApplied: true,
        backup: BACKUP,
        after: audit,
        migration011: migration.rows[0].ok,
      }, {
        status: valid ? 200 : 409,
      });
    }

    const baselineOk =
      before.published === EXPECTED.published &&
      before.pending === EXPECTED.pending &&
      before.rejected === EXPECTED.rejected &&
      before.total === EXPECTED.total;

    if (!baselineOk) {
      return NextResponse.json({
        marker: MARKER,
        ok: false,
        error: 'BASELINE_GUARD_FAILED',
        before,
        expected: EXPECTED,
      }, { status: 409 });
    }

    const rows = await loadRows(client);
    const plan = buildPlan(rows.published, rows.pending);

    const planSummary = {
      publishedKeep: plan.publishedKeep.length,
      publishedReject: plan.publishedReject.length,
      pendingKeep: plan.pendingKeep.length,
      pendingReject: plan.pendingReject.length,
    };

    const planOk =
      planSummary.publishedKeep === EXPECTED.publishedKeep &&
      planSummary.publishedReject === EXPECTED.publishedReject &&
      planSummary.pendingKeep === EXPECTED.pendingKeep &&
      planSummary.pendingReject === EXPECTED.pendingReject;

    if (!planOk) {
      return NextResponse.json({
        marker: MARKER,
        ok: false,
        error: 'PLAN_GUARD_FAILED',
        before,
        plan: planSummary,
        expected: EXPECTED,
      }, { status: 409 });
    }

    // Report migration state, but do not silently run unrelated migrations.
    const migrationRows = await client.query<{ filename: string }>(`
      SELECT filename
      FROM schema_migrations
      ORDER BY filename
    `);

    const knownMigrations = new Set(
      migrationRows.rows.map((row) => row.filename)
    );

    const allExpectedMigrations = [
      '001_init.sql',
      '002_seed_materials.sql',
      '003_seed_formulas.sql',
      '004_seed_pseo_routes.sql',
      '005_pseo_quality_status.sql',
      '006_pseo_content_fingerprint.sql',
      '007_market_suppliers.sql',
      '008_supplier_contacts.sql',
      '009_pseo_quality_harden.sql',
      '010_region_price_medians.sql',
    ];

    const missingBefore = allExpectedMigrations.filter(
      (name) => !knownMigrations.has(name)
    );

    // --------------------------------------------------------
    // Backup is committed separately BEFORE remediation.
    // --------------------------------------------------------
    const backupExists = await client.query<{ backup: string | null }>(
      `SELECT to_regclass('public.${BACKUP}')::text AS backup`
    );

    if (!backupExists.rows[0].backup) {
      await client.query('BEGIN');

      try {
        await client.query(
          `CREATE TABLE ${BACKUP} AS TABLE pseo_routes WITH DATA`
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    const backupCount = await client.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM ${BACKUP}`
    );

    if (backupCount.rows[0].total !== EXPECTED.total) {
      return NextResponse.json({
        marker: MARKER,
        ok: false,
        error: 'BACKUP_GUARD_FAILED',
        backup: BACKUP,
        backupRows: backupCount.rows[0].total,
        expectedRows: EXPECTED.total,
      }, { status: 409 });
    }

    // --------------------------------------------------------
    // Atomic remediation transaction.
    // --------------------------------------------------------
    await client.query('BEGIN');

    try {
      await client.query(`
        COMMENT ON COLUMN pseo_routes.content_fingerprint IS
        'structure|length|width|depth|canonical_region — set only for published quality_status=ok rows'
      `);

      await client.query(`
        INSERT INTO schema_migrations (filename)
        VALUES ('011_pseo_semantic_fingerprint.sql')
        ON CONFLICT DO NOTHING
      `);

      const keepIds =
        plan.publishedKeep.map((row) => row.id);

      const keepFingerprints =
        plan.publishedKeep.map(fingerprint);

      await client.query(`
        UPDATE pseo_routes AS p
        SET
          content_fingerprint = v.fingerprint,
          updated_at = NOW()
        FROM
          unnest(
            $1::bigint[],
            $2::text[]
          ) AS v(id, fingerprint)
        WHERE
          p.id = v.id
          AND p.is_published = TRUE
          AND p.quality_status = 'ok'
      `, [
        keepIds,
        keepFingerprints,
      ]);

      const publishedRejectIds =
        plan.publishedReject.map((row) => row.id);

      await client.query(`
        UPDATE pseo_routes
        SET
          is_published = FALSE,
          publish_date = NULL,
          quality_status = 'rejected',
          content_fingerprint = NULL,
          updated_at = NOW()
        WHERE id = ANY($1::bigint[])
      `, [
        publishedRejectIds,
      ]);

      const pendingRejectIds =
        plan.pendingReject.map((row) => row.id);

      await client.query(`
        UPDATE pseo_routes
        SET
          quality_status = 'rejected',
          updated_at = NOW()
        WHERE
          id = ANY($1::bigint[])
          AND is_published = FALSE
      `, [
        pendingRejectIds,
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    // --------------------------------------------------------
    // Post-apply proof.
    // --------------------------------------------------------
    const after = await semanticAudit(client);

    const migrationAfter = await client.query<{ ok: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM schema_migrations
        WHERE filename = '011_pseo_semantic_fingerprint.sql'
      ) AS ok
    `);

    const postOk =
      after.current.published === EXPECTED.publishedKeep &&
      after.current.pending === EXPECTED.pendingKeep &&
      after.current.rejected === EXPECTED.rejectedAfter &&
      after.current.total === EXPECTED.total &&
      after.publishedDuplicateIntents === 0 &&
      after.pendingDuplicateIntents === 0 &&
      after.pendingWithPublishedSibling === 0 &&
      after.publishedFingerprintMismatch === 0 &&
      migrationAfter.rows[0].ok;

    return NextResponse.json({
      marker: MARKER,
      ok: postOk,
      alreadyApplied: false,
      before,
      plan: planSummary,
      backup: BACKUP,
      backupRows: backupCount.rows[0].total,
      missingMigrationsBefore: missingBefore,
      migration011: migrationAfter.rows[0].ok,
      after,
      samplePublishedSlug:
        plan.publishedKeep[0]?.slug ?? null,
      sampleRejectedPublishedSlug:
        plan.publishedReject[0]?.slug ?? null,
    }, {
      status: postOk ? 200 : 409,
    });

  } catch (error) {
    return NextResponse.json({
      marker: MARKER,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'PRODUCTION_REMEDIATION_FAILED',
    }, {
      status: 500,
    });

  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}