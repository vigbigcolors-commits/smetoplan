/** Read-only guard for the semantic PSEO identity + live indexability contract. */
import {
  evaluatePseoIndexability,
  searchIntentFingerprint,
} from '../src/lib/pseo-quality';
import type {
  IntentCluster,
  PseoRoute,
  StructureType,
} from '../src/lib/types';

type Row = {
  id: number;
  slug: string;
  structure_type: StructureType;
  intent_cluster: IntentCluster;
  params: PseoRoute['params'];
  region_slug: string | null;
  title_template: string;
  h1_template: string;
  description: string;
  content_fingerprint: string | null;
};

function countDuplicates(rows: Row[]): number {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = searchIntentFingerprint(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.values()].filter((count) => count > 1).length;
}

async function main() {
  const columns = `
    id,
    slug,
    structure_type,
    intent_cluster,
    params,
    region_slug,
    title_template,
    h1_template,
    description,
    content_fingerprint
  `;

  const { query } = await import('../src/lib/db');

  const { rows: published } = await query<Row>(
    `SELECT ${columns}
     FROM pseo_routes
     WHERE is_published = TRUE
       AND quality_status = 'ok'`
  );

  const { rows: pending } = await query<Row>(
    `SELECT ${columns}
     FROM pseo_routes
     WHERE is_published = FALSE
       AND COALESCE(quality_status, 'pending') = 'pending'`
  );

  const publishedKeys = new Set(
    published.map(searchIntentFingerprint)
  );

  const publishedNotIndexableDetails = published.flatMap((row) => {
    const gate = evaluatePseoIndexability({
      slug: row.slug,
      structure_type: row.structure_type,
      intent_cluster: row.intent_cluster,
      params: row.params,
      region_slug: row.region_slug,
      title_template: row.title_template,
      h1_template: row.h1_template,
      description: row.description,
    });

    if (gate.ok) return [];

    return [
      {
        slug: row.slug,
        reason: gate.reason,
      },
    ];
  });

  const metrics = {
    published: published.length,
    pending: pending.length,
    publishedDuplicateIntents: countDuplicates(published),
    pendingDuplicateIntents: countDuplicates(pending),
    pendingWithPublishedSibling: pending.filter((row) =>
      publishedKeys.has(searchIntentFingerprint(row))
    ).length,
    publishedFingerprintMismatch: published.filter(
      (row) =>
        row.content_fingerprint !== searchIntentFingerprint(row)
    ).length,
    publishedNotIndexable: publishedNotIndexableDetails.length,
  };

  console.log(
    JSON.stringify(
      {
        ...metrics,
        publishedNotIndexableDetails,
      },
      null,
      2
    )
  );

  const violations = [
    metrics.publishedDuplicateIntents,
    metrics.pendingDuplicateIntents,
    metrics.pendingWithPublishedSibling,
    metrics.publishedFingerprintMismatch,
    metrics.publishedNotIndexable,
  ];

  if (violations.some((value) => value > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});