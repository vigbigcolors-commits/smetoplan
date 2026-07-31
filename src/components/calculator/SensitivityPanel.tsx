'use client';

import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { runSensitivityScenarios } from '@/domain/sensitivity';
import { formatCurrency, type ExtendedCalcOptions } from '@/lib/calculator';
import type {
  ConcreteSpec,
  Currency,
  DimensionState,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from '@/lib/types';
import { ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function SensitivityPanel({
  structureType,
  dimensions,
  concreteSpec,
  rebarSpec,
  prices,
  unitSystem,
  safetyFactor,
  calcOptions,
  currency,
}: {
  structureType: StructureType;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  prices: MaterialPrices;
  unitSystem: UnitSystem;
  safetyFactor: number;
  calcOptions: ExtendedCalcOptions;
  currency: Currency;
}) {
  const rows = useMemo(
    () =>
      runSensitivityScenarios({
        structureType,
        dimensions,
        concreteSpec,
        rebarSpec,
        prices,
        unitSystem,
        safetyFactor,
        options: calcOptions,
      }),
    [
      structureType,
      dimensions,
      concreteSpec,
      rebarSpec,
      prices,
      unitSystem,
      safetyFactor,
      calcOptions,
    ]
  );

  const maxAbsCost = Math.max(1, ...rows.map((r) => Math.abs(r.deltaCost)));

  return (
    <ToolPanelShell
      id="tool-sensitivity"
      title="Сценарии чувствительности"
      subtitle="R грунта, нагрузки и марка бетона — тот же движок расчёта, отклонения от базы."
      icon={Activity}
      accent="emerald"
      badge="анализ"
      delayMs={100}
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <th className="px-3 py-2.5">Сценарий</th>
              <th className="px-3 py-2.5">м³</th>
              <th className="px-3 py-2.5">Δм³</th>
              <th className="px-3 py-2.5">кг</th>
              <th className="px-3 py-2.5">R %</th>
              <th className="px-3 py-2.5">Δ смета</th>
              <th className="px-3 py-2.5 w-28">Δ визуал</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const barW = Math.round((Math.abs(r.deltaCost) / maxAbsCost) * 100);
              const pos = r.deltaCost >= 0;
              return (
                <tr
                  key={r.id}
                  className={`border-t border-slate-100 transition hover:bg-emerald-50/40 ${
                    r.id === 'base' ? 'bg-sky-50/70' : 'bg-white'
                  }`}
                >
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{r.label}</td>
                  <td className="px-3 py-2.5 font-mono">{r.result.concreteVolumeM3}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">
                    {fmtDelta(r.deltaVolumeM3)}
                  </td>
                  <td className="px-3 py-2.5 font-mono">{r.result.rebarWeightKg}</td>
                  <td className="px-3 py-2.5 font-mono">
                    {r.result.soilUtilizationPct}%
                    <span className="ml-1 text-slate-400">{fmtDelta(r.deltaSoilPct)}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold">
                    {r.id === 'base'
                      ? formatCurrency(r.result.itemizedCosts.total, currency)
                      : `${pos && r.deltaCost !== 0 ? '+' : ''}${formatCurrency(r.deltaCost, currency)}`}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex h-2 items-center gap-1">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${pos ? 'bg-rose-400' : 'bg-emerald-500'}`}
                          style={{ width: `${r.id === 'base' ? 0 : barW}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ToolPanelShell>
  );
}

function fmtDelta(n: number): string {
  if (n === 0) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}
