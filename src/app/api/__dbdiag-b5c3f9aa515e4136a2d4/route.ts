import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const raw = process.env.DATABASE_URL || '';
  let host = '';
  let database = '';

  try {
    const u = new URL(raw);
    host = u.hostname;
    database = u.pathname.replace(/^\/+/, '');
  } catch {}

  try {
    const meta = await query(`
      SELECT
        current_database() AS db,
        to_regclass('public.pseo_routes')::text AS pseo,
        to_regclass('public.schema_migrations')::text AS migrations
    `);

    let counts = {};

    if (meta.rows[0]?.pseo) {
      const c = await query(`
        SELECT
          count(*) FILTER (
            WHERE is_published=true AND quality_status='ok'
          )::int AS published,
          count(*) FILTER (
            WHERE is_published=false
              AND coalesce(quality_status,'pending')='pending'
          )::int AS pending,
          count(*) FILTER (
            WHERE quality_status='rejected'
          )::int AS rejected,
          count(*)::int AS total
        FROM pseo_routes
      `);

      counts = c.rows[0];
    }

    return NextResponse.json({
      marker: 'b5c3f9aa515e4136a2d4',
      present: Boolean(raw),
      host,
      database,
      ...meta.rows[0],
      ...counts
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (e) {
    return NextResponse.json({
      marker: 'b5c3f9aa515e4136a2d4',
      present: Boolean(raw),
      host,
      database,
      error: e instanceof Error ? e.message : 'DB_ERROR'
    }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}