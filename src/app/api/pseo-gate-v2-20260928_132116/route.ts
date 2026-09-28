import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  evaluatePseoIndexability,
  type PseoGateInput,
} from '@/lib/pseo-quality';
import type {
  PseoRouteParams,
  StructureType,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Row = {
  slug: string;
  structure_type: StructureType;
  intent_cluster: string | null;
  params: PseoRouteParams;
  region_slug: string | null;
  title_template: string;
  h1_template: string;
  description: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

export async function GET() {
  try {
    const { rows } = await query<Row>(
      `SELECT
         slug,
         structure_type,
         intent_cluster,
         params,
         region_slug,
         title_template,
         h1_template,
         description
       FROM pseo_routes
       WHERE is_published = TRUE
         AND quality_status = 'ok'
         AND publish_date IS NOT NULL
         AND publish_date <= NOW()
       ORDER BY id ASC`
    );

    const excluded: Array<{
      slug: string;
      reason: string;
      structureType: StructureType;
      regionSlug: string | null;
      intent: string | null;
      error?: string;
    }> = [];

    let indexable = 0;

    for (const row of rows) {
      try {
        const input: PseoGateInput = {
          slug: row.slug,
          structure_type: row.structure_type,
          intent_cluster: row.intent_cluster,
          params: row.params,
          region_slug: row.region_slug,
          title_template: row.title_template,
          h1_template: row.h1_template,
          description: row.description || '',
        };

        const gate = evaluatePseoIndexability(input);

        if (gate.ok) {
          indexable += 1;
        } else {
          excluded.push({
            slug: row.slug,
            reason: gate.reason,
            structureType: row.structure_type,
            regionSlug: row.region_slug,
            intent: row.intent_cluster,
          });
        }
      } catch (error) {
        excluded.push({
          slug: row.slug,
          reason: 'runtime_exception',
          structureType: row.structure_type,
          regionSlug: row.region_slug,
          intent: row.intent_cluster,
          error: errorMessage(error),
        });
      }
    }

    return NextResponse.json(
      {
        fatal: false,
        publishedOk: rows.length,
        indexable,
        excludedCount: excluded.length,
        excluded,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        fatal: true,
        error: errorMessage(error),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}