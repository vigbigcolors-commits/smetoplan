/**
 * Offline dry-run: build curated PSEO corpus and run quality gate + live calc.
 * No DB writes. Usage: npx tsx scripts/pseo-verify-corpus.ts
 *
 * Safety: thin / doorway / missing region / duplicate fingerprint → reject.
 */
import {
  evaluatePseoIndexability,
  paramsFingerprint,
} from '../src/lib/pseo-quality';
import { calculateMaterials } from '../src/lib/calculator';
import { getRegionalPrices } from '../src/domain/markets';
import type { PseoRouteParams, StructureType } from '../src/lib/types';

const REGIONS = [
  { slug: 'moskva', label: 'Москва и МО' },
  { slug: 'spb', label: 'Санкт-Петербург и ЛО' },
  { slug: 'krasnodar', label: 'Краснодарский край' },
  { slug: 'ekaterinburg', label: 'Екатеринбург / Урал' },
  { slug: 'novosibirsk', label: 'Новосибирск / Сибирь' },
] as const;

const STRUCTURES: Array<{
  type: StructureType;
  slugPart: string;
  label: string;
  depths: number[];
  sizes: Array<[number, number]>;
  pW: (t: StructureType) => number;
  pH: (t: StructureType) => number;
}> = [
  {
    type: 'slab',
    slugPart: 'plitnogo-fundamenta',
    label: 'плитного фундамента',
    depths: [0.3, 0.35, 0.4],
    sizes: [
      [8, 6],
      [8, 8],
      [10, 8],
      [10, 10],
      [12, 8],
      [12, 10],
      [14, 10],
      [16, 12],
    ],
    pW: () => 0.5,
    pH: () => 0.3,
  },
  {
    type: 'strip',
    slugPart: 'lentochnogo-fundamenta',
    label: 'ленточного фундамента',
    depths: [0.8, 1.0, 1.2],
    sizes: [
      [10, 8],
      [12, 9],
      [12, 10],
      [15, 10],
      [15, 12],
      [16, 12],
    ],
    pW: () => 0.4,
    pH: () => 0,
  },
  {
    type: 'pier',
    slugPart: 'svajnogo-fundamenta',
    label: 'свайного фундамента',
    depths: [1.2, 1.5],
    sizes: [
      [10, 8],
      [12, 8],
      [12, 10],
      [14, 10],
    ],
    pW: () => 0.4,
    pH: () => 0.4,
  },
  {
    type: 'beam',
    slugPart: 'monolitnoj-balki',
    label: 'монолитной балки',
    depths: [0.5, 0.6],
    sizes: [
      [5, 0.35],
      [6, 0.4],
      [7, 0.4],
      [8, 0.45],
    ],
    pW: () => 0,
    pH: () => 0,
  },
  {
    type: 'wall',
    slugPart: 'podpornoj-steny',
    label: 'подпорной стены',
    depths: [2.0, 2.5],
    sizes: [
      [8, 0.3],
      [10, 0.3],
      [12, 0.35],
      [15, 0.4],
    ],
    pW: () => 0,
    pH: () => 0,
  },
];

const GRADES = ['M250', 'M300', 'M350'] as const;
const REBARS = [
  { d: 12, step: 200, layers: 2 },
  { d: 14, step: 150, layers: 2 },
  { d: 16, step: 150, layers: 2 },
];

type Row = {
  slug: string;
  structure_type: StructureType;
  params: PseoRouteParams;
  region_slug: string;
  title_template: string;
  h1_template: string;
  description: string;
};

