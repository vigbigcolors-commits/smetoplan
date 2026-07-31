'use client';

import React, { useMemo } from 'react';
import { Download, ShoppingCart } from 'lucide-react';
import {
  buildBuyTomorrowList,
  buyListToText,
} from '@/domain/procurement';
import type { FormworkBom } from '@/domain/formwork';
import type { RebarPiece } from '@/domain/rebar';
import { ToolButton, ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

const catColor: Record<string, string> = {
  Бетон: 'bg-sky-100 text-sky-800',
  Арматура: 'bg-orange-100 text-orange-900',
  Раскрой: 'bg-amber-100 text-amber-900',
  Фиксаторы: 'bg-teal-100 text-teal-900',
  Уход: 'bg-emerald-100 text-emerald-900',
  Опалубка: 'bg-indigo-100 text-indigo-900',
  Пиломатериал: 'bg-slate-200 text-slate-800',
};

export function BuyTomorrowPanel({
  concreteVolumeM3,
  rebarPieces,
  rebarWeightKg,
  bindingWireKg,
  stockBarsApprox,
  stockLengthM,
  diameterMm,
  coverMm,
  formwork,
  contactAreaM2,
  planAreaM2,
  structureLabel,
}: {
  concreteVolumeM3: number;
  rebarPieces: RebarPiece[];
  rebarWeightKg: number;
  bindingWireKg: number;
  stockBarsApprox: number;
  stockLengthM: number;
  diameterMm: number;
  coverMm: number;
  formwork: FormworkBom;
  contactAreaM2: number;
  planAreaM2: number;
  structureLabel: string;
}) {
  const list = useMemo(
    () =>
      buildBuyTomorrowList({
        concreteVolumeM3,
        rebarPieces,
        rebarWeightKg,
        bindingWireKg,
        stockBarsApprox,
        stockLengthM,
        diameterMm,
        coverMm,
        formwork,
        contactAreaM2,
        planAreaM2,
      }),
    [
      concreteVolumeM3,
      rebarPieces,
      rebarWeightKg,
      bindingWireKg,
      stockBarsApprox,
      stockLengthM,
      diameterMm,
      coverMm,
      formwork,
      contactAreaM2,
      planAreaM2,
    ]
  );

  const download = () => {
    const text = buyListToText(list, `Smetoplan — купить завтра · ${structureLabel}`);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smetoplan_купить_завтра.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPanelShell
      id="tool-buy"
      title="Что купить завтра"
      subtitle={list.generatedAtHint}
      icon={ShoppingCart}
      accent="amber"
      badge={`${list.items.length} позиций`}
      delayMs={60}
      actions={
        <ToolButton onClick={download} icon={Download} variant="primary">
          Скачать .txt
        </ToolButton>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <th className="px-3 py-2.5">Категория</th>
              <th className="px-3 py-2.5">Позиция</th>
              <th className="px-3 py-2.5">Кол-во</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">Примечание</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((i, idx) => (
              <tr
                key={i.id}
                className={`border-t border-slate-100 transition hover:bg-sky-50/60 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      catColor[i.category] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {i.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-semibold text-slate-900">{i.name}</td>
                <td className="px-3 py-2.5 font-mono font-extrabold text-[#0F172A]">
                  {i.qty} <span className="font-semibold text-slate-400">{i.unit}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-slate-500 sm:table-cell">{i.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolPanelShell>
  );
}
