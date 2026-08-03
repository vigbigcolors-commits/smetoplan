/**
 * Quality-first PSEO corpus → PostgreSQL (unpublished until drip).
 * Usage: node --env-file=.env.local scripts/generate-pseo-routes.mjs
 *
 * Rules (10/10 anti-thin):
 * - ONE intent cluster (kalkulyator) — no doorway clones
 * - Region required, only canonical price regions (no phantom cities)
 * - Reinforcement required
 * - Russian region labels in title/H1/description
 * - Curated size grid (not full cartesian explosion)
 */
import pg from 'pg';

const { Client } = pg;

const REGIONS = [
  { slug: 'moskva', label: 'Москва и МО', locative: 'в Москве и МО' },
  { slug: 'spb', label: 'Санкт-Петербург и ЛО', locative: 'в Санкт-Петербурге и ЛО' },
  { slug: 'krasnodar', label: 'Краснодарский край', locative: 'в Краснодарском крае' },
  { slug: 'ekaterinburg', label: 'Екатеринбург / Урал', locative: 'в Екатеринбурге' },
  { slug: 'novosibirsk', label: 'Новосибирск / Сибирь', locative: 'в Новосибирске' },
];

const STRUCTURES = [
  {
    type: 'slab',
    formula: 'slab_volume',
    slugPart: 'plitnogo-fundamenta',
    label: 'плитного фундамента',
    depths: [0.3, 0.35, 0.4],
    sizes: [
      [8, 6], [8, 8], [10, 8], [10, 10], [12, 8], [12, 10], [14, 10], [16, 12],
    ],
  },
  {
    type: 'strip',
    formula: 'strip_volume',
    slugPart: 'lentochnogo-fundamenta',
    label: 'ленточного фундамента',
    depths: [0.8, 1.0, 1.2],
    sizes: [
      [10, 8], [12, 9], [12, 10], [15, 10], [15, 12], [16, 12],
    ],
  },
  {
    type: 'pier',
    formula: 'pier_volume',
    slugPart: 'svajnogo-fundamenta',
    label: 'свайного фундамента',
    depths: [1.2, 1.5],
    sizes: [
      [10, 8], [12, 8], [12, 10], [14, 10],
    ],
  },
  {
    type: 'beam',
    formula: 'beam_volume',
    slugPart: 'monolitnoj-balki',
    label: 'монолитной балки',
    depths: [0.5, 0.6],
    sizes: [
      [5, 0.35], [6, 0.4], [7, 0.4], [8, 0.45],
    ],
  },
  {
    type: 'wall',
    formula: 'wall_volume',
    slugPart: 'podpornoj-steny',
    label: 'подпорной стены',
    depths: [2.0, 2.5],
    sizes: [
      [8, 0.3], [10, 0.3], [12, 0.35], [15, 0.4],
    ],
  },
];

const GRADES = ['M250', 'M300', 'M350'];
const REBARS = [
  { d: 12, step: 200, layers: 2 },
  { d: 14, step: 150, layers: 2 },
  { d: 16, step: 150, layers: 2 },
];

/** Single intent — prevents 4× doorway duplicates for the same calc. */
const INTENT = { cluster: 'kalkulyator', verb: 'Калькулятор' };

function materialSku(grade) {
  return `BET-${grade}`;
}

