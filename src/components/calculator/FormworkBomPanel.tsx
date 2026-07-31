'use client';

import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { computeFormworkBom } from '@/domain/formwork';
import { formatCurrency } from '@/lib/calculator';
import type { Currency, StructureType } from '@/lib/types';
import { MetricTile, ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function FormworkBomPanel({
  structureType,
  formworkAreaM2,
  depthM,
  stripLengthM,
  formworkPricePerM2,
  currency,
}: {
  structureType: StructureType;
  formworkAreaM2: number;
  depthM: number;
  stripLengthM: number;
  formworkPricePerM2: number;
  currency: Currency;
}) {
  const bom = useMemo(
    () =>
      computeFormworkBom({
        structureType,
        formworkAreaM2,
        depthM,
        stripLengthM,
        formworkPricePerM2,
      }),
    [structureType, formworkAreaM2, depthM, stripLengthM, formworkPricePerM2]
  );

  const panelVisual = Math.min(12, bom.panelsApprox);

  return (
    <ToolPanelShell
      id="tool-formwork"
      title="Ведомость опалубки"
      subtitle="Ориентир щитов, стоек и пиломатериала от площади боков — не проект опалубки."
      icon={Layers}
      accent="violet"
      badge="закупка"
      delayMs={40}
    >
      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-[#F4F7FA] p-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Схема щитов (условно)</span>
          <span className="font-mono text-slate-700">
            {bom.panelLengthM}×{bom.panelHeightM} м
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: panelVisual }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-7 rounded-sm border border-slate-400/70 bg-gradient-to-b from-slate-200 to-slate-300 shadow-sm transition hover:border-[#3D6494] hover:from-sky-100 hover:to-sky-200"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
          {bom.panelsApprox > panelVisual ? (
            <div className="flex h-10 min-w-10 items-center justify-center rounded-sm border border-dashed border-slate-300 px-2 font-mono text-[11px] font-bold text-slate-500">
              +{bom.panelsApprox - panelVisual}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="Площадь боков" value={`${bom.sideAreaM2} м²`} tone="sky" />
        <MetricTile label="Щиты" value={`${bom.panelsApprox} шт`} hint="+8% запас" />
        <MetricTile label="Стойки / упоры" value={`${bom.propsApprox} шт`} />
        <MetricTile label="Ригели" value={`${bom.walersApprox} шт`} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricTile label="Пиломатериал" value={`${bom.timberVolumeM3} м³`} />
        <MetricTile
          label="Аренда ориентир"
          value={formatCurrency(bom.rentCostApprox, currency)}
          tone="amber"
        />
        <MetricTile
          label="Купить пиломатериал"
          value={formatCurrency(bom.buyTimberCostApprox, currency)}
          tone="emerald"
        />
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        {bom.notes.map((n) => (
          <li key={n} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3D6494]" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </ToolPanelShell>
  );
}
