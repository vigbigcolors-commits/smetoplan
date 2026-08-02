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

  it('retaining wall labeled top/base → trapezoid patch', () => {
    const text = `
Подпорная стена
Длина стены: 12.0 м
Высота стены: 2.5 м
Толщина стены (подошва/основание): 0.5 м
Толщина стены (верхушка/тело): 0.3 м
Защитный слой: 40 мм
Рабочая арматура (вертикальная/основная): Ø16 мм (А500С), шаг 200 мм
Конструктивная арматура (горизонтальная): Ø10 мм, шаг 300 мм
`;
    const patch = extractCalcPatchFromText(text);
    assert.equal(patch.structureType, 'wall');
    assert.equal(patch.lengthM, 12);
    assert.equal(patch.depthM, 2.5);
    assert.equal(patch.widthM, 0.3);
    assert.equal(patch.ribWidthM, 0.5);
    assert.equal(patch.ribDepthM, 0);
    assert.equal(patch.coverMm, 40);
    assert.equal(patch.diameterMm, 16);
    assert.equal(patch.spacingMm, 200);
    assert.equal(shouldAutoApplyParams(text, [], patch), true);
    const lines = describeCalcPatch(patch);
    assert.ok(lines.some((l) => /подошвы:\s*0\.5/i.test(l)));
    assert.ok(lines.some((l) => /12\.00 м³/i.test(l)));
  });

  it('wall base 0.6 with L=10 → эталон 11.25 м³', () => {
    const patch = extractCalcPatchFromText(
      'Подпорная стена длина 10 м высота 2.5 м верхушка 0.3 м подошва 0.6 м'
    );
    assert.equal(patch.structureType, 'wall');
    assert.equal(patch.lengthM, 10);
    assert.equal(patch.widthM, 0.3);
    assert.equal(patch.ribWidthM, 0.6);
    const vol =
      (patch.lengthM! * patch.depthM! * (patch.widthM! + patch.ribWidthM!)) / 2;
    assert.ok(Math.abs(vol - 11.25) < 1e-9);
  });

  it('industrial slab Д×Ш + толщина (not L×W×H) applies full geometry', () => {
    const text = `
Параметры геометрии (Фундамент промздания)
Габариты (Д х Ш): 45.0 × 25.0 м
Толщина: 0.6 м
Защитный слой: 40 мм
Диаметр стержней: Ø16 мм (А500С)
Количество слоев: 2 (верх + низ)
Шаг ячейки: 200 × 200 мм
`;
    const patch = extractCalcPatchFromText(text);
    assert.equal(patch.structureType, 'slab');
    assert.equal(patch.lengthM, 45);
    assert.equal(patch.widthM, 25);
    assert.equal(patch.depthM, 0.6);
    assert.equal(patch.ribWidthM, 0);
    assert.equal(patch.ribDepthM, 0);
    assert.equal(patch.diameterMm, 16);
    assert.equal(patch.layers, 2);
    assert.equal(patch.spacingMm, 200);
    assert.equal(patch.coverMm, 40);
    assert.equal(shouldAutoApplyParams(text, [], patch), true);
  });
});
