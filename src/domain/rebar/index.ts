import {
  estimateLapMm,
  rebarLinearDensityKgM,
  REBAR_STOCK_LENGTH_MM,
  MU_S_MIN,
} from '@/domain/norms/tables';
import { nestPiecesToStock } from '@/domain/rebar/cutting';
import type { RebarSpec, StructureType } from '@/lib/types';

export interface RebarInput {
  lengthM: number;
  widthM: number;
  depthM: number;
  auxWidthM: number;
  stripLengthM: number;
  pierCount: number;
  coverMm: number;
  /** Warehouse stock bar length, m (default 11.7) */
  stockLengthM?: number;
}

export interface RebarPiece {
  mark: string;
  role: string;
  diameterMm: number;
  lengthMm: number;
  count: number;
  weightKg: number;
}

export interface RebarResult {
  lengthM: number;
  weightKg: number;
  bindingWireKg: number;
  lapMm: number;
  coverMm: number;
  asProvidedMm2PerM: number;
  asMinMm2PerM: number;
  wastePct: number;
  stockBarsApprox: number;
  stockLengthM: number;
  wasteM: number;
  /** Закупка по диаметрам — нельзя смешивать Ø10 и Ø8 в одной строке. */
  stockByDiameter: Array<{ diameterMm: number; bars: number; weightKg: number }>;
  pieces: RebarPiece[];
  notes: string[];
}

function resolveLongitudinalBars(rebarSpec: RebarSpec): 4 | 6 | 8 {
  if (rebarSpec.longitudinalBars === 4 || rebarSpec.longitudinalBars === 6 || rebarSpec.longitudinalBars === 8) {
    return rebarSpec.longitudinalBars;
  }
  if (rebarSpec.layers >= 3) return 8;
  if (rebarSpec.layers >= 2) return 6;
  return 4;
}

function stirrupPerimeterMm(
  sectionWidthM: number,
  sectionHeightM: number,
  coverM: number,
  stirrupDiameterMm: number
): number {
  const clearW = Math.max(0.05, sectionWidthM - 2 * coverM);
  const clearH = Math.max(0.05, sectionHeightM - 2 * coverM);
  const hookMm = Math.max(75, 10 * stirrupDiameterMm);
  return Math.max(400, Math.round(2 * (clearW + clearH) * 1000) + 2 * hookMm);
}

function pieceWeight(diameterMm: number, lengthMm: number, count: number): number {
  return rebarLinearDensityKgM(diameterMm) * (lengthMm / 1000) * count;
}

function addPiece(
  pieces: RebarPiece[],
  mark: string,
  role: string,
  diameterMm: number,
  lengthMm: number,
  count: number
) {
  if (count <= 0 || lengthMm <= 0) return;
  pieces.push({
    mark,
    role,
    diameterMm,
    lengthMm,
    count,
    weightKg: pieceWeight(diameterMm, lengthMm, count),
  });
}

