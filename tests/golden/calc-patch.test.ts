import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeCalcPatch,
  detectApplyIntent,
  extractApplyPatchFromDialog,
  extractCalcPatchFromText,
} from '../../src/lib/ai/calc-patch';

const SAMPLE = `
1. Скорректированные параметры (Ввод)
Габариты плиты: 10.0 × 8.0 × 0.25 м
Ребра жесткости: 0.05 × 0.05 м (минимальный лимит)
Защитный слой: 50 мм
Армирование: Ø12 мм, 2 слоя, шаг 200 × 200 мм, нулевые запасы
`;

describe('calc-patch extractor', () => {
  it('parses full slab assignment', () => {
    const patch = extractCalcPatchFromText(SAMPLE);
    assert.equal(patch.lengthM, 10);
    assert.equal(patch.widthM, 8);
    assert.equal(patch.depthM, 0.25);
    assert.equal(patch.ribWidthM, 0.05);
    assert.equal(patch.ribDepthM, 0.05);
    assert.equal(patch.coverMm, 50);
    assert.equal(patch.diameterMm, 12);
    assert.equal(patch.layers, 2);
    assert.equal(patch.spacingMm, 200);
    assert.equal(patch.safetyFactor, 1);
    assert.equal(patch.structureType, 'slab');
    assert.ok(describeCalcPatch(patch).length >= 5);
  });

  it('applies from history when user says поставить сам', () => {
    assert.equal(detectApplyIntent('поставь все параметры сам'), true);
    const patch = extractApplyPatchFromDialog('поставь все цифры сам', [
      { role: 'user', content: SAMPLE },
    ]);
    assert.equal(patch.lengthM, 10);
    assert.equal(patch.coverMm, 50);
    assert.equal(patch.safetyFactor, 1);
  });
});
