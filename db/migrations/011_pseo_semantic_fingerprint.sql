-- content_fingerprint is the indexed search-intent identity, not a calculator preset.
COMMENT ON COLUMN pseo_routes.content_fingerprint IS
  'structure|length|width|depth|canonical_region — set only for published quality_status=ok rows';
