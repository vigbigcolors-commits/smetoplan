/**
 * Safe publish: only through dripFeedPublish (quality gate).
 * Never bulk-flips is_published.
 *
 * Usage:
 *   PSEO_TARGET_PUBLISHED=300 npx tsx --env-file=.env.local scripts/pseo-publish-safe-batch.ts
 */
import { query } from '../src/lib/db';
import { dripFeedPublish } from '../src/lib/pseo';

async function publishedCount(): Promise<number> {
  const { rows } = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM pseo_routes
     WHERE is_published = TRUE AND quality_status = 'ok'`
  );
  return rows[0]?.n ?? 0;
}

async function main() {
  const target = Math.max(
    50,
    Math.min(2000, Number(process.env.PSEO_TARGET_PUBLISHED || 300))
  );
  const maxRounds = Math.max(1, Math.min(80, Number(process.env.PSEO_DRIP_ROUNDS || 40)));
  const min = Number(process.env.DRIP_MIN || 40);
  const max = Number(process.env.DRIP_MAX || 80);

  let before = await publishedCount();
  console.log(
    JSON.stringify({
      before,
      target,
      maxRounds,
      dripPerRound: `${min}-${max}`,
      mode: 'gate-only',
    })
  );

  let rounds = 0;
  let publishedSum = 0;
  let rejectedSum = 0;
  const rejectReasons: Record<string, number> = {};

  while (before + publishedSum < target && rounds < maxRounds) {
    rounds += 1;
    const result = await dripFeedPublish(min, max);
    publishedSum += result.published;
    rejectedSum += result.rejected;
    for (const [k, v] of Object.entries(result.rejectReasons)) {
      rejectReasons[k] = (rejectReasons[k] || 0) + v;
    }
    console.log(
      JSON.stringify({
        round: rounds,
        published: result.published,
        rejected: result.rejected,
        cumulativePublished: before + publishedSum,
        sample: result.slugs.slice(0, 5),
      })
    );
    if (result.published === 0) break;
  }

  const after = await publishedCount();
  console.log(
    JSON.stringify(
      {
        done: true,
        before,
        after,
        publishedThisRun: after - before,
        rejectedSum,
        rejectReasons,
        rounds,
        note:
          after >= target
            ? 'Target reached via gated drip.'
            : 'Stopped early (no more pending that pass gate, or max rounds).',
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
