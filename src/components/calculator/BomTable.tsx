'use client';

import React from 'react';
import {
  FileText,
  Download,
  Printer,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Currency, ConcreteSpec, RebarSpec } from '@/lib/types';
import { formatCurrency, type ExtendedCalculationResult } from '@/lib/calculator';

interface BomTableProps {
  calculation: ExtendedCalculationResult;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  currency: Currency;
  onSaveProject: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export const BomTable: React.FC<BomTableProps> = ({
  calculation,
  concreteSpec,
  rebarSpec,
  currency,
  onSaveProject,
  onExportCsv,
  onPrint,
}) => {
  const { itemizedCosts } = calculation;

  return (
    <div
      id="bom-estimate-total"
      className="scroll-mt-28 bg-white rounded-2xl border border-slate-200 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] overflow-hidden mt-6 tool-panel"
    >
      {/* Table Header & Metrics Banner */}
      <div className="bg-[#0F172A] text-white p-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#1F5A8E] rounded text-white">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold uppercase tracking-wide">
                Сводная Ведомость Материалов и Смета (BOM)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ОРИЕНТИР БЮДЖЕТА ±15–25% · НЕ КП / НЕ ОФЕРТА РБУ · НЕ ПРОЕКТ КЖ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSaveProject}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" /> Сохранить
            </button>
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" /> CSV
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 bg-[#1F5A8E] hover:bg-[#174771] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Печать Сметы
            </button>
          </div>
        </div>

        {/* Top Metric Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Объем Бетона</span>
            <span className="text-lg font-mono font-extrabold text-sky-400">
              {calculation.concreteVolumeM3} <span className="text-xs font-normal">м³</span>
            </span>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Масса Арматуры</span>
            <span className="text-lg font-mono font-extrabold text-teal-400">
              {calculation.rebarWeightKg} <span className="text-xs font-normal">кг</span>
            </span>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Вес Конструкции</span>
            <span className="text-lg font-mono font-extrabold text-emerald-400">
              {calculation.totalWeightTons} <span className="text-xs font-normal">Тонн</span>
            </span>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Ориентировочная Стоимость</span>
            <span className="text-lg font-mono font-extrabold text-white">
              {formatCurrency(itemizedCosts.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Crisp Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F4F4F5] border-b border-slate-200 font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-4">Код и Наименование Материала</th>
              <th className="py-3 px-4">Расчетное Количество</th>
              <th className="py-3 px-4">Фасовка и Характеристики</th>
              <th className="py-3 px-4 text-right">Стоимость ({currency})</th>
              <th className="py-3 px-4">Норматив (справочно)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
            {/* 1. Ready-Mix Concrete */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-sky-600">БЕТ-01:</span> Товарный Бетон Марки {concreteSpec.grade}
              </td>
              <td className="py-3 px-4 font-bold">{calculation.concreteVolumeM3} м³</td>
              <td className="py-3 px-4 text-slate-600">
                {calculation.totalWeightTons} Тонн Влажной Массы (В/Ц ~0.50)
              </td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {formatCurrency(itemizedCosts.concrete, currency)}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> ГОСТ 7473 — смета
                </span>
              </td>
            </tr>

            {/* 2. Cement Bags */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-amber-600">ЦЕМ-02:</span> Портландцемент (Мешки {concreteSpec.cementBagKg}кг)
              </td>
              <td className="py-3 px-4 font-bold">{calculation.cementBags} Мешков</td>
              <td className="py-3 px-4 text-slate-600">
                {Math.round(calculation.cementBags * concreteSpec.cementBagKg)} кг Вяжущего
              </td>
              <td className="py-3 px-4 text-right text-slate-500">Включено в замес</td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">ГОСТ 31108-2020 ЦЕМ I 42.5Н</span>
              </td>
            </tr>

            {/* 3. Sand & Fine Aggregate */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-amber-600">ПСК-03:</span> Песок Строительный Мытый
              </td>
              <td className="py-3 px-4 font-bold">{calculation.sandTons} Тонн</td>
              <td className="py-3 px-4 text-slate-600">Крупность фракции 0-4мм</td>
              <td className="py-3 px-4 text-right font-bold text-slate-900" rowSpan={2}>
                {formatCurrency(itemizedCosts.sandGravel, currency)}
              </td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">ГОСТ 8736-2014</span>
              </td>
            </tr>

            {/* 4. Crushed Stone Gravel */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-slate-600">ЩЕБ-04:</span> Щебень Гранитный (Фракция 5-20мм)
              </td>
              <td className="py-3 px-4 font-bold">{calculation.gravelTons} Тонн</td>
              <td className="py-3 px-4 text-slate-600">Прочный гранитный щебень 5-20мм</td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">Прочность М1200</span>
              </td>
            </tr>

            {/* 5. Steel Rebar Mesh */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-[#1F5A8E]">АРМ-05:</span> Арматурный Прокат Ø{rebarSpec.diameterMm}мм А500С
              </td>
              <td className="py-3 px-4 font-bold">{calculation.rebarWeightKg} кг</td>
              <td className="py-3 px-4 text-slate-600">
                {calculation.rebarStockBarsApprox} хлыстов ×{' '}
                {calculation.rebarStockLengthM.toFixed(1)} м · нетто{' '}
                {calculation.rebarLengthMeters} м ({rebarSpec.layers} сл.)
              </td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {formatCurrency(itemizedCosts.rebar, currency)}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> ГОСТ 52544 — смета
                </span>
              </td>
            </tr>

            {/* 6. Binding Wire & Spacers */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-slate-600">ПРВ-06:</span> Вязальная Вязаная Проволока и Фиксаторы (Звездочки/Стульчики)
              </td>
              <td className="py-3 px-4 font-bold">{calculation.bindingWireKg} кг Проволоки</td>
              <td className="py-3 px-4 text-slate-[#0F172A]">Фиксаторы защитного слоя 35мм</td>
              <td className="py-3 px-4 text-right text-slate-500">Учтено</td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">ГОСТ 3282-74</span>
              </td>
            </tr>

            {/* 7. Formwork Boards */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-amber-700">ОПА-07:</span> Щиты Опалубки / Ламинированная Фанера
              </td>
              <td className="py-3 px-4 font-bold">{calculation.formworkAreaM2} м² Площади</td>
              <td className="py-3 px-4 text-slate-600">{calculation.timberVolumeM3} м³ Пиломатериала</td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {formatCurrency(itemizedCosts.formwork, currency)}
              </td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">Влагостойкая ФСФ</span>
              </td>
            </tr>

            {/* 8. Labor & Equipment Estimate */}
            <tr className="hover:bg-slate-50 transition bg-slate-50/80">
              <td className="py-3 px-4 font-semibold text-slate-900">
                <span className="text-indigo-600">РАБ-08:</span> Рабочая Бригада, Автобетононасос и Вибрирование
              </td>
              <td className="py-3 px-4 font-bold">1 Смена</td>
              <td className="py-3 px-4 text-slate-600">Приемка, Укладка, Уплотнение и Выравнивание</td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {formatCurrency(itemizedCosts.laborEst, currency)}
              </td>
              <td className="py-3 px-4">
                <span className="text-[11px] text-slate-500 font-sans">35% Коэффициент Работ</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-[#0F172A] text-white font-mono font-extrabold text-sm border-t-2 border-[#1F5A8E]">
              <td className="py-4 px-4 uppercase" colSpan={3}>
                ИТОГО ОБЩАЯ СМЕТА КОНСТРУКЦИИ (МАТЕРИАЛЫ + РАБОТЫ)
              </td>
              <td className="py-4 px-4 text-right text-teal-400 text-base">
                {formatCurrency(itemizedCosts.total, currency)}
              </td>
              <td className="py-4 px-4 text-slate-400 font-normal text-xs font-sans">
                Ориентир ±15–25%, не КП
              </td>
            </tr>
            <tr className="bg-slate-900 text-slate-300 text-[11px] font-sans">
              <td className="px-4 py-3" colSpan={5}>
                Диапазон рынка к этой смете примерно{' '}
                <span className="font-mono font-bold text-amber-200">
                  {formatCurrency(Math.round(itemizedCosts.total * 0.85), currency)}
                </span>
                {' — '}
                <span className="font-mono font-bold text-amber-200">
                  {formatCurrency(Math.round(itemizedCosts.total * 1.25), currency)}
                </span>
                . Объёмы считаются точно; цены — медиана/справочник региона. Актуальный прайс и
                доставку подтверждайте на РБУ (слой сравнения на /ceny).
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