export function computeRebar(
  structureType: StructureType,
  rebarSpec: RebarSpec,
  input: RebarInput
): RebarResult {
  const L = input.lengthM;
  const W = input.widthM;
  const H = input.depthM;
  const pW = input.auxWidthM;
  const coverM = Math.max(20, input.coverMm) / 1000;
  const d = rebarSpec.diameterMm;
  const lapMm = estimateLapMm(d);
  const lapM = lapMm / 1000;
  const stockLengthM = Math.max(6, input.stockLengthM ?? REBAR_STOCK_LENGTH_MM / 1000);
  const notes: string[] = [];
  const pieces: RebarPiece[] = [];

  switch (structureType) {
    case 'slab': {
      const spacingM = Math.max(0.05, rebarSpec.spacingMm / 1000);
      const numLong = Math.ceil(W / spacingM) + 1;
      const numTrans = Math.ceil(L / spacingM) + 1;
      const longMm = Math.max(500, Math.round((L - 2 * coverM) * 1000));
      const transMm = Math.max(500, Math.round((W - 2 * coverM) * 1000));
      for (let layer = 1; layer <= rebarSpec.layers; layer++) {
        const suffix = rebarSpec.layers > 1 ? `-L${layer}` : '';
        addPiece(pieces, `А1${suffix}`, 'Продольная сетка', d, longMm, numLong);
        addPiece(pieces, `А2${suffix}`, 'Поперечная сетка', d, transMm, numTrans);
      }
      notes.push(
        `Сетка плиты: ${numLong} прод. × ${numTrans} попер. на слой × ${rebarSpec.layers} сл.; a=${input.coverMm} мм`
      );
      break;
    }
    case 'strip': {
      const ribbonWidth =
        pW > 0 ? pW : Math.min(0.5, Math.max(0.3, W > 2 ? 0.4 : W));
      const totalStripLen = Math.max(input.stripLengthM, 2 * (L + W));
      const longBars = resolveLongitudinalBars(rebarSpec);
      const stirrupStepM = Math.max(0.1, rebarSpec.spacingMm / 1000);

      // Продольные: линии вдоль всей сети ленты, нарезка под складской хлыст с нахлёстом.
      const usable = Math.max(0.5, stockLengthM - lapM);
      const segsPerLine = Math.max(1, Math.ceil(totalStripLen / usable));
      const longPieceMm = Math.max(
        500,
        Math.round(Math.min(usable, totalStripLen) * 1000)
      );
      addPiece(
        pieces,
        'А1',
        `Продольные каркаса (${longBars} шт в сечении)`,
        d,
        longPieceMm,
        longBars * segsPerLine
      );

      // Хомуты: замкнутый прямоугольник по сечению ленты с учётом a и крюков.
      const stirrupD = Math.min(8, d);
      const stirrupMm = stirrupPerimeterMm(ribbonWidth, H, coverM, stirrupD);
      const stirrupsCount = Math.max(
        2,
        Math.ceil(totalStripLen / stirrupStepM) + 1
      );
      addPiece(
        pieces,
        'Х1',
        `Хомуты шаг ${Math.round(stirrupStepM * 1000)} мм`,
        stirrupD,
        stirrupMm,
        stirrupsCount
      );

      notes.push(
        `Лента ${ribbonWidth.toFixed(2)}×${H.toFixed(2)} м, сеть ${totalStripLen.toFixed(1)} м: ${longBars} прод. Ø${d} + хомуты Ø${stirrupD} шаг ${Math.round(stirrupStepM * 1000)} мм, a=${input.coverMm} мм`
      );
      break;
    }
    case 'beam': {
      const longBars = resolveLongitudinalBars(rebarSpec);
      const stirrupStepM = Math.max(0.1, rebarSpec.spacingMm / 1000);
      const barMm = Math.max(500, Math.round((L + 2 * 0.15) * 1000));
      addPiece(pieces, 'А1', `Продольные (${longBars} шт)`, d, barMm, longBars);
      const stirrupD = Math.min(8, d);
      const stirrupMm = stirrupPerimeterMm(W, H, coverM, stirrupD);
      const stirrupsCount = Math.max(2, Math.ceil(L / stirrupStepM) + 1);
      addPiece(
        pieces,
        'Х1',
        `Хомуты шаг ${Math.round(stirrupStepM * 1000)} мм`,
        stirrupD,
        stirrupMm,
        stirrupsCount
      );
      notes.push(
        `Балка ${W.toFixed(2)}×${H.toFixed(2)}×${L.toFixed(2)} м: ${longBars} прод. Ø${d} + хомуты Ø${stirrupD}`
      );
      break;
    }
    case 'pier': {
      const pierSize = pW > 0 ? pW : 0.4;
      const pierCount = Math.max(4, input.pierCount);
      const barMm = Math.max(500, Math.round((H + 0.5) * 1000));
      const longCount = pierCount * 4;
      addPiece(pieces, 'А1', 'Стержни свай (4Ø)', d, barMm, longCount);
      const stirrupD = Math.min(8, d);
      const stirrupMm = Math.max(400, Math.round(4 * pierSize * 1000));
      const stirrupsCount = pierCount * Math.max(3, Math.ceil(H / 0.25));
      addPiece(pieces, 'Х1', 'Хомуты свай', stirrupD, stirrupMm, stirrupsCount);
      notes.push(`Сваи: ${pierCount} шт × 4 стержня Ø${d}`);
      break;
    }
    case 'wall': {
      const spacingM = Math.max(0.05, rebarSpec.spacingMm / 1000);
      const verticalBars = Math.ceil(L / spacingM) + 1;
      const horizontalBars = Math.ceil(H / spacingM) + 1;
      const vMm = Math.max(500, Math.round((H - 2 * coverM) * 1000));
      const hMm = Math.max(500, Math.round((L - 2 * coverM) * 1000));
      for (let layer = 1; layer <= rebarSpec.layers; layer++) {
        const suffix = rebarSpec.layers > 1 ? `-L${layer}` : '';
        addPiece(pieces, `А1${suffix}`, 'Вертикаль', d, vMm, verticalBars);
        addPiece(pieces, `А2${suffix}`, 'Горизонталь', d, hMm, horizontalBars);
      }
      notes.push(
        `Сетка стены шаг ${rebarSpec.spacingMm} мм, слоёв ${rebarSpec.layers}`
      );
      break;
    }
  }

  // Раскрой по диаметрам отдельно: Ø8 и Ø12 нельзя резать из одного хлыста.
  const byDiameter = new Map<number, { lengthM: number; count: number }[]>();
  for (const p of pieces) {
    const list = byDiameter.get(p.diameterMm) ?? [];
    list.push({ lengthM: p.lengthMm / 1000, count: p.count });
    byDiameter.set(p.diameterMm, list);
  }

  let barsNeeded = 0;
  let wasteM = 0;
  let stockTotalM = 0;
  /** Масса к закупке = Σ (хлысты × L × ρ) по каждому Ø. */
  let purchaseWeightKg = 0;
  const stockByDiameter: RebarResult['stockByDiameter'] = [];
  for (const [dia, group] of byDiameter) {
    const nest = nestPiecesToStock(group, stockLengthM, lapM);
    const dens = rebarLinearDensityKgM(dia);
    const groupWeight = nest.barsNeeded * stockLengthM * dens;
    barsNeeded += nest.barsNeeded;
    wasteM += nest.wasteM;
    stockTotalM += nest.stockTotalM;
    purchaseWeightKg += groupWeight;
    stockByDiameter.push({
      diameterMm: dia,
      bars: nest.barsNeeded,
      weightKg: Math.round(groupWeight * 10) / 10,
    });
  }
  stockByDiameter.sort((a, b) => b.diameterMm - a.diameterMm);

  const wastePct =
    stockTotalM > 0 ? Math.round((wasteM / stockTotalM) * 1000) / 10 : 0;
  const weightKg = Math.round(purchaseWeightKg * 10) / 10;

  const netLen = pieces.reduce((s, p) => s + (p.lengthMm / 1000) * p.count, 0);

  const barArea = Math.PI * (d / 2) ** 2;
  const spacingM = Math.max(0.05, rebarSpec.spacingMm / 1000);
  let asProvided = (barArea / spacingM) * rebarSpec.layers;
  if (structureType === 'strip' || structureType === 'beam') {
    const longBars = resolveLongitudinalBars(rebarSpec);
    const sectionW =
      structureType === 'strip'
        ? pW > 0
          ? pW
          : Math.min(0.5, Math.max(0.3, W > 2 ? 0.4 : W))
        : W;
    asProvided = (longBars * barArea) / Math.max(0.1, sectionW);
  }
  const asMin = MU_S_MIN * H * 1e6;

  notes.push(
    `Нахлёст ${lapMm} мм (~40Ø), хлыст ${stockLengthM.toFixed(1)} м → ${barsNeeded} шт (${stockByDiameter
      .map((s) => `${s.bars}×Ø${s.diameterMm}`)
      .join(' + ')}), отход ${wastePct}%`
  );

  return {
    lengthM: Math.round(netLen * 10) / 10,
    weightKg,
    bindingWireKg: Math.round(Math.max(1.5, weightKg * 0.012) * 10) / 10,
    lapMm,
    coverMm: input.coverMm,
    asProvidedMm2PerM: asProvided,
    asMinMm2PerM: asMin,
    wastePct,
    stockBarsApprox: barsNeeded,
    stockLengthM,
    wasteM: Math.round(wasteM * 10) / 10,
    stockByDiameter,
    pieces,
    notes,
  };
}

export { nestPiecesToStock, stockBarsForPieces } from '@/domain/rebar/cutting';
