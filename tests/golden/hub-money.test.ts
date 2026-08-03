import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getStructureHubBenchmark } from '../../src/lib/hub-benchmarks';
import { getHubBySlug } from '../../src/lib/pseo-hubs';

describe('money hubs slab + strip', () => {
  it('slab hub has search-intent title and rich FAQ', () => {
    const hub = getHubBySlug('plitnyy-fundament');
    assert.ok(hub && hub.kind === 'structure');
    assert.match(hub.title, /бетон|арматур/i);
    assert.match(hub.description, /10×12|10x12|куб/i);
    assert.ok(hub.faqs.length >= 5);
    assert.ok(hub.faqs.some((f) => /10×12|10x12|30\s*см|0,3/i.test(f.q)));
  });

  it('strip hub has contour FAQ and money title', () => {
    const hub = getHubBySlug('lentochnyy-fundament');
    assert.ok(hub && hub.kind === 'structure');
    assert.match(hub.title, /ленточн/i);
    assert.ok(hub.faqs.length >= 5);
    assert.ok(hub.faqs.some((f) => /10.+12|контур/i.test(f.q)));
  });

  it('slab benchmark matches engine volumes', () => {
    const b = getStructureHubBenchmark('slab');
    assert.ok(b);
    assert.match(b.answerLine, /41[,.]4|41\.4/);
    assert.equal(b.kpis[0]?.value, '41.4');
    assert.match(b.calcHref, /type=slab/);
  });

  it('strip benchmark matches engine volumes', () => {
    const b = getStructureHubBenchmark('strip');
    assert.ok(b);
    assert.match(b.answerLine, /19[,.]5|19\.5/);
    assert.equal(b.kpis[0]?.value, '19.5');
    assert.match(b.calcHref, /type=strip/);
  });

  it('other structures have no money benchmark yet', () => {
    assert.equal(getStructureHubBenchmark('beam'), null);
    assert.equal(getStructureHubBenchmark('wall'), null);
  });
});
