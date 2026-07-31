'use client';

import React from 'react';
import { Grid3x3 } from 'lucide-react';
import type { RebarPiece } from '@/lib/calculator';
import { MetricTile, ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function RebarScheduleTable({
  pieces,
  wastePct,
  stockBarsApprox,
  lapMm,
  totalWeightKg,
  stockLengthM = 11.7,
  wasteM = 0,
}: {
  pieces: RebarPiece[];
  wastePct: number;
  stockBarsApprox: number;
  lapMm: number;
  totalWeightKg: number;
  stockLengthM?: number;
  wasteM?: number;
}) {
  if (!pieces.length) return null;

  return (
    <ToolPanelShell
      id="tool-rebar"
      title="Ведомость раскроя арматуры"
      subtitle={`Длины стержней, нахлёст ${lapMm} мм, хлыст ${stockLengthM.toFixed(1)} м. Не замена КЖ.`}
      icon={Grid3x3}
      accent="amber"
      badge="раскрой"
      delayMs={20}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="Хлыстов" value={`${stockBarsApprox} шт`} tone="amber" />
        <MetricTile label="Отход" value={`${wasteM} м`} hint={`${wastePct}%`} />
        <MetricTile label="Нахлёст" value={`${lapMm} мм`} />
        <MetricTile label="Масса" value={`${totalWeightKg} кг`} tone="sky" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <th className="px-3 py-2.5">Марка</th>
              <th className="px-3 py-2.5">Назначение</th>
              <th className="px-3 py-2.5">Ø</th>
              <th className="px-3 py-2.5">Длина</th>
              <th className="px-3 py-2.5">Кол-во</th>
              <th className="px-3 py-2.5 text-right">Масса</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((p, idx) => (
              <tr
                key={`${p.mark}-${p.role}-${p.lengthMm}`}
                className={`border-t border-slate-100 font-mono transition hover:bg-amber-50/50 ${
                  idx % 2 ? 'bg-[#F8FAFC]' : 'bg-white'
                }`}
              >
                <td className="px-3 py-2.5 font-bold text-[#1F5A8E]">{p.mark}</td>
                <td className="px-3 py-2.5 font-sans text-slate-600">{p.role}</td>
                <td className="px-3 py-2.5">{p.diameterMm}</td>
                <td className="px-3 py-2.5">{p.lengthMm}</td>
                <td className="px-3 py-2.5 font-bold">{p.count}</td>
                <td className="px-3 py-2.5 text-right font-bold">
                  {Math.round(p.weightKg * 10) / 10}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#1F5A8E] bg-slate-50 font-bold">
              <td className="px-3 py-3 font-sans" colSpan={5}>
                Итого с отходами {wastePct}%
              </td>
              <td className="px-3 py-3 text-right text-[#0F172A]">{totalWeightKg} кг</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ToolPanelShell>
  );
}
