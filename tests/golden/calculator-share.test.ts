import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCalculatorDraft, type CalculatorDraft } from '../../src/lib/calculator-draft';
import {
  decodeShareToken,
  encodeShareToken,
  bytesToBase64Url,
  base64UrlToBytes,
} from '../../src/lib/calculator-share';

function sampleDraft(): CalculatorDraft {
  const raw = {
    v: 1 as const,
    structureType: 'slab' as const,
    unitSystem: 'metric' as const,
    currency: 'RUB' as const,
    dimensions: {
      length: 12,
      width: 8,
      depth: 0.3,
      perimeterThickeningWidth: 0,
      perimeterThickeningDepth: 0,
    },
    concreteSpec: {
      grade: 'M300' as const,
      cementBagKg: 50 as const,
      customPricePerM3: 5500,
    },
    rebarSpec: {
      diameterMm: 12,
      spacingMm: 200,
      layers: 2 as const,
      customPricePerTon: 65000,
    },
    prices: {
      concretePerM3: 5500,
      rebarPerTon: 65000,
      sandPerTon: 1200,
      gravelPerTon: 1800,
      formworkPerM2: 450,
    },
    safetyFactor: 1.15,
    calcMode: 'estimate' as const,
    stripLayout: 'perimeter' as const,
    stripInnerLong: 0,
    stripInnerCross: 0,
    stripPlan: {
      outer: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 8 },
        { x: 0, y: 8 },
      ],
      inners: [],
    },
    stripPlanCustom: false,
    pierSpacingM: 2.5,
    coverMm: 40,
    stockLengthM: 11.7,
    buildingDeadLoadKpa: 5,
    liveLoadKpa: 2,
    priceRegionId: 'moscow' as const,
    snowRegion: 'III' as const,
    applySnow: false,
    soilTypeId: 'sand_medium' as const,
    soilResistanceKpa: 250,
    savedAt: 1_700_000_000_000,
  };
  const parsed = parseCalculatorDraft(raw);
  assert.ok(parsed);
  return parsed;
}

describe('calculator-share', () => {
  it('base64url roundtrip', () => {
    const src = new TextEncoder().encode('привет smetoplan');
    const token = bytesToBase64Url(src);
    const back = base64UrlToBytes(token);
    assert.ok(back);
    assert.equal(new TextDecoder().decode(back), 'привет smetoplan');
  });

  it('encode/decode draft preserves dimensions', async () => {
    const draft = sampleDraft();
    const token = await encodeShareToken(draft);
    assert.match(token, /^(d1|j1)\./);
    const restored = await decodeShareToken(token);
    assert.ok(restored);
    assert.equal(restored.structureType, 'slab');
    assert.equal(restored.dimensions.length, 12);
    assert.equal(restored.dimensions.width, 8);
    assert.equal(restored.dimensions.depth, 0.3);
    assert.equal(restored.rebarSpec.diameterMm, 12);
    assert.equal(restored.priceRegionId, 'moscow');
  });
});
