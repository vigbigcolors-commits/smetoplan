-- Seed starter PSEO routes (MVP batch). Full corpus generated via scripts/generate-pseo-routes.mjs
-- Drip-feed: only is_published=true + publish_date<=now() are crawlable.

INSERT INTO pseo_routes (
  slug, structure_type, intent_cluster, title_template, h1_template, description,
  params, layout_variant, show_rebar, show_bom, show_cad, show_ai, show_contractors,
  region_slug, material_sku, formula_code, priority, is_published, publish_date
) VALUES
(
  'kalkulyator-plitnogo-fundamenta-12x8-m300',
  'slab', 'kalkulyator',
  'Калькулятор плитного фундамента 12×8 м бетон М300 — смета онлайн | Smetoplan',
  'Калькулятор плитного фундамента 12×8 м',
  'Онлайн-расчёт монолитной плиты 12×8×0.4 м: объём бетона М300, арматура Ø12, опалубка и смета в рублях по СП 63.13330.',
  '{"length":12,"width":8,"depth":0.4,"grade":"M300","rebar_d":12,"rebar_step":200,"layers":2,"pW":0.5,"pH":0.3}'::jsonb,
  1, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, 'BET-M300', 'slab_volume', 90, TRUE, NOW() - INTERVAL '1 day'
),
(
  'raschet-lentochnogo-fundamenta-15x10-m300',
  'strip', 'raschet',
  'Расчёт ленточного фундамента 15×10 м М300 — смета арматуры | Smetoplan',
  'Расчёт ленточного фундамента 15×10 м',
  'Инженерный расчёт ленты с внутренним несущим: объём бетона, каркас Ø14, давление на грунт и BOM.',
  '{"length":15,"width":10,"depth":1.0,"grade":"M300","rebar_d":14,"rebar_step":150,"layers":2,"ribbon_w":0.4}'::jsonb,
  2, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, 'BET-M300', 'strip_volume', 85, TRUE, NOW() - INTERVAL '1 day'
),
(
  'smeta-monolitnoj-plity-10x8-armatura-12',
  'slab', 'smeta',
  'Смета монолитной плиты 10×8 м арматура Ø12 — онлайн | Smetoplan',
  'Смета монолитной плиты 10×8 с арматурой Ø12',
  'Готовая ведомость материалов: бетон, цемент, песок, щебень, арматура А500С Ø12 шаг 200 мм.',
  '{"length":10,"width":8,"depth":0.35,"grade":"M250","rebar_d":12,"rebar_step":200,"layers":2,"pW":0.4,"pH":0.25}'::jsonb,
  3, TRUE, TRUE, TRUE, FALSE, TRUE, NULL, 'BET-M250', 'slab_volume', 80, TRUE, NOW() - INTERVAL '12 hours'
),
(
  'online-kalkulyator-svajnogo-fundamenta-10x8',
  'pier', 'online',
  'Онлайн калькулятор свайного фундамента 10×8 — расчёт ростверка | Smetoplan',
  'Онлайн-калькулятор свайно-ростверкового фундамента 10×8',
  'Расчёт числа свай, объёма бетона и арматурных каркасов с опциональным ростверком.',
  '{"length":10,"width":8,"depth":1.2,"grade":"M300","rebar_d":12,"rebar_step":200,"layers":1,"pier":0.4,"grillage_h":0.4}'::jsonb,
  4, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, 'BET-M300', 'pier_volume', 75, TRUE, NOW() - INTERVAL '1 day'
),
(
  'kalkulyator-podpornoj-steny-10x25-m250',
  'wall', 'kalkulyator',
  'Калькулятор подпорной стены 10×2.5 м бетон М250 | Smetoplan',
  'Калькулятор подпорной стены высотой 2.5 м',
  'Расчёт монолитной подпорной стены: объём, двойная сетка Ø12, опалубка двух сторон.',
  '{"length":10,"width":0.3,"depth":2.5,"grade":"M250","rebar_d":12,"rebar_step":150,"layers":2}'::jsonb,
  5, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, 'BET-M250', 'wall_volume', 70, TRUE, NOW() - INTERVAL '1 day'
),
(
  'raschet-balki-6m-armatura-16-m350',
  'beam', 'raschet',
  'Расчёт монолитной балки 6 м арматура Ø16 М350 | Smetoplan',
  'Расчёт монолитной балки пролётом 6 м',
  'Объём бетона М350, продольная арматура Ø16 и хомуты с шагом 200 мм по СП 63.13330.',
  '{"length":6,"width":0.4,"depth":0.6,"grade":"M350","rebar_d":16,"rebar_step":150,"layers":3}'::jsonb,
  1, TRUE, TRUE, TRUE, FALSE, TRUE, NULL, 'BET-M350', 'beam_volume', 65, TRUE, NOW() - INTERVAL '1 day'
),
(
  'smeta-plitnogo-fundamenta-bez-armatury-8x6',
  'slab', 'smeta',
  'Смета плитного фундамента 8×6 без армирования — подготовка | Smetoplan',
  'Смета бетонной подготовки 8×6 без армирования',
  'Расчёт подбетонки М150 без схемы армирования: объём, цемент, песок, щебень.',
  '{"length":8,"width":6,"depth":0.1,"grade":"M150","rebar_d":0,"rebar_step":0,"layers":0,"pW":0,"pH":0}'::jsonb,
  2, FALSE, TRUE, TRUE, FALSE, FALSE, NULL, 'BET-M150', 'slab_volume', 60, FALSE, NULL
),
(
  'online-raschet-lenty-12x9-m200-moskva',
  'strip', 'online',
  'Онлайн расчёт ленточного фундамента 12×9 М200 Москва | Smetoplan',
  'Онлайн-расчёт ленты 12×9 м для Москвы',
  'Региональный расчёт ленточного фундамента с ценами РБУ и давлением на грунт.',
  '{"length":12,"width":9,"depth":0.9,"grade":"M200","rebar_d":12,"rebar_step":200,"layers":2,"ribbon_w":0.4}'::jsonb,
  3, TRUE, TRUE, TRUE, TRUE, TRUE, 'moskva', 'BET-M200', 'strip_volume', 88, FALSE, NULL
),
(
  'kalkulyator-plity-14x10-armatura-14-dva-sloya',
  'slab', 'kalkulyator',
  'Калькулятор плиты 14×10 арматура Ø14 два слоя — смета | Smetoplan',
  'Калькулятор плиты 14×10 с двойной сеткой Ø14',
  'Тяжёлая плита: бетон М350, арматура Ø14 шаг 150 мм, рёбра жёсткости по периметру.',
  '{"length":14,"width":10,"depth":0.45,"grade":"M350","rebar_d":14,"rebar_step":150,"layers":2,"pW":0.6,"pH":0.35}'::jsonb,
  4, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, 'BET-M350', 'slab_volume', 92, FALSE, NULL
),
(
  'raschet-svaj-s-rostverkom-12x10-m300',
  'pier', 'raschet',
  'Расчёт свай с ростверком 12×10 М300 — онлайн смета | Smetoplan',
  'Расчёт свайного поля 12×10 с ростверком',
  'Число свай, каркасы, объём ростверка и полная BOM с партнёрской корзиной.',
  '{"length":12,"width":10,"depth":1.5,"grade":"M300","rebar_d":14,"rebar_step":200,"layers":2,"pier":0.4,"grillage_h":0.5}'::jsonb,
  5, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, 'BET-M300', 'pier_volume', 78, FALSE, NULL
)
ON CONFLICT (slug) DO NOTHING;
