import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMaterials } from '../../src/lib/calculator';
import {
  buildGeometry,
  buildLShapeStripPlan,
  computeStripPlanMetrics,
} from '../../src/domain/geometry';
import { stockBarsForPieces } from '../../src/domain/rebar/cutting';
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
    assert.ok(Math.abs(g.concreteVolumeRawM3 - 10.24) < 1e-9);
    assert.equal(g.junctionCount, 2);
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
    assert.equal(s.prices.concretePerM3, 5200);
    assert.equal(s.lines.find((l) => l.id === 'concrete')!.lineTotal, 52000);
    assert.equal(s.lines.find((l) => l.id === 'rebar')!.lineTotal, 68000);
    assert.equal(s.peerRegions.length, 5);
    assert.ok(s.disclaimer.includes('не оферта'));
  });
});
