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
  pieces: RebarPiece[];
  notes: string[];
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
      // Typical strip cage: 4 bars (1 layer equiv) or 6 bars (top+bottom)
      const mainBarCount = rebarSpec.layers >= 2 ? 6 : 4;
      // Total longitudinal steel along whole strip network
      const longPieceMm = Math.max(
        500,
        Math.round(Math.min(stockLengthM - lapM, Math.max(L, W)) * 1000)
      );
      const totalLongM = mainBarCount * totalStripLen;
      const longCount = Math.max(1, Math.ceil((totalLongM * 1000) / longPieceMm));
      addPiece(pieces, 'А1', 'Продольные каркаса ленты', d, longPieceMm, longCount);

      const stirrupD = Math.min(8, d);
      const stirrupMm = Math.max(
        600,
        Math.round(2 * (ribbonWidth + H - 2 * coverM) * 1000)
      );
      const stirrupsCount = Math.ceil(totalStripLen / 0.3);
      addPiece(pieces, 'Х1', 'Хомуты шаг 300 мм', stirrupD, stirrupMm, stirrupsCount);
      notes.push(
        `Лента: ${mainBarCount} прод. по ${totalStripLen.toFixed(1)} м сети + хомуты Ø${stirrupD}`
      );
      break;
    }
    case 'beam': {
      const mainBarCount = Math.max(4, rebarSpec.layers * 2);
      const barMm = Math.max(500, Math.round((L + 2 * 0.15) * 1000)); // +anchorage allowance
      addPiece(pieces, 'А1', 'Продольные', d, barMm, mainBarCount);
      const stirrupD = Math.min(8, d);
      const stirrupMm = Math.max(
        500,
        Math.round(2 * (W + H - 2 * coverM) * 1000)
      );
      const stirrupsCount = Math.ceil(L / 0.2) + 1;
      addPiece(pieces, 'Х1', 'Хомуты шаг 200 мм', stirrupD, stirrupMm, stirrupsCount);
      notes.push(`Балка: ${mainBarCount} прод. + хомуты Ø${stirrupD}`);
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

  const nest = nestPiecesToStock(
    pieces.map((p) => ({ lengthM: p.lengthMm / 1000, count: p.count })),
    stockLengthM,
    lapM
  );

  const netLen = pieces.reduce((s, p) => s + (p.lengthMm / 1000) * p.count, 0);
  const netWeight = pieces.reduce((s, p) => s + p.weightKg, 0);
  const weightWithWaste = netWeight * (1 + nest.wastePct / 100);

  const barArea = Math.PI * (d / 2) ** 2;
  const spacingM = Math.max(0.05, rebarSpec.spacingMm / 1000);
  const asProvided = (barArea / spacingM) * rebarSpec.layers;
  const asMin = MU_S_MIN * H * 1e6;

  notes.push(
    `Нахлёст ${lapMm} мм (~40Ø), хлыст ${stockLengthM.toFixed(1)} м → ${nest.barsNeeded} шт, отход ${nest.wastePct}%`
  );

  return {
    lengthM: Math.round(netLen * 10) / 10,
    weightKg: Math.round(weightWithWaste * 10) / 10,
    bindingWireKg: Math.round(Math.max(1.5, weightWithWaste * 0.012) * 10) / 10,
    lapMm,
    coverMm: input.coverMm,
    asProvidedMm2PerM: asProvided,
    asMinMm2PerM: asMin,
    wastePct: nest.wastePct,
    stockBarsApprox: nest.barsNeeded,
    stockLengthM,
    wasteM: nest.wasteM,
    pieces,
    notes,
  };
}

export { nestPiecesToStock, stockBarsForPieces } from '@/domain/rebar/cutting';
