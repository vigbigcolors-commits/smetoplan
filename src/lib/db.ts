import { Pool, type QueryResultRow } from 'pg';

declare global {
  var __smetoplanPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getPool(): Pool {
  if (!global.__smetoplanPool) {
    global.__smetoplanPool = createPool();
  }
  return global.__smetoplanPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const result = await getPool().query<T>(text, params);
  return { rows: result.rows, rowCount: result.rowCount };
}
