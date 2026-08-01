import { NextResponse } from 'next/server';
import { PRICE_REGIONS, type PriceRegionId } from '@/domain/norms/tables';
import { loadRegionMedianFromDb } from '@/lib/market-quotes';
import {
  getRegionalPricesWithMedian,
  PRICE_BAND_DISCLAIMER,
  PRICE_BAND_HIGH_PCT,
  PRICE_BAND_LOW_PCT,
} from '@/lib/region-medians';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Median unit prices for a region (from DB if cron ran, else JSON /ceny overlay).
 * Used by calculator «подставить среднюю с /ceny».
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get('region') || 'moscow') as PriceRegionId;

  if (!(region in PRICE_REGIONS)) {
    return NextResponse.json(
      { error: 'Unknown region', known: Object.keys(PRICE_REGIONS) },
      { status: 400 }
    );
  }

  const fileMedian = getRegionalPricesWithMedian(region);
  const dbMedian = await loadRegionMedianFromDb(region);

  const prices = {
    concretePerM3:
      dbMedian?.concretePerM3 ?? fileMedian.concretePerM3,
    rebarPerTon: dbMedian?.rebarPerTon ?? fileMedian.rebarPerTon,
    formworkPerM2:
      dbMedian?.formworkPerM2 ?? fileMedian.formworkPerM2,
    sandPerTon: dbMedian?.sandPerTon ?? fileMedian.sandPerTon,
    gravelPerTon: dbMedian?.gravelPerTon ?? fileMedian.gravelPerTon,
  };

  return NextResponse.json(
    {
      regionId: region,
      regionLabel: PRICE_REGIONS[region].label,
      asOf: dbMedian?.asOf ?? fileMedian.asOf,
      source: dbMedian ? 'db_median' : fileMedian.source,
      sampleN: {
        concrete: dbMedian?.sampleNConcrete ?? fileMedian.sampleN.concrete,
        rebar: dbMedian?.sampleNRebar ?? fileMedian.sampleN.rebar,
      },
      prices,
      bandPct: { low: PRICE_BAND_LOW_PCT, high: PRICE_BAND_HIGH_PCT },
      disclaimer: PRICE_BAND_DISCLAIMER,
      cenyPath: `/ceny/${region === 'moscow' ? 'moskva' : region === 'spb' ? 'sankt-peterburg' : region}`,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    }
  );
}
