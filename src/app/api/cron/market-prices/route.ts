import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { MarketFeed } from '@/domain/markets/suppliers';
import { ingestMarketFeed } from '@/lib/market-quotes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function loadFeed(): Promise<{ feed: MarketFeed; source: string }> {
  const url = process.env.MARKET_FEED_URL;
  if (url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`MARKET_FEED_URL HTTP ${res.status}`);
    return { feed: (await res.json()) as MarketFeed, source: url };
  }
  const file = path.join(process.cwd(), 'data', 'market-quotes.json');
  const raw = fs.readFileSync(file, 'utf8');
  return { feed: JSON.parse(raw) as MarketFeed, source: 'data/market-quotes.json' };
}

/**
 * Market prices cron: ingest feed + refresh region medians for calculator.
 * Auth: Authorization: Bearer $CRON_SECRET
 * Schedule (weekly Sunday 05:00 UTC example):
 *   0 5 * * 0 curl -H "Authorization: Bearer ..." /api/cron/market-prices
 * Daily ingest is also fine — medians recomputed each run.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const urlToken = new URL(request.url).searchParams.get('secret');

  if (token !== secret && urlToken !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { feed, source } = await loadFeed();
    const result = await ingestMarketFeed(feed, source);
    return NextResponse.json({
      ok: true,
      ...result,
      suppliersInFeed: feed.suppliers?.length ?? 0,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'market-prices ingest failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
