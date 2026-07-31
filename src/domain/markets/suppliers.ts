/**
 * Supplier market quotes — real ingest only (no seeded fake plants).
 */

export type SupplierKind = 'rbu' | 'store' | 'wholesale';

export type QuoteSku =
  | 'concrete_m3'
  | 'rebar_ton'
  | 'formwork_m2'
  | 'sand_ton'
  | 'gravel_ton';

export type QuoteSource = 'feed' | 'parse' | 'manual';

export type SupplierBadge = 'known' | 'partner' | 'price_leader';

export interface SupplierRow {
  id: number;
  slug: string;
  name: string;
  kind: SupplierKind;
  regionId: string;
  city: string | null;
  url: string | null;
  phone: string | null;
  email: string | null;
  featured: boolean;
  badge: SupplierBadge | null;
  isActive: boolean;
}

export interface SupplierQuoteRow {
  id: number;
  supplierId: number;
  sku: QuoteSku;
  grade: string | null;
  priceRub: number;
  currency: string;
  fetchedAt: string;
  source: QuoteSource;
  note: string | null;
}

export interface SupplierWithQuotes extends SupplierRow {
  quotes: SupplierQuoteRow[];
}

export interface MarketQuotesPayload {
  regionId: string;
  asOf: string | null;
  suppliers: SupplierWithQuotes[];
  empty: boolean;
  message: string;
}

export interface VolumeInputs {
  concreteM3: number;
  rebarTon: number;
  formworkM2?: number;
}

export interface SupplierCostBreakdown {
  supplier: SupplierWithQuotes;
  concreteRub: number | null;
  rebarRub: number | null;
  formworkRub: number | null;
  totalRub: number | null;
  deltaToBenchmarkPct: number | null;
}

export interface MarketFeedQuote {
  sku: QuoteSku;
  grade?: string | null;
  priceRub: number;
  note?: string;
}

export interface MarketFeedSupplier {
  slug: string;
  name: string;
  kind: SupplierKind;
  regionId: string;
  city?: string;
  url?: string;
  phone?: string;
  email?: string;
  featured?: boolean;
  badge?: SupplierBadge | null;
  quotes: MarketFeedQuote[];
}

export interface MarketFeed {
  asOf: string;
  note?: string;
  suppliers: MarketFeedSupplier[];
}

export const SKU_LABELS: Record<QuoteSku, string> = {
  concrete_m3: 'Бетон, ₽/м³',
  rebar_ton: 'Арматура, ₽/т',
  formwork_m2: 'Опалубка, ₽/м²',
  sand_ton: 'Песок, ₽/т',
  gravel_ton: 'Щебень, ₽/т',
};

export const KIND_LABELS: Record<SupplierKind, string> = {
  rbu: 'РБУ',
  store: 'Магазин',
  wholesale: 'Опт',
};

export const BADGE_LABELS: Record<SupplierBadge, string> = {
  known: 'Известный в регионе',
  partner: 'Партнёр каталога',
  price_leader: 'Лучшая цена в фиде',
};

export function pickQuote(
  quotes: SupplierQuoteRow[],
  sku: QuoteSku,
  grade?: string | null,
): SupplierQuoteRow | undefined {
  if (grade) {
    const exact = quotes.find((q) => q.sku === sku && q.grade === grade);
    if (exact) return exact;
  }
  return quotes.find((q) => q.sku === sku);
}

export function costForSupplier(
  supplier: SupplierWithQuotes,
  volume: VolumeInputs,
  grade?: string | null,
): SupplierCostBreakdown {
  const c = pickQuote(supplier.quotes, 'concrete_m3', grade);
  const r = pickQuote(supplier.quotes, 'rebar_ton');
  const f = pickQuote(supplier.quotes, 'formwork_m2');

  const concreteRub =
    c && volume.concreteM3 > 0 ? c.priceRub * volume.concreteM3 : c ? 0 : null;
  const rebarRub = r && volume.rebarTon > 0 ? r.priceRub * volume.rebarTon : r ? 0 : null;
  const formworkRub =
    f && (volume.formworkM2 ?? 0) > 0
      ? f.priceRub * (volume.formworkM2 ?? 0)
      : f
        ? 0
        : null;

  const parts = [concreteRub, rebarRub, formworkRub].filter((x): x is number => x != null);
  const totalRub = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : null;

  return {
    supplier,
    concreteRub,
    rebarRub,
    formworkRub,
    totalRub,
    deltaToBenchmarkPct: null,
  };
}

export function withBenchmarkDelta(
  rows: SupplierCostBreakdown[],
  benchmarkTotal: number,
): SupplierCostBreakdown[] {
  if (!(benchmarkTotal > 0)) return rows;
  return rows.map((row) => ({
    ...row,
    deltaToBenchmarkPct:
      row.totalRub != null ? ((row.totalRub - benchmarkTotal) / benchmarkTotal) * 100 : null,
  }));
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function compareStats(rows: SupplierCostBreakdown[]): {
  minTotal: number | null;
  medianTotal: number | null;
  count: number;
} {
  const totals = rows.map((r) => r.totalRub).filter((x): x is number => x != null && x > 0);
  return {
    minTotal: totals.length ? Math.min(...totals) : null,
    medianTotal: median(totals),
    count: totals.length,
  };
}
