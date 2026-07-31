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

export interface IngestResult {
  suppliersUpserted: number;
  quotesUpserted: number;
  asOf: string;
  source: string;
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

  return { suppliersUpserted, quotesUpserted, asOf, source: sourceLabel };
}
