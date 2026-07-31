-- Contacts & curated badges for suppliers (no fake ratings).
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS phone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS email VARCHAR(256),
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS badge VARCHAR(32)
    CHECK (badge IS NULL OR badge IN ('known', 'partner', 'price_leader'));

CREATE INDEX IF NOT EXISTS idx_suppliers_featured
  ON suppliers (region_id, featured)
  WHERE is_active = TRUE AND featured = TRUE;
