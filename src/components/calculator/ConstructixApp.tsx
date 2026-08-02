'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StructureType,
  UnitSystem,
  Currency,
  DimensionState,
  ConcreteSpec,
  RebarSpec,
  MaterialPrices,
} from '@/lib/types';
import { calculateMaterials, type CalcMode, type SnowRegionId, type StripLayoutMode } from '@/lib/calculator';
import { Header } from '@/components/calculator/Header';
import { PresetSelector } from '@/components/calculator/PresetSelector';
import { InputWorkspace } from '@/components/calculator/InputWorkspace';
import { CadViewerLazy } from '@/components/calculator/CadViewerLazy';
import { BomTable } from '@/components/calculator/BomTable';
import { RegionalSupplyPanel } from '@/components/calculator/RegionalSupplyPanel';
import { SiteFooter } from '@/components/site/SiteChrome';
import { QuoteModal } from '@/components/calculator/QuoteModal';
import { BlueprintWorkbench } from '@/components/calculator/BlueprintWorkbench';
import { EngineeringChecksPanel } from '@/components/calculator/EngineeringChecksPanel';
import { RebarScheduleTable } from '@/components/calculator/RebarScheduleTable';
import { StructureComparePanel } from '@/components/calculator/StructureComparePanel';
import { FormworkBomPanel } from '@/components/calculator/FormworkBomPanel';
import { BuyTomorrowPanel } from '@/components/calculator/BuyTomorrowPanel';
import { PourSchedulePanel } from '@/components/calculator/PourSchedulePanel';
import { SensitivityPanel } from '@/components/calculator/SensitivityPanel';
import { BrigadeNodeSheet } from '@/components/calculator/BrigadeNodeSheet';
import { AcceptancePanel } from '@/components/calculator/AcceptancePanel';
import { ToolsRail } from '@/components/calculator/ui/ToolsRail';
import { LiveKpiStrip } from '@/components/calculator/ui/LiveKpiStrip';
import { HardHatAssistant } from '@/components/calculator/HardHatAssistant';
import { HelperPromoBanner } from '@/components/calculator/HelperPromoBanner';
import { BackToTop } from '@/components/calculator/ui/BackToTop';
import { WorkStatusPanel } from '@/components/calculator/WorkStatusPanel';
import { SitePipeline } from '@/components/calculator/SitePipeline';
import { ResultsReveal } from '@/components/calculator/ResultsReveal';
import type { AiCalcPatch, AiSuggestion } from '@/lib/ai/types';
import { OPEN_QUOTE_EVENT } from '@/lib/rbu-spec';
import { DOWNLOAD_BOM_CSV_EVENT } from '@/lib/site-events';
import {
  CheckCircle,
} from 'lucide-react';
import type { ConstructixInitialState } from '@/lib/types';
import {
  COVER_DEFAULT_MM,
  PRICE_REGIONS,
  getSoilType,
  type SoilTypeId,
  type PriceRegionId,
} from '@/domain/norms/tables';
import { getRegionalPrices } from '@/domain/markets';
import { getStructurePreset } from '@/lib/calculator-routes';
import { buildRectangleStripPlan, type StripPlan } from '@/domain/geometry';
import { computeFormworkBom } from '@/domain/formwork';
import { TrustSourcesNote } from '@/components/pseo/TrustSourcesNote';
import {
  loadCalculatorDraft,
  saveCalculatorDraft,
} from '@/lib/calculator-draft';

const slabPreset = getStructurePreset('slab');
const defaultRegion: PriceRegionId = 'moscow';

const DEFAULT_STATE: ConstructixInitialState = {
  structureType: slabPreset.structureType,
  dimensions: slabPreset.dimensions,
  concreteSpec: {
    ...slabPreset.concreteSpec,
    customPricePerM3: PRICE_REGIONS[defaultRegion].prices.concretePerM3,
  },
  rebarSpec: {
    ...slabPreset.rebarSpec,
    customPricePerTon: PRICE_REGIONS[defaultRegion].prices.rebarPerTon,
  },
  prices: getRegionalPrices(defaultRegion),
  safetyFactor: 1.15,
};

