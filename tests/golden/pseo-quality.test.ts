import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluatePseoIndexability,
  isSafePseoSnapshot,
  paramsFingerprint,
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
      assert.ok(gate.snapshot.faqs.length >= 4);
      assert.ok(gate.snapshot.regionLabel);
      assert.ok(isSafePseoSnapshot(gate.snapshot));
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

  it('rejects duplicate fingerprint', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    const fp = paramsFingerprint(input);
    const gate = evaluatePseoIndexability(input, new Set([fp]), new Set());
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'duplicate_fingerprint');
  });

  it('rejects thin params', () => {
    const route = getDemoRouteBySlug(
      'kalkulyator-plitnogo-fundamenta-12x8-m300'
    );
    assert.ok(route);
    const input = routeToGateInput(route);
    input.params = { ...input.params, length: 0 };
    const gate = evaluatePseoIndexability(input);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, 'thin_params');
  });
});