function buildCorpus(): Row[] {
  const rows: Row[] = [];
  for (const st of STRUCTURES) {
    for (const [L, W] of st.sizes) {
      for (const H of st.depths) {
        for (const grade of GRADES) {
          for (const rb of REBARS) {
            for (const region of REGIONS) {
              const dimSlug = `${L}x${W}x${String(H).replace('.', '-')}`;
              const slug =
                `kalkulyator-${st.slugPart}-${dimSlug}-${grade.toLowerCase()}-armatura-${rb.d}-s${rb.step}-l${rb.layers}-${region.slug}`
                  .replace(/_/g, '-')
                  .slice(0, 480);
              const title = `Калькулятор ${st.label} ${L}×${W}×${H} м ${grade} арматура Ø${rb.d} — ${region.label} | Smetoplan`;
              const h1 = `Калькулятор ${st.label} ${L}×${W}×${H} м — ${region.label}`;
              const description =
                `Калькулятор ${st.label} ${L}×${W}×${H} м (${grade}), арматура Ø${rb.d} шаг ${rb.step} мм, ` +
                `${rb.layers} слоя: объём бетона, опалубка и смета. Справочные цены Smetoplan, не оферта РБУ.`;
              rows.push({
                slug,
                structure_type: st.type,
                region_slug: region.slug,
                title_template: title,
                h1_template: h1,
                description,
                params: {
                  length: L,
                  width: W,
                  depth: H,
                  grade,
                  rebar_d: rb.d,
                  rebar_step: rb.step,
                  layers: rb.layers,
                  pW: st.pW(st.type),
                  pH: st.pH(st.type),
                },
              });
            }
          }
        }
      }
    }
  }
  return rows;
}

function main() {
  const rows = buildCorpus();
  const fps = new Set<string>();
  const titles = new Set<string>();
  const batch = new Set<string>();
  const reasons: Record<string, number> = {};
  let ok = 0;
  let calcFail = 0;
  const samples: Array<{ slug: string; vol: number; rebar: number }> = [];

  for (const row of rows) {
    const gate = evaluatePseoIndexability(
      {
        slug: row.slug,
        structure_type: row.structure_type,
        params: row.params,
        region_slug: row.region_slug,
        title_template: row.title_template,
        h1_template: row.h1_template,
        description: row.description,
      },
      fps,
      titles,
      batch
    );
    if (!gate.ok) {
      reasons[gate.reason] = (reasons[gate.reason] || 0) + 1;
      continue;
    }
    batch.add(gate.fingerprint);
    fps.add(gate.fingerprint);
    titles.add(row.title_template.toLowerCase());

    const regionId =
      row.region_slug === 'spb'
        ? 'spb'
        : row.region_slug === 'krasnodar'
          ? 'krasnodar'
          : row.region_slug === 'ekaterinburg'
            ? 'ekaterinburg'
            : row.region_slug === 'novosibirsk'
              ? 'novosibirsk'
              : 'moscow';
    const prices = getRegionalPrices(regionId as 'moscow');
    const p = row.params;
    try {
      const r = calculateMaterials(
        row.structure_type,
        {
          length: Number(p.length),
          width: Number(p.width),
          depth: Number(p.depth),
          perimeterThickeningWidth: Number(p.pW || 0),
          perimeterThickeningDepth: Number(p.pH || 0),
        },
        {
          grade: (p.grade as 'M250' | 'M300' | 'M350') || 'M300',
          cementBagKg: 50,
          customPricePerM3: prices.concretePerM3,
        },
        {
          diameterMm: Number(p.rebar_d || 12),
          spacingMm: Number(p.rebar_step || 200),
          layers: (Number(p.layers || 2) as 1 | 2 | 3) || 2,
          customPricePerTon: prices.rebarPerTon,
        },
        prices,
        'metric',
        1.15,
        {
          coverMm: 40,
          stockLengthM: 11.7,
          stripLayout: 'perimeter',
          pierSpacingM: 2.5,
        }
      );
      if (!(r.concreteVolumeM3 > 0) || !(r.rebarWeightKg > 0)) {
        calcFail += 1;
        continue;
      }
      ok += 1;
      if (samples.length < 8) {
        samples.push({
          slug: row.slug,
          vol: r.concreteVolumeM3,
          rebar: r.rebarWeightKg,
        });
      }
    } catch {
      calcFail += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        corpusTotal: rows.length,
        gateAndCalcOk: ok,
        calcFail,
        rejectReasons: reasons,
        uniqueFingerprints: fps.size,
        samples,
        safety:
          'One intent (kalkulyator), region required, rebar required, unique fingerprint, rich FAQ snapshot — no thin/doorway.',
        publishAdvice:
          'Upsert unpublished via generate-pseo-routes; publish ONLY via drip (DRIP_MIN/MAX), never bulk is_published=true.',
      },
      null,
      2
    )
  );
}

main();
