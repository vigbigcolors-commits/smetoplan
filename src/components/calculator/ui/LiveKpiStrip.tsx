'use client';

import React from 'react';
import { formatCurrency } from '@/lib/calculator';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import type { Currency } from '@/lib/types';

export function LiveKpiStrip({
  calculation,
  currency,
  diameterMm,
}: {
  calculation: ExtendedCalculationResult;
  currency: Currency;
  diameterMm: number;
}) {
  const soilTone =
    calculation.soilStatus === 'critical'
      ? 'text-rose-300'
      : calculation.soilStatus === 'warning'
        ? 'text-amber-300'
        : 'text-emerald-300';

  const items = [
    { k: 'Бетон', v: `${calculation.concreteVolumeM3} м³`, c: 'text-sky-300' },
    { k: `Ø${diameterMm}`, v: `${calculation.rebarWeightKg} кг`, c: 'text-orange-300' },
    {
      k: 'Хлысты',
      v: `${calculation.rebarStockBarsApprox} шт`,
      c: 'text-amber-300',
    },
    { k: 'Опалубка', v: `${calculation.formworkAreaM2} м²`, c: 'text-teal-300' },
    {
      k: 'Грунт',
      v: `${calculation.soilUtilizationPct}% R`,
      c: soilTone,
    },
    {
      k: 'Смета',
      v: formatCurrency(calculation.itemizedCosts.total, currency),
      c: 'text-emerald-300',
    },
  ];

  return (
    <div className="live-kpi relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B132B] px-4 py-3 shadow-xl sm:px-5">
      <div className="pointer-events-none absolute inset-0 opacity-40 blueprint-grid-steel" />
      <div className="relative flex flex-wrap items-stretch gap-3 sm:gap-0 sm:divide-x sm:divide-slate-700/80">
        {items.map((it) => (
          <div key={it.k} className="min-w-[7.5rem] flex-1 px-1 sm:px-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {it.k}
            </div>
            <div className={`mt-0.5 font-mono text-base font-extrabold sm:text-lg ${it.c}`}>
              {it.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
