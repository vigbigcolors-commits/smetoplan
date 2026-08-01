import { query } from '@/lib/db';
import type {
  MarketFeed,
  MarketQuotesPayload,
  QuoteSku,
  QuoteSource,
  SupplierBadge,
  SupplierKind,
  SupplierQuoteRow,
  SupplierWithQuotes,
} from '@/domain/markets/suppliers';

interface SupplierDb {
  id: number;
  slug: string;
  name: string;
  kind: SupplierKind;
  region_id: string;
  city: string | null;
  url: string | null;
  phone: string | null;
  email: string | null;
  featured: boolean;
  badge: SupplierBadge | null;
  is_active: boolean;
}

interface QuoteDb {
  id: number;
  supplier_id: number;
  sku: QuoteSku;
  grade: string | null;
  price_rub: string | number;
  currency: string;
  fetched_at: Date | string;
  source: QuoteSource;
  note: string | null;
}

function mapQuote(row: QuoteDb): SupplierQuoteRow {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    sku: row.sku,
    grade: row.grade || null,
    priceRub: Number(row.price_rub),
    currency: row.currency,
    fetchedAt:
      typeof row.fetched_at === 'string'
        ? row.fetched_at
        : row.fetched_at.toISOString(),
    source: row.source,
    note: row.note,
  };
}

/**
 * Load active suppliers + latest quotes for a region.
 * Returns honest empty payload when DB is empty / unavailable.
 */
export async function loadMarketQuotes(regionId: string): Promise<MarketQuotesPayload> {
  const empty: MarketQuotesPayload = {
    regionId,
    asOf: null,
    suppliers: [],
    empty: true,
    message:
      'Котировок заводов пока нет. Показан ориентир Smetoplan — не прайс конкретного РБУ.',
  };

  try {
    const { rows: suppliers } = await query<SupplierDb>(
      `SELECT id, slug, name, kind, region_id, city, url, phone, email,
              featured, badge, is_active
       FROM suppliers
       WHERE is_active = TRUE
         AND region_id = $1
         AND name NOT ILIKE '%демо%'
         AND name NOT ILIKE '%demo%'
         AND COALESCE(url, '') NOT ILIKE '%example.com%'
       ORDER BY featured DESC, kind, name`,
      [regionId],
    );

    if (suppliers.length === 0) return empty;

    const ids = suppliers.map((s) => s.id);
    const { rows: quotes } = await query<QuoteDb>(
      `SELECT DISTINCT ON (supplier_id, sku, grade)
              id, supplier_id, sku, grade, price_rub, currency, fetched_at, source, note
       FROM supplier_quotes
       WHERE supplier_id = ANY($1::bigint[])
       ORDER BY supplier_id, sku, grade, fetched_at DESC`,
      [ids],
    );

    const bySupplier = new Map<number, SupplierQuoteRow[]>();
    for (const q of quotes) {
      const list = bySupplier.get(q.supplier_id) ?? [];
      list.push(mapQuote(q));
      bySupplier.set(q.supplier_id, list);
    }

    const result: SupplierWithQuotes[] = suppliers.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      kind: s.kind,
      regionId: s.region_id,
      city: s.city,
      url: s.url,
      phone: s.phone,
      email: s.email,
      featured: Boolean(s.featured),
      badge: s.badge,
      isActive: s.is_active,
      quotes: bySupplier.get(s.id) ?? [],
    }));

    const withQuotes = result.filter((s) => s.quotes.length > 0);
    if (withQuotes.length === 0) return empty;

    let asOf: string | null = null;
    const times = withQuotes.flatMap((s) => s.quotes.map((q) => q.fetchedAt));
    if (times.length) {
      asOf = times.sort().at(-1)!.slice(0, 10);
    }

    return {
      regionId,
      asOf,
      suppliers: withQuotes,
      empty: false,
      message: `Котировки поставщиков на ${asOf ?? '—'}. Смета в калькуляторе остаётся на ориентире Smetoplan.`,
    };
  } catch {
    return empty;
  }
}

export interface RegionMedianRow {
  regionId: string;
  concretePerM3: number | null;
  rebarPerTon: number | null;
  formworkPerM2: number | null;
  sandPerTon: number | null;
  gravelPerTon: number | null;
  sampleNConcrete: number;
  sampleNRebar: number;
  asOf: string;
}

export interface IngestResult {
  suppliersUpserted: number;
  quotesUpserted: number;
  asOf: string;
  source: string;
  medians?: RegionMedianRow[];
}

