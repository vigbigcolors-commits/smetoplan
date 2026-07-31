import type { StructureType } from '@/lib/types';
import {
  buildRectangleStripPlan,
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
  /** Slab rib / strip ribbon / pier size / wall thickness override */
  auxWidthM: number;
  /** Slab rib depth / grillage height */
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

/**
 * Strip volume by centerline length × ribbon × depth, minus junction cubes
 * (T/cross overlaps) so volume is not double-counted at intersections.
 */
export function computeStripMetrics(
  lengthM: number,
  widthM: number,
  depthM: number,
  ribbonWidth: number,
  innerLong: number,
  innerCross: number
): {
  stripLengthM: number;
  concreteVolumeRawM3: number;
  formworkAreaM2: number;
  contactAreaM2: number;
  junctionCount: number;
} {
  const L = lengthM;
  const W = widthM;
  const H = depthM;
  const w = ribbonWidth;
  const nL = innerLong;
  const nC = innerCross;

  const stripLengthM = 2 * (L + W) + nL * L + nC * W;
  const junctions = nL * nC + 2 * nL + 2 * nC;
  const gross = stripLengthM * w * H;
  const deduct = junctions * w * w * H;
  const concreteVolumeRawM3 = Math.max(w * w * H * 4, gross - deduct);

  return {
    stripLengthM,
    concreteVolumeRawM3,
    formworkAreaM2: 2 * stripLengthM * H,
    contactAreaM2: Math.max(w * w * 4, stripLengthM * w - junctions * w * w),
    junctionCount: junctions,
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
      const plan = isValidStripPlan(input.stripPlan)
        ? input.stripPlan
        : buildRectangleStripPlan(L, W, axes.long, axes.cross);
      const m = computeStripPlanMetrics(plan, H, ribbonWidth);
      notes.push(...m.notes);
      if (!isValidStripPlan(input.stripPlan)) {
        notes.push(
          `Прямоугольник ${L}×${W} м + ${axes.long} прод. / ${axes.cross} попер.`
        );
      }
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
      return {
        concreteVolumeRawM3: L * W * H,
        formworkAreaM2: (2 * H + W) * L,
        contactAreaM2: L * W,
        stripLengthM: 0,
        pierCount: 0,
        ...emptyAxes,
        notes: ['Балка/ригель: призматический объём'],
      };
    }
    case 'pier': {
      const pierSize = pW > 0 ? pW : 0.4;
      const spacing = Math.max(1.5, input.pierSpacingM ?? 2.5);
      const nx = Math.max(2, Math.ceil(L / spacing) + 1);
      const ny = Math.max(2, Math.ceil(W / spacing) + 1);
      const pierCount = nx * ny;
      const pierVol = pierCount * (pierSize * pierSize * H);
      const grillageVol = pH > 0 ? 2 * (L + W) * pierSize * pH : 0;
      if (pH > 0) notes.push('Учтён ростверк по контуру');
      notes.push(
        `Свайное поле: ${pierCount} шт (${nx}×${ny}), шаг ${spacing.toFixed(2)} м`
      );
      return {
        concreteVolumeRawM3: pierVol + grillageVol,
        formworkAreaM2:
          pierCount * (4 * pierSize * H) +
          (pH > 0 ? 2 * (L + W) * (2 * pH + pierSize) : 0),
        contactAreaM2:
          pierCount * (pierSize * pierSize) +
          (pH > 0 ? 2 * (L + W) * pierSize : 0),
        stripLengthM: 0,
        pierCount,
        ...emptyAxes,
        notes,
      };
    }
    case 'wall': {
      const wallThickness = W > 1.5 ? (pW > 0 ? pW : 0.3) : W;
      return {
        concreteVolumeRawM3: L * wallThickness * H,
        formworkAreaM2: 2 * L * H,
        contactAreaM2: L * wallThickness,
        stripLengthM: 0,
        pierCount: 0,
        ...emptyAxes,
        notes: ['Стена: две стороны опалубки'],
      };
    }
  }
}
