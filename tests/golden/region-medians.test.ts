import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPriceBand,
  getRegionalPricesWithMedian,
  medianOf,
  PRICE_BAND_DISCLAIMER,
} from '../../src/lib/region-medians';
import { getRegionalPrices } from '../../src/domain/markets';

describe('region medians', () => {
  it('medianOf picks middle value', () => {
    assert.equal(medianOf([3, 1, 2]), 2);
    assert.equal(medianOf([10, 20]), 15);
  });

  it('moscow uses feed median overlay above handbook floor', () => {
    const m = getRegionalPricesWithMedian('moscow');
    assert.equal(m.source, 'feed_median');
    assert.ok(m.concretePerM3 >= 5000);
    assert.ok(m.rebarPerTon >= 60000);
    const p = getRegionalPrices('moscow');
    assert.equal(p.concretePerM3, m.concretePerM3);
  });

  it('band disclaimer and range helpers', () => {
    assert.match(PRICE_BAND_DISCLAIMER, /15–25%/);
    const band = formatPriceBand(100000);
    assert.equal(band.low, 85000);
    assert.equal(band.high, 125000);
  });
});
