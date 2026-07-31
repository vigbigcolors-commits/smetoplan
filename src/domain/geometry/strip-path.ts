/**
 * Arbitrary strip foundation centerline plan:
 * closed outer polygon + internal wall segments.
 * Volume = centerline length × ribbon × H − junction cubes (inners vs axes).
 */

export interface Point2 {
  x: number;
  y: number;
}

export interface StripInner {
  id: string;
  a: Point2;
  b: Point2;
}

export interface StripPlan {
  outer: Point2[];
  inners: StripInner[];
}

export interface StripPlanMetrics {
  stripLengthM: number;
  concreteVolumeRawM3: number;
  formworkAreaM2: number;
  contactAreaM2: number;
  junctionCount: number;
  planAreaM2: number;
  notes: string[];
}

const EPS = 1e-6;

export function dist(a: Point2, b: Point2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polygonPerimeter(outer: Point2[]): number {
  if (outer.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < outer.length; i++) {
    p += dist(outer[i], outer[(i + 1) % outer.length]);
  }
  return p;
}

/** Shoelace; absolute area of closed polygon. */
export function polygonArea(outer: Point2[]): number {
  if (outer.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i];
    const b = outer[(i + 1) % outer.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export function boundingBox(outer: Point2[]): {
  lengthM: number;
  widthM: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (outer.length === 0) {
    return { lengthM: 0, widthM: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = outer[0].x;
  let minY = outer[0].y;
  let maxX = outer[0].x;
  let maxY = outer[0].y;
  for (const p of outer) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    lengthM: Math.max(0.5, maxX - minX),
    widthM: Math.max(0.5, maxY - minY),
    minX,
    minY,
    maxX,
    maxY,
  };
}

/** Classic rectangular house plan with evenly spaced internal axes. */
export function buildRectangleStripPlan(
  lengthM: number,
  widthM: number,
  innerLong: number,
  innerCross: number
): StripPlan {
  const L = Math.max(0.5, lengthM);
  const W = Math.max(0.5, widthM);
  const outer: Point2[] = [
    { x: 0, y: 0 },
    { x: L, y: 0 },
    { x: L, y: W },
    { x: 0, y: W },
  ];
  const inners: StripInner[] = [];
  const nL = Math.max(0, Math.min(6, Math.round(innerLong)));
  const nC = Math.max(0, Math.min(6, Math.round(innerCross)));
  for (let i = 1; i <= nL; i++) {
    const y = (i / (nL + 1)) * W;
    inners.push({
      id: `long-${i}`,
      a: { x: 0, y },
      b: { x: L, y },
    });
  }
  for (let i = 1; i <= nC; i++) {
    const x = (i / (nC + 1)) * L;
    inners.push({
      id: `cross-${i}`,
      a: { x, y: 0 },
      b: { x, y: W },
    });
  }
  return { outer, inners };
}

type Seg = { a: Point2; b: Point2 };

function pointKey(p: Point2): string {
  return `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
}

function onSegment(p: Point2, a: Point2, b: Point2): boolean {
  const d = dist(a, b);
  if (d < EPS) return dist(p, a) < EPS;
  const cross = Math.abs((p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y));
  if (cross > EPS * Math.max(1, d)) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  return dot >= -EPS && dot <= d * d + EPS;
}

function orient(a: Point2, b: Point2, c: Point2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** Proper intersection or shared endpoint of two segments. */
function segmentIntersection(s1: Seg, s2: Seg): Point2 | null {
  const { a, b } = s1;
  const { a: c, b: d } = s2;
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (
    Math.abs(o1) < EPS &&
    Math.abs(o2) < EPS &&
    Math.abs(o3) < EPS &&
    Math.abs(o4) < EPS
  ) {
    // Colinear — treat shared endpoints / overlaps at endpoints only
    for (const p of [a, b, c, d]) {
      if (onSegment(p, a, b) && onSegment(p, c, d)) {
        if (
          (dist(p, a) < EPS || dist(p, b) < EPS) &&
          (dist(p, c) < EPS || dist(p, d) < EPS)
        ) {
          return p;
        }
      }
    }
    return null;
  }

  if (o1 * o2 <= EPS && o3 * o4 <= EPS) {
    const denom =
      (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (Math.abs(denom) < EPS) {
      if (onSegment(a, c, d)) return a;
      if (onSegment(b, c, d)) return b;
      return null;
    }
    const t =
      ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denom;
    return {
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y),
    };
  }
  return null;
}

function outerEdges(outer: Point2[]): Seg[] {
  const edges: Seg[] = [];
  for (let i = 0; i < outer.length; i++) {
    edges.push({ a: outer[i], b: outer[(i + 1) % outer.length] });
  }
  return edges;
}

/**
 * Junctions for volume deduction: meetings of inner axes with outer or other inners.
 * Outer polyline corners are continuous path — not deducted (matches classic strip model).
 */
export function countStripJunctions(plan: StripPlan): number {
  const edges = outerEdges(plan.outer);
  const inners: Seg[] = plan.inners.map((s) => ({ a: s.a, b: s.b }));
  const keys = new Set<string>();

  for (let i = 0; i < inners.length; i++) {
    const inner = inners[i];
    for (const edge of edges) {
      const hit = segmentIntersection(inner, edge);
      if (hit) keys.add(pointKey(hit));
    }
    for (let j = i + 1; j < inners.length; j++) {
      const hit = segmentIntersection(inner, inners[j]);
      if (hit) keys.add(pointKey(hit));
    }
  }
  return keys.size;
}

export function computeStripPlanMetrics(
  plan: StripPlan,
  depthM: number,
  ribbonWidth: number
): StripPlanMetrics {
  const H = Math.max(0.05, depthM);
  const w = Math.max(0.15, ribbonWidth);
  const outerLen = polygonPerimeter(plan.outer);
  let innerLen = 0;
  for (const s of plan.inners) {
    innerLen += dist(s.a, s.b);
  }
  const stripLengthM = outerLen + innerLen;
  const junctionCount = countStripJunctions(plan);
  const gross = stripLengthM * w * H;
  const deduct = junctionCount * w * w * H;
  const concreteVolumeRawM3 = Math.max(w * w * H * 4, gross - deduct);
  const contactAreaM2 = Math.max(
    w * w * 4,
    stripLengthM * w - junctionCount * w * w
  );
  const planAreaM2 = polygonArea(plan.outer);
  const notes = [
    `Контур ленты: периметр ${outerLen.toFixed(2)} м + внутр. ${innerLen.toFixed(2)} м; стыков ${junctionCount}`,
  ];
  return {
    stripLengthM,
    concreteVolumeRawM3,
    formworkAreaM2: 2 * stripLengthM * H,
    contactAreaM2,
    junctionCount,
    planAreaM2,
    notes,
  };
}

export function isValidStripPlan(plan: StripPlan | null | undefined): plan is StripPlan {
  return !!plan && Array.isArray(plan.outer) && plan.outer.length >= 3;
}

/** L-shaped outer for golden tests / demo. */
export function buildLShapeStripPlan(
  longArmM: number,
  shortArmM: number,
  thicknessM: number
): StripPlan {
  const L = Math.max(3, longArmM);
  const S = Math.max(2, shortArmM);
  const T = Math.max(1, Math.min(thicknessM, S - 0.5, L - 0.5));
  return {
    outer: [
      { x: 0, y: 0 },
      { x: L, y: 0 },
      { x: L, y: T },
      { x: T, y: T },
      { x: T, y: S },
      { x: 0, y: S },
    ],
    inners: [],
  };
}
