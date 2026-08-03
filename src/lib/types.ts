export type StructureType = 'slab' | 'strip' | 'beam' | 'pier' | 'wall';

export type UnitSystem = 'metric' | 'imperial';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'AED';

export type IntentCluster = 'kalkulyator' | 'raschet' | 'smeta' | 'online';

export interface DimensionState {
  length: number;
  width: number;
  depth: number;
  perimeterThickeningWidth: number;
  perimeterThickeningDepth: number;
}

export interface ConcreteSpec {
  grade: 'M150' | 'M200' | 'M250' | 'M300' | 'M350' | 'M400';
  cementBagKg: 25 | 50;
  customPricePerM3: number;
}

export interface RebarSpec {
  diameterMm: number;
  /** Плита/стена: шаг сетки. Лента/балка: шаг хомутов. */
  spacingMm: number;
  /** Плита/стена: число сеток. Для ленты — запасной маппинг, если нет longitudinalBars. */
  layers: 1 | 2 | 3;
  /** Продольные стержни каркаса ленты/балки (типично 4 / 6 / 8). */
  longitudinalBars?: 4 | 6 | 8;
  /** Хомуты ленты/балки/колонны; иначе min(8, рабочий Ø). */
  stirrupDiameterMm?: number;
  customPricePerTon: number;
}

export interface MaterialPrices {
  concretePerM3: number;
  rebarPerTon: number;
  sandPerTon: number;
  gravelPerTon: number;
  formworkPerM2: number;
}

export interface MaterialCalculationResult {
  concreteVolumeM3: number;
  totalWeightTons: number;
  cementBags: number;
  sandTons: number;
  gravelTons: number;
  rebarLengthMeters: number;
  rebarWeightKg: number;
  bindingWireKg: number;
  formworkAreaM2: number;
  timberVolumeM3: number;
  waterLiters: number;
  soilPressureKpa: number;
  itemizedCosts: {
    concrete: number;
    rebar: number;
    sandGravel: number;
    formwork: number;
    laborEst: number;
    total: number;
  };
}

export interface ContractorOffer {
  id: string;
  contractorName: string;
  rating: number;
  completedProjects: number;
  discountBadge: string;
  concreteDiscountPrice: number;
  rebarDiscountPrice: number;
  deliveryTime: string;
  verified: boolean;
  phoneBlurred: string;
}

export interface AiStructuralAnalysis {
  feasibilityScore: number;
  bearingStatus: string;
  bearingPressureRatio: string;
  structuralSummary: string;
  keyRecommendations: Array<{
    title: string;
    impact: string;
    description: string;
  }>;
  curingScheduleDays: {
    formworkRemovalDays: number;
    fullLoadCapacityDays: number;
    hydrationTip: string;
  };
  complianceNote: string;
}

export interface PseoRouteParams {
  length: number;
  width: number;
  depth: number;
  grade: ConcreteSpec['grade'];
  rebar_d: number;
  rebar_step: number;
  layers: number;
  pW?: number;
  pH?: number;
  ribbon_w?: number;
  pier?: number;
  grillage_h?: number;
}

export interface PseoRoute {
  id: number;
  slug: string;
  structure_type: StructureType;
  intent_cluster: IntentCluster;
  title_template: string;
  h1_template: string;
  description: string;
  params: PseoRouteParams;
  layout_variant: 1 | 2 | 3 | 4 | 5;
  show_rebar: boolean;
  show_bom: boolean;
  show_cad: boolean;
  show_ai: boolean;
  show_contractors: boolean;
  region_slug: string | null;
  material_sku: string | null;
  formula_code: string | null;
  is_published: boolean;
  publish_date: string | null;
}

export interface ConstructixInitialState {
  structureType: StructureType;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  prices?: MaterialPrices;
  priceRegionId?: string;
  safetyFactor?: number;
  h1?: string;
  description?: string;
  /** PSEO landing: defer 3D + disable sticky CAD for LCP */
  deferHeavyUi?: boolean;
}
