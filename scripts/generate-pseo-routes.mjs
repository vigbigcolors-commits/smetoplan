/**
 * Generates a large corpus of unpublished PSEO routes into PostgreSQL.
 * Usage: node --env-file=.env.local scripts/generate-pseo-routes.mjs
 *
 * Routes stay is_published=false until /api/cron/drip-feed activates 200–300/day.
 */
import pg from 'pg';

const { Client } = pg;

const STRUCTURES = [
  {
    type: 'slab',
    formula: 'slab_volume',
    slugPart: 'plitnogo-fundamenta',
    label: 'плитного фундамента',
    depths: [0.25, 0.3, 0.35, 0.4, 0.45],
    sizes: [
      [6, 6], [8, 6], [8, 8], [10, 8], [10, 10], [12, 8], [12, 10], [12, 12],
      [14, 10], [14, 12], [15, 10], [16, 12], [18, 12], [20, 12],
    ],
  },
  {
    type: 'strip',
    formula: 'strip_volume',
    slugPart: 'lentochnogo-fundamenta',
    label: 'ленточного фундамента',
    depths: [0.7, 0.8, 0.9, 1.0, 1.2],
    sizes: [
      [8, 6], [10, 8], [12, 9], [12, 10], [15, 10], [15, 12], [16, 12], [18, 12],
    ],
  },
  {
    type: 'pier',
    formula: 'pier_volume',
    slugPart: 'svajnogo-fundamenta',
    label: 'свайного фундамента',
    depths: [1.0, 1.2, 1.5, 1.8],
    sizes: [
      [8, 6], [10, 8], [12, 8], [12, 10], [14, 10], [15, 12],
    ],
  },
  {
    type: 'beam',
    formula: 'beam_volume',
    slugPart: 'monolitnoj-balki',
    label: 'монолитной балки',
    depths: [0.4, 0.5, 0.6, 0.7],
    sizes: [
      [4, 0.3], [5, 0.35], [6, 0.4], [7, 0.4], [8, 0.45], [9, 0.5],
    ],
  },
  {
    type: 'wall',
    formula: 'wall_volume',
    slugPart: 'podpornoj-steny',
    label: 'подпорной стены',
    depths: [1.5, 2.0, 2.5, 3.0],
    sizes: [
      [6, 0.25], [8, 0.3], [10, 0.3], [12, 0.35], [15, 0.4],
    ],
  },
];

const GRADES = ['M200', 'M250', 'M300', 'M350'];
const REBARS = [
  { d: 10, step: 200, layers: 1 },
  { d: 12, step: 200, layers: 2 },
  { d: 14, step: 150, layers: 2 },
  { d: 16, step: 150, layers: 2 },
  { d: 0, step: 0, layers: 0 },
];
const INTENTS = [
  { cluster: 'kalkulyator', verb: 'Калькулятор' },
  { cluster: 'raschet', verb: 'Расчёт' },
  { cluster: 'smeta', verb: 'Смета' },
  { cluster: 'online', verb: 'Онлайн-расчёт' },
];
const REGIONS = ['moskva', 'spb', 'kazan', 'ekaterinburg', 'novosibirsk'];
// null region removed — gate ALWAYS requires resolvePseoRegion (PSEO_REQUIRE_REGION)

function materialSku(grade) {
  return `BET-${grade}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  const rows = [];
  let layout = 1;

  for (const st of STRUCTURES) {
    for (const [L, W] of st.sizes) {
      for (const H of st.depths) {
        for (const grade of GRADES) {
          for (const rb of REBARS) {
            for (const intent of INTENTS) {
              for (const region of REGIONS) {
                const dimSlug = `${L}x${W}x${String(H).replace('.', '-')}`;
                const rebarSlug =
                  rb.layers === 0
                    ? 'bez-armatury'
                    : `armatura-${rb.d}-s${rb.step}-l${rb.layers}`;
                const regionSlug = region ? `-${region}` : '';
                const slug =
                  `${intent.cluster}-${st.slugPart}-${dimSlug}-${grade.toLowerCase()}-${rebarSlug}${regionSlug}`
                    .replace(/_/g, '-')
                    .slice(0, 480);

                const showRebar = rb.layers > 0;
                const title =
                  `${intent.verb} ${st.label} ${L}×${W} м ${grade}` +
                  (showRebar ? ` арматура Ø${rb.d}` : ' без армирования') +
                  (region ? ` ${region}` : '') +
                  ' | Smetoplan';
                const h1 = `${intent.verb} ${st.label} ${L}×${W} м`;
                const description =
                  `${intent.verb} ${st.label} ${L}×${W}×${H} м (${grade}): ` +
                  `объём бетона${showRebar ? `, арматура Ø${rb.d}` : ''}, опалубка и смета онлайн.`;

                const params = {
                  length: L,
                  width: W,
                  depth: H,
                  grade,
                  rebar_d: rb.d,
                  rebar_step: rb.step,
                  layers: rb.layers,
                  pW: st.type === 'slab' ? 0.5 : st.type === 'strip' ? 0.4 : st.type === 'pier' ? 0.4 : 0,
                  pH: st.type === 'slab' ? 0.3 : st.type === 'pier' ? 0.4 : 0,
                };

                rows.push({
                  slug,
                  structure_type: st.type,
                  intent_cluster: intent.cluster,
                  title_template: title,
                  h1_template: h1,
                  description,
                  params,
                  layout_variant: layout,
                  show_rebar: showRebar,
                  show_bom: true,
                  show_cad: true,
                  show_ai: layout !== 4,
                  show_contractors: intent.cluster !== 'smeta' || layout % 2 === 0,
                  region_slug: region,
                  material_sku: materialSku(grade),
                  formula_code: st.formula,
                  priority: 40 + (layout * 3) + (showRebar ? 5 : 0),
                });

                layout = layout === 5 ? 1 : layout + 1;
              }
            }
          }
        }
      }
    }
  }

  console.log(`Prepared ${rows.length} routes. Upserting in batches...`);

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let p = 1;

    for (const r of batch) {
      values.push(
        `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++}::jsonb,$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},FALSE,NULL)`
      );
      params.push(
        r.slug,
        r.structure_type,
        r.intent_cluster,
        r.title_template,
        r.h1_template,
        r.description,
        JSON.stringify(r.params),
        r.layout_variant,
        r.show_rebar,
        r.show_bom,
        r.show_cad,
        r.show_ai,
        r.show_contractors,
        r.region_slug,
        r.material_sku,
        r.formula_code,
        r.priority
      );
    }

    const sql = `
      INSERT INTO pseo_routes (
        slug, structure_type, intent_cluster, title_template, h1_template, description,
        params, layout_variant, show_rebar, show_bom, show_cad, show_ai, show_contractors,
        region_slug, material_sku, formula_code, priority, is_published, publish_date
      ) VALUES ${values.join(',')}
      ON CONFLICT (slug) DO NOTHING
    `;

    const res = await client.query(sql, params);
    inserted += res.rowCount || 0;
    process.stdout.write(`\rBatch ${Math.floor(i / batchSize) + 1}: +${res.rowCount} (total new ${inserted})`);
  }

  const count = await client.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE is_published)::int AS published
     FROM pseo_routes`
  );
  console.log('\nDone.', count.rows[0]);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
