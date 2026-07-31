-- Hard indexability: only quality_status='ok' is crawlable.
ALTER TABLE pseo_routes
  ADD COLUMN IF NOT EXISTS quality_status VARCHAR(16) NOT NULL DEFAULT 'pending';

COMMENT ON COLUMN pseo_routes.quality_status IS 'pending | ok | rejected — only ok may be indexed';

-- Backfill: already published → ok (then runtime re-checks snapshot on drip only).
-- New publishes MUST pass evaluatePseoIndexability (unique calc + FAQ + region gate).
UPDATE pseo_routes
SET quality_status = 'ok',
    updated_at = NOW()
WHERE is_published = TRUE
  AND COALESCE(quality_status, 'pending') = 'pending';

CREATE INDEX IF NOT EXISTS idx_pseo_drip_quality
  ON pseo_routes (priority DESC, id ASC)
  WHERE is_published = FALSE AND quality_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pseo_indexable
  ON pseo_routes (priority DESC, publish_date DESC)
  WHERE is_published = TRUE
    AND quality_status = 'ok'
    AND publish_date IS NOT NULL;
