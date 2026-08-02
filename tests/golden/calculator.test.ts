import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMaterials } from '../../src/lib/calculator';
import {
  buildGeometry,
  buildLShapeStripPlan,
  buildRectangleStripPlan,
  computeStripPlanMetrics,
} from '../../src/domain/geometry';
import { nestPiecesToStock, stockBarsForPieces } from '../../src/domain/rebar/cutting';
import { computeRebar } from '../../src/domain/rebar';
import { rebarLinearDensityKgM } from '../../src/domain/norms/tables';
import { computeLoads } from '../../src/domain/loads';
import { computeFormworkBom } from '../../src/domain/formwork';
import { computePourSchedule } from '../../src/domain/pour';
import { evaluateConcreteAcceptance } from '../../src/domain/acceptance';
import type { ConcreteSpec, MaterialPrices, RebarSpec } from '../../src/lib/types';

const concrete: ConcreteSpec = {
  grade: 'M300',
  cementBagKg: 50,
  customPricePerM3: 4200,
};

const rebar: RebarSpec = {
  diameterMm: 12,
  spacingMm: 200,
  layers: 2,
  customPricePerTon: 62000,
};

const prices: MaterialPrices = {
  concretePerM3: 4200,
  rebarPerTon: 62000,
  sandPerTon: 850,
  gravelPerTon: 1400,
  formworkPerM2: 650,
};

describe('golden: geometry', () => {
  it('slab 12×8×0.4 with perimeter ribs (corners not double-counted)', () => {
    const g = buildGeometry('slab', {
      lengthM: 12,
      widthM: 8,
      depthM: 0.4,
      auxWidthM: 0.5,
      auxDepthM: 0.3,
      stripLayout: 'perimeter',
    });
    // 38.4 + (40*0.5*0.3 − 4*0.5*0.5*0.3) = 38.4 + 5.7 = 44.1
    assert.ok(Math.abs(g.concreteVolumeRawM3 - 44.1) < 1e-9);
    assert.equal(g.contactAreaM2, 96);
  });

  it('strip perimeter + one axis with junction deduction', () => {
    const g = buildGeometry('strip', {
      lengthM: 12,
      widthM: 8,
      depthM: 0.5,
      auxWidthM: 0.4,
      auxDepthM: 0,
      stripLayout: 'perimeter_plus_one',
    });
    assert.equal(g.stripLengthM, 52);
    // Рама 12×8 (наруж.) + 1 внутр. стена, w=0.4, H=0.5:
    // площадь бетона 19.84 м² → объём 9.92 м³ (углы/крестовины не задвоены).
    assert.ok(Math.abs(g.concreteVolumeRawM3 - 9.92) < 1e-9);
    assert.equal(g.junctionCount, 2);
  });

  it('rect stripPlan formwork = outer + void perimeters (not 2×axis)', () => {
    // UI всегда передаёт stripPlan — раньше давало 2×52×1 = 104.
    const plan = buildRectangleStripPlan(12, 8, 1, 0);
    const m = computeStripPlanMetrics(plan, 1.0, 0.4);
    // 40 + 2×(11.2+3.4)×2 = 40 + 58.4 = 98.4
    assert.equal(m.formworkAreaM2, 98.4);
    assert.ok(Math.abs(m.concreteVolumeRawM3 - 19.84) < 1e-9);

    const g = buildGeometry('strip', {
      lengthM: 12,
      widthM: 8,
      depthM: 1,
      auxWidthM: 0.4,
      auxDepthM: 0,
      stripLayout: 'perimeter_plus_one',
      stripPlan: plan,
    });
    assert.equal(g.formworkAreaM2, 98.4);
    assert.ok(Math.abs(g.concreteVolumeRawM3 - 19.84) < 1e-9);
  });

  it('L-shape strip contour perimeter and area', () => {
    const plan = buildLShapeStripPlan(12, 8, 4);
    const m = computeStripPlanMetrics(plan, 0.5, 0.4);
    // perimeter: 12+4+8+4+4+8 = 40
    assert.ok(Math.abs(m.stripLengthM - 40) < 1e-9);
    assert.equal(m.junctionCount, 0);
    assert.ok(m.planAreaM2 > 40 && m.planAreaM2 < 96);
  });

  it('custom stripPlan overrides rectangle axes', () => {
    const plan = buildLShapeStripPlan(12, 8, 4);
    const g = buildGeometry('strip', {
      lengthM: 12,
      widthM: 8,
      depthM: 0.5,
      auxWidthM: 0.4,
      auxDepthM: 0,
      stripLayout: 'perimeter_plus_one',
      stripPlan: plan,
    });
    assert.ok(Math.abs(g.stripLengthM - 40) < 1e-9);
    assert.ok(g.planAreaM2 && g.planAreaM2 < 96);
  });

  it('wall L×t×H', () => {
    const g = buildGeometry('wall', {
      lengthM: 10,
      widthM: 0.3,
      depthM: 3,
      auxWidthM: 0,
      auxDepthM: 0,
      stripLayout: 'perimeter',
    });
    assert.equal(g.concreteVolumeRawM3, 9);
    assert.equal(g.formworkAreaM2, 60);
  });

  it('wall trapezoid average thickness', () => {
    // 10 × 2.5 × (0.5+0.3)/2 = 10 м³; опалубка 2×10×2.5 = 50
    const g = buildGeometry('wall', {
      lengthM: 10,
      widthM: 0.3,
      depthM: 2.5,
      auxWidthM: 0.5,
      auxDepthM: 0,
      stripLayout: 'perimeter',
    });
    assert.equal(g.concreteVolumeRawM3, 10);
    assert.equal(g.formworkAreaM2, 50);
    assert.equal(g.contactAreaM2, 5);
  });
});

