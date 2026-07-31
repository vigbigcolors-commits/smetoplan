-- Market suppliers & quotes (honest ingest only — no fake plants).
CREATE TABLE IF NOT EXISTS suppliers (
  id          BIGSERIAL PRIMARY KEY,
  slug        VARCHAR(128) NOT NULL UNIQUE,
  name        VARCHAR(256) NOT NULL,
  kind        VARCHAR(32) NOT NULL CHECK (kind IN ('rbu', 'store', 'wholesale')),
  region_id   VARCHAR(64) NOT NULL,
  city        VARCHAR(128),
  url         TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quotes (
  id           BIGSERIAL PRIMARY KEY,
  supplier_id  BIGINT NOT NULL REFERENCES suppliers (id) ON DELETE CASCADE,
  sku          VARCHAR(64) NOT NULL CHECK (
    sku IN ('concrete_m3', 'rebar_ton', 'formwork_m2', 'sand_ton', 'gravel_ton')
  ),
  grade        VARCHAR(32) NOT NULL DEFAULT '',
  price_rub    NUMERIC(12, 2) NOT NULL CHECK (price_rub >= 0),
  currency     VARCHAR(8) NOT NULL DEFAULT 'RUB',
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source       VARCHAR(32) NOT NULL DEFAULT 'feed'
    CHECK (source IN ('feed', 'parse', 'manual')),
  note         TEXT,
  UNIQUE (supplier_id, sku, grade)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_region_active
  ON suppliers (region_id, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_quotes_fetched
  ON supplier_quotes (fetched_at DESC);

CREATE TABLE IF NOT EXISTS market_ingest_runs (
  id            BIGSERIAL PRIMARY KEY,
  as_of         DATE,
  suppliers_n   INTEGER NOT NULL DEFAULT 0,
  quotes_n      INTEGER NOT NULL DEFAULT 0,
  source        TEXT,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
