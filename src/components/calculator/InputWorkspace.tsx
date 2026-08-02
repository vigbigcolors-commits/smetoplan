'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Maximize2,
  ChevronDown,
  Layers,
  Wrench,
  DollarSign,
  Info,
  Shield,
  RotateCcw,
} from 'lucide-react';
import {
  ConcreteSpec,
  DimensionState,
  MaterialPrices,
  RebarSpec,
  UnitSystem,
  StructureType,
} from '@/lib/types';
import type { CalcMode, SnowRegionId, StripLayoutMode } from '@/lib/calculator';
import type { StripPlan } from '@/domain/geometry';
import { StripPlanEditor } from '@/components/calculator/StripPlanEditor';
import {
  SNOW_REGIONS,
  SOIL_TYPES,
  PRICE_REGIONS,
  getSoilType,
  type SoilTypeId,
  type PriceRegionId,
} from '@/domain/norms/tables';

interface InputWorkspaceProps {
  structureType: StructureType;
  dimensions: DimensionState;
  onDimensionsChange: (dims: DimensionState) => void;
  concreteSpec: ConcreteSpec;
  onConcreteSpecChange: (spec: ConcreteSpec) => void;
  rebarSpec: RebarSpec;
  onRebarSpecChange: (spec: RebarSpec) => void;
  prices: MaterialPrices;
  onPricesChange: (prices: MaterialPrices) => void;
  unitSystem: UnitSystem;
  safetyFactor: number;
  onSafetyFactorChange: (sf: number) => void;
  calcMode: CalcMode;
  onCalcModeChange: (mode: CalcMode) => void;
  stripLayout: StripLayoutMode;
  onStripLayoutChange: (mode: StripLayoutMode) => void;
  stripInnerLong: number;
  onStripInnerLongChange: (v: number) => void;
  stripInnerCross: number;
  onStripInnerCrossChange: (v: number) => void;
  stripPlan: StripPlan;
  stripPlanCustom: boolean;
  onStripPlanChange: (plan: StripPlan, custom: boolean) => void;
  pierSpacingM: number;
  onPierSpacingMChange: (v: number) => void;
  coverMm: number;
  onCoverMmChange: (v: number) => void;
  buildingDeadLoadKpa: number;
  onBuildingDeadLoadKpaChange: (v: number) => void;
  liveLoadKpa: number;
  onLiveLoadKpaChange: (v: number) => void;
  snowRegion: SnowRegionId;
  onSnowRegionChange: (v: SnowRegionId) => void;
  applySnow: boolean;
  onApplySnowChange: (v: boolean) => void;
  soilResistanceKpa: number;
  onSoilResistanceKpaChange: (v: number) => void;
  soilTypeId: SoilTypeId;
  onSoilTypeIdChange: (v: SoilTypeId) => void;
  priceRegionId: PriceRegionId;
  onPriceRegionIdChange: (v: PriceRegionId) => void;
  onApplyCenyMedian?: () => Promise<void> | void;
  cenyMedianBusy?: boolean;
  cenyMedianHint?: string | null;
}

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  structureType,
  dimensions,
  onDimensionsChange,
  concreteSpec,
  onConcreteSpecChange,
  rebarSpec,
  onRebarSpecChange,
  prices,
  onPricesChange,
  unitSystem,
  safetyFactor,
  onSafetyFactorChange,
  calcMode,
  onCalcModeChange,
  stripLayout,
  onStripLayoutChange,
  stripInnerLong,
  onStripInnerLongChange,
  stripInnerCross,
  onStripInnerCrossChange,
  stripPlan,
  stripPlanCustom,
  onStripPlanChange,
  pierSpacingM,
  onPierSpacingMChange,
  coverMm,
  onCoverMmChange,
  buildingDeadLoadKpa,
  onBuildingDeadLoadKpaChange,
  liveLoadKpa,
  onLiveLoadKpaChange,
  snowRegion,
  onSnowRegionChange,
  applySnow,
  onApplySnowChange,
  soilResistanceKpa,
  onSoilResistanceKpaChange,
  soilTypeId,
  onSoilTypeIdChange,
  priceRegionId,
  onPriceRegionIdChange,
  onApplyCenyMedian,
  cenyMedianBusy,
  cenyMedianHint,
}) => {
  const [showPriceSettings, setShowPriceSettings] = useState<boolean>(false);

  const unitLabel = unitSystem === 'imperial' ? 'фут' : 'м';
  const minDim = 1.0;
  const maxDim = unitSystem === 'imperial' ? 100 : 35;
  const stepDim = unitSystem === 'imperial' ? 0.5 : 0.1;

  const updateDimension = (key: keyof DimensionState, val: number) => {
    onDimensionsChange({
      ...dimensions,
      [key]: Math.max(0.05, val),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1F5A8E] text-white rounded-md">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
              Панель Параметров Конструкции
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              СМЕТА МАТЕРИАЛОВ + ОРИЕНТИРОВОЧНЫЕ ПРОВЕРКИ
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onDimensionsChange({
              length: unitSystem === 'imperial' ? 32 : 10,
              width: unitSystem === 'imperial' ? 24 : 8,
              depth: unitSystem === 'imperial' ? 1.3 : 0.4,
              perimeterThickeningWidth: unitSystem === 'imperial' ? 1.5 : 0.5,
              perimeterThickeningDepth: unitSystem === 'imperial' ? 1.0 : 0.3,
            });
          }}
          className="text-[11px] text-slate-500 hover:text-[#1F5A8E] flex items-center gap-1 transition font-mono font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Сбросить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onCalcModeChange('estimate')}
          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
            calcMode === 'estimate'
              ? 'border-[#1F5A8E] bg-[#1F5A8E] text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
          }`}
        >
          Режим: смета
          <span className="mt-0.5 block text-[10px] font-medium opacity-80">
            Материалы и стоимость
          </span>
        </button>
        <button
          type="button"
          onClick={() => onCalcModeChange('checks')}
          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
            calcMode === 'checks'
              ? 'border-[#1F5A8E] bg-[#1F5A8E] text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
          }`}
        >
          Режим: проверки
          <span className="mt-0.5 block text-[10px] font-medium opacity-80">
            Покрытие, As,min, грунт
          </span>
        </button>
      </div>

      {/* 1. Geometric Dimensions Sliders & Direct Inputs */}
      <div className="space-y-4">
        <div className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 uppercase">
          <Maximize2 className="w-3.5 h-3.5 text-[#1F5A8E]" />
          1. Геометрические Размеры ({unitLabel.toUpperCase()})
        </div>

        {/* Length Input */}
        <div className="space-y-1.5 bg-[#F4F4F5] p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-slate-700">Длина ($L$)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={dimensions.length}
                onChange={(e) => updateDimension('length', parseFloat(e.target.value) || 0)}
                step={stepDim}
                className="w-20 bg-white border border-slate-300 font-mono font-bold text-slate-900 text-right px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-[#1F5A8E] focus:outline-none"
              />
              <span className="text-slate-500 font-mono text-[11px]">{unitLabel}</span>
            </div>
          </div>
          <input
            type="range"
            min={minDim}
            max={maxDim}
            step={stepDim}
            value={dimensions.length}
            onChange={(e) => updateDimension('length', parseFloat(e.target.value))}
            className="w-full accent-[#1F5A8E] cursor-pointer"
          />
        </div>

        {/* Width Input */}
        <div className="space-y-1.5 bg-[#F4F4F5] p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-slate-700">Ширина ($W$)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => updateDimension('width', parseFloat(e.target.value) || 0)}
                step={stepDim}
                className="w-20 bg-white border border-slate-300 font-mono font-bold text-slate-900 text-right px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-[#1F5A8E] focus:outline-none"
              />
              <span className="text-slate-500 font-mono text-[11px]">{unitLabel}</span>
            </div>
          </div>
          <input
            type="range"
            min={minDim}
            max={maxDim}
            step={stepDim}
            value={dimensions.width}
            onChange={(e) => updateDimension('width', parseFloat(e.target.value))}
            className="w-full accent-[#1F5A8E] cursor-pointer"
          />
        </div>

        {/* Depth / Thickness Input */}
        <div className="space-y-1.5 bg-[#F4F4F5] p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-slate-700">
              {structureType === 'pier'
                ? 'Глубина свай ($H$)'
                : 'Толщина / Высота ($H$)'}
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={dimensions.depth}
                onChange={(e) => updateDimension('depth', parseFloat(e.target.value) || 0)}
                step={0.05}
                className="w-20 bg-white border border-slate-300 font-mono font-bold text-slate-900 text-right px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-[#1F5A8E] focus:outline-none"
              />
              <span className="text-slate-500 font-mono text-[11px]">{unitLabel}</span>
            </div>
          </div>
          <input
            type="range"
            min={0.1}
            max={
              structureType === 'pier'
                ? unitSystem === 'imperial'
                  ? 20
                  : 6
                : unitSystem === 'imperial'
                  ? 5
                  : 1.5
            }
            step={0.05}
            value={dimensions.depth}
            onChange={(e) => updateDimension('depth', parseFloat(e.target.value))}
            className="w-full accent-[#1F5A8E] cursor-pointer"
          />
        </div>

        {/* Perimeter Stiffening Ribs for Slab */}
        {structureType === 'slab' && (
          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Ребро жесткости по периметру
              </span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-mono">
                ДОП. УСИЛЕНИЕ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Ширина ребра</label>
                <input
                  type="number"
                  value={dimensions.perimeterThickeningWidth}
                  onChange={(e) =>
                    updateDimension('perimeterThickeningWidth', parseFloat(e.target.value) || 0)
                  }
                  step={0.05}
                  className="w-full bg-white border border-amber-300 font-mono font-semibold px-2 py-1 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Глубина ребра</label>
                <input
                  type="number"
                  value={dimensions.perimeterThickeningDepth}
                  onChange={(e) =>
                    updateDimension('perimeterThickeningDepth', parseFloat(e.target.value) || 0)
                  }
                  step={0.05}
                  className="w-full bg-white border border-amber-300 font-mono font-semibold px-2 py-1 rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {structureType === 'strip' && (
          <div className="space-y-2 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs">
            <p className="font-semibold text-sky-950">Редактор плана ленты</p>
            <select
              value={stripLayout === 'custom' ? 'custom' : stripLayout}
              onChange={(e) => {
                const mode = e.target.value as StripLayoutMode;
                onStripLayoutChange(mode);
                if (mode === 'perimeter') {
                  onStripInnerLongChange(0);
                  onStripInnerCrossChange(0);
                } else if (mode === 'perimeter_plus_one') {
                  onStripInnerLongChange(1);
                  onStripInnerCrossChange(0);
                } else if (mode === 'perimeter_plus_cross') {
                  onStripInnerLongChange(1);
                  onStripInnerCrossChange(1);
                }
              }}
              className="w-full rounded-lg border border-sky-300 bg-white p-2 font-mono text-xs font-semibold"
            >
              <option value="perimeter">Только контур</option>
              <option value="perimeter_plus_one">Контур + 1 продольная</option>
              <option value="perimeter_plus_cross">Контур + крест</option>
              <option value="custom">Свои оси</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[11px] text-slate-600">
                  Внутр. продольные
                </label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  step={1}
                  value={stripInnerLong}
                  onChange={(e) => {
                    onStripLayoutChange('custom');
                    onStripInnerLongChange(Number(e.target.value) || 0);
                  }}
                  className="w-full rounded-lg border border-sky-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-slate-600">
                  Внутр. поперечные
                </label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  step={1}
                  value={stripInnerCross}
                  onChange={(e) => {
                    onStripLayoutChange('custom');
                    onStripInnerCrossChange(Number(e.target.value) || 0);
                  }}
                  className="w-full rounded-lg border border-sky-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="mb-0.5 block text-[11px] text-slate-600">Ширина ленты, м</label>
              <input
                type="number"
                min={0.2}
                max={1.2}
                step={0.05}
                value={dimensions.perimeterThickeningWidth || 0.4}
                onChange={(e) =>
                  updateDimension(
                    'perimeterThickeningWidth',
                    parseFloat(e.target.value) || 0.4
                  )
                }
                className="w-full rounded-lg border border-sky-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
              />
            </div>
            <p className="text-[11px] text-sky-900/80">
              Объём: осевая длина × ширина − стыки (без двойного бетона на пересечениях)
            </p>
            <StripPlanEditor
              lengthM={dimensions.length}
              widthM={dimensions.width}
              depthM={dimensions.depth}
              ribbonWidthM={dimensions.perimeterThickeningWidth || 0.4}
              innerLong={stripInnerLong}
              innerCross={stripInnerCross}
              plan={stripPlan}
              custom={stripPlanCustom}
              onPlanChange={onStripPlanChange}
            />
          </div>
        )}

        {structureType === 'pier' && (
          <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/70 p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-violet-950">
              <span>Плита и сваи</span>
              <span className="text-[10px] bg-violet-200/70 text-violet-900 px-1.5 py-0.5 rounded font-mono">
                СВАЙНО-ПЛИТНЫЙ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[11px] text-slate-600">
                  Толщина плиты, м
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={1.2}
                  step={0.05}
                  value={dimensions.perimeterThickeningDepth}
                  onChange={(e) =>
                    updateDimension(
                      'perimeterThickeningDepth',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-violet-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-slate-600">
                  Диаметр сваи, м
                </label>
                <input
                  type="number"
                  min={0.15}
                  max={0.8}
                  step={0.05}
                  value={dimensions.perimeterThickeningWidth}
                  onChange={(e) =>
                    updateDimension(
                      'perimeterThickeningWidth',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-violet-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="mb-0.5 block font-semibold text-violet-950">
                Шаг свай, м
              </label>
              <input
                type="number"
                min={1.5}
                max={4}
                step={0.1}
                value={pierSpacingM}
                onChange={(e) => onPierSpacingMChange(Number(e.target.value) || 2.5)}
                className="w-full rounded-lg border border-violet-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
              />
              <p className="mt-1 text-[11px] text-violet-800/80">
                Бетон = плита L×W×t + Σ свай. Опалубка только по периметру плиты (сваи в грунте без щитов).
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-slate-200 bg-[#F4F4F5] p-3 text-xs">
          <label className="font-semibold text-slate-700">Защитный слой a, мм</label>
          <input
            type="number"
            min={20}
            max={80}
            step={5}
            value={coverMm}
            onChange={(e) => onCoverMmChange(Number(e.target.value) || 40)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono font-bold"
          />
          <p className="text-[11px] text-slate-500">Ориентир для фундаментов ≥ 40 мм (СП 63)</p>
        </div>
      </div>

      {/* Loads & soil */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-800">
          <Shield className="h-3.5 w-3.5 text-[#1F5A8E]" />
          Регион, нагрузки и основание
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600">
            Регион цен / РБУ
          </label>
          <select
            value={priceRegionId}
            onChange={(e) => onPriceRegionIdChange(e.target.value as PriceRegionId)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs font-bold"
          >
            {(Object.keys(PRICE_REGIONS) as PriceRegionId[]).map((id) => (
              <option key={id} value={id}>
                {PRICE_REGIONS[id].label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Постоянная от здания, кПа
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={buildingDeadLoadKpa}
              onChange={(e) => onBuildingDeadLoadKpaChange(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Полезная, кПа
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={liveLoadKpa}
              onChange={(e) => onLiveLoadKpaChange(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Снег (СП 20)
            </label>
            <select
              value={snowRegion}
              onChange={(e) => onSnowRegionChange(e.target.value as SnowRegionId)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs font-bold"
            >
              {Object.entries(SNOW_REGIONS).map(([id, meta]) => (
                <option key={id} value={id}>
                  {id}: {meta.label} ({meta.sgKpa} кПа)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Тип грунта (справочно)
            </label>
            <select
              value={soilTypeId}
              onChange={(e) => {
                const id = e.target.value as SoilTypeId;
                onSoilTypeIdChange(id);
                onSoilResistanceKpaChange(getSoilType(id).rKpa);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs font-bold"
            >
              {SOIL_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · R≈{s.rKpa}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              R грунта, кПа (можно уточнить по ИГИ)
            </label>
            <input
              type="number"
              min={50}
              step={10}
              value={soilResistanceKpa}
              onChange={(e) => onSoilResistanceKpaChange(Number(e.target.value) || 200)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-bold"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              {getSoilType(soilTypeId).note}. Не замена инженерно-геологических изысканий.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={applySnow}
            onChange={(e) => onApplySnowChange(e.target.checked)}
            className="accent-[#1F5A8E]"
          />
          Учитывать снег на пятне фундамента
        </label>
      </div>

      {/* 2. Structural Concrete Mix */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 uppercase">
          <Layers className="w-3.5 h-3.5 text-[#1F5A8E]" />
          2. Марка Бетона и Фасовка Цемента
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Марка / Класс Бетона</label>
            <select
              value={concreteSpec.grade}
              onChange={(e) =>
                onConcreteSpecChange({
                  ...concreteSpec,
                  grade: e.target.value as ConcreteSpec['grade'],
                })
              }
              className="w-full bg-[#F4F4F5] border border-slate-300 rounded-lg font-mono font-bold text-xs p-2 text-slate-900 focus:ring-1 focus:ring-[#1F5A8E]"
            >
              <option value="M150">М150 / В12.5 (Подготовка)</option>
              <option value="M200">М200 / В15 (Стандарт)</option>
              <option value="M250">М250 / В20 (Усиленный)</option>
              <option value="M300">М300 / В22.5 (Высокая нагрузка)</option>
              <option value="M350">M350 / В25 (Монолитный каркас)</option>
              <option value="M400">М400 / В30 (Гидротехнический)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Мешки Цемента</label>
            <select
              value={concreteSpec.cementBagKg}
              onChange={(e) =>
                onConcreteSpecChange({
                  ...concreteSpec,
                  cementBagKg: Number(e.target.value) as 25 | 50,
                })
              }
              className="w-full bg-[#F4F4F5] border border-slate-300 rounded-lg font-mono font-bold text-xs p-2 text-slate-900 focus:ring-1 focus:ring-[#1F5A8E]"
            >
              <option value={50}>Мешки по 50 кг</option>
              <option value={25}>Мешки по 25 кг</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Арматурный каркас */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="text-xs font-mono font-bold text-slate-800 flex items-center justify-between uppercase">
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-[#1F5A8E]" />
            3. Арматурный каркас
          </span>
          <span className="text-[11px] text-[#1F5A8E] font-bold normal-case">
            {structureType === 'strip' || structureType === 'beam'
              ? `Ø${rebarSpec.diameterMm} · ${rebarSpec.longitudinalBars ?? (rebarSpec.layers >= 2 ? 6 : 4)} прод. · хомуты ${rebarSpec.spacingMm} мм`
              : `Ø${rebarSpec.diameterMm} мм · шаг ${rebarSpec.spacingMm} мм`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              {structureType === 'strip' || structureType === 'beam'
                ? 'Диаметр продольных'
                : 'Диаметр арматуры'}
            </label>
            <select
              value={rebarSpec.diameterMm}
              onChange={(e) =>
                onRebarSpecChange({
                  ...rebarSpec,
                  diameterMm: Number(e.target.value),
                })
              }
              className="w-full bg-[#F4F4F5] border border-slate-300 rounded-lg font-mono font-bold text-xs p-2 text-slate-900 focus:ring-1 focus:ring-[#1F5A8E]"
            >
              <option value={8}>8 мм (А400 Лёгкая)</option>
              <option value={10}>10 мм (А500С Стандарт)</option>
              <option value={12}>12 мм (А500С Усиленная)</option>
              <option value={14}>14 мм (Высокая прочность)</option>
              <option value={16}>16 мм (Монолитные балки)</option>
              <option value={20}>20 мм (Тяжёлые нагрузки)</option>
            </select>
          </div>

          {structureType === 'strip' || structureType === 'beam' ? (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Продольных стержней
              </label>
              <select
                value={
                  rebarSpec.longitudinalBars ??
                  (rebarSpec.layers >= 3 ? 8 : rebarSpec.layers >= 2 ? 6 : 4)
                }
                onChange={(e) => {
                  const n = Number(e.target.value) as 4 | 6 | 8;
                  onRebarSpecChange({
                    ...rebarSpec,
                    longitudinalBars: n,
                    layers: n >= 8 ? 3 : n >= 6 ? 2 : 1,
                  });
                }}
                className="w-full bg-[#F4F4F5] border border-slate-300 rounded-lg font-mono font-bold text-xs p-2 text-slate-900 focus:ring-1 focus:ring-[#1F5A8E]"
              >
                <option value={4}>4 шт (нижний пояс)</option>
                <option value={6}>6 шт (верх + низ)</option>
                <option value={8}>8 шт (усиленный каркас)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Слои армирования
              </label>
              <select
                value={rebarSpec.layers}
                onChange={(e) =>
                  onRebarSpecChange({
                    ...rebarSpec,
                    layers: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className="w-full bg-[#F4F4F5] border border-slate-300 rounded-lg font-mono font-bold text-xs p-2 text-slate-900 focus:ring-1 focus:ring-[#1F5A8E]"
              >
                <option value={1}>1 слой (нижняя сетка)</option>
                <option value={2}>2 слоя (верх + низ)</option>
                <option value={3}>3 слоя (пространственная сетка)</option>
              </select>
            </div>
          )}
        </div>

        <div className="bg-[#F4F4F5] p-3 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              {structureType === 'strip' || structureType === 'beam'
                ? 'Шаг поперечных хомутов'
                : 'Шаг сетки (ячейка)'}
            </span>
            <span className="font-mono font-bold text-[#0F172A]">
              {rebarSpec.spacingMm} мм
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={350}
            step={25}
            value={rebarSpec.spacingMm}
            onChange={(e) =>
              onRebarSpecChange({
                ...rebarSpec,
                spacingMm: Number(e.target.value),
              })
            }
            className="w-full accent-[#1F5A8E] cursor-pointer"
          />
          {(structureType === 'strip' || structureType === 'beam') && (
            <p className="text-[10px] leading-snug text-slate-500">
              Хомуты — замкнутый прямоугольник по сечению с учётом защитного слоя.
              Диаметр хомутов: min(8 мм, Ø продольных).
            </p>
          )}
        </div>
      </div>

      {/* Safety Factor Margin */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Запас на укладку и отходы (+{(Math.round((safetyFactor - 1) * 100))}%)
          </span>
          <select
            value={safetyFactor}
            onChange={(e) => onSafetyFactorChange(Number(e.target.value))}
            className="bg-[#F4F4F5] border border-slate-300 text-xs font-mono font-bold rounded px-2 py-1 text-slate-900"
          >
            <option value={1.05}>+5% Минимальный запас</option>
            <option value={1.15}>+15% Стандартный (Рекомендуется)</option>
            <option value={1.25}>+25% Высокая надежность</option>
          </select>
        </div>
      </div>

      {/* 4. Custom Unit Prices Overrides Accordion */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() => setShowPriceSettings(!showPriceSettings)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-700 bg-[#F4F4F5] hover:bg-slate-200 px-3 py-2 rounded-lg transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5 uppercase">
            <DollarSign className="w-3.5 h-3.5 text-[#1F5A8E]" />
            Корректировка Базовых Цен
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showPriceSettings ? 'rotate-180' : ''}`}
          />
        </button>

        {showPriceSettings && (
          <div className="mt-3 space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[11px] leading-snug text-slate-600">
              Цены в смете — ориентир бюджета ±15–25%, не КП завода. Можно подставить медиану
              публичных котировок с /ceny или править вручную.
            </p>
            {onApplyCenyMedian ? (
              <button
                type="button"
                disabled={Boolean(cenyMedianBusy)}
                onClick={() => void onApplyCenyMedian()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-[#3D6494]/40 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#1F5A8E] transition-colors hover:bg-[#3D6494] hover:text-white disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${cenyMedianBusy ? 'animate-spin' : ''}`} />
                {cenyMedianBusy ? 'Загрузка медианы…' : 'Подставить среднюю с /ceny'}
              </button>
            ) : null}
            {cenyMedianHint ? (
              <p className="text-[10px] font-mono text-emerald-700">{cenyMedianHint}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-600 block mb-0.5">Бетон Товарный / м³</label>
              <input
                type="number"
                value={prices.concretePerM3}
                onChange={(e) =>
                  onPricesChange({ ...prices, concretePerM3: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 font-mono font-bold px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-0.5">Арматура / Тонна</label>
              <input
                type="number"
                value={prices.rebarPerTon}
                onChange={(e) =>
                  onPricesChange({ ...prices, rebarPerTon: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 font-mono font-bold px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-0.5">Песок и Щебень / Тонна</label>
              <input
                type="number"
                value={prices.sandPerTon}
                onChange={(e) =>
                  onPricesChange({ ...prices, sandPerTon: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 font-mono font-bold px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-0.5">Опалубка и Фанера / м²</label>
              <input
                type="number"
                value={prices.formworkPerM2}
                onChange={(e) =>
                  onPricesChange({ ...prices, formworkPerM2: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 font-mono font-bold px-2 py-1 rounded"
              />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
