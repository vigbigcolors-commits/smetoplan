import type { StructureType } from '@/lib/types';
import {
  computeRectStripFootprint,
  computeStripPlanMetrics,
  isValidStripPlan,
  type StripPlan,
} from '@/domain/geometry/strip-path';

export type { StripPlan, Point2, StripInner } from '@/domain/geometry/strip-path';
export {
  buildRectangleStripPlan,
  buildLShapeStripPlan,
  computeStripPlanMetrics,
  polygonArea,
  boundingBox,
} from '@/domain/geometry/strip-path';

export type StripLayoutMode =
  | 'perimeter'
  | 'perimeter_plus_one'
  | 'perimeter_plus_cross'
  | 'custom';

export interface GeometryInput {
  lengthM: number;
  widthM: number;
  depthM: number;
  /** Slab rib / strip ribbon / pier diameter / wall base thickness (подошва) */
  auxWidthM: number;
  /** Slab rib depth / pier slab thickness */
  auxDepthM: number;
  stripLayout: StripLayoutMode;
  /** Internal strip axes parallel to length (custom / overrides preset) */
  stripInnerLong?: number;
  /** Internal strip axes parallel to width */
  stripInnerCross?: number;
  /** Pier grid spacing, m */
  pierSpacingM?: number;
  /** Optional arbitrary strip centerline plan (overrides axis counts when set) */
  stripPlan?: StripPlan | null;
}

export interface GeometryResult {
  concreteVolumeRawM3: number;
  formworkAreaM2: number;
  contactAreaM2: number;
  stripLengthM: number;
  pierCount: number;
  stripInnerLong: number;
  stripInnerCross: number;
  junctionCount: number;
  /** Plan area for loads (polygon if stripPlan provided) */
  planAreaM2?: number;
  notes: string[];
}

function clampPositive(v: number, min: number): number {
  return Math.max(min, v);
}

export function resolveStripAxes(
  layout: StripLayoutMode,
  innerLong?: number,
  innerCross?: number
): { long: number; cross: number } {
  if (layout === 'custom') {
    return {
      long: Math.max(0, Math.min(6, Math.round(innerLong ?? 0))),
      cross: Math.max(0, Math.min(6, Math.round(innerCross ?? 0))),
    };
  }
  if (layout === 'perimeter_plus_one') return { long: 1, cross: 0 };
  if (layout === 'perimeter_plus_cross') return { long: 1, cross: 1 };
  if (layout === 'perimeter') return { long: 0, cross: 0 };
  return {
    long: Math.max(0, Math.min(6, Math.round(innerLong ?? 0))),
    cross: Math.max(0, Math.min(6, Math.round(innerCross ?? 0))),
  };
}

