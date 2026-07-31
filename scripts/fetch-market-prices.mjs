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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const { feed, source, audit } = await loadFeed();
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result = await ingest(client, feed, source);
    console.log(JSON.stringify({ ok: true, ...result, audit }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
