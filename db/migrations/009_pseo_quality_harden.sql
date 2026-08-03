-- Fix legacy PSEO seed: require region, Russian titles, reject thin shells.
-- Idempotent updates by slug.

-- 1) Reject thin / incomplete drafts
UPDATE pseo_routes
SET
  is_published = FALSE,
  publish_date = NULL,
  quality_status = 'rejected',
  updated_at = NOW()
WHERE slug IN (
  'smeta-plitnogo-fundamenta-bez-armatury-8x6'
)
OR region_slug = 'kazan'
OR (is_published = FALSE AND region_slug IS NULL AND slug LIKE '%bez-armatury%');

-- 2) Attach Москва to legacy published/pending starters + rewrite meta
UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор плитного фундамента 12×8 м бетон М300 арматура Ø12 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор плитного фундамента 12×8 м — Москва и МО',
  description = 'Онлайн-расчёт монолитной плиты 12×8×0.4 м (М300), арматура Ø12 шаг 200 мм, 2 слоя: объём бетона, опалубка и смета в Москве и МО. Справочные цены Smetoplan, не оферта РБУ.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'kalkulyator-plitnogo-fundamenta-12x8-m300';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор ленточного фундамента 15×10 м М300 арматура Ø14 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор ленточного фундамента 15×10 м — Москва и МО',
  description = 'Инженерный расчёт ленты 15×10×1.0 м (М300), каркас Ø14 шаг 150 мм: объём бетона, давление на грунт и смета в Москве и МО. Справочник Smetoplan, не КП завода.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'raschet-lentochnogo-fundamenta-15x10-m300';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор монолитной плиты 10×8 м арматура Ø12 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор монолитной плиты 10×8 м — Москва и МО',
  description = 'Готовая смета плиты 10×8×0.35 м (М250), арматура А500С Ø12 шаг 200 мм, 2 слоя: бетон, опалубка и ориентир стоимости в Москве и МО.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'smeta-monolitnoj-plity-10x8-armatura-12';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор свайного фундамента 10×8 м — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор свайно-ростверкового фундамента 10×8 м — Москва и МО',
  description = 'Расчёт свайного поля 10×8×1.2 м (М300), каркасы Ø12 и ростверк: объёмы бетона и арматуры со справочными ценами Москвы и МО.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'online-kalkulyator-svajnogo-fundamenta-10x8';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор подпорной стены 10×2.5 м М250 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор подпорной стены 10×2.5 м — Москва и МО',
  description = 'Монолитная подпорная стена 10×0.3×2.5 м (М250), двойная сетка Ø12: объём, опалубка двух сторон и смета в Москве и МО.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'kalkulyator-podpornoj-steny-10x25-m250';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор монолитной балки 6 м арматура Ø16 М350 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор монолитной балки 6 м — Москва и МО',
  description = 'Балка пролётом 6 м сечением 0.4×0.6 м (М350), продольная арматура Ø16: объём бетона, хомуты и смета в Москве и МО по справочнику Smetoplan.',
  intent_cluster = 'kalkulyator',
  quality_status = CASE WHEN is_published THEN 'ok' ELSE 'pending' END,
  updated_at = NOW()
WHERE slug = 'raschet-balki-6m-armatura-16-m350';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор плиты 14×10 м арматура Ø14 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор плиты 14×10 м — Москва и МО',
  description = 'Тяжёлая плита 14×10×0.45 м (М350), арматура Ø14 шаг 150 мм, 2 слоя: объёмы и смета в Москве и МО. Не оферта РБУ.',
  intent_cluster = 'kalkulyator',
  quality_status = 'pending',
  updated_at = NOW()
WHERE slug = 'kalkulyator-plity-14x10-armatura-14-dva-sloya';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор свай с ростверком 12×10 м М300 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор свайного поля 12×10 м — Москва и МО',
  description = 'Свайное поле 12×10×1.5 м (М300), каркасы Ø14 и ростверк: объёмы бетона/арматуры и смета в Москве и МО.',
  intent_cluster = 'kalkulyator',
  quality_status = 'pending',
  updated_at = NOW()
WHERE slug = 'raschet-svaj-s-rostverkom-12x10-m300';

UPDATE pseo_routes SET
  region_slug = 'moskva',
  title_template = 'Калькулятор ленточного фундамента 12×9 м М200 — Москва и МО | Smetoplan',
  h1_template = 'Калькулятор ленты 12×9 м — Москва и МО',
  description = 'Ленточный фундамент 12×9×0.9 м (М200), арматура Ø12: объём, давление на грунт и смета в Москве и МО по справочнику Smetoplan.',
  intent_cluster = 'kalkulyator',
  quality_status = 'pending',
  updated_at = NOW()
WHERE slug = 'online-raschet-lenty-12x9-m200-moskva';

-- 3) Any remaining published leaf without resolvable region → unpublish
UPDATE pseo_routes
SET
  is_published = FALSE,
  quality_status = 'rejected',
  updated_at = NOW()
WHERE is_published = TRUE
  AND (
    region_slug IS NULL
    OR region_slug = 'kazan'
  );