describe('golden: cutting nest', () => {
  it('packs short pieces into stock', () => {
    const r = stockBarsForPieces(2, 10, 11.7, 0.48);
    // floor(11.7/2)=5 per bar → ceil(10/5)=2 bars
    assert.equal(r.bars, 2);
    assert.ok(r.wasteM > 0);
  });

  it('splices pieces longer than stock', () => {
    const r = stockBarsForPieces(12, 2, 11.7, 0.48);
    // usable 11.22 → ceil(12/11.22)=2 segs × 2 pieces = 4 bars
    assert.equal(r.bars, 4);
  });

  it('purchase mass = stock bars × length × density (no hidden waste uplift)', () => {
    const r = computeRebar(
      'slab',
      { diameterMm: 12, spacingMm: 200, layers: 2, customPricePerTon: 0 },
      {
        lengthM: 10,
        widthM: 8,
        depthM: 0.25,
        auxWidthM: 0.05,
        stripLengthM: 0,
        pierCount: 0,
        coverMm: 50,
        stockLengthM: 11.7,
      }
    );
    const dens = rebarLinearDensityKgM(12);
    const expected = r.stockBarsApprox * r.stockLengthM * dens;
    assert.ok(
      Math.abs(r.weightKg - expected) < 0.15,
      `weight ${r.weightKg} vs bars×L×ρ ${expected}`
    );
  });

  it('merges same-length layers into one nest (no overcount)', () => {
    const separate =
      stockBarsForPieces(3.92, 151, 11.7, 0.4).bars +
      stockBarsForPieces(3.92, 151, 11.7, 0.4).bars;
    const merged = nestPiecesToStock(
      [
        { lengthM: 3.92, count: 151 },
        { lengthM: 3.92, count: 151 },
      ],
      11.7,
      0.4
    );
    assert.equal(separate, 152);
    assert.equal(merged.barsNeeded, 151);
  });
});

describe('golden: loads use plan area', () => {
  it('building load on plan, not strip contact', () => {
    const r = computeLoads({
      planAreaM2: 96,
      contactAreaM2: 20,
      buildingDeadLoadKpa: 10,
      liveLoadKpa: 0,
      snowRegion: 'III',
      applySnow: false,
      foundationForceKn: 100,
    });
    assert.equal(r.buildingForceKn, 960);
    assert.equal(r.totalForceKn, 1060);
  });
});

