-- Regional median prices derived from supplier_quotes (ceny feed).
-- Handbook PRICE_REGIONS remains fallback when no median rows exist.

CREATE TABLE IF NOT EXISTS region_price_medians (
  region_id           VARCHAR(64) PRIMARY KEY,
  concrete_per_m3     NUMERIC(12, 2),
  rebar_per_ton       NUMERIC(12, 2),
  formwork_per_m2     NUMERIC(12, 2),
  sand_per_ton        NUMERIC(12, 2),
  gravel_per_ton      NUMERIC(12, 2),
  sample_n_concrete   INTEGER NOT NULL DEFAULT 0,
  sample_n_rebar      INTEGER NOT NULL DEFAULT 0,
  as_of               DATE NOT NULL,
  source              TEXT NOT NULL DEFAULT 'supplier_quotes_median',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_region_price_medians_as_of
  ON region_price_medians (as_of DESC);
