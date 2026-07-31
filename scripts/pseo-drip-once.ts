/**
 * One drip-feed batch through the real quality gate.
 * Usage: npx tsx --env-file=.env.local scripts/pseo-drip-once.ts
 */
import { dripFeedPublish } from '../src/lib/pseo';

async function main() {
  const min = Number(process.env.DRIP_MIN || 40);
  const max = Number(process.env.DRIP_MAX || 80);
  const result = await dripFeedPublish(min, max);
  console.log(
    JSON.stringify(
      {
        published: result.published,
        rejected: result.rejected,
        rejectReasons: result.rejectReasons,
        sample: result.slugs.slice(0, 10),
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