describe('golden: calculateMaterials', () => {
  it('slab applies safety factor; cover shortens bars', () => {
    const r40 = calculateMaterials(
      'slab',
      {
        length: 12,
        width: 8,
        depth: 0.4,
        perimeterThickeningWidth: 0.5,
        perimeterThickeningDepth: 0.3,
      },
      concrete,
      rebar,
      prices,
      'metric',
      1.15,
      { coverMm: 40, stockLengthM: 11.7 }
    );
    // 44.1 * 1.15 = 50.715 → 50.72
    assert.equal(r40.concreteVolumeM3, 50.72);
    assert.ok(r40.rebarPieces.length >= 2);
    const long40 = r40.rebarPieces.find((p) => p.mark.includes('А1'));
    assert.ok(long40);
    assert.equal(long40!.lengthMm, 11920); // 12 − 2*0.04

    const r70 = calculateMaterials(
      'slab',
      {
        length: 12,
        width: 8,
        depth: 0.4,
        perimeterThickeningWidth: 0.5,
        perimeterThickeningDepth: 0.3,
      },
      concrete,
      rebar,
      prices,
      'metric',
      1.15,
      { coverMm: 70, stockLengthM: 11.7 }
    );
    const long70 = r70.rebarPieces.find((p) => p.mark.includes('А1'));
    assert.equal(long70!.lengthMm, 11860); // 12 − 2*0.07
    assert.ok(r70.rebarStockBarsApprox >= 1);
  });

  it('stock length changes bar count', () => {
    const base = {
      length: 12,
      width: 8,
      depth: 0.4,
      perimeterThickeningWidth: 0,
      perimeterThickeningDepth: 0,
    };
    const a = calculateMaterials(
      'slab',
      base,
      concrete,
      rebar,
      prices,
      'metric',
      1.0,
      { coverMm: 40, stockLengthM: 6 }
    );
    const b = calculateMaterials(
      'slab',
      base,
      concrete,
      rebar,
      prices,
      'metric',
      1.0,
      { coverMm: 40, stockLengthM: 12 }
    );
    assert.ok(a.rebarStockBarsApprox > b.rebarStockBarsApprox);
  });

  it('strip layout changes volume', () => {
    const base = {
      length: 12,
      width: 8,
      depth: 0.5,
      perimeterThickeningWidth: 0.4,
      perimeterThickeningDepth: 0,
    };
    const perimeter = calculateMaterials(
      'strip',
      base,
      concrete,
      rebar,
      prices,
      'metric',
      1.0,
      { stripLayout: 'perimeter' }
    );
    const plusOne = calculateMaterials(
      'strip',
      base,
      concrete,
      rebar,
      prices,
      'metric',
      1.0,
      { stripLayout: 'perimeter_plus_one' }
    );
    assert.ok(plusOne.concreteVolumeM3 > perimeter.concreteVolumeM3);
    assert.equal(plusOne.stripLengthM, 52);
    assert.equal(perimeter.stripLengthM, 40);
    assert.ok(plusOne.rebarPieces.length >= 1);
  });

  it('wall volume and checks present', () => {
    const r = calculateMaterials(
      'wall',
      {
        length: 10,
        width: 0.3,
        depth: 3,
        perimeterThickeningWidth: 0,
        perimeterThickeningDepth: 0,
      },
      concrete,
      rebar,
      prices,
      'metric',
      1.15
    );
    assert.equal(r.concreteVolumeM3, 10.35);
    assert.ok(Array.isArray(r.checks));
  });

  it('strip cage: longitudinal + rectangular stirrups; mass by diameter', () => {
    const r = calculateMaterials(
      'strip',
      {
        length: 12,
        width: 8,
        depth: 1.0,
        perimeterThickeningWidth: 0.4,
        perimeterThickeningDepth: 0,
      },
      concrete,
      {
        diameterMm: 10,
        spacingMm: 300,
        layers: 2,
        longitudinalBars: 6,
        customPricePerTon: 62000,
      },
      prices,
      'metric',
      1.0,
      { coverMm: 40, stockLengthM: 11.7, stripLayout: 'perimeter_plus_one' }
    );
    // 12×8×1.0 (наруж.), стенка 0.4, 1 внутр. стена:
    // 2 пустоты 11.2×3.4 → бетон 19.84 м³; опалубка 40 + 2×29.2 = 98.4 м².
    assert.equal(r.concreteVolumeM3, 19.84);
    assert.equal(r.formworkAreaM2, 98.4);
    assert.ok(r.rebarPieces.some((p) => p.mark === 'А1'));
    assert.ok(r.rebarPieces.some((p) => p.mark === 'Х1'));
    const stirrup = r.rebarPieces.find((p) => p.mark === 'Х1')!;
    // 0.4×1.0, a=40 → clear 0.32×0.92 → 2×1.24 м + 2×крюка(80) = 2640 мм
    assert.equal(stirrup.lengthMm, 2640);
    assert.ok(stirrup.lengthMm < 4000, 'хомут не длиннее разумного контура секции');
    assert.equal(stirrup.diameterMm, 8);
    const fromDia = r.rebarStockByDiameter.reduce(
      (s, row) =>
        s + row.bars * r.rebarStockLengthM * rebarLinearDensityKgM(row.diameterMm),
      0
    );
    assert.ok(Math.abs(r.rebarWeightKg - fromDia) < 1.5);
    assert.ok(r.rebarStockByDiameter.length >= 2);
  });

  it('pier pile-slab: slab+piles volume, perimeter formwork, mesh by spacing', () => {
    const r = calculateMaterials(
      'pier',
      {
        length: 10,
        width: 10,
        depth: 3.0,
        perimeterThickeningWidth: 0.3,
        perimeterThickeningDepth: 0.3,
      },
      concrete,
      {
        diameterMm: 12,
        spacingMm: 200,
        layers: 2,
        customPricePerTon: 62000,
      },
      prices,
      'metric',
      1.0,
      { coverMm: 40, stockLengthM: 11.7, pierSpacingM: 2.5 }
    );
    // 5×5 = 25 свай; плита 10×10×0.3 = 30; сваи 25×π×0.15²×3 ≈ 5.301
    assert.equal(r.pierCount, 25);
    assert.ok(Math.abs(r.concreteVolumeM3 - 35.301) < 0.02);
    // Опалубка только борт плиты: 40×0.3 = 12 (не поверхности свай)
    assert.equal(r.formworkAreaM2, 12);
    const mesh = r.rebarPieces.filter((p) => p.mark.startsWith('П'));
    assert.ok(mesh.length >= 2);
    // шаг 200 → 51+51 стержней на слой × 2 слоя
    const long = mesh.find((p) => p.mark.includes('П1'))!;
    assert.equal(long.count, 51);
    const fromDia = r.rebarStockByDiameter.reduce(
      (s, row) =>
        s + row.bars * r.rebarStockLengthM * rebarLinearDensityKgM(row.diameterMm),
      0
    );
    assert.ok(Math.abs(r.rebarWeightKg - fromDia) < 1.5);
    assert.ok(r.rebarLengthMeters > 1800, 'сетка плиты ~2000 м + сваи');
  });
});

