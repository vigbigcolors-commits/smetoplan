-- Seed: calc_formulas — СНиП-логика изолирована от справочника материалов
INSERT INTO calc_formulas (code, structure_type, title_ru, snip_ref, formula_expr, params_schema, defaults, safety_factor) VALUES
(
  'slab_volume',
  'slab',
  'Объём плитного фундамента',
  'СП 63.13330',
  'V = (L*W*H + 2*(L+W)*pW*pH) * k_safety',
  '{"L":"number","W":"number","H":"number","pW":"number","pH":"number","k_safety":"number"}'::jsonb,
  '{"L":12,"W":8.5,"H":0.4,"pW":0.5,"pH":0.3,"k_safety":1.15,"rebar_d":12,"rebar_step":200,"layers":2,"grade":"M300"}'::jsonb,
  1.150
),
(
  'slab_rebar_mesh',
  'slab',
  'Сетка армирования плиты',
  'СП 63.13330',
  'L_rebar = (ceil(W/s)+1)*(L+0.3) + (ceil(L/s)+1)*(W+0.3); * layers * 1.12',
  '{"L":"number","W":"number","s":"number","layers":"number","d_mm":"number"}'::jsonb,
  '{"s":0.2,"layers":2,"d_mm":12,"lap":1.12}'::jsonb,
  1.120
),
(
  'strip_volume',
  'strip',
  'Объём ленточного фундамента',
  'СП 22.13330',
  'V = (2*(L+W)+L) * ribbon_w * H * k_safety',
  '{"L":"number","W":"number","H":"number","ribbon_w":"number","k_safety":"number"}'::jsonb,
  '{"L":15,"W":0.6,"H":1.0,"ribbon_w":0.4,"k_safety":1.15,"rebar_d":14,"layers":2,"grade":"M300"}'::jsonb,
  1.150
),
(
  'beam_volume',
  'beam',
  'Объём балки / колонны',
  'СП 63.13330',
  'V = L * W * H * k_safety',
  '{"L":"number","W":"number","H":"number","k_safety":"number"}'::jsonb,
  '{"L":6,"W":0.4,"H":0.6,"k_safety":1.15,"rebar_d":16,"layers":3,"grade":"M350"}'::jsonb,
  1.150
),
(
  'pier_volume',
  'pier',
  'Объём свайно-плитного фундамента',
  'СП 24.13330',
  'V = n_piers * pier^2 * H + grillage; n = max(4, ceil(L/2.5)*ceil(W/2.5))',
  '{"L":"number","W":"number","H":"number","pier":"number","grillage_h":"number"}'::jsonb,
  '{"L":10,"W":0.5,"H":1.2,"pier":0.4,"grillage_h":0,"k_safety":1.15,"rebar_d":12,"layers":1,"grade":"M300"}'::jsonb,
  1.150
),
(
  'wall_volume',
  'wall',
  'Объём подпорной / цокольной стены',
  'СП 63.13330',
  'V = L * thickness * H * k_safety',
  '{"L":"number","thickness":"number","H":"number","k_safety":"number"}'::jsonb,
  '{"L":10,"W":0.3,"H":2.5,"k_safety":1.15,"rebar_d":12,"layers":2,"grade":"M250"}'::jsonb,
  1.150
)
ON CONFLICT (code) DO UPDATE SET
  formula_expr = EXCLUDED.formula_expr,
  defaults = EXCLUDED.defaults,
  safety_factor = EXCLUDED.safety_factor,
  updated_at = NOW();
