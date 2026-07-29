import type {
  ConcreteSpec,
  DimensionState,
  MaterialCalculationResult,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from './types';

export function calculateMaterials(
  structureType: StructureType,
  dimensions: DimensionState,
  concreteSpec: ConcreteSpec,
  rebarSpec: RebarSpec,
  prices: MaterialPrices,
  unitSystem: UnitSystem,
  safetyFactor: number = 1.15
): MaterialCalculationResult {
  const mFactor = unitSystem === 'imperial' ? 0.3048 : 1.0;

  const L = Math.max(0.5, dimensions.length * mFactor);
  const W = Math.max(0.5, dimensions.width * mFactor);
  const H = Math.max(0.05, dimensions.depth * mFactor);
  const pW = dimensions.perimeterThickeningWidth
    ? dimensions.perimeterThickeningWidth * mFactor
    : 0;
  const pH = dimensions.perimeterThickeningDepth
    ? dimensions.perimeterThickeningDepth * mFactor
    : 0;

  let concreteVol = 0;
  let formworkArea = 0;
  let contactAreaM2 = 0;
  let rebarLenMeters = 0;
  const hasRebar = rebarSpec.layers > 0 && rebarSpec.diameterMm > 0;

  switch (structureType) {
    case 'slab': {
      const mainVol = L * W * H;
      const perimeter = 2 * (L + W);
      const ribVol = pW > 0 && pH > 0 ? perimeter * pW * pH : 0;
      concreteVol = (mainVol + ribVol) * safetyFactor;
      formworkArea = 2 * (L + W) * (H + (pH > 0 ? pH : 0));
      contactAreaM2 = L * W;

      if (hasRebar) {
        const spacingM = Math.max(0.05, rebarSpec.spacingMm / 1000);
        const numLongitudinal = Math.ceil(W / spacingM) + 1;
        const numTransverse = Math.ceil(L / spacingM) + 1;
        const lapCoeff = 1.12;
        const singleLayerLen =
          (numLongitudinal * (L + 0.3) + numTransverse * (W + 0.3)) * lapCoeff;
        rebarLenMeters = singleLayerLen * rebarSpec.layers;
      }
      break;
    }
    case 'strip': {
      const ribbonWidth = pW > 0 ? pW : Math.min(0.5, Math.max(0.3, W > 2 ? 0.4 : W));
      const totalStripLen = 2 * (L + W) + L;
      concreteVol = totalStripLen * ribbonWidth * H * safetyFactor;
      formworkArea = 2 * totalStripLen * H;
      contactAreaM2 = totalStripLen * ribbonWidth;

      if (hasRebar) {
        const mainBarCount = rebarSpec.layers >= 2 ? 6 : 4;
        const longitudinalTotal = mainBarCount * totalStripLen * 1.15;
        const stirrupPerimeter = 2 * (ribbonWidth + H - 0.1);
        const stirrupsCount = Math.ceil(totalStripLen / 0.3);
        const stirrupTotal = stirrupsCount * Math.max(0.6, stirrupPerimeter);
        rebarLenMeters = longitudinalTotal + stirrupTotal;
      }
      break;
    }
    case 'beam': {
      concreteVol = L * W * H * safetyFactor;
      formworkArea = (2 * H + W) * L;
      contactAreaM2 = L * W;

      if (hasRebar) {
        const mainBarCount = Math.max(2, rebarSpec.layers * 2);
        const longitudinalTotal = mainBarCount * L * 1.12;
        const stirrupPerimeter = 2 * (W + H - 0.08);
        const stirrupsCount = Math.ceil(L / 0.2);
        const stirrupTotal = stirrupsCount * Math.max(0.5, stirrupPerimeter);
        rebarLenMeters = longitudinalTotal + stirrupTotal;
      }
      break;
    }
    case 'pier': {
      const pierSize = pW > 0 ? pW : 0.4;
      const pierCount = Math.max(4, Math.ceil((L / 2.5) * (W / 2.5)));
      const pierVol = pierCount * (pierSize * pierSize * H);
      const grillageVol = pH > 0 ? 2 * (L + W) * pierSize * pH : 0;
      concreteVol = (pierVol + grillageVol) * safetyFactor;

      const pierFormwork = pierCount * (4 * pierSize * H);
      const grillageFormwork = pH > 0 ? 2 * (L + W) * (2 * pH + pierSize) : 0;
      formworkArea = pierFormwork + grillageFormwork;
      contactAreaM2 =
        pierCount * (pierSize * pierSize) + (pH > 0 ? 2 * (L + W) * pierSize : 0);

      if (hasRebar) {
        const barPerPier = 4 * (H + 0.5) * 1.1;
        const pierStirrups = Math.ceil(H / 0.25) * (4 * pierSize);
        rebarLenMeters =
          pierCount * (barPerPier + pierStirrups) * Math.max(1, rebarSpec.layers);
      }
      break;
    }
    case 'wall': {
      const wallThickness = W > 1.5 ? (pW > 0 ? pW : 0.3) : W;
      concreteVol = L * wallThickness * H * safetyFactor;
      formworkArea = 2 * L * H;
      contactAreaM2 = L * wallThickness;

      if (hasRebar) {
        const verticalBars = Math.ceil(L / 0.2) + 1;
        const horizontalBars = Math.ceil(H / 0.2) + 1;
        const singleMeshLen =
          (verticalBars * (H + 0.3) + horizontalBars * (L + 0.3)) * 1.12;
        rebarLenMeters = singleMeshLen * Math.max(1, rebarSpec.layers);
      }
      break;
    }
  }

  const totalWeightKg = concreteVol * 2450;
  const totalWeightTons = totalWeightKg / 1000;

  let cementKgPerM3 = 350;
  let sandKgPerM3 = 620;
  let gravelKgPerM3 = 1200;

  switch (concreteSpec.grade) {
    case 'M150':
      cementKgPerM3 = 260;
      sandKgPerM3 = 730;
      gravelKgPerM3 = 1180;
      break;
    case 'M200':
      cementKgPerM3 = 310;
      sandKgPerM3 = 690;
      gravelKgPerM3 = 1160;
      break;
    case 'M250':
      cementKgPerM3 = 350;
      sandKgPerM3 = 650;
      gravelKgPerM3 = 1150;
      break;
    case 'M300':
      cementKgPerM3 = 380;
      sandKgPerM3 = 610;
      gravelKgPerM3 = 1140;
      break;
    case 'M350':
      cementKgPerM3 = 420;
      sandKgPerM3 = 570;
      gravelKgPerM3 = 1120;
      break;
    case 'M400':
      cementKgPerM3 = 460;
      sandKgPerM3 = 530;
      gravelKgPerM3 = 1100;
      break;
  }

  const totalCementKg = concreteVol * cementKgPerM3;
  const cementBags = Math.ceil(totalCementKg / concreteSpec.cementBagKg);
  const sandTons = (concreteVol * sandKgPerM3) / 1000;
  const gravelTons = (concreteVol * gravelKgPerM3) / 1000;
  const waterLiters = concreteVol * (cementKgPerM3 * 0.52);

  const d = hasRebar ? rebarSpec.diameterMm : 0;
  const linearDensityKgM = d > 0 ? d * d * 0.006165 : 0;
  const rebarWeightKg = rebarLenMeters * linearDensityKgM;
  const bindingWireKg = hasRebar ? Math.max(1.5, rebarWeightKg * 0.012) : 0;
  const timberVolumeM3 = formworkArea * 0.025 * 1.15;

  const safeAreaM2 = Math.max(0.2, contactAreaM2);
  const totalMassWithRebar = totalWeightKg + rebarWeightKg;
  const forceKn = (totalMassWithRebar * 9.81) / 1000;
  const soilPressureKpa = forceKn / safeAreaM2;

  const concretePrice =
    concreteSpec.customPricePerM3 > 0
      ? concreteSpec.customPricePerM3
      : prices.concretePerM3;
  const rebarPrice =
    rebarSpec.customPricePerTon > 0
      ? rebarSpec.customPricePerTon
      : prices.rebarPerTon;

  const concreteCost = concreteVol * concretePrice;
  const rebarCost = (rebarWeightKg / 1000) * rebarPrice;
  const sandGravelCost =
    sandTons * prices.sandPerTon + gravelTons * prices.gravelPerTon;
  const formworkCost = formworkArea * prices.formworkPerM2;
  const laborEstCost = (concreteCost + rebarCost) * 0.35;
  const totalCost =
    concreteCost + rebarCost + sandGravelCost + formworkCost + laborEstCost;

  return {
    concreteVolumeM3: Math.round(concreteVol * 100) / 100,
    totalWeightTons: Math.round(totalWeightTons * 100) / 100,
    cementBags,
    sandTons: Math.round(sandTons * 10) / 10,
    gravelTons: Math.round(gravelTons * 10) / 10,
    rebarLengthMeters: Math.round(rebarLenMeters),
    rebarWeightKg: Math.round(rebarWeightKg),
    bindingWireKg: Math.round(bindingWireKg * 10) / 10,
    formworkAreaM2: Math.round(formworkArea * 10) / 10,
    timberVolumeM3: Math.round(timberVolumeM3 * 100) / 100,
    waterLiters: Math.round(waterLiters),
    soilPressureKpa: Math.round(soilPressureKpa * 10) / 10,
    itemizedCosts: {
      concrete: Math.round(concreteCost),
      rebar: Math.round(rebarCost),
      sandGravel: Math.round(sandGravelCost),
      formwork: Math.round(formworkCost),
      laborEst: Math.round(laborEstCost),
      total: Math.round(totalCost),
    },
  };
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  AED: 'AED ',
};

export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₽';
  if (currency === 'RUB') {
    return `${amount.toLocaleString('ru-RU', {
      maximumFractionDigits: 0,
    })} ${symbol}`;
  }
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export const DEFAULT_PRICES: MaterialPrices = {
  concretePerM3: 4200,
  rebarPerTon: 62000,
  sandPerTon: 850,
  gravelPerTon: 1400,
  formworkPerM2: 650,
};