export function buildGeometry(
  structureType: StructureType,
  input: GeometryInput
): GeometryResult {
  const L = clampPositive(input.lengthM, 0.5);
  const W =
    structureType === 'wall' || structureType === 'beam'
      ? clampPositive(input.widthM, 0.05)
      : clampPositive(input.widthM, 0.5);
  const H = clampPositive(input.depthM, 0.05);
  const pW = Math.max(0, input.auxWidthM);
  const pH = Math.max(0, input.auxDepthM);
  const notes: string[] = [];
  const emptyAxes = { stripInnerLong: 0, stripInnerCross: 0, junctionCount: 0 };

  switch (structureType) {
    case 'slab': {
      const mainVol = L * W * H;
      const perimeter = 2 * (L + W);
      // Ribs along perimeter; deduct 4 corner cubes (double-counted)
      const ribVolRaw = pW > 0 && pH > 0 ? perimeter * pW * pH : 0;
      const ribCorners = pW > 0 && pH > 0 ? 4 * pW * pW * pH : 0;
      const ribVol = Math.max(0, ribVolRaw - ribCorners);
      if (ribVol > 0) {
        notes.push(
          `Рёбра по периметру ${pW}×${pH} м (углы без двойного счёта)`
        );
      }
      // Edge formwork only (slab on grade — no soffit)
      return {
        concreteVolumeRawM3: mainVol + ribVol,
        formworkAreaM2: 2 * (L + W) * (H + (pH > 0 ? pH : 0)),
        contactAreaM2: L * W,
        stripLengthM: 0,
        pierCount: 0,
        ...emptyAxes,
        notes,
      };
    }
    case 'strip': {
      const ribbonWidth =
        pW > 0 ? pW : Math.min(0.5, Math.max(0.3, W > 2 ? 0.4 : W));
      const axes = resolveStripAxes(
        input.stripLayout,
        input.stripInnerLong,
        input.stripInnerCross
      );
      // Прямоугольный план → точная аналитика (рама + стены, углы не задвоены).
      // Произвольный контур из редактора → осевая модель по полигону.
      const m = isValidStripPlan(input.stripPlan)
        ? computeStripPlanMetrics(input.stripPlan, H, ribbonWidth)
        : computeRectStripFootprint(L, W, H, ribbonWidth, axes.long, axes.cross);
      notes.push(...m.notes);
      return {
        concreteVolumeRawM3: m.concreteVolumeRawM3,
        formworkAreaM2: m.formworkAreaM2,
        contactAreaM2: m.contactAreaM2,
        stripLengthM: m.stripLengthM,
        pierCount: 0,
        stripInnerLong: axes.long,
        stripInnerCross: axes.cross,
        junctionCount: m.junctionCount,
        planAreaM2: m.planAreaM2,
        notes,
      };
    }
    case 'beam': {
      // Квадратное сечение (колонна/пилон): 4 грани. Прямоугольная балка: низ+2 бока.
      const nearlySquare =
        Math.abs(W - H) / Math.max(W, H, 1e-6) <= 0.08;
      const formworkAreaM2 = nearlySquare
        ? 4 * ((W + H) / 2) * L
        : (2 * H + W) * L;
      notes.push(
        nearlySquare
          ? 'Колонна/пилон: призматический объём, опалубка 4 грани'
          : 'Балка/ригель: призматический объём, опалубка низ+2 бока'
      );
      return {
        concreteVolumeRawM3: L * W * H,
        formworkAreaM2,
        contactAreaM2: L * W,
        stripLengthM: 0,
        pierCount: 0,
        ...emptyAxes,
        notes,
      };
    }
    case 'pier': {
      // Свайно-плитный: плита L×W×t + поле свай. Опалубка только по борту плиты
      // (сваи — бурение/обсадка в грунте, щиты не закупаются).
      const pierDia = pW > 0 ? pW : 0.3;
      const slabH = pH > 0 ? pH : 0.3;
      const pileDepth = Math.max(0.5, H);
      const spacing = Math.max(1.5, input.pierSpacingM ?? 2.5);
      const nx = Math.max(2, Math.ceil(L / spacing) + 1);
      const ny = Math.max(2, Math.ceil(W / spacing) + 1);
      const pierCount = nx * ny;
      const pierArea = Math.PI * (pierDia / 2) ** 2;
      const pierVol = pierCount * pierArea * pileDepth;
      const slabVol = L * W * slabH;
      notes.push(
        `Плита ${L.toFixed(1)}×${W.toFixed(1)}×${slabH.toFixed(2)} м = ${slabVol.toFixed(2)} м³`
      );
      notes.push(
        `Сваи: ${pierCount} шт (${nx}×${ny}), Ø${pierDia.toFixed(2)} м, L=${pileDepth.toFixed(2)} м, шаг ${spacing.toFixed(2)} м`
      );
      return {
        concreteVolumeRawM3: slabVol + pierVol,
        formworkAreaM2: 2 * (L + W) * slabH,
        contactAreaM2: L * W,
        stripLengthM: 0,
        pierCount,
        ...emptyAxes,
        planAreaM2: L * W,
        notes,
      };
    }
    case 'wall': {
      // Подпорная стена: трапеция в сечении (верхушка W, подошва pW).
      // Объём = L × H × (t_top + t_base) / 2. Если подошва не задана — прямоугольник.
      const tTop = Math.max(0.1, W);
      const tBase = pW > 0 ? Math.max(0.1, pW) : tTop;
      const tAvg = (tTop + tBase) / 2;
      if (Math.abs(tBase - tTop) > 1e-6) {
        notes.push(
          `Трапеция: верх ${tTop.toFixed(2)} м / подошва ${tBase.toFixed(2)} м → tср=${tAvg.toFixed(3)} м`
        );
      } else {
        notes.push('Стена постоянного сечения (прямоугольник)');
      }
      return {
        concreteVolumeRawM3: L * H * tAvg,
        formworkAreaM2: 2 * L * H,
        contactAreaM2: L * tBase,
        stripLengthM: 0,
        pierCount: 0,
        ...emptyAxes,
        notes,
      };
    }
  }
}
