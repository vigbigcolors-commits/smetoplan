/**
 * Apply SQL migrations that may be missing on an existing Postgres volume
 * (docker-entrypoint-initdb.d only runs on first init).
 *
 * Usage: node --env-file=.env.local scripts/db-migrate.mjs
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // If core schema already exists (initdb volume), mark 001–004 applied.
  const { rows: core } = await client.query(
    `SELECT to_regclass('public.pseo_routes') AS t`
  );
  if (core[0]?.t) {
    for (const f of [
      '001_init.sql',
      '002_seed_materials.sql',
      '003_seed_formulas.sql',
      '004_seed_pseo_routes.sql',
    ]) {
      await client.query(
        `INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
        [f]
      );
    }
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      `SELECT 1 FROM schema_migrations WHERE filename = $1`,
      [file]
    );
    if (rows.length > 0) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`apply ${file}…`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (filename) VALUES ($1)`,
        [file]
      );
      await client.query('COMMIT');
      console.log(`ok ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      const msg = err instanceof Error ? err.message : String(err);
      if (/already exists/i.test(msg)) {
        await client.query(
          `INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
          [file]
        );
        console.log(`ok ${file} (already applied objects)`);
        continue;
      }
      console.error(`fail ${file}:`, msg);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('migrations done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
