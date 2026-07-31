'use client';

import React, { useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import { compareFoundationOptions } from '@/domain/compare';
import { formatCurrency, type ExtendedCalcOptions } from '@/lib/calculator';
import type {
  ConcreteSpec,
  Currency,
  MaterialPrices,
  UnitSystem,
} from '@/lib/types';
import { ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function StructureComparePanel({
  lengthM,
  widthM,
  concreteSpec,
  prices,
  unitSystem,
  safetyFactor,
  currency,
  calcOptions,
}: {
  lengthM: number;
  widthM: number;
  concreteSpec: ConcreteSpec;
  prices: MaterialPrices;
  unitSystem: UnitSystem;
  safetyFactor: number;
  currency: Currency;
  calcOptions: ExtendedCalcOptions;
}) {
  const rows = useMemo(
    () =>
      compareFoundationOptions(
        lengthM,
        widthM,
        concreteSpec,
        prices,
        unitSystem,
        safetyFactor,
        calcOptions
      ),
    [
      lengthM,
      widthM,
      concreteSpec,
      prices,
      unitSystem,
      safetyFactor,
      calcOptions,
    ]
  );

  const cheapest = rows.reduce((a, b) => (a.totalCost <= b.totalCost ? a : b));
  const maxCost = Math.max(...rows.map((r) => r.totalCost), 1);

  return (
    <ToolPanelShell
      id="tool-compare"
      title="Сравнение: плита / лента / сваи"
      subtitle={`Один план ${lengthM}×${widthM} м — ориентировочные объёмы и смета (не выбор по несущей способности).`}
      icon={GitCompare}
      accent="steel"
      badge="варианты"
      delayMs={90}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((r) => {
          const best = r.structureType === cheapest.structureType;
          const bar = Math.round((r.totalCost / maxCost) * 100);
          return (
            <div
              key={r.structureType}
              className={`relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
                best
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-md'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {best ? (
                <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  выгоднее
                </span>
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {r.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-[#0F172A]">
                {formatCurrency(r.totalCost, currency)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${best ? 'bg-emerald-500' : 'bg-[#3D6494]'}`}
                  style={{ width: `${bar}%` }}
                />
              </div>
              <dl className="mt-3 space-y-1.5 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt>Бетон</dt>
                  <dd className="font-bold text-slate-900">{r.concreteVolumeM3} м³</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Арматура</dt>
                  <dd className="font-bold text-slate-900">{r.rebarWeightKg} кг</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>σ грунта</dt>
                  <dd className="font-bold text-slate-900">{r.soilPressureKpa} кПа</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>R</dt>
                  <dd className="font-bold text-slate-900">{r.soilUtilizationPct}%</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </ToolPanelShell>
  );
}
