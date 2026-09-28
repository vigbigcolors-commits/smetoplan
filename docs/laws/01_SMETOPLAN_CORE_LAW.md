# SMETOPLAN Core Engineering Law

## Source of truth

Each domain fact has one authoritative source.

- calculation truth lives in calculation/domain code
- PSEO identity and indexability live in PSEO source modules
- database facts live in PostgreSQL
- generated HTML, metadata, sitemap and UI consume those sources
- never patch generated output instead of fixing its source

## PSEO semantic identity

One indexable search intent is:

`structure_type + length + width + depth + canonical region`

Grade, reinforcement diameter, reinforcement step, layers,
longitudinal bars and stirrup settings are calculator parameters,
not separate SEO identities.

Published PSEO must satisfy:

- `is_published = true`
- `quality_status = 'ok'`
- exactly one published row per semantic fingerprint
- published `content_fingerprint` equals semantic fingerprint
- no pending semantic sibling of a published row
- sitemap and runtime use the same contract

## Production database safety

Required sequence:

`READ-ONLY AUDIT -> BASELINE GUARD -> BACKUP -> TRANSACTION -> POST-AUDIT -> IDEMPOTENCY`

Never mutate an unidentified production database.
Never continue when baseline differs from the reviewed plan.
Production database mutation requires explicit approval.

## Engineering workflow

`SOURCE OF TRUTH -> ROOT CAUSE -> ONE SAFE CHANGE -> DIFF -> TEST -> COMMIT -> PUSH -> RUNTIME VERIFY`

Rules:

- protect unrelated WIP
- `qa-lessons/` is protected WIP
- no force push
- ff-only synchronization
- do not repeat completed audits without new evidence
- long logs go to report files, not the terminal

## Orchestrator

AI-Orchestrator executes repository-defined rules.
It is not a second architectural source of truth.

READ and VALIDATE may run automatically.

COMMIT, PUSH, PRODUCTION_DEPLOY, DATABASE_MUTATION,
SECRET_CHANGE and destructive cloud actions require approval.