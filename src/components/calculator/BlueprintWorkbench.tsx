'use client';

import React from 'react';
import {
  ClipboardList,
  Download,
  Grid3x3,
  Ruler,
  Scissors,
} from 'lucide-react';
import type {
  DimensionState,
  RebarSpec,
  StructureType,
} from '@/lib/types';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import { FoundationSvgBlueprint } from './FoundationSvgBlueprint';

interface BlueprintWorkbenchProps {
  structureType: StructureType;
  dimensions: DimensionState;
  rebarSpec: RebarSpec;
  calculation: ExtendedCalculationResult;
  coverMm: number;
  onCoverMmChange: (v: number) => void;
  stockLengthM: number;
  onStockLengthMChange: (v: number) => void;
}

/**
 * 2D plan + live cutting board — numbers come from domain calculateMaterials only.
 */
export function BlueprintWorkbench({
  structureType,
  dimensions,
  rebarSpec,
  calculation,
  coverMm,
  onCoverMmChange,
  stockLengthM,
  onStockLengthMChange,
}: BlueprintWorkbenchProps) {
  const pieces = calculation.rebarPieces;
  const long = pieces.find((p) => p.role.includes('Продоль') || p.mark.startsWith('А1'));
  const cross = pieces.find((p) => p.role.includes('Попереч') || p.role.includes('Горизонт') || p.mark.startsWith('А2'));

  const exportCuttingCsv = () => {
    const rows = [
      ['Smetoplan — Раскрой арматуры'],
      ['Конструкция', structureType],
      ['Диаметр мм', String(rebarSpec.diameterMm)],
      ['Шаг мм', String(rebarSpec.spacingMm)],
      ['Слои', String(rebarSpec.layers)],
      ['Защитный слой мм', String(coverMm)],
      ['Хлыст склада м', String(stockLengthM)],
      ['Нужно прутков шт', String(calculation.rebarStockBarsApprox)],
      ['Отход м', String(calculation.rebarWasteM)],
      ['Отход %', String(calculation.rebarWastePct)],
      ['Масса кг', String(calculation.rebarWeightKg)],
      ['Нахлёст мм', String(calculation.lapMm)],
      [],
      ['Марка', 'Назначение', 'Ø мм', 'Длина мм', 'Кол-во', 'Масса кг'],
      ...pieces.map((p) => [
        p.mark,
        p.role,
        String(p.diameterMm),
        String(p.lengthMm),
        String(p.count),
        String(Math.round(p.weightKg * 10) / 10),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(';')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smetoplan_raskroy_${structureType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0B132B] shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 bg-slate-900/90 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-orange-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-orange-400">
            2D Чертёж + Раскрой арматуры
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {structureType.toUpperCase()} · Ø{rebarSpec.diameterMm}
            {structureType === 'strip' || structureType === 'beam'
              ? ` · ${rebarSpec.longitudinalBars ?? (rebarSpec.layers >= 2 ? 6 : 4)} прод. · хом. ${rebarSpec.spacingMm}`
              : ` · ${rebarSpec.spacingMm}×${rebarSpec.spacingMm} мм`}
          </span>
        </div>
        <button
          type="button"
          onClick={exportCuttingCsv}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#3D6494] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#4A76AB]"
        >
          <Download className="h-3.5 w-3.5" />
          CSV раскроя
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-slate-700 lg:border-b-0 lg:border-r">
          <FoundationSvgBlueprint
            structureType={structureType}
            dimensions={dimensions}
            rebarSpec={rebarSpec}
            showRebar
            soilPressureKpa={calculation.soilPressureKpa}
          />
        </div>

        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-sky-300">
            <Scissors className="h-4 w-4" />
            <span className="font-mono text-xs font-bold uppercase tracking-wide">
              Ведомость стержней
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-2.5">
              <span className="block text-[10px] text-slate-500">
                {long?.role ?? 'А1'}
              </span>
              <span className="text-sm font-extrabold text-white">
                {long
                  ? `${long.count} шт × ${(long.lengthMm / 1000).toFixed(2)} м`
                  : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-2.5">
              <span className="block text-[10px] text-slate-500">
                {cross?.role ?? 'А2 / хомуты'}
              </span>
              <span className="text-sm font-extrabold text-white">
                {cross
                  ? `${cross.count} шт × ${(cross.lengthMm / 1000).toFixed(2)} м`
                  : pieces[1]
                    ? `${pieces[1].count} шт × ${(pieces[1].lengthMm / 1000).toFixed(2)} м`
                    : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-2.5">
              <span className="block text-[10px] text-slate-500">Погонных метров</span>
              <span className="text-sm font-extrabold text-sky-400">
                {calculation.rebarLengthMeters} м
              </span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-2.5">
              <span className="block text-[10px] text-slate-500">Масса с отходом</span>
              <span className="text-sm font-extrabold text-orange-400">
                {calculation.rebarWeightKg} кг
              </span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Ruler className="h-3.5 w-3.5 text-[#6B93C4]" />
                Защитный слой
              </label>
              <span className="font-mono font-bold text-white">{coverMm} мм</span>
            </div>
            <input
              type="range"
              min={25}
              max={70}
              step={5}
              value={coverMm}
              onChange={(e) => onCoverMmChange(Number(e.target.value))}
              className="w-full cursor-pointer accent-[#3D6494]"
            />
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="font-semibold text-slate-300">Пруток склада</label>
              <span className="font-mono font-bold text-white">
                {stockLengthM.toFixed(1)} м
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={12}
              step={0.1}
              value={stockLengthM}
              onChange={(e) => onStockLengthMChange(Number(e.target.value))}
              className="w-full cursor-pointer accent-[#3D6494]"
            />
            <p className="text-[10px] leading-relaxed text-slate-500">
              Те же формулы, что в смете и ведомости ниже — не отдельный «демо»-расчёт.
            </p>
          </div>

          <div
            className="rounded-lg border border-[#3D6494]/40 bg-[#3D6494]/15 p-3 font-mono text-xs text-slate-200"
            data-purchase-bars={calculation.rebarStockBarsApprox}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[#9BB6D4]">
              <ClipboardList className="h-3.5 w-3.5" />
              Заказ на склад
            </div>
            <p>
              Нужно прутков:{' '}
              <strong className="text-white">
                {calculation.rebarStockBarsApprox} шт
              </strong>{' '}
              по {calculation.rebarStockLengthM.toFixed(1)} м
            </p>
            {calculation.rebarStockByDiameter.length > 1 && (
              <p className="text-[10px] text-sky-200/90">
                {calculation.rebarStockByDiameter
                  .map((s) => `${s.bars}×Ø${s.diameterMm} (${s.weightKg} кг)`)
                  .join(' · ')}
              </p>
            )}
            <p>
              Отход:{' '}
              <strong className="text-amber-300">{calculation.rebarWasteM} м</strong> (
              {calculation.rebarWastePct}%)
            </p>
            <p>
              Нахлёст:{' '}
              <strong className="text-white">{calculation.lapMm} мм</strong> (~40Ø)
            </p>
            <p className="mt-1.5 text-[10px] text-slate-400">
              Масса закупки {calculation.rebarWeightKg} кг = Σ(хлысты × L × ρ по Ø)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
