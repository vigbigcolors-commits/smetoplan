/** Read-only guard for the semantic PSEO identity contract. */
import { query } from '../src/lib/db';
import { searchIntentFingerprint } from '../src/lib/pseo-quality';
import type { PseoRoute, StructureType } from '../src/lib/types';

type Row = {
  id: number;
  structure_type: StructureType;
  params: PseoRoute['params'];
  region_slug: string | null;
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
  const { rows: published } = await query<Row>(
    `SELECT id, structure_type, params, region_slug, content_fingerprint
     FROM pseo_routes WHERE is_published = TRUE AND quality_status = 'ok'`
  );
  const { rows: pending } = await query<Row>(
    `SELECT id, structure_type, params, region_slug, content_fingerprint
     FROM pseo_routes
     WHERE is_published = FALSE AND COALESCE(quality_status, 'pending') = 'pending'`
  );
  const publishedKeys = new Set(published.map(searchIntentFingerprint));
  const result = {
    published: published.length,
    pending: pending.length,
    publishedDuplicateIntents: countDuplicates(published),
    pendingDuplicateIntents: countDuplicates(pending),
    pendingWithPublishedSibling: pending.filter((row) => publishedKeys.has(searchIntentFingerprint(row))).length,
    publishedFingerprintMismatch: published.filter((row) => row.content_fingerprint !== searchIntentFingerprint(row)).length,
  };
  console.log(JSON.stringify(result, null, 2));
  if (Object.entries(result).some(([key, value]) => key !== 'published' && key !== 'pending' && value > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
