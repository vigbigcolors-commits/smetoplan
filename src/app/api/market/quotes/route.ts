import { NextResponse } from 'next/server';
import { loadMarketQuotes } from '@/lib/market-quotes';
import { PRICE_REGIONS, type PriceRegionId } from '@/domain/norms/tables';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get('region') || 'moscow') as PriceRegionId;

  if (!(region in PRICE_REGIONS)) {
    return NextResponse.json(
      { error: 'Unknown region', known: Object.keys(PRICE_REGIONS) },
      { status: 400 },
    );
  }

  const payload = await loadMarketQuotes(region);
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
