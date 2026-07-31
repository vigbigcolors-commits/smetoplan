import { NextResponse } from 'next/server';
import { dripFeedPublish } from '@/lib/pseo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily drip-feed cron.
 * Auth: Authorization: Bearer $CRON_SECRET
 * Schedule (host/cron): 0 4 * * * curl -H "Authorization: Bearer ..." /api/cron/drip-feed
 *
 * Publishes exactly 200–300 routes/day and writes sitemap_builds audit row.
 * Unpublished routes keep returning 404 from /kalkulyator/[slug].
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

  const min = Number(process.env.DRIP_MIN || 200);
  const max = Number(process.env.DRIP_MAX || 300);

  try {
    const result = await dripFeedPublish(min, max);
    return NextResponse.json({
      ok: true,
      published: result.published,
      rejected: result.rejected,
      rejectReasons: result.rejectReasons,
      range: [min, max],
      slugsSample: result.slugs.slice(0, 20),
      sitemapHint: 'Dynamic /sitemap.xml rebuilt on next crawl via DB query',
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'drip-feed failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
