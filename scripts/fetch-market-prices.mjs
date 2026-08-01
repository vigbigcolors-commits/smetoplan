/**
 * Fetch live public prices (allow-list parsers) → write JSON → upsert DB.
 * Usage: node --env-file=.env.local scripts/fetch-market-prices.mjs
 *
 * MARKET_FEED_URL — optional override (skip parsers, use remote JSON).
 * MARKET_SKIP_PARSE=1 — ingest only existing data/market-quotes.json
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { buildFeedFromPublicPrices } from './market-parsers/index.mjs';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCAL_FEED = path.join(ROOT, 'data', 'market-quotes.json');

async function loadFeed() {
  const url = process.env.MARKET_FEED_URL;
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MARKET_FEED_URL HTTP ${res.status}`);
    return { feed: await res.json(), source: url, audit: [] };
  }

  if (process.env.MARKET_SKIP_PARSE === '1') {
    const raw = fs.readFileSync(LOCAL_FEED, 'utf8');
    return { feed: JSON.parse(raw), source: 'data/market-quotes.json', audit: [] };
  }

  const { feed, audit } = await buildFeedFromPublicPrices();
  fs.writeFileSync(LOCAL_FEED, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
  return { feed, source: 'market-parsers+public-pages', audit };
}

async function ingest(client, feed, sourceLabel) {
  const asOf = feed.asOf || new Date().toISOString().slice(0, 10);
  const fetchedAt = new Date().toISOString();
  let suppliersUpserted = 0;
  let quotesUpserted = 0;
  const activeSlugs = [];

  for (const s of feed.suppliers || []) {
    if (!s.slug || !s.name || !s.regionId || !s.kind) continue;
    activeSlugs.push(s.slug);

    const { rows } = await client.query(
      `INSERT INTO suppliers
         (slug, name, kind, region_id, city, url, phone, email, featured, badge, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         kind = EXCLUDED.kind,
         region_id = EXCLUDED.region_id,
         city = EXCLUDED.city,
         url = EXCLUDED.url,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         featured = EXCLUDED.featured,
         badge = EXCLUDED.badge,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING id`,
      [
        s.slug,
        s.name,
        s.kind,
        s.regionId,
        s.city ?? null,
        s.url ?? null,
        s.phone ?? null,
        s.email ?? null,
        Boolean(s.featured),
        s.badge ?? null,
      ],
    );
    const supplierId = rows[0]?.id;
    if (!supplierId) continue;
    suppliersUpserted += 1;

    for (const q of s.quotes || []) {
      if (!q.sku || !(Number(q.priceRub) >= 0)) continue;
      await client.query(
        `INSERT INTO supplier_quotes
           (supplier_id, sku, grade, price_rub, currency, fetched_at, source, note)
         VALUES ($1, $2, $3, $4, 'RUB', $5::timestamptz, 'parse', $6)
         ON CONFLICT (supplier_id, sku, grade)
         DO UPDATE SET
           price_rub = EXCLUDED.price_rub,
           fetched_at = EXCLUDED.fetched_at,
           source = EXCLUDED.source,
           note = EXCLUDED.note`,
        [
          supplierId,
          q.sku,
          q.grade ?? '',
          q.priceRub,
          fetchedAt,
          q.note ?? null,
        ],
      );
      quotesUpserted += 1;
    }
  }

  if (activeSlugs.length === 0) {
    await client.query(
      `UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE is_active = TRUE`,
    );
  } else {
    await client.query(
      `UPDATE suppliers SET is_active = FALSE, updated_at = NOW()
       WHERE is_active = TRUE AND NOT (slug = ANY($1::text[]))`,
      [activeSlugs],
    );
  }

  await client.query(
    `INSERT INTO market_ingest_runs (as_of, suppliers_n, quotes_n, source, meta)
     VALUES ($1::date, $2, $3, $4, $5::jsonb)`,
    [
      asOf,
      suppliersUpserted,
      quotesUpserted,
      sourceLabel,
      JSON.stringify({ note: feed.note ?? null }),
    ],
  );

  return { suppliersUpserted, quotesUpserted, asOf, source: sourceLabel };
}

function median(nums) {
  const a = nums.filter((n) => Number.isFinite(n) && n > 0).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? Math.round(a[mid]) : Math.round((a[mid - 1] + a[mid]) / 2);
}

function buildMediansFile(feed) {
  const byRegion = {};
  for (const s of feed.suppliers || []) {
    if (!s.regionId) continue;
    const bag = byRegion[s.regionId] || {
      concrete: [],
      rebar: [],
      formwork: [],
      sand: [],
      gravel: [],
    };
    for (const q of s.quotes || []) {
      const p = Number(q.priceRub);
      if (q.sku === 'concrete_m3') bag.concrete.push(p);
      if (q.sku === 'rebar_ton') bag.rebar.push(p);
      if (q.sku === 'formwork_m2') bag.formwork.push(p);
      if (q.sku === 'sand_ton') bag.sand.push(p);
      if (q.sku === 'gravel_ton') bag.gravel.push(p);
    }
    byRegion[s.regionId] = bag;
  }

  const regions = {};
  for (const [regionId, bag] of Object.entries(byRegion)) {
    const concretePerM3 = median(bag.concrete);
    const rebarPerTon = median(bag.rebar);
    if (concretePerM3 == null && rebarPerTon == null) continue;
    regions[regionId] = {
      concretePerM3: concretePerM3 ?? undefined,
      rebarPerTon: rebarPerTon ?? undefined,
      formworkPerM2: median(bag.formwork) ?? undefined,
      sandPerTon: median(bag.sand) ?? undefined,
      gravelPerTon: median(bag.gravel) ?? undefined,
      sampleN: { concrete: bag.concrete.length, rebar: bag.rebar.length },
    };
  }

  return {
    asOf: feed.asOf || new Date().toISOString().slice(0, 10),
    note: 'Медианы публичных котировок /ceny. Не оферта РБУ. Слой сравнения + ориентир сметы.',
    bandPct: { low: 15, high: 25 },
    regions,
  };
}

async function refreshMediansDb(client, asOf) {
  try {
    await client.query(`
      INSERT INTO region_price_medians
        (region_id, concrete_per_m3, rebar_per_ton, formwork_per_m2, sand_per_ton, gravel_per_ton,
         sample_n_concrete, sample_n_rebar, as_of, source, updated_at)
      SELECT
        s.region_id,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.price_rub)
          FILTER (WHERE q.sku = 'concrete_m3'),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.price_rub)
          FILTER (WHERE q.sku = 'rebar_ton'),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.price_rub)
          FILTER (WHERE q.sku = 'formwork_m2'),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.price_rub)
          FILTER (WHERE q.sku = 'sand_ton'),
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.price_rub)
          FILTER (WHERE q.sku = 'gravel_ton'),
        COUNT(*) FILTER (WHERE q.sku = 'concrete_m3'),
        COUNT(*) FILTER (WHERE q.sku = 'rebar_ton'),
        $1::date,
        'supplier_quotes_median',
        NOW()
      FROM supplier_quotes q
      JOIN suppliers s ON s.id = q.supplier_id
      WHERE s.is_active = TRUE AND q.fetched_at > NOW() - INTERVAL '45 days'
      GROUP BY s.region_id
      ON CONFLICT (region_id) DO UPDATE SET
        concrete_per_m3 = EXCLUDED.concrete_per_m3,
        rebar_per_ton = EXCLUDED.rebar_per_ton,
        formwork_per_m2 = EXCLUDED.formwork_per_m2,
        sand_per_ton = EXCLUDED.sand_per_ton,
        gravel_per_ton = EXCLUDED.gravel_per_ton,
        sample_n_concrete = EXCLUDED.sample_n_concrete,
        sample_n_rebar = EXCLUDED.sample_n_rebar,
        as_of = EXCLUDED.as_of,
        source = EXCLUDED.source,
        updated_at = NOW()
    `, [asOf]);
    return true;
  } catch (err) {
    console.warn('region_price_medians upsert skipped:', err.message);
    return false;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const { feed, source, audit } = await loadFeed();
  const mediansPath = path.join(ROOT, 'data', 'region-price-medians.json');
  const mediansFile = buildMediansFile(feed);
  // Keep handbook fields filled when median missing for a sku
  for (const [rid, row] of Object.entries(mediansFile.regions)) {
    const prev = (() => {
      try {
        return JSON.parse(fs.readFileSync(mediansPath, 'utf8')).regions?.[rid];
      } catch {
        return null;
      }
    })();
    mediansFile.regions[rid] = {
      concretePerM3: row.concretePerM3 ?? prev?.concretePerM3 ?? 5500,
      rebarPerTon: row.rebarPerTon ?? prev?.rebarPerTon ?? 65000,
      formworkPerM2: row.formworkPerM2 ?? prev?.formworkPerM2 ?? 800,
      sandPerTon: row.sandPerTon ?? prev?.sandPerTon ?? 1200,
      gravelPerTon: row.gravelPerTon ?? prev?.gravelPerTon ?? 2000,
      sampleN: row.sampleN ?? prev?.sampleN ?? { concrete: 0, rebar: 0 },
    };
  }
  fs.writeFileSync(mediansPath, `${JSON.stringify(mediansFile, null, 2)}\n`, 'utf8');

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result = await ingest(client, feed, source);
    const mediansDb = await refreshMediansDb(client, result.asOf);
    console.log(JSON.stringify({ ok: true, ...result, mediansDb, audit, mediansPath }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
