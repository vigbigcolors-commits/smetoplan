import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGeometry } from '@/domain/geometry';
import { calculateMaterials } from '@/lib/calculator';
import { buildPseoSnapshot, PSEO_CALC_BRIDGE } from '@/lib/pseo-snapshot';
import { paramsToCalculatorState } from '@/lib/meta';
import type { PseoRoute } from '@/lib/types';

function route(partial: Partial<PseoRoute> & Pick<PseoRoute, 'structure_type' | 'params' | 'slug'>): PseoRoute {
  return {
    id: 0,
    intent_cluster: 'kalkulyator',
    title_template: 'Калькулятор монолитной балки 6×0.4×0.4 м М300 арматура Ø25 — Москва и МО | Smetoplan',
    h1_template: 'Калькулятор монолитной балки 6×0.4×0.4 м — Москва и МО',
    description:
      'Калькулятор монолитной балки 6×0.4×0.4 м (М300), арматура Ø25 шаг 100 мм, каркас: объём бетона, опалубка и смета в Москве и МО. Справочные цены Smetoplan, не оферта РБУ. Методика и disclaimer на сайте.',
    layout_variant: 1,
    show_rebar: true,
    show_bom: true,
    show_cad: true,
    show_ai: true,
    show_contractors: true,
    region_slug: 'moskva',
    material_sku: 'BET-M300',
    formula_code: 'beam_volume',
    is_published: true,
    publish_date: new Date().toISOString(),
    ...partial,
  };
}

describe('PSEO live calc bridge — always synced to kernel', () => {
  it('marks snapshot as live-calculateMaterials', () => {
    const snap = buildPseoSnapshot(
      route({
        slug: 'kalkulyator-monolitnoj-balki-6x0-4x0-4-m300-armatura-25-s100-l2-moskva',
        structure_type: 'beam',
        params: {
          length: 6,
          width: 0.4,
          depth: 0.4,
          grade: 'M300',
          rebar_d: 25,
          rebar_step: 100,
          layers: 2,
          long_bars: 8,
          stirrup_d: 10,
          cover_mm: 40,
          pW: 0,
          pH: 0,
        },
      })
    );
    assert.equal(snap.calcBridge, PSEO_CALC_BRIDGE);
    assert.equal(PSEO_CALC_BRIDGE, 'live-calculateMaterials');
  });

  it('square beam/column leaf matches geometry kernel (0.96 / 9.6)', () => {
    const r = route({
      slug: 'kalkulyator-monolitnoj-balki-6x0-4x0-4-m300-armatura-25-s100-l2-moskva',
      structure_type: 'beam',
      params: {
        length: 6,
        width: 0.4,
        depth: 0.4,
        grade: 'M300',
        rebar_d: 25,
        rebar_step: 100,
        layers: 2,
        long_bars: 8,
        stirrup_d: 10,
        cover_mm: 40,
        pW: 0,
        pH: 0,
      },
    });
    const snap = buildPseoSnapshot(r);
    const geo = buildGeometry('beam', {
      lengthM: 6,
      widthM: 0.4,
      depthM: 0.4,
      auxWidthM: 0,
      auxDepthM: 0,
    });
    assert.ok(Math.abs(geo.concreteVolumeRawM3 - 0.96) < 1e-9);
    assert.ok(Math.abs(geo.formworkAreaM2 - 9.6) < 1e-9);
    // Snapshot uses safety 1.15 on volume — formwork stays raw from geometry.
    assert.ok(Math.abs(snap.formworkAreaM2 - 9.6) < 0.05);
    assert.ok(snap.concreteVolumeM3 >= 0.96);
    assert.match(snap.faqs.map((f) => f.a).join(' '), /8 продольных/);
    assert.match(snap.faqs.map((f) => f.a).join(' '), /хомуты Ø10/);
  });

  it('paramsToCalculatorState feeds longitudinalBars into the same calculateMaterials path', () => {
    const state = paramsToCalculatorState({
      length: 6,
      width: 0.4,
      depth: 0.4,
      grade: 'M300',
      rebar_d: 25,
      rebar_step: 100,
      layers: 2,
      long_bars: 8,
      stirrup_d: 10,
      cover_mm: 40,
    });
    assert.equal(state.rebarSpec.longitudinalBars, 8);
    assert.equal(state.rebarSpec.stirrupDiameterMm, 10);
    assert.equal(state.coverMm, 40);

    const prices = {
      concretePerM3: 5000,
      rebarPerTon: 60000,
      formworkPerM2: 600,
      sandPerTon: 800,
      gravelPerTon: 1200,
    };
    const direct = calculateMaterials(
      'beam',
      state.dimensions,
      { ...state.concreteSpec, customPricePerM3: prices.concretePerM3 },
      { ...state.rebarSpec, customPricePerTon: prices.rebarPerTon },
      prices,
      'metric',
      1.15,
      { coverMm: state.coverMm, stockLengthM: 11.7 }
    );
    const snap = buildPseoSnapshot(
      route({
        slug: 't',
        structure_type: 'beam',
        params: {
          length: 6,
          width: 0.4,
          depth: 0.4,
          grade: 'M300',
          rebar_d: 25,
          rebar_step: 100,
          layers: 2,
          long_bars: 8,
          stirrup_d: 10,
          cover_mm: 40,
        },
        region_slug: null,
      })
    );
    assert.equal(snap.formworkAreaM2, direct.formworkAreaM2);
    assert.equal(snap.concreteVolumeM3, direct.concreteVolumeM3);
    assert.equal(snap.rebarWeightKg, direct.rebarWeightKg);
  });
});
