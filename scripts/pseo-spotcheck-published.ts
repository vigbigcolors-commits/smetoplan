/**
 * Spot-check published PSEO via full evaluatePseoIndexability (gate + live snapshot).
 * Usage: npx tsx --env-file=.env.local scripts/pseo-spotcheck-published.ts
 */
import { query } from '../src/lib/db';
import {
  evaluatePseoIndexability,
  routeToGateInput,
} from '../src/lib/pseo-quality';
import type { PseoRoute, StructureType } from '../src/lib/types';

const SAMPLE = Math.max(20, Math.min(200, Number(process.env.PSEO_SPOT_N || 80)));

async function main() {
  const { rows: stats } = await query<{
    published: number;
    pending: number;
    rejected: number;
    by_structure: string;
    by_intent: string;
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE is_published AND quality_status='ok')::int AS published,
      COUNT(*) FILTER (WHERE NOT is_published AND COALESCE(quality_status,'pending')='pending')::int AS pending,
      COUNT(*) FILTER (WHERE quality_status='rejected')::int AS rejected,
      (
        SELECT string_agg(s || ':' || c::text, ', ' ORDER BY s)
        FROM (
          SELECT structure_type::text AS s, COUNT(*)::int AS c
          FROM pseo_routes
          WHERE is_published AND quality_status='ok'
          GROUP BY structure_type
        ) t
      ) AS by_structure,
      (
        SELECT string_agg(s || ':' || c::text, ', ' ORDER BY s)
        FROM (
          SELECT intent_cluster::text AS s, COUNT(*)::int AS c
          FROM pseo_routes
          WHERE is_published AND quality_status='ok'
          GROUP BY intent_cluster
        ) t
      ) AS by_intent
    FROM pseo_routes
  `);

  const { rows } = await query<{
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
  }>(
    `SELECT id, slug, structure_type, intent_cluster, title_template, h1_template,
            description, params, region_slug, show_rebar, show_bom, show_cad,
            show_ai, show_contractors, material_sku, formula_code, layout_variant,
            is_published, publish_date
     FROM pseo_routes
     WHERE is_published = TRUE AND quality_status = 'ok'
     ORDER BY random()
     LIMIT $1`,
    [SAMPLE]
  );

  let ok = 0;
  let fail = 0;
  const fails: Array<{ slug: string; why: string; vol?: number }> = [];
  const vols: number[] = [];

  for (const row of rows) {
    const route: PseoRoute = {
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

    const gate = evaluatePseoIndexability(routeToGateInput(route));
    if (!gate.ok) {
      fail += 1;
      fails.push({ slug: row.slug, why: gate.reason });
      continue;
    }
    ok += 1;
    vols.push(gate.snapshot.concreteVolumeM3);
  }

  console.log(
    JSON.stringify(
      {
        db: stats[0],
        spotSample: rows.length,
        ok,
        fail,
        volMin: vols.length ? Math.min(...vols) : null,
        volMax: vols.length ? Math.max(...vols) : null,
        fails: fails.slice(0, 20),
        verdict:
          fail === 0 && ok === rows.length
            ? 'PASS — published sample gate+calc clean'
            : 'FAIL — run pseo:remediate',
      },
      null,
      2
    )
  );
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
