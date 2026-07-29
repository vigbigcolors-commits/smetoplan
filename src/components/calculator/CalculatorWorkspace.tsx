'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import {
  calculateMaterials,
  DEFAULT_PRICES,
  formatCurrency,
} from '@/lib/calculator';
import type {
  ConcreteSpec,
  Currency,
  DimensionState,
  LayoutFlags,
  MaterialPrices,
  RebarSpec,
  StructureType,
  UnitSystem,
} from '@/lib/types';
import { InputWorkspace } from './InputWorkspace';
import { CadViewer3D } from './CadViewer3D';
import { FoundationSvgBlueprint } from './FoundationSvgBlueprint';
import { BomTable } from './BomTable';
import { PresetSelector } from './PresetSelector';
import { ContractorOffersGlass } from './ContractorOffersGlass';
import { QuoteModal } from './QuoteModal';
import { AiEngineerReport } from './AiEngineerReport';
import { RsyAdSlot } from '@/components/ads/RsyAdSlot';
import { PseoLayoutClassic } from '@/components/layouts/PseoLayoutClassic';
import { PseoLayoutSplit } from '@/components/layouts/PseoLayoutSplit';
import { PseoLayoutCadFirst } from '@/components/layouts/PseoLayoutCadFirst';
import { PseoLayoutCompact } from '@/components/layouts/PseoLayoutCompact';
import { PseoLayoutGuide } from '@/components/layouts/PseoLayoutGuide';

export interface CalculatorInitialState {
  structureType: StructureType;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  h1: string;
  description: string;
  flags: LayoutFlags;
}

interface CalculatorWorkspaceProps {
  initial: CalculatorInitialState;
}