export default function ConstructixApp({
  initial,
}: {
  initial?: ConstructixInitialState;
}) {
  const boot = { ...DEFAULT_STATE, ...initial };
  const deferHeavy = Boolean(boot.deferHeavyUi);
  // Application State
  const [structureType, setStructureType] = useState<StructureType>(boot.structureType);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [currency, setCurrency] = useState<Currency>('RUB');

  // Dimensions state
  const [dimensions, setDimensions] = useState<DimensionState>(boot.dimensions);

  // Concrete & Rebar Specs
  const [concreteSpec, setConcreteSpec] = useState<ConcreteSpec>(boot.concreteSpec);

  const [rebarSpec, setRebarSpec] = useState<RebarSpec>(boot.rebarSpec);

  // Prices State
  const [prices, setPrices] = useState<MaterialPrices>(
    boot.prices ?? DEFAULT_STATE.prices!
  );

  const [safetyFactor, setSafetyFactor] = useState<number>(
    boot.safetyFactor ?? 1.15
  );
  const [calcMode, setCalcMode] = useState<CalcMode>('estimate');
  const [stripLayout, setStripLayout] = useState<StripLayoutMode>('perimeter_plus_one');
  const [stripInnerLong, setStripInnerLong] = useState(1);
  const [stripInnerCross, setStripInnerCross] = useState(0);
  const [stripPlan, setStripPlan] = useState<StripPlan>(() =>
    buildRectangleStripPlan(
      boot.dimensions.length,
      boot.dimensions.width,
      1,
      0
    )
  );
  const [stripPlanCustom, setStripPlanCustom] = useState(false);
  const [pierSpacingM, setPierSpacingM] = useState(2.5);
  const [coverMm, setCoverMm] = useState(COVER_DEFAULT_MM);
  const [stockLengthM, setStockLengthM] = useState(11.7);
  const [buildingDeadLoadKpa, setBuildingDeadLoadKpa] = useState(0);
  const [liveLoadKpa, setLiveLoadKpa] = useState(0);
  const [priceRegionId, setPriceRegionId] = useState<PriceRegionId>(() => {
    const id = boot.priceRegionId;
    if (id && id in PRICE_REGIONS) return id as PriceRegionId;
    return defaultRegion;
  });
  const bootRegion: PriceRegionId =
    boot.priceRegionId && boot.priceRegionId in PRICE_REGIONS
      ? (boot.priceRegionId as PriceRegionId)
      : defaultRegion;
  const bootSoil: SoilTypeId = PRICE_REGIONS[bootRegion].soilDefaultId;
  const [snowRegion, setSnowRegion] = useState<SnowRegionId>(
    PRICE_REGIONS[bootRegion].snowDefault as SnowRegionId
  );
  const [applySnow, setApplySnow] = useState(false);
  const [soilTypeId, setSoilTypeId] = useState<SoilTypeId>(bootSoil);
  const [soilResistanceKpa, setSoilResistanceKpa] = useState<number>(
    getSoilType(bootSoil).rKpa
  );
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [cenyMedianBusy, setCenyMedianBusy] = useState(false);
  const [cenyMedianHint, setCenyMedianHint] = useState<string | null>(null);
  const exportCsvRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const openQuote = () => setIsQuoteModalOpen(true);
    const downloadCsv = () => exportCsvRef.current();
    window.addEventListener(OPEN_QUOTE_EVENT, openQuote);
    window.addEventListener(DOWNLOAD_BOM_CSV_EVENT, downloadCsv);
    return () => {
      window.removeEventListener(OPEN_QUOTE_EVENT, openQuote);
      window.removeEventListener(DOWNLOAD_BOM_CSV_EVENT, downloadCsv);
    };
  }, []);

  // Restore last calculator settings after refresh
  useEffect(() => {
    const draft = loadCalculatorDraft();
    if (draft) {
      setStructureType(draft.structureType);
      setUnitSystem(draft.unitSystem);
      setCurrency(draft.currency);
      setDimensions(draft.dimensions);
      setConcreteSpec(draft.concreteSpec);
      setRebarSpec(draft.rebarSpec);
      setPrices(draft.prices);
      setSafetyFactor(draft.safetyFactor);
      setCalcMode(draft.calcMode);
      setStripLayout(draft.stripLayout);
      setStripInnerLong(draft.stripInnerLong);
      setStripInnerCross(draft.stripInnerCross);
      setStripPlan(draft.stripPlan);
      setStripPlanCustom(draft.stripPlanCustom);
      setPierSpacingM(draft.pierSpacingM);
      setCoverMm(draft.coverMm);
      setStockLengthM(draft.stockLengthM);
      setBuildingDeadLoadKpa(draft.buildingDeadLoadKpa);
      setLiveLoadKpa(draft.liveLoadKpa);
      setPriceRegionId(draft.priceRegionId);
      setSnowRegion(draft.snowRegion);
      setApplySnow(draft.applySnow);
      setSoilTypeId(draft.soilTypeId);
      setSoilResistanceKpa(draft.soilResistanceKpa);
    }
    setDraftReady(true);
  }, []);

  // Wall: если подошва не задана (старый черновик / 0) — синхронизируем state с верхом,
  // чтобы инпут не показывал «фантом», а ядро видело реальное число. Трапеция = пользователь
  // увеличит подошву вручную (напр. 0.5 при верхе 0.3).
  useEffect(() => {
    if (!draftReady || structureType !== 'wall') return;
    setDimensions((prev) => {
      if (prev.perimeterThickeningWidth > 0) return prev;
      return { ...prev, perimeterThickeningWidth: Math.max(0.15, prev.width) };
    });
  }, [draftReady, structureType]);

  // Autosave settings so refresh never wipes inputs
  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      saveCalculatorDraft({
        structureType,
        unitSystem,
        currency,
        dimensions,
        concreteSpec,
        rebarSpec,
        prices,
        safetyFactor,
        calcMode,
        stripLayout,
        stripInnerLong,
        stripInnerCross,
        stripPlan,
        stripPlanCustom,
        pierSpacingM,
        coverMm,
        stockLengthM,
        buildingDeadLoadKpa,
        liveLoadKpa,
        priceRegionId,
        snowRegion,
        applySnow,
        soilTypeId,
        soilResistanceKpa,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    structureType,
    unitSystem,
    currency,
    dimensions,
    concreteSpec,
    rebarSpec,
    prices,
    safetyFactor,
    calcMode,
    stripLayout,
    stripInnerLong,
    stripInnerCross,
    stripPlan,
    stripPlanCustom,
    pierSpacingM,
    coverMm,
    stockLengthM,
    buildingDeadLoadKpa,
    liveLoadKpa,
    priceRegionId,
    snowRegion,
    applySnow,
    soilTypeId,
    soilResistanceKpa,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const persistNow = () => {
    saveCalculatorDraft({
      structureType,
      unitSystem,
      currency,
      dimensions,
      concreteSpec,
      rebarSpec,
      prices,
      safetyFactor,
      calcMode,
      stripLayout,
      stripInnerLong,
      stripInnerCross,
      stripPlan,
      stripPlanCustom,
      pierSpacingM,
      coverMm,
      stockLengthM,
      buildingDeadLoadKpa,
      liveLoadKpa,
      priceRegionId,
      snowRegion,
      applySnow,
      soilTypeId,
      soilResistanceKpa,
    });
  };

  // Switch presets helper
  const handleSelectPreset = (type: StructureType) => {
    const preset = getStructurePreset(type);
    setStructureType(preset.structureType);
    setDimensions(preset.dimensions);
    setConcreteSpec(preset.concreteSpec);
    setRebarSpec(preset.rebarSpec);
    if (type === 'strip') {
      setStripPlanCustom(false);
      setStripPlan(
        buildRectangleStripPlan(preset.dimensions.length, preset.dimensions.width, 1, 0)
      );
      setStripLayout('perimeter_plus_one');
      setStripInnerLong(1);
      setStripInnerCross(0);
    }
  };

  const syncStripPlanFromAxes = (
    length: number,
    width: number,
    long: number,
    cross: number,
    force = false
  ) => {
    if (!stripPlanCustom || force) {
      setStripPlan(buildRectangleStripPlan(length, width, long, cross));
      if (force) setStripPlanCustom(false);
    }
  };

  const handlePriceRegionChange = (regionId: PriceRegionId) => {
    setPriceRegionId(regionId);
    const meta = PRICE_REGIONS[regionId];
    const nextPrices = getRegionalPrices(regionId);
    setPrices(nextPrices);
    setConcreteSpec((prev) => ({
      ...prev,
      customPricePerM3: nextPrices.concretePerM3,
    }));
    setRebarSpec((prev) => ({
      ...prev,
      customPricePerTon: nextPrices.rebarPerTon,
    }));
    setSnowRegion(meta.snowDefault as SnowRegionId);
    setSoilTypeId(meta.soilDefaultId);
    setSoilResistanceKpa(getSoilType(meta.soilDefaultId).rKpa);
    setCenyMedianHint(null);
  };

  const applyCenyMedian = async () => {
    setCenyMedianBusy(true);
    try {
      const res = await fetch(
        `/api/market/median?region=${encodeURIComponent(priceRegionId)}`
      );
      const json = await res.json();
      if (!res.ok || !json?.prices) throw new Error(json?.error || 'median fail');
      const next = {
        concretePerM3: Number(json.prices.concretePerM3),
        rebarPerTon: Number(json.prices.rebarPerTon),
        formworkPerM2: Number(json.prices.formworkPerM2),
        sandPerTon: Number(json.prices.sandPerTon),
        gravelPerTon: Number(json.prices.gravelPerTon),
      };
      setPrices(next);
      setConcreteSpec((prev) => ({
        ...prev,
        customPricePerM3: next.concretePerM3,
      }));
      setRebarSpec((prev) => ({
        ...prev,
        customPricePerTon: next.rebarPerTon,
      }));
      setCenyMedianHint(
        `Медиана /ceny на ${json.asOf} · бетон ${next.concretePerM3} ₽/м³ · арматура ${next.rebarPerTon} ₽/т (±15–25%, не КП)`
      );
      showToast('Подставлена средняя цена с /ceny');
    } catch {
      setCenyMedianHint('Не удалось загрузить медиану — оставлены текущие цены');
    } finally {
      setCenyMedianBusy(false);
    }
  };

  const calcOptions = useMemo(
    () => ({
      stripLayout,
      stripInnerLong,
      stripInnerCross,
      pierSpacingM,
      coverMm,
      stockLengthM,
      buildingDeadLoadKpa,
      liveLoadKpa,
      snowRegion,
      applySnow,
      soilResistanceKpa,
      soilTypeId,
      stripPlan: structureType === 'strip' ? stripPlan : null,
    }),
    [
      stripLayout,
      stripInnerLong,
      stripInnerCross,
      pierSpacingM,
      coverMm,
      stockLengthM,
      buildingDeadLoadKpa,
      liveLoadKpa,
      snowRegion,
      applySnow,
      soilResistanceKpa,
      soilTypeId,
      stripPlan,
      structureType,
    ]
  );

  // Real-time calculation engine
  const calculation = useMemo(() => {
    return calculateMaterials(
      structureType,
      dimensions,
      concreteSpec,
      rebarSpec,
      prices,
      unitSystem,
      safetyFactor,
      calcOptions
    );
  }, [
    structureType,
    dimensions,
    concreteSpec,
    rebarSpec,
    prices,
    unitSystem,
    safetyFactor,
    calcOptions,
  ]);

  const formworkBom = useMemo(
    () =>
      computeFormworkBom({
        structureType,
        formworkAreaM2: calculation.formworkAreaM2,
        depthM: dimensions.depth,
        stripLengthM: calculation.stripLengthM,
        formworkPricePerM2: prices.formworkPerM2,
      }),
    [
      structureType,
      calculation.formworkAreaM2,
      dimensions.depth,
      calculation.stripLengthM,
      prices.formworkPerM2,
    ]
  );

  // Handle Export PDF / Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Export CSV — literate BOM for warehouse / RBU
  const handleExportCsv = () => {
    const sep = ';';
    const rows: string[][] = [
      ['Smetoplan — ведомость материалов'],
      ['Регион', PRICE_REGIONS[priceRegionId].label],
      ['Тип конструкции', structureType],
      ['Габариты Д×Ш×В, м', `${dimensions.length}×${dimensions.width}×${dimensions.depth}`],
      ['Марка бетона', concreteSpec.grade],
      ['Класс (ориентир)', calculation.concreteClassB],
      ['Запас объёма', String(safetyFactor)],
      ['Защитный слой a, мм', String(calculation.coverMm)],
      ['Нахлёст ориентир, мм', String(calculation.lapMm)],
      [],
      ['Позиция', 'Кол-во', 'Ед.', 'Примечание'],
      [
        'Бетон',
        String(calculation.concreteVolumeM3),
        'м³',
        `${concreteSpec.grade} / ${calculation.concreteClassB}`,
      ],
      ['Цемент (мешки)', String(calculation.cementBags), 'шт', `${concreteSpec.cementBagKg} кг`],
      ['Песок', String(calculation.sandTons), 'т', 'самозамес — ориентир'],
      ['Щебень', String(calculation.gravelTons), 'т', 'самозамес — ориентир'],
      [
        `Арматура Ø${rebarSpec.diameterMm}`,
        String(calculation.rebarWeightKg),
        'кг',
        `хлыстов ≈ ${calculation.rebarStockBarsApprox}, L=${calculation.rebarStockLengthM} м, отход ${calculation.rebarWastePct}%`,
      ],
      ['Проволока вязальная', String(calculation.bindingWireKg), 'кг', ''],
      ['Опалубка (площадь боков)', String(calculation.formworkAreaM2), 'м²', 'ориентир'],
      ['Пиломатериал ориентир', String(calculation.timberVolumeM3), 'м³', ''],
      [],
      ['Раскрой: марка', 'назначение', 'Ø мм', 'L мм', 'N', 'масса кг'],
      ...calculation.rebarPieces.map((p) => [
        p.mark,
        p.role,
        String(p.diameterMm),
        String(p.lengthMm),
        String(p.count),
        String(Math.round(p.weightKg * 10) / 10),
      ]),
      [],
      ['σ грунта, кПа', String(calculation.soilPressureKpa)],
      ['R ввод, кПа', String(calculation.soilResistanceKpa)],
      ['Использование R, %', String(calculation.soilUtilizationPct)],
      [
        'Ориентир сметы материалов',
        String(calculation.itemizedCosts.total),
        currency,
        'не оферта РБУ',
      ],
      [],
      [
        'Дисклеймер',
        'Файл построен из расчёта Smetoplan. Не заменяет КЖ, ИГИ и договор с поставщиком.',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(sep)).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smetoplan_${structureType}_vedomost.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Ведомость CSV скачана');
  };
  exportCsvRef.current = handleExportCsv;

  const applyAiSuggestion = (s: AiSuggestion) => {
    if (s.scrollTo) {
      document.getElementById(s.scrollTo)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      if (!s.field) showToast(s.label);
    }
    if (s.field === 'structureType' && typeof s.value === 'string') {
      const t = s.value as StructureType;
      if (['slab', 'strip', 'beam', 'pier', 'wall'].includes(t)) {
        setStructureType(t);
        showToast(`Тип → ${t}`);
      }
      return;
    }
    const n = typeof s.value === 'number' ? s.value : Number(s.value);
    if (!Number.isFinite(n) && s.field && s.field !== 'structureType') return;

    if (s.field === 'coverMm') {
      setCoverMm(n);
      showToast(`Защитный слой → ${n} мм`);
      return;
    }
    if (s.field === 'safetyFactor') {
      setSafetyFactor(n);
      showToast(`Запас объёма → ${Math.round((n - 1) * 100)}%`);
      return;
    }
    if (s.field === 'spacingMm') {
      setRebarSpec((prev) => ({ ...prev, spacingMm: n }));
      showToast(`Шаг сетки → ${n} мм`);
      return;
    }
    if (s.field === 'diameterMm') {
      setRebarSpec((prev) => ({ ...prev, diameterMm: n }));
      showToast(`Диаметр → Ø${n}`);
      return;
    }
    if (s.field === 'layers' && (n === 1 || n === 2 || n === 3)) {
      setRebarSpec((prev) => ({ ...prev, layers: n }));
      showToast(`Слоёв → ${n}`);
      return;
    }
    if (s.field === 'soilResistanceKpa') {
      setSoilResistanceKpa(n);
      showToast(`R грунта → ${n} кПа`);
      return;
    }
    if (s.field === 'stockLengthM') {
      setStockLengthM(n);
      showToast(`Хлыст → ${n} м`);
      return;
    }
    if (s.field === 'lengthM') {
      setDimensions((prev) => ({ ...prev, length: n }));
      showToast(`Длина → ${n} м`);
      return;
    }
    if (s.field === 'widthM') {
      setDimensions((prev) => ({ ...prev, width: n }));
      showToast(`Ширина → ${n} м`);
      return;
    }
    if (s.field === 'depthM') {
      setDimensions((prev) => ({ ...prev, depth: n }));
      showToast(`Толщина → ${n} м`);
      return;
    }
    if (s.field === 'ribWidthM') {
      setDimensions((prev) => ({ ...prev, perimeterThickeningWidth: n }));
      showToast(`Ребро ширина → ${n} м`);
      return;
    }
    if (s.field === 'ribDepthM') {
      setDimensions((prev) => ({ ...prev, perimeterThickeningDepth: n }));
      showToast(`Ребро высота → ${n} м`);
      return;
    }
    if (!s.scrollTo && !s.field) {
      showToast(s.label);
    }
  };

  const applyAiPatch = (patch: AiCalcPatch) => {
    if (patch.structureType) setStructureType(patch.structureType);
    setDimensions((prev) => ({
      ...prev,
      ...(patch.lengthM != null ? { length: patch.lengthM } : {}),
      ...(patch.widthM != null ? { width: patch.widthM } : {}),
      ...(patch.depthM != null ? { depth: patch.depthM } : {}),
      ...(patch.ribWidthM != null
        ? { perimeterThickeningWidth: patch.ribWidthM }
        : {}),
      ...(patch.ribDepthM != null
        ? { perimeterThickeningDepth: patch.ribDepthM }
        : {}),
    }));
    if (
      patch.diameterMm != null ||
      patch.spacingMm != null ||
      patch.layers != null ||
      patch.longitudinalBars != null
    ) {
      setRebarSpec((prev) => ({
        ...prev,
        ...(patch.diameterMm != null ? { diameterMm: patch.diameterMm } : {}),
        ...(patch.spacingMm != null ? { spacingMm: patch.spacingMm } : {}),
        ...(patch.layers != null ? { layers: patch.layers } : {}),
        ...(patch.longitudinalBars != null
          ? { longitudinalBars: patch.longitudinalBars }
          : {}),
      }));
    }
    if (patch.concreteGrade) {
      setConcreteSpec((prev) => ({ ...prev, grade: patch.concreteGrade! }));
    }
    if (patch.coverMm != null) setCoverMm(patch.coverMm);
    if (patch.safetyFactor != null) setSafetyFactor(patch.safetyFactor);
    if (patch.stockLengthM != null) setStockLengthM(patch.stockLengthM);
    showToast('HELPER проставил параметры в калькулятор');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F4F7FA_0%,#FFFFFF_28%,#F8FAFC_100%)] text-slate-900 font-sans selection:bg-[#1F5A8E] selection:text-white pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(61,100,148,0.12),_transparent_60%)]" />
      {toastMessage && (
        <div className="tool-panel fixed bottom-20 right-5 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-xs font-mono font-bold text-white shadow-2xl">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        unitSystem={unitSystem}
        onUnitSystemChange={(u) => {
          setUnitSystem(u);
          // Convert length/width/depth visually if changing system
          if (u === 'imperial' && unitSystem === 'metric') {
            setDimensions({
              length: Math.round(dimensions.length * 3.28084 * 10) / 10,
              width: Math.round(dimensions.width * 3.28084 * 10) / 10,
              depth: Math.round(dimensions.depth * 3.28084 * 10) / 10,
              perimeterThickeningWidth: 1.5,
              perimeterThickeningDepth: 1.0,
            });
          } else if (u === 'metric' && unitSystem === 'imperial') {
            setDimensions({
              length: Math.round((dimensions.length / 3.28084) * 10) / 10,
              width: Math.round((dimensions.width / 3.28084) * 10) / 10,
              depth: Math.round((dimensions.depth / 3.28084) * 10) / 10,
              perimeterThickeningWidth: 0.5,
              perimeterThickeningDepth: 0.3,
            });
          }
        }}
        currency={currency}
        onCurrencyChange={setCurrency}
        onRunAiAnalysis={() => setHelperOpen(true)}
        onOpenHelper={() => setHelperOpen(true)}
        onExportPdf={handlePrint}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <HelperPromoBanner onOpenHelper={() => setHelperOpen(true)} />

        {(boot.h1 || boot.description) && (
          <header className="mb-6">
            {boot.h1 && (
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
                {boot.h1}
              </h1>
            )}
            {boot.description && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                {boot.description}
              </p>
            )}
          </header>
        )}
        {/* Preset Selector */}
        <PresetSelector
          selectedType={structureType}
          onSelectType={handleSelectPreset}
        />

        {/* 1. Split-Screen Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: input controls */}
          <div id="site-params" className="lg:col-span-5 scroll-mt-28">
            <InputWorkspace
              structureType={structureType}
              dimensions={dimensions}
              onDimensionsChange={(dims) => {
                setDimensions(dims);
                syncStripPlanFromAxes(
                  dims.length,
                  dims.width,
                  stripInnerLong,
                  stripInnerCross
                );
              }}
              concreteSpec={concreteSpec}
              onConcreteSpecChange={setConcreteSpec}
              rebarSpec={rebarSpec}
              onRebarSpecChange={setRebarSpec}
              prices={prices}
              onPricesChange={setPrices}
              onApplyCenyMedian={applyCenyMedian}
              cenyMedianBusy={cenyMedianBusy}
              cenyMedianHint={cenyMedianHint}
              unitSystem={unitSystem}
              safetyFactor={safetyFactor}
              onSafetyFactorChange={setSafetyFactor}
              calcMode={calcMode}
              onCalcModeChange={(mode) => {
                setCalcMode(mode);
                if (mode === 'checks') {
                  window.setTimeout(() => {
                    document
                      .getElementById('bom-estimate-total')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 80);
                }
              }}
              stripLayout={stripLayout}
              onStripLayoutChange={(mode) => {
                setStripLayout(mode);
                let long = stripInnerLong;
                let cross = stripInnerCross;
                if (mode === 'perimeter') {
                  long = 0;
                  cross = 0;
                } else if (mode === 'perimeter_plus_one') {
                  long = 1;
                  cross = 0;
                } else if (mode === 'perimeter_plus_cross') {
                  long = 1;
                  cross = 1;
                }
                setStripInnerLong(long);
                setStripInnerCross(cross);
                syncStripPlanFromAxes(
                  dimensions.length,
                  dimensions.width,
                  long,
                  cross,
                  true
                );
              }}
              stripInnerLong={stripInnerLong}
              onStripInnerLongChange={(v) => {
                setStripInnerLong(v);
                setStripLayout('custom');
                syncStripPlanFromAxes(dimensions.length, dimensions.width, v, stripInnerCross, true);
              }}
              stripInnerCross={stripInnerCross}
              onStripInnerCrossChange={(v) => {
                setStripInnerCross(v);
                setStripLayout('custom');
                syncStripPlanFromAxes(dimensions.length, dimensions.width, stripInnerLong, v, true);
              }}
              stripPlan={stripPlan}
              stripPlanCustom={stripPlanCustom}
              onStripPlanChange={(plan, custom) => {
                setStripPlan(plan);
                setStripPlanCustom(custom);
              }}
              pierSpacingM={pierSpacingM}
              onPierSpacingMChange={setPierSpacingM}
              coverMm={coverMm}
              onCoverMmChange={setCoverMm}
              buildingDeadLoadKpa={buildingDeadLoadKpa}
              onBuildingDeadLoadKpaChange={setBuildingDeadLoadKpa}
              liveLoadKpa={liveLoadKpa}
              onLiveLoadKpaChange={setLiveLoadKpa}
              snowRegion={snowRegion}
              onSnowRegionChange={setSnowRegion}
              applySnow={applySnow}
              onApplySnowChange={setApplySnow}
              soilResistanceKpa={soilResistanceKpa}
              onSoilResistanceKpaChange={setSoilResistanceKpa}
              soilTypeId={soilTypeId}
              onSoilTypeIdChange={setSoilTypeId}
              priceRegionId={priceRegionId}
              onPriceRegionIdChange={handlePriceRegionChange}
            />
          </div>

          {/* Right Column: CAD workbench (sticky off on PSEO for LCP) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-3 ${
              deferHeavy ? '' : 'lg:sticky lg:top-24 lg:self-start'
            }`}
          >
            <BlueprintWorkbench
              structureType={structureType}
              dimensions={dimensions}
              rebarSpec={rebarSpec}
              calculation={calculation}
              coverMm={coverMm}
              onCoverMmChange={setCoverMm}
              stockLengthM={stockLengthM}
              onStockLengthMChange={setStockLengthM}
            />

            <CadViewerLazy
              structureType={structureType}
              dimensions={dimensions}
              rebarSpec={rebarSpec}
              unitSystem={unitSystem}
              soilPressureKpa={calculation.soilPressureKpa}
              deferUntilVisible={deferHeavy}
            />

            <LiveKpiStrip
              calculation={calculation}
              currency={currency}
              diameterMm={rebarSpec.diameterMm}
            />

            <WorkStatusPanel
              calculation={calculation}
              currency={currency}
              regionLabel={PRICE_REGIONS[priceRegionId].label}
              diameterMm={rebarSpec.diameterMm}
              safetyFactor={safetyFactor}
            />
          </div>
        </div>

        <ToolsRail />

        <SitePipeline
          calculation={calculation}
          currency={currency}
          regionLabel={PRICE_REGIONS[priceRegionId].label}
          concreteGrade={concreteSpec.grade}
          structureLabel={structureType}
          dimsLabel={`${dimensions.length}×${dimensions.width}×${dimensions.depth} м`}
        />

        {/* Chain: смета → раскрой → РБУ → А4 */}
        <BomTable
          calculation={calculation}
          concreteSpec={concreteSpec}
          rebarSpec={rebarSpec}
          currency={currency}
          onSaveProject={() => {
            persistNow();
            showToast('Параметры расчета сохранены!');
          }}
          onExportCsv={handleExportCsv}
          onPrint={handlePrint}
        />

        {calcMode === 'checks' && (
          <EngineeringChecksPanel checks={calculation.checks} visible />
        )}

        <RebarScheduleTable
          pieces={calculation.rebarPieces}
          wastePct={calculation.rebarWastePct}
          stockBarsApprox={calculation.rebarStockBarsApprox}
          lapMm={calculation.lapMm}
          totalWeightKg={calculation.rebarWeightKg}
          stockLengthM={calculation.rebarStockLengthM}
          wasteM={calculation.rebarWasteM}
        />

        <RegionalSupplyPanel
          currency={currency}
          regionId={priceRegionId}
          regionLabel={PRICE_REGIONS[priceRegionId].label}
          prices={prices}
          calculation={calculation}
          concreteGrade={concreteSpec.grade}
          onRequestQuote={() => setIsQuoteModalOpen(true)}
        />

        <BrigadeNodeSheet
          structureType={structureType}
          dimensions={{
            length: dimensions.length,
            width: dimensions.width,
            depth: dimensions.depth,
            ribbon:
              structureType === 'wall'
                ? dimensions.perimeterThickeningWidth > 0
                  ? dimensions.perimeterThickeningWidth
                  : dimensions.width
                : dimensions.perimeterThickeningWidth || undefined,
          }}
          diameterMm={rebarSpec.diameterMm}
          spacingMm={rebarSpec.spacingMm}
          layers={rebarSpec.layers}
          calculation={calculation}
        />

        <ResultsReveal>
          <FormworkBomPanel
            structureType={structureType}
            formworkAreaM2={calculation.formworkAreaM2}
            depthM={dimensions.depth}
            stripLengthM={calculation.stripLengthM}
            formworkPricePerM2={prices.formworkPerM2}
            currency={currency}
          />

          <BuyTomorrowPanel
            concreteVolumeM3={calculation.concreteVolumeM3}
            rebarPieces={calculation.rebarPieces}
            rebarWeightKg={calculation.rebarWeightKg}
            bindingWireKg={calculation.bindingWireKg}
            stockBarsApprox={calculation.rebarStockBarsApprox}
            stockLengthM={calculation.rebarStockLengthM}
            diameterMm={rebarSpec.diameterMm}
            stockByDiameter={calculation.rebarStockByDiameter}
            coverMm={calculation.coverMm}
            formwork={formworkBom}
            contactAreaM2={calculation.contactAreaM2}
            planAreaM2={calculation.planAreaM2}
            structureLabel={`${structureType} ${dimensions.length}x${dimensions.width}`}
          />

          <PourSchedulePanel concreteVolumeM3={calculation.concreteVolumeM3} />

          <AcceptancePanel expectedGrade={concreteSpec.grade} workabilityHours={1.5} />

          <StructureComparePanel
            lengthM={dimensions.length}
            widthM={dimensions.width}
            concreteSpec={concreteSpec}
            prices={prices}
            unitSystem={unitSystem}
            safetyFactor={safetyFactor}
            currency={currency}
            calcOptions={calcOptions}
          />

          <SensitivityPanel
            structureType={structureType}
            dimensions={dimensions}
            concreteSpec={concreteSpec}
            rebarSpec={rebarSpec}
            prices={prices}
            unitSystem={unitSystem}
            safetyFactor={safetyFactor}
            calcOptions={calcOptions}
            currency={currency}
          />

          <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-6 lg:px-8">
            <TrustSourcesNote regionLabel={PRICE_REGIONS[priceRegionId].label} />
          </div>
        </ResultsReveal>
      </main>

      <SiteFooter />

      {/* Quote Request Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        calculation={calculation}
        currency={currency}
        regionLabel={PRICE_REGIONS[priceRegionId].label}
        concreteGrade={concreteSpec.grade}
      />
      <HardHatAssistant
        calculation={calculation}
        onApplySuggestion={applyAiSuggestion}
        onApplyPatch={applyAiPatch}
        open={helperOpen}
        onOpenChange={setHelperOpen}
      />
      <BackToTop />
    </div>
  );
}
