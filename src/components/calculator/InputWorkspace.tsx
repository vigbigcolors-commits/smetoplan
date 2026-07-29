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
              РАСЧЕТ ГЕОМЕТРИИ И ХАРАКТЕРИСТИК МАТЕРИАЛОВ
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
            <label className="font-semibold text-slate-700">Толщина / Высота ($H$)</label>
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
            max={unitSystem === 'imperial' ? 5 : 1.5}
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

      {/* 3. Rebar — hidden when route/query has no reinforcement (DOM variance) */}
      {rebarSpec.layers > 0 && rebarSpec.diameterMm > 0 ? (
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <div className="text-xs font-mono font-bold text-slate-800 flex items-center justify-between uppercase">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#1F5A8E]" />
              3. Арматурный Каркас и Сетка
            </span>
            <span className="text-[11px] text-[#1F5A8E] font-bold">
              Ø{rebarSpec.diameterMm}мм с шагом {rebarSpec.spacingMm}мм
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Диаметр Арматуры</label>
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
                <option value={8}>8 мм (А400 Легкая)</option>
                <option value={10}>10 мм (А500С Стандарт)</option>
                <option value={12}>12 мм (А500С Усиленная)</option>
                <option value={14}>14 мм (Высокая прочность)</option>
                <option value={16}>16 мм (Монолитные балки)</option>
                <option value={20}>20 мм (Тяжелые нагрузки)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Слои Армирования</label>
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
                <option value={1}>1 Слой (Нижняя сетка)</option>
                <option value={2}>2 Слоя (Верх + Низ)</option>
                <option value={3}>3D Пространственный каркас</option>
              </select>
            </div>
          </div>

          <div className="bg-[#F4F4F5] p-3 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Шаг Сетки (Ячейка)</span>
              <span className="font-mono font-bold text-[#0F172A]">{rebarSpec.spacingMm} мм</span>
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
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 bg-amber-50/80 border border-amber-200 rounded-lg p-3">
          Схема армирования не входит в этот расчёт (подбетонка / запрос без арматуры).
          Блок скрыт для вариативности DOM и соответствия интенту.
        </div>
      )}

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
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
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
        )}
      </div>
    </div>
  );
};
