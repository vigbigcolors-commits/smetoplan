'use client';

import React from 'react';
import {
  SlidersHorizontal,
  FileSpreadsheet,
  Grid3x3,
  MapPin,
  FileOutput,
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  formatCurrency,
  type ExtendedCalculationResult,
} from '@/lib/calculator';
import type { Currency } from '@/lib/types';
import {
  buildRbuSpecText,
  downloadTextFile,
} from '@/lib/rbu-spec';
import {
  dispatchSiteEvent,
  DOWNLOAD_BOM_CSV_EVENT,
  OPEN_QUOTE_EVENT,
  PRINT_BRIGADE_A4_EVENT,
} from '@/lib/site-events';

const STEPS: Array<{
  id: string;
  label: string;
  hint: (c: ExtendedCalculationResult, currency: Currency) => string;
  icon: typeof SlidersHorizontal;
}> = [
  {
    id: 'site-params',
    label: 'Параметры',
    hint: (c) => `${c.coverMm} мм a · грунт ${c.soilUtilizationPct}% R`,
    icon: SlidersHorizontal,
  },
  {
    id: 'bom-estimate-total',
    label: 'Смета',
    hint: (c, currency) => formatCurrency(c.itemizedCosts.total, currency),
    icon: FileSpreadsheet,
  },
  {
    id: 'tool-rebar',
    label: 'Раскрой',
    hint: (c) => `${c.rebarStockBarsApprox} хлыстов · отход ${c.rebarWastePct}%`,
    icon: Grid3x3,
  },
  {
    id: 'tool-rbu',
    label: 'РБУ',
    hint: (c) => `${c.concreteVolumeM3} м³ бетон`,
    icon: MapPin,
  },
  {
    id: 'tool-nodes',
    label: 'А4 бригаде',
    hint: (c) => `${c.rebarWeightKg} кг · ${c.formworkAreaM2} м²`,
    icon: FileOutput,
  },
];

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SitePipeline({
  calculation,
  currency,
  regionLabel,
  concreteGrade,
  structureLabel,
  dimsLabel,
}: {
  calculation: ExtendedCalculationResult;
  currency: Currency;
  regionLabel: string;
  concreteGrade: string;
  structureLabel: string;
  dimsLabel: string;
}) {
  const downloadRbu = () => {
    downloadTextFile(
      `smetoplan-spec-rbu-${Date.now()}.txt`,
      buildRbuSpecText({
        regionLabel,
        concreteGrade,
        concreteVolumeM3: calculation.concreteVolumeM3,
        rebarWeightKg: calculation.rebarWeightKg,
        formworkAreaM2: calculation.formworkAreaM2,
        totalLabel: formatCurrency(calculation.itemizedCosts.total, currency),
        structureLabel,
        dimsLabel,
        rebarLines: (calculation.rebarPieces || []).map(
          (p) =>
            `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}; m=${Math.round(p.weightKg * 10) / 10}кг`
        ),
      })
    );
  };

  const outlineBtn =
    'inline-flex items-center gap-1.5 rounded-xl border border-slate-500 bg-transparent px-3 py-2 text-[11px] font-bold text-slate-100 transition-colors hover:border-sky-300 hover:bg-sky-400/30 hover:text-white';
  const solidBtn =
    'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-[#0B132B] transition-colors';

  return (
    <section
      id="site-pipeline"
      className="rounded-2xl border border-slate-700/80 bg-[#0B132B] text-white shadow-xl"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 overflow-hidden rounded-t-2xl border-b border-slate-700/80 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-white">
            Конвейер объекта
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Параметры → смета → раскрой → РБУ → А4 · без разрывов
          </p>
        </div>
        <p className="font-mono text-[11px] text-slate-500">
          {structureLabel} · {dimsLabel}
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden bg-slate-800/60 sm:grid-cols-5">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.id} className="relative bg-[#0B132B]">
              <button
                type="button"
                onClick={() => jump(step.id)}
                className="flex h-full w-full flex-col items-start gap-1 px-3 py-3 text-left transition-colors hover:bg-sky-500/20 sm:px-4"
              >
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 font-mono text-[10px] text-sky-300">
                    {i + 1}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  {step.label}
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-200">
                  {step.hint(calculation, currency)}
                </span>
              </button>
              {i < STEPS.length - 1 ? (
                <ChevronRight className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-slate-600 sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2 rounded-b-2xl border-t border-slate-700/80 px-4 pb-5 pt-3 sm:px-5">
        <button
          type="button"
          onClick={() => {
            downloadRbu();
            jump('tool-nodes');
            window.setTimeout(() => dispatchSiteEvent(PRINT_BRIGADE_A4_EVENT), 350);
          }}
          className={`${solidBtn} bg-emerald-500 hover:bg-emerald-300`}
        >
          <Printer className="h-3.5 w-3.5" />
          Пакет на объект: РБУ .txt + А4
        </button>
        <button
          type="button"
          onClick={() => {
            jump('bom-estimate-total');
            dispatchSiteEvent(DOWNLOAD_BOM_CSV_EVENT);
          }}
          className={outlineBtn}
        >
          <Download className="h-3.5 w-3.5" />
          CSV сметы
        </button>
        <button
          type="button"
          onClick={() => jump('tool-rebar')}
          className={outlineBtn}
        >
          <Grid3x3 className="h-3.5 w-3.5" />
          К раскрою
        </button>
        <button
          type="button"
          onClick={downloadRbu}
          className={`${solidBtn} bg-sky-500 hover:bg-sky-300`}
        >
          <Download className="h-3.5 w-3.5" />
          Спецификация РБУ .txt
        </button>
        <button
          type="button"
          onClick={() => {
            jump('tool-rbu');
            dispatchSiteEvent(OPEN_QUOTE_EVENT);
          }}
          className={outlineBtn}
        >
          <MapPin className="h-3.5 w-3.5" />
          Заявка РБУ
        </button>
        <button
          type="button"
          onClick={() => {
            jump('tool-nodes');
            dispatchSiteEvent(PRINT_BRIGADE_A4_EVENT);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-100 transition-colors hover:border-amber-300 hover:bg-amber-400/40 hover:text-white"
        >
          <Printer className="h-3.5 w-3.5" />
          Печать А4
        </button>
      </div>
    </section>
  );
}
