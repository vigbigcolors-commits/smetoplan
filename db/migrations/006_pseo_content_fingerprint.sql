-- Uniqueness of indexed PSEO leaves at DB level (JS gate + this index).
ALTER TABLE pseo_routes
  ADD COLUMN IF NOT EXISTS content_fingerprint VARCHAR(128);

COMMENT ON COLUMN pseo_routes.content_fingerprint IS
  'structure|L|W|H|grade|rebar|step|layers|region — set only when quality_status=ok';

-- One indexed URL per unique calc+region fingerprint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pseo_fingerprint_unique_ok
  ON pseo_routes (content_fingerprint)
  WHERE quality_status = 'ok'
    AND is_published = TRUE
    AND content_fingerprint IS NOT NULL;