function priorityFor(regionSlug, grade, showRebar, L, W) {
  let p = 50;
  if (regionSlug === 'moskva') p += 20;
  else if (regionSlug === 'spb') p += 12;
  else if (regionSlug === 'krasnodar') p += 8;
  if (grade === 'M300') p += 8;
  if (showRebar) p += 5;
  if ((L === 12 && W === 8) || (L === 10 && W === 8) || (L === 15 && W === 10)) p += 10;
  return p;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: url.includes('neon.tech') ? { rejectUnauthorized: false } : undefined });
  await client.connect();

  const rows = [];
  let layout = 1;

  for (const st of STRUCTURES) {
    for (const [L, W] of st.sizes) {
      for (const H of st.depths) {
        for (const grade of GRADES) {
          for (const rb of REBARS) {
            for (const region of REGIONS) {
              const dimSlug = `${L}x${W}x${String(H).replace('.', '-')}`;
              const rebarSlug = `armatura-${rb.d}-s${rb.step}-l${rb.layers}`;
              const slug =
                `${INTENT.cluster}-${st.slugPart}-${dimSlug}-${grade.toLowerCase()}-${rebarSlug}-${region.slug}`
                  .replace(/_/g, '-')
                  .slice(0, 480);

              const title =
                `${INTENT.verb} ${st.label} ${L}×${W}×${H} м ${grade} арматура Ø${rb.d} — ${region.label} | Smetoplan`;
              const h1 = `${INTENT.verb} ${st.label} ${L}×${W}×${H} м — ${region.label}`;
              const description =
                `${INTENT.verb} ${st.label} ${L}×${W}×${H} м (${grade}), арматура Ø${rb.d} шаг ${rb.step} мм, ` +
                `${rb.layers} слоя: объём бетона, опалубка и смета ${region.locative}. ` +
                `Справочные цены Smetoplan, не оферта РБУ. Методика и disclaimer на сайте.`;

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
                intent_cluster: INTENT.cluster,
                title_template: title,
                h1_template: h1,
                description,
                params,
                layout_variant: layout,
                show_rebar: true,
                show_bom: true,
                show_cad: true,
                show_ai: layout !== 4,
                show_contractors: true,
                region_slug: region.slug,
                material_sku: materialSku(grade),
                formula_code: st.formula,
                priority: priorityFor(region.slug, grade, true, L, W),
              });

              layout = layout === 5 ? 1 : layout + 1;
            }
          }
        }
      }
    }
  }

  console.log(`Prepared ${rows.length} quality routes. Upserting…`);

  // Drop legacy doorway / phantom-city drafts so they cannot drip.
  await client.query(`
    UPDATE pseo_routes
    SET quality_status = 'rejected',
        is_published = FALSE,
        updated_at = NOW()
    WHERE is_published = FALSE
      AND (
        region_slug IS NULL
        OR region_slug = 'kazan'
        OR intent_cluster IN ('raschet', 'smeta', 'online')
        OR slug LIKE '%bez-armatury%'
      )
  `);

  // Re-queue false-positive rejects after title/depth harden (keep true thin shells out).
  await client.query(`
    UPDATE pseo_routes
    SET quality_status = 'pending',
        updated_at = NOW()
    WHERE quality_status = 'rejected'
      AND is_published = FALSE
      AND region_slug IS NOT NULL
      AND region_slug <> 'kazan'
      AND intent_cluster = 'kalkulyator'
      AND slug NOT LIKE '%bez-armatury%'
  `);

  const batchSize = 400;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let p = 1;

    for (const r of batch) {
      values.push(
        `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++}::jsonb,$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},FALSE,NULL,'pending')`
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
        region_slug, material_sku, formula_code, priority, is_published, publish_date, quality_status
      ) VALUES ${values.join(',')}
      ON CONFLICT (slug) DO UPDATE SET
        title_template = EXCLUDED.title_template,
        h1_template = EXCLUDED.h1_template,
        description = EXCLUDED.description,
        params = EXCLUDED.params,
        region_slug = EXCLUDED.region_slug,
        priority = EXCLUDED.priority,
        quality_status = CASE
          WHEN pseo_routes.is_published THEN pseo_routes.quality_status
          ELSE 'pending'
        END,
        updated_at = NOW()
    `;

    const res = await client.query(sql, params);
    inserted += res.rowCount || 0;
    process.stdout.write(`\rBatch ${Math.floor(i / batchSize) + 1}: upserted ${inserted}`);
  }

  const count = await client.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE is_published)::int AS published,
            COUNT(*) FILTER (WHERE COALESCE(quality_status,'pending')='pending' AND NOT is_published)::int AS pending,
            COUNT(*) FILTER (WHERE quality_status='rejected')::int AS rejected
     FROM pseo_routes`
  );
  console.log('\nDone.', count.rows[0]);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