export async function ingestMarketFeed(
  feed: MarketFeed,
  sourceLabel: string,
): Promise<IngestResult> {
  let suppliersUpserted = 0;
  let quotesUpserted = 0;
  const asOf = feed.asOf || new Date().toISOString().slice(0, 10);
  const fetchedAt = `${asOf}T12:00:00.000Z`;
  const activeSlugs: string[] = [];

  for (const s of feed.suppliers) {
    if (!s.slug || !s.name || !s.regionId || !s.kind) continue;
    activeSlugs.push(s.slug);

    const { rows } = await query<{ id: number }>(
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

    for (const q of s.quotes ?? []) {
      if (!q.sku || !(q.priceRub >= 0)) continue;
      await query(
        `INSERT INTO supplier_quotes
           (supplier_id, sku, grade, price_rub, currency, fetched_at, source, note)
         VALUES ($1, $2, $3, $4, 'RUB', $5::timestamptz, 'feed', $6)
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
    await query(`UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE is_active = TRUE`);
  } else {
    await query(
      `UPDATE suppliers SET is_active = FALSE, updated_at = NOW()
       WHERE is_active = TRUE AND NOT (slug = ANY($1::text[]))`,
      [activeSlugs],
    );
  }

  await query(
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

  let medians: RegionMedianRow[] = [];
  try {
    medians = await refreshRegionPriceMedians(asOf);
  } catch (err) {
    console.warn(
      'region_price_medians refresh skipped:',
      err instanceof Error ? err.message : err
    );
  }

  return {
    suppliersUpserted,
    quotesUpserted,
    asOf,
    source: sourceLabel,
    medians,
  };
}

function medianSqlNums(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return Math.round(nums[mid]);
  return Math.round((nums[mid - 1] + nums[mid]) / 2);
}

/** Recompute regional medians from latest supplier_quotes and upsert. */
export async function refreshRegionPriceMedians(
  asOf = new Date().toISOString().slice(0, 10)
): Promise<RegionMedianRow[]> {
  const { rows } = await query<{
    region_id: string;
    sku: string;
    price_rub: string | number;
  }>(
    `SELECT s.region_id, q.sku, q.price_rub::float AS price_rub
     FROM supplier_quotes q
     JOIN suppliers s ON s.id = q.supplier_id
     WHERE s.is_active = TRUE
       AND q.fetched_at > NOW() - INTERVAL '45 days'`
  );

  const byRegion = new Map<string, Record<string, number[]>>();
  for (const r of rows) {
    const bag = byRegion.get(r.region_id) ?? {
      concrete_m3: [],
      rebar_ton: [],
      formwork_m2: [],
      sand_ton: [],
      gravel_ton: [],
    };
    const key = r.sku;
    if (key in bag) bag[key].push(Number(r.price_rub));
    byRegion.set(r.region_id, bag);
  }

  const out: RegionMedianRow[] = [];
  for (const [regionId, bag] of byRegion) {
    const concretePerM3 = medianSqlNums(bag.concrete_m3 || []);
    const rebarPerTon = medianSqlNums(bag.rebar_ton || []);
    const formworkPerM2 = medianSqlNums(bag.formwork_m2 || []);
    const sandPerTon = medianSqlNums(bag.sand_ton || []);
    const gravelPerTon = medianSqlNums(bag.gravel_ton || []);
    if (
      concretePerM3 == null &&
      rebarPerTon == null &&
      formworkPerM2 == null
    ) {
      continue;
    }
    await query(
      `INSERT INTO region_price_medians
         (region_id, concrete_per_m3, rebar_per_ton, formwork_per_m2, sand_per_ton, gravel_per_ton,
          sample_n_concrete, sample_n_rebar, as_of, source, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,'supplier_quotes_median',NOW())
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
         updated_at = NOW()`,
      [
        regionId,
        concretePerM3,
        rebarPerTon,
        formworkPerM2,
        sandPerTon,
        gravelPerTon,
        (bag.concrete_m3 || []).length,
        (bag.rebar_ton || []).length,
        asOf,
      ]
    );
    out.push({
      regionId,
      concretePerM3,
      rebarPerTon,
      formworkPerM2,
      sandPerTon,
      gravelPerTon,
      sampleNConcrete: (bag.concrete_m3 || []).length,
      sampleNRebar: (bag.rebar_ton || []).length,
      asOf,
    });
  }
  return out;
}

export async function loadRegionMedianFromDb(
  regionId: string
): Promise<RegionMedianRow | null> {
  try {
    const { rows } = await query<{
      region_id: string;
      concrete_per_m3: string | number | null;
      rebar_per_ton: string | number | null;
      formwork_per_m2: string | number | null;
      sand_per_ton: string | number | null;
      gravel_per_ton: string | number | null;
      sample_n_concrete: number;
      sample_n_rebar: number;
      as_of: Date | string;
    }>(
      `SELECT region_id, concrete_per_m3, rebar_per_ton, formwork_per_m2, sand_per_ton, gravel_per_ton,
              sample_n_concrete, sample_n_rebar, as_of
       FROM region_price_medians WHERE region_id = $1`,
      [regionId]
    );
    const r = rows[0];
    if (!r) return null;
    const asOf =
      typeof r.as_of === 'string' ? r.as_of.slice(0, 10) : r.as_of.toISOString().slice(0, 10);
    return {
      regionId: r.region_id,
      concretePerM3: r.concrete_per_m3 != null ? Number(r.concrete_per_m3) : null,
      rebarPerTon: r.rebar_per_ton != null ? Number(r.rebar_per_ton) : null,
      formworkPerM2: r.formwork_per_m2 != null ? Number(r.formwork_per_m2) : null,
      sandPerTon: r.sand_per_ton != null ? Number(r.sand_per_ton) : null,
      gravelPerTon: r.gravel_per_ton != null ? Number(r.gravel_per_ton) : null,
      sampleNConcrete: r.sample_n_concrete,
      sampleNRebar: r.sample_n_rebar,
      asOf,
    };
  } catch {
    return null;
  }
}
