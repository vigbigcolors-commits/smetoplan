import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MetaRow = {
  pseo: string | null;
  migrations: string | null;
};

type CountRow = {
  published: number;
  pending: number;
  rejected: number;
  total: number;
};

export async function GET() {
  try {
    const meta = await query<MetaRow>(`
      SELECT
        to_regclass('public.pseo_routes')::text AS pseo,
        to_regclass('public.schema_migrations')::text AS migrations
    `);

    if (!meta.rows[0]?.pseo) {
      return NextResponse.json({
        marker: 'smetoplan-prod-check-20260928',
        pseo: false,
        migrations: meta.rows[0]?.migrations ?? null
      });
    }

    const counts = await query<CountRow>(`
      SELECT
        count(*) FILTER (
          WHERE is_published = true AND quality_status = 'ok'
        )::int AS published,
        count(*) FILTER (
          WHERE is_published = false
            AND coalesce(quality_status,'pending') = 'pending'
        )::int AS pending,
        count(*) FILTER (
          WHERE quality_status = 'rejected'
        )::int AS rejected,
        count(*)::int AS total
      FROM pseo_routes
    `);

    return NextResponse.json({
      marker: 'smetoplan-prod-check-20260928',
      pseo: true,
      migrations: meta.rows[0]?.migrations ?? null,
      ...counts.rows[0]
    });
  } catch {
    return NextResponse.json(
      {
        marker: 'smetoplan-prod-check-20260928',
        error: 'DB_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}
