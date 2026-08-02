import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeCalcPatch,
  detectApplyIntent,
  extractApplyPatchFromDialog,
  extractCalcPatchFromText,
  shouldAutoApplyParams,
  stripCannotApplyClaims,
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

  it('auto-applies when user pastes full assignment without magic words', () => {
    const patch = extractCalcPatchFromText(SAMPLE);
    assert.equal(shouldAutoApplyParams(SAMPLE, [], patch), true);
  });

  it('strips cannot-apply refusals from model text', () => {
    const raw =
      'Я не могу сам вносить значения в интерфейс — это доступно только вам. Но вот настройка.';
    const cleaned = stripCannotApplyClaims(raw);
    assert.equal(/не могу/i.test(cleaned), false);
    assert.match(cleaned, /настройка/i);
  });

  it('свайно-плитный maps to pier, not slab (плит in name)', () => {
    const text = `
Свайно-плитный фундамент
Габариты плиты: 10.0 × 10.0 × 0.5 м
Сваи: 16 шт, диаметр 0.3 м, глубина 3.0 м
Армирование: Ø12 мм, 2 слоя, шаг 200 мм
`;
    const patch = extractCalcPatchFromText(text);
    assert.equal(patch.structureType, 'pier');
    assert.equal(patch.lengthM, 10);
    assert.equal(patch.widthM, 10);
    assert.equal(patch.depthM, 3);
    assert.equal(patch.ribDepthM, 0.5);
    assert.equal(patch.ribWidthM, 0.3);
    assert.equal(patch.diameterMm, 12);
  });

  it('plain slab still maps to slab', () => {
    const patch = extractCalcPatchFromText(
      'Монолитная плита 12 × 8 × 0.3 м, Ø14 мм'
    );
    assert.equal(patch.structureType, 'slab');
    assert.equal(patch.diameterMm, 14);
  });
});
