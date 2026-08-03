/**
 * Unpublish ANY published route that fails the current quality gate.
 * Safety: thin / doorway / bad calc must leave the index.
 *
 * Usage: npx tsx --env-file=.env.local scripts/pseo-remediate-published.ts
 */
import { query } from '../src/lib/db';
import {
  evaluatePseoIndexability,
  normalizeTitle,
  paramsFingerprint,
  routeToGateInput,
  type PseoGateReason,
} from '../src/lib/pseo-quality';
import type { PseoRoute, StructureType } from '../src/lib/types';

type Row = {
  id: number;
  slug: string;
  structure_type: StructureType;
  intent_cluster: PseoRoute['intent_cluster'];
  title_template: string;
  h1_template: string;
  description: string;
  params: PseoRoute['params'];
  region_slug: string | null;
  show_rebar: boolean;
  show_bom: boolean;
  show_cad: boolean;
  show_ai: boolean;
  show_contractors: boolean;
  material_sku: string | null;
  formula_code: string | null;
  layout_variant: number;
  is_published: boolean;
  publish_date: Date | null;
};

function toRoute(row: Row): PseoRoute {
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

async function main() {
  const dry = process.env.PSEO_REMEDIATE_DRY === '1';
  const { rows } = await query<Row>(
    `SELECT id, slug, structure_type, intent_cluster, title_template, h1_template,
            description, params, region_slug, show_rebar, show_bom, show_cad,
            show_ai, show_contractors, material_sku, formula_code, layout_variant,
            is_published, publish_date
     FROM pseo_routes
     WHERE is_published = TRUE
     ORDER BY id ASC`
  );

  const keepFingerprints = new Set<string>();
  const keepTitles = new Set<string>();
  const toReject: Array<{ id: number; reason: string }> = [];
  const reasons: Record<string, number> = {};
  let keep = 0;

  for (const row of rows) {
    const gate = evaluatePseoIndexability(
      routeToGateInput(toRoute(row)),
      keepFingerprints,
      keepTitles
    );
    if (!gate.ok) {
      toReject.push({ id: row.id, reason: gate.reason });
      reasons[gate.reason] = (reasons[gate.reason] || 0) + 1;
      continue;
    }
    keepFingerprints.add(gate.fingerprint);
    keepTitles.add(normalizeTitle(row.title_template || row.h1_template));
    keep += 1;
  }

  console.log(
    JSON.stringify(
      {
        scanned: rows.length,
        keep,
        unpublish: toReject.length,
        reasons,
        dry,
        sampleRejects: toReject.slice(0, 12).map((r) => ({
          id: r.id,
          reason: r.reason,
          slug: rows.find((x) => x.id === r.id)?.slug,
        })),
      },
      null,
      2
    )
  );

  if (dry || toReject.length === 0) {
    process.exit(0);
    return;
  }

  // Batch unpublish + reject (no bulk publish ever).
  const ids = toReject.map((r) => r.id);
  const chunk = 500;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    await query(
      `UPDATE pseo_routes
       SET is_published = FALSE,
           publish_date = NULL,
           quality_status = 'rejected',
           content_fingerprint = NULL,
           updated_at = NOW()
       WHERE id = ANY($1::bigint[])
         AND is_published = TRUE`,
      [slice]
    );
  }

  const { rows: after } = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM pseo_routes
     WHERE is_published = TRUE AND quality_status = 'ok'`
  );

  console.log(
    JSON.stringify({
      done: true,
      unpublished: toReject.length,
      publishedOkAfter: after[0]?.n ?? 0,
      note: 'Index now contains only gate-passing routes. Refill via pseo:publish-safe.',
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
