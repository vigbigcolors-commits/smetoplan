import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPool, query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HASH='5a24043e09fe212efb66621120baeafe3119e021562c27dcce354a85d6379333';
const BACKUP='pseo_routes_backup_20260928_142123_doorway';

const TARGETS=[
  'raschet-lentochnogo-fundamenta-15x10-m300',
  'smeta-monolitnoj-plity-10x8-armatura-12',
  'online-kalkulyator-svajnogo-fundamenta-10x8',
  'raschet-balki-6m-armatura-16-m350',
  'online-raschet-lenty-12x9-m200-moskva',
];

type C={total:string;published:string;pending:string;rejected:string};
type T={
  slug:string;
  is_published:boolean;
  quality_status:string|null;
  publish_date:Date|null;
  content_fingerprint:string|null;
};

async function counts(){
  const {rows}=await query<C>(`
    SELECT
      COUNT(*)::text total,
      COUNT(*) FILTER (
        WHERE is_published=TRUE AND quality_status='ok'
      )::text published,
      COUNT(*) FILTER (
        WHERE is_published=FALSE
          AND COALESCE(quality_status,'pending')='pending'
      )::text pending,
      COUNT(*) FILTER (
        WHERE quality_status='rejected'
      )::text rejected
    FROM pseo_routes
  `);

  return {
    total:Number(rows[0].total),
    published:Number(rows[0].published),
    pending:Number(rows[0].pending),
    rejected:Number(rows[0].rejected),
  };
}

async function targets(){
  const {rows}=await query<T>(`
    SELECT slug,is_published,quality_status,publish_date,content_fingerprint
    FROM pseo_routes
    WHERE slug=ANY($1::text[])
    ORDER BY slug
  `,[TARGETS]);

  return rows;
}

function finalState(
  c:{total:number;published:number;pending:number;rejected:number},
  t:T[]
){
  return (
    c.total===2980 &&
    c.published===31 &&
    c.pending===296 &&
    c.rejected===2653 &&
    t.length===5 &&
    t.every(x =>
      !x.is_published &&
      x.quality_status==='rejected' &&
      x.publish_date===null &&
      x.content_fingerprint===null
    )
  );
}

export async function POST(req:Request){
  try {
    const auth=req.headers.get('authorization')||'';
    const token=auth.startsWith('Bearer ')?auth.slice(7):'';
    const digest=createHash('sha256').update(token).digest('hex');

    if(!token || digest!==HASH){
      return NextResponse.json({ok:false,error:'unauthorized'},{status:401});
    }

    const before=await counts();
    const beforeTargets=await targets();

    if(finalState(before,beforeTargets)){
      return NextResponse.json({
        ok:true,
        alreadyApplied:true,
        after:before
      });
    }

    if(
      before.total!==2980 ||
      before.published!==36 ||
      before.pending!==296 ||
      before.rejected!==2648
    ){
      return NextResponse.json(
        {ok:false,error:'baseline_mismatch',before},
        {status:409}
      );
    }

    if(
      beforeTargets.length!==5 ||
      !beforeTargets.every(
        x => x.is_published && x.quality_status==='ok'
      )
    ){
      return NextResponse.json(
        {ok:false,error:'target_baseline_mismatch',beforeTargets},
        {status:409}
      );
    }

    const existing=await query<{name:string|null}>(
      `SELECT to_regclass($1)::text name`,
      [BACKUP]
    );

    if(existing.rows[0]?.name){
      return NextResponse.json(
        {ok:false,error:'backup_exists'},
        {status:409}
      );
    }

    await query(`CREATE TABLE ${BACKUP} AS SELECT * FROM pseo_routes`);

    const backupRows=await query<{n:string}>(
      `SELECT COUNT(*)::text n FROM ${BACKUP}`
    );

    if(Number(backupRows.rows[0].n)!==2980){
      throw new Error('backup_count_mismatch');
    }

    const client=await getPool().connect();

    try {
      await client.query('BEGIN');

      const updated=await client.query<{slug:string}>(`
        UPDATE pseo_routes
        SET
          is_published=FALSE,
          publish_date=NULL,
          quality_status='rejected',
          content_fingerprint=NULL,
          updated_at=NOW()
        WHERE slug=ANY($1::text[])
          AND is_published=TRUE
          AND quality_status='ok'
        RETURNING slug
      `,[TARGETS]);

      if(updated.rows.length!==5){
        throw new Error(`updated_count:${updated.rows.length}`);
      }

      await client.query('COMMIT');
    }
    catch(error){
      await client.query('ROLLBACK');
      throw error;
    }
    finally {
      client.release();
    }

    const after=await counts();
    const afterTargets=await targets();

    if(!finalState(after,afterTargets)){
      throw new Error('post_state_mismatch');
    }

    return NextResponse.json({
      ok:true,
      alreadyApplied:false,
      before,
      after,
      backup:BACKUP,
      backupRows:2980
    });
  }
  catch(error){
    return NextResponse.json(
      {
        ok:false,
        error:error instanceof Error ? error.message : String(error)
      },
      {status:500}
    );
  }
}