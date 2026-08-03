/**
 * Apply 009 + generate quality PSEO corpus on DATABASE_URL.
 * Usage: node scripts/pseo-quality-sync.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';

function run(cmd, args) {
  console.log('>', cmd, args.join(' '));
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

run('node', ['scripts/db-migrate.mjs']);
run('node', ['scripts/generate-pseo-routes.mjs']);
console.log('PSEO quality sync complete');
