import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { auditCalculationIntegrity } from '../../src/domain/integrity';
import { computeRectStripFootprint } from '../../src/domain/geometry/strip-path';
import { computeRebar } from '../../src/domain/rebar';

describe('CalcIntegrity', () => {
  it('flags phantom closed perimeter when rebar axis != geometry', () => {
    const report = auditCalculationIntegrity({
      structureType: 'strip',
      lengthM: 49,
      widthM: 0.5,
      depthM: 1.2,
      ribbonWidthM: 0.5,
      stripLengthM: 49,
      concreteVolumeM3: 29.4,
      formworkAreaM2: 118.8,
      contactAreaM2: 24.5,
      rebarAxisLengthM: 99, // старый баг
      stirrupStepMm: 250,
      longitudinalBarsInSection: 6,
      stockLengthM: 11.7,
      lapMm: 560,
      pieces: [
        {
          mark: 'А1',
          role: 'прод',
          diameterMm: 14,
          lengthMm: 11140,
          count: 48,
          weightKg: 600,
        },
        {
          mark: 'Х1',
          role: 'хомут',
          diameterMm: 8,
          lengthMm: 3200,
          count: 328,
          weightKg: 400,
        },
      ],
      rebarWeightKg: 1000,
      stockByDiameter: [
        { diameterMm: 14, bars: 48, weightKg: 500 },
        { diameterMm: 8, bars: 108, weightKg: 500 },
      ],
      safetyFactor: 1,
    });
    assert.equal(report.ok, false);
    assert.ok(
      report.findings.some(
        (f) => f.id === 'strip-axis-contract' && f.severity === 'fail'
      )
    );
    assert.ok(
      report.findings.some(
        (f) => f.id === 'strip-stirrup-span' && f.severity === 'fail'
      )
    );
  });

  it('passes live geometry→rebar contract for solid trench 49×0.5', () => {
    const g = computeRectStripFootprint(49, 0.5, 1.2, 0.5, 0, 0);
    const rebar = computeRebar(
      'strip',
      {
        diameterMm: 14,
        spacingMm: 250,
        layers: 2,
        longitudinalBars: 6,
        customPricePerTon: 72000,
      },
      {
        lengthM: 49,
        widthM: 0.5,
        depthM: 1.2,
        auxWidthM: 0.5,
        stripLengthM: g.stripLengthM,
        pierCount: 0,
        coverMm: 40,
        stockLengthM: 11.7,
      }
    );
    const report = auditCalculationIntegrity({
      structureType: 'strip',
      lengthM: 49,
      widthM: 0.5,
      depthM: 1.2,
      ribbonWidthM: 0.5,
      stripLengthM: g.stripLengthM,
      concreteVolumeM3: g.concreteVolumeRawM3,
      formworkAreaM2: g.formworkAreaM2,
      contactAreaM2: g.contactAreaM2,
      rebarAxisLengthM: rebar.axisLengthUsedM,
      stirrupStepMm: 250,
      longitudinalBarsInSection: 6,
      stockLengthM: rebar.stockLengthM,
      lapMm: rebar.lapMm,
      pieces: rebar.pieces,
      rebarWeightKg: rebar.weightKg,
      stockByDiameter: rebar.stockByDiameter,
      safetyFactor: 1,
    });
    assert.equal(g.stripLengthM, 49);
    assert.equal(rebar.axisLengthUsedM, 49);
    assert.equal(report.ok, true);
    assert.ok(
      report.findings.every((f) => f.severity !== 'fail'),
      report.findings
        .filter((f) => f.severity === 'fail')
        .map((f) => f.id)
        .join(',')
    );
  });
});
