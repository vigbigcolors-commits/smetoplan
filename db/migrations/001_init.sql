-- =============================================================================
-- Smetoplan.ru — Core Schema
-- Isolation: materials_dict | calc_formulas | pseo_routes
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. MATERIALS DICTIONARY (physics / prices / dimensions — no calc logic)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials_dict (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(64) NOT NULL UNIQUE,
  category        VARCHAR(64) NOT NULL,          -- concrete | rebar | sand | gravel | formwork | block | insulation
  name_ru         VARCHAR(255) NOT NULL,
  name_aliases    TEXT[] NOT NULL DEFAULT '{}',  -- synonym cluster for PSEO meta
  density_kg_m3   NUMERIC(10, 2),
  unit            VARCHAR(16) NOT NULL,          -- m3 | ton | kg | m2 | pcs | bag
  unit_price_rub  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  dim_length_mm   NUMERIC(10, 2),
  dim_width_mm    NUMERIC(10, 2),
  dim_height_mm   NUMERIC(10, 2),
  diameter_mm     NUMERIC(8, 2),
  grade           VARCHAR(32),                   -- M300, А500С, etc.
  gost_ref        VARCHAR(128),
  attrs           JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON materials_dict (category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_materials_grade ON materials_dict (grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_attrs ON materials_dict USING GIN (attrs);

-- -----------------------------------------------------------------------------
-- 2. CALC FORMULAS (СНиП / СП logic — isolated from material prices)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calc_formulas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(64) NOT NULL UNIQUE,   -- slab_volume | rebar_mesh | strip_volume
  structure_type  VARCHAR(32) NOT NULL,          -- slab | strip | beam | pier | wall | roof | wall_block
  title_ru        VARCHAR(255) NOT NULL,
  snip_ref        VARCHAR(128),                  -- СП 63.13330, СП 22.13330
  formula_expr    TEXT NOT NULL,                 -- human-readable expression
  params_schema   JSONB NOT NULL DEFAULT '{}'::jsonb,
  defaults        JSONB NOT NULL DEFAULT '{}'::jsonb,
  safety_factor  NUMERIC(5, 3) NOT NULL DEFAULT 1.150,
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulas_structure ON calc_formulas (structure_type) WHERE is_active;

-- -----------------------------------------------------------------------------
-- 3. PSEO ROUTES (drip-feed anti-ban indexing)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pseo_routes (
  id              BIGSERIAL PRIMARY KEY,
  slug            VARCHAR(512) NOT NULL UNIQUE,
  structure_type  VARCHAR(32) NOT NULL,
  intent_cluster  VARCHAR(32) NOT NULL,          -- kalkulyator | raschet | smeta | online
  title_template  VARCHAR(512) NOT NULL,
  h1_template     VARCHAR(512) NOT NULL,
  description     TEXT NOT NULL,
  params          JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_variant  SMALLINT NOT NULL DEFAULT 1 CHECK (layout_variant BETWEEN 1 AND 5),
  show_rebar      BOOLEAN NOT NULL DEFAULT TRUE,
  show_bom        BOOLEAN NOT NULL DEFAULT TRUE,
  show_cad        BOOLEAN NOT NULL DEFAULT TRUE,
  show_ai         BOOLEAN NOT NULL DEFAULT TRUE,
  show_contractors BOOLEAN NOT NULL DEFAULT TRUE,
  region_slug     VARCHAR(64),
  material_sku    VARCHAR(64) REFERENCES materials_dict (sku) ON DELETE SET NULL,
  formula_code    VARCHAR(64) REFERENCES calc_formulas (code) ON DELETE SET NULL,
  priority        SMALLINT NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  publish_date    TIMESTAMPTZ,
  indexed_at      TIMESTAMPTZ,
  last_sitemap_at TIMESTAMPTZ,
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pseo_published
  ON pseo_routes (is_published, publish_date DESC)
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_pseo_drip_queue
  ON pseo_routes (priority DESC, id ASC)
  WHERE is_published = FALSE;

CREATE INDEX IF NOT EXISTS idx_pseo_structure ON pseo_routes (structure_type);
CREATE INDEX IF NOT EXISTS idx_pseo_params ON pseo_routes USING GIN (params);

-- -----------------------------------------------------------------------------
-- 4. SITEMAP SNAPSHOTS (rebuild audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sitemap_builds (
  id              BIGSERIAL PRIMARY KEY,
  urls_count      INTEGER NOT NULL,
  batch_published INTEGER NOT NULL DEFAULT 0,
  built_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- -----------------------------------------------------------------------------
-- 5. UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materials_updated ON materials_dict;
CREATE TRIGGER trg_materials_updated
  BEFORE UPDATE ON materials_dict
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_formulas_updated ON calc_formulas;
CREATE TRIGGER trg_formulas_updated
  BEFORE UPDATE ON calc_formulas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pseo_updated ON pseo_routes;
CREATE TRIGGER trg_pseo_updated
  BEFORE UPDATE ON pseo_routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