export function CalculatorWorkspace({ initial }: CalculatorWorkspaceProps) {
  const [structureType, setStructureType] = useState(initial.structureType);
  const [unitSystem] = useState<UnitSystem>('metric');
  const [currency] = useState<Currency>('RUB');
  const [dimensions, setDimensions] = useState(initial.dimensions);
  const [concreteSpec, setConcreteSpec] = useState(initial.concreteSpec);
  const [rebarSpec, setRebarSpec] = useState(initial.rebarSpec);
  const [prices, setPrices] = useState<MaterialPrices>(DEFAULT_PRICES);
  const [safetyFactor, setSafetyFactor] = useState(1.15);
  const [adReloadToken, setAdReloadToken] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const showRebarBlock =
    initial.flags.showRebar && rebarSpec.layers > 0 && rebarSpec.diameterMm > 0;

  const calculation = useMemo(
    () =>
      calculateMaterials(
        structureType,
        dimensions,
        concreteSpec,
        rebarSpec,
        prices,
        unitSystem,
        safetyFactor
      ),
    [
      structureType,
      dimensions,
      concreteSpec,
      rebarSpec,
      prices,
      unitSystem,
      safetyFactor,
    ]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  /** Safe ad reload: ONLY on explicit user recalculation click */
  const handleRecalculate = () => {
    startTransition(() => {
      setAdReloadToken((t) => t + 1);
      showToast('Схема и смета пересчитаны · реклама обновлена по клику');
    });
  };

  const handleSelectPreset = (type: StructureType) => {
    setStructureType(type);
    if (type === 'slab') {
      setDimensions({
        length: 12,
        width: 8.5,
        depth: 0.4,
        perimeterThickeningWidth: 0.5,
        perimeterThickeningDepth: 0.3,
      });
      setRebarSpec({ diameterMm: 12, spacingMm: 200, layers: 2, customPricePerTon: 0 });
    } else if (type === 'strip') {
      setDimensions({
        length: 15,
        width: 10,
        depth: 1.0,
        perimeterThickeningWidth: 0.4,
        perimeterThickeningDepth: 0,
      });
      setRebarSpec({ diameterMm: 14, spacingMm: 150, layers: 2, customPricePerTon: 0 });
    } else if (type === 'beam') {
      setDimensions({
        length: 6,
        width: 0.4,
        depth: 0.6,
        perimeterThickeningWidth: 0,
        perimeterThickeningDepth: 0,
      });
      setRebarSpec({ diameterMm: 16, spacingMm: 150, layers: 3, customPricePerTon: 0 });
    } else if (type === 'pier') {
      setDimensions({
        length: 10,
        width: 8,
        depth: 1.2,
        perimeterThickeningWidth: 0.4,
        perimeterThickeningDepth: 0.4,
      });
      setRebarSpec({ diameterMm: 12, spacingMm: 200, layers: 1, customPricePerTon: 0 });
    } else {
      setDimensions({
        length: 10,
        width: 0.3,
        depth: 2.5,
        perimeterThickeningWidth: 0,
        perimeterThickeningDepth: 0,
      });
      setRebarSpec({ diameterMm: 12, spacingMm: 150, layers: 2, customPricePerTon: 0 });
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Smetoplan — Ведомость материалов'],
      ['Тип', structureType],
      ['Марка', concreteSpec.grade],
      ['Габариты', `${dimensions.length}x${dimensions.width}x${dimensions.depth}`],
      ['Бетон м3', String(calculation.concreteVolumeM3)],
      ['Арматура кг', String(calculation.rebarWeightKg)],
      ['Итого RUB', String(calculation.itemizedCosts.total)],
    ];
    const blob = new Blob([rows.map((r) => r.join(';')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smetoplan_${structureType}_smeta.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV экспортирован');
  };

  const inputPanel = (
    <div className="flex flex-col gap-4">
      <InputWorkspace
        structureType={structureType}
        dimensions={dimensions}
        onDimensionsChange={setDimensions}
        concreteSpec={concreteSpec}
        onConcreteSpecChange={setConcreteSpec}
        rebarSpec={
          showRebarBlock
            ? rebarSpec
            : { ...rebarSpec, layers: 0, diameterMm: 0 }
        }
        onRebarSpecChange={setRebarSpec}
        prices={prices}
        onPricesChange={setPrices}
        unitSystem={unitSystem}
        safetyFactor={safetyFactor}
        onSafetyFactorChange={setSafetyFactor}
      />
      <button
        type="button"
        onClick={handleRecalculate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F5A8E] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#174771]"
      >
        <RefreshCw className="h-4 w-4" />
        Пересчитать схему и обновить смету
      </button>
    </div>
  );

  const svgPanel = (
    <FoundationSvgBlueprint
      structureType={structureType}
      dimensions={dimensions}
      rebarSpec={rebarSpec}
      showRebar={showRebarBlock}
      soilPressureKpa={calculation.soilPressureKpa}
    />
  );

  const cadPanel = initial.flags.showCad ? (
    <CadViewer3D
      structureType={structureType}
      dimensions={dimensions}
      rebarSpec={
        showRebarBlock
          ? { ...rebarSpec, layers: Math.max(1, rebarSpec.layers) as 1 | 2 | 3 }
          : { ...rebarSpec, layers: 1, diameterMm: 8 }
      }
      unitSystem={unitSystem}
      soilPressureKpa={calculation.soilPressureKpa}
    />
  ) : null;

  const statsStrip = (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-[#F4F4F5] p-3 font-mono text-xs sm:grid-cols-4">
      <div>
        <span className="block text-[10px] text-slate-500">Объём бетона</span>
        <span className="text-sm font-extrabold text-[#0F172A]">
          {calculation.concreteVolumeM3} м³
        </span>
      </div>
      <div>
        <span className="block text-[10px] text-slate-500">
          Арматура {showRebarBlock ? `Ø${rebarSpec.diameterMm}` : '—'}
        </span>
        <span className="text-sm font-extrabold text-[#1F5A8E]">
          {showRebarBlock ? `${calculation.rebarWeightKg} кг` : 'не требуется'}
        </span>
      </div>
      <div>
        <span className="block text-[10px] text-slate-500">Давление на грунт</span>
        <span className="text-sm font-extrabold text-sky-700">
          {calculation.soilPressureKpa} кПа
        </span>
      </div>
      <div>
        <span className="block text-[10px] text-slate-500">Итого материалы</span>
        <span className="text-sm font-extrabold text-emerald-700">
          {formatCurrency(calculation.itemizedCosts.total, currency)}
        </span>
      </div>
    </div>
  );

  const bomBlock = initial.flags.showBom ? (
    <BomTable
      calculation={calculation}
      concreteSpec={concreteSpec}
      rebarSpec={
        showRebarBlock
          ? { ...rebarSpec, layers: Math.max(1, rebarSpec.layers) as 1 | 2 | 3 }
          : { diameterMm: 0, spacingMm: 0, layers: 1, customPricePerTon: 0 }
      }
      currency={currency}
      onSaveProject={() => showToast('Параметры сохранены локально')}
      onExportCsv={handleExportCsv}
      onPrint={() => window.print()}
    />
  ) : null;

  const contractorsBlock = initial.flags.showContractors ? (
    <ContractorOffersGlass
      currency={currency}
      onRequestQuote={() => setIsQuoteOpen(true)}
    />
  ) : null;

  const aiBlock = initial.flags.showAi ? (
    <div id="ai-report-section">
      <AiEngineerReport
        structureType={structureType}
        dimensions={dimensions}
        concreteSpec={concreteSpec}
        rebarSpec={
          showRebarBlock
            ? { ...rebarSpec, layers: Math.max(1, rebarSpec.layers) as 1 | 2 | 3 }
            : { diameterMm: 8, spacingMm: 200, layers: 1, customPricePerTon: 0 }
        }
        calculation={calculation}
        soilPressureKpa={calculation.soilPressureKpa}
        safetyFactor={safetyFactor}
      />
    </div>
  ) : null;

  const adBlock = (
    <RsyAdSlot slotKey="calc-mid" reloadToken={adReloadToken} minHeight={140} />
  );

  const layoutProps = {
    h1: initial.h1,
    description: initial.description,
    preset: (
      <PresetSelector selectedType={structureType} onSelectType={handleSelectPreset} />
    ),
    inputPanel,
    svgPanel,
    cadPanel,
    statsStrip,
    bomBlock,
    contractorsBlock,
    aiBlock,
    adBlock,
    showRebarBlock,
  };

  const variant = initial.flags.layoutVariant;

  return (
    <div className="pb-16">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 font-mono text-xs font-bold text-white shadow-2xl">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {variant === 1 && <PseoLayoutClassic {...layoutProps} />}
      {variant === 2 && <PseoLayoutSplit {...layoutProps} />}
      {variant === 3 && <PseoLayoutCadFirst {...layoutProps} />}
      {variant === 4 && <PseoLayoutCompact {...layoutProps} />}
      {variant === 5 && <PseoLayoutGuide {...layoutProps} />}

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        calculation={calculation}
        currency={currency}
      />
    </div>
  );
}