describe('golden: formwork pour acceptance', () => {
  it('formwork panels scale with area', () => {
    const a = computeFormworkBom({
      structureType: 'strip',
      formworkAreaM2: 52,
      depthM: 0.5,
      stripLengthM: 52,
      formworkPricePerM2: 650,
    });
    assert.ok(a.panelsApprox >= 1);
    assert.ok(a.rentCostApprox > 0);
  });

  it('pour schedule trips and risk', () => {
    const r = computePourSchedule({
      concreteVolumeM3: 24,
      mixerVolumeM3: 8,
      placeRateM3PerHour: 6,
      workabilityHours: 1,
      airTempC: 30,
    });
    assert.equal(r.trips, 3);
    assert.ok(r.catchCount >= 1);
    assert.ok(['ok', 'watch', 'high'].includes(r.coldJointRisk));
  });

  it('acceptance flags grade mismatch', () => {
    const r = evaluateConcreteAcceptance({
      declaredGrade: 'M200',
      expectedGrade: 'M300',
      slumpCm: 12,
      mixTempC: 18,
      travelMinutes: 40,
      airTempC: 20,
      hasAdmixtureNote: true,
      workabilityHours: 1.5,
    });
    assert.equal(r.overall, 'reject_hint');
  });
});

describe('golden: regional supply', () => {
  it('uses real regional unit prices × calc qty', async () => {
    const { buildRegionalSupplySnapshot } = await import('../../src/domain/markets');
    const s = buildRegionalSupplySnapshot('moscow', {
      concreteVolumeM3: 10,
      rebarWeightKg: 1000,
      formworkAreaM2: 20,
      sandTons: 1,
      gravelTons: 1,
    });
    assert.equal(s.regionLabel, 'Москва и МО');
    assert.equal(s.prices.concretePerM3, 5450);
    assert.equal(s.lines.find((l) => l.id === 'concrete')!.lineTotal, 54500);
    assert.equal(s.lines.find((l) => l.id === 'rebar')!.lineTotal, 64500);
    assert.equal(s.peerRegions.length, 5);
    assert.match(s.disclaimer, /не оферта/i);
  });
});
