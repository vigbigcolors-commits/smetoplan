/**
 * Bootstrap PSEO corpus: migrate → generate routes → drip first batch via SQL helper.
 * Full gate drip needs Next runtime; this seeds pending queue + applies migrations.
 *
 * Usage: node --env-file=.env.local scripts/pseo-bootstrap.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
}

run('node', ['--env-file=.env.local', 'scripts/db-migrate.mjs']);
run('node', ['--env-file=.env.local', 'scripts/generate-pseo-routes.mjs']);
run('npx', ['tsx', '--env-file=.env.local', 'scripts/pseo-drip-once.ts']);

console.log('\nPSEO bootstrap complete. Schedule cron: npm run cron:drip');
