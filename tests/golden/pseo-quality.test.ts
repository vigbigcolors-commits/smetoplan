import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluatePseoIndexability,
  isSafePseoSnapshot,
  searchIntentFingerprint,
} from '@/lib/pseo-quality';
import { getDemoRouteBySlug } from '@/lib/demo-routes';
import { routeToGateInput } from '@/lib/pseo-quality';

describe('pseo quality gate — always', () => {
  it('passes curated demo with unique calc + FAQ + region', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const gate = evaluatePseoIndexability(routeToGateInput(route));
    assert.equal(gate.ok, true);
    if (gate.ok) {
      assert.ok(gate.snapshot.concreteVolumeM3 > 0);
      assert.ok(gate.snapshot.faqs.length >= 6);
      assert.ok(gate.snapshot.sections.length >= 4);
      assert.ok(gate.snapshot.regionLabel);
      assert.ok(isSafePseoSnapshot(gate.snapshot));
      assert.match(route.title_template, /Москв/i);
    }
  });

  it('rejects missing region when required', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.region_slug = null;
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'missing_region');
  });

  it('rejects title without region mention', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.title_template = 'Калькулятор плиты 12×8 м бетон М300 | Smetoplan';
    input.h1_template = 'Калькулятор плиты 12×8 м';
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'thin_title');
  });

  it('rejects phantom region kazan', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.region_slug = 'kazan';
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'missing_region');
  });

  it('rejects duplicate fingerprint', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    const fp = searchIntentFingerprint(input);
    const gate = evaluatePseoIndexability(input, new Set([fp]), new Set());
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'duplicate_fingerprint');
  });

  it('treats material variants as one search intent', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const first = routeToGateInput(route);
    const variant = structuredClone(first);
    variant.params.grade = 'M350';
    variant.params.rebar_d = 16;
    variant.params.rebar_step = 150;

    const firstFingerprint = searchIntentFingerprint(first);
    assert.equal(firstFingerprint, searchIntentFingerprint(variant));

    const differentDepth = structuredClone(first);
    differentDepth.params.depth = Number(differentDepth.params.depth) + 0.1;
    assert.notEqual(firstFingerprint, searchIntentFingerprint(differentDepth));

    const differentRegion = structuredClone(first);
    differentRegion.region_slug = 'spb';
    assert.notEqual(firstFingerprint, searchIntentFingerprint(differentRegion));

    const differentStructure = structuredClone(first);
    differentStructure.structure_type = 'strip';
    assert.notEqual(firstFingerprint, searchIntentFingerprint(differentStructure));

    const gate = evaluatePseoIndexability(
      variant,
      new Set([firstFingerprint]),
      new Set()
    );
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'duplicate_fingerprint');
  });

  it('rejects doorway intent clusters', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.intent_cluster = 'raschet';
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'doorway_intent');
  });

  it('rejects doorway slug prefix even if intent mislabeled', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.slug = 'smeta-plitnogo-fundamenta-12x8-m300-moskva';
    input.intent_cluster = 'kalkulyator';
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'doorway_intent');
  });
});
