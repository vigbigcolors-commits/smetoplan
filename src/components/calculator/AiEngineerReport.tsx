'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Cpu,
  Clock,
  BookOpen,
  Zap,
} from 'lucide-react';
import type {
  AiStructuralAnalysis,
  ConcreteSpec,
  DimensionState,
  MaterialCalculationResult,
  RebarSpec,
  StructureType,
} from '@/lib/types';

interface AiEngineerReportProps {
  structureType: StructureType;
  dimensions: DimensionState;
  concreteSpec: ConcreteSpec;
  rebarSpec: RebarSpec;
  calculation: MaterialCalculationResult;
  soilPressureKpa: number;
  safetyFactor: number;
}

function buildLocalAnalysis(
  structureType: StructureType,
  dimensions: DimensionState,
  concreteSpec: ConcreteSpec,
  rebarSpec: RebarSpec,
  calculation: MaterialCalculationResult,
  soilPressureKpa: number,
  safetyFactor: number
): AiStructuralAnalysis {
  const bearingLimit = 200;
  const ratio = soilPressureKpa / bearingLimit;
  const bearingStatus: AiStructuralAnalysis['bearingStatus'] =
    ratio < 0.7 ? 'PASS' : ratio < 1.0 ? 'WARNING' : 'CRITICAL';
  const score = Math.max(
    35,
    Math.min(98, Math.round(100 - ratio * 40 + (safetyFactor - 1) * 80))
  );

  const recommendations: AiStructuralAnalysis['keyRecommendations'] = [
    {
      title: 'Контроль защитного слоя',
      impact: 'HIGH',
      description:
        'Обеспечьте защитный слой бетона ≥40 мм снизу плиты/ленты (фиксаторы-стульчики).',
    },
    {
      title:
        rebarSpec.layers > 1
          ? 'Двойная сетка подтверждена'
          : 'Оценка слоёв армирования',
      impact: rebarSpec.layers > 1 ? 'MEDIUM' : 'HIGH',
      description:
        rebarSpec.layers > 1
          ? `Верхняя и нижняя сетка Ø${rebarSpec.diameterMm} шаг ${rebarSpec.spacingMm} мм соответствуют типовой схеме.`
          : 'Для нагруженных плит рекомендуется минимум 2 слоя сетки А500С.',
    },
    {
      title: 'Оптимизация марки бетона',
      impact: 'COST_SAVING',
      description:
        concreteSpec.grade === 'M400' || concreteSpec.grade === 'M350'
          ? 'Проверьте, достаточно ли М300 — возможна экономия без потери несущей способности для малоэтажки.'
          : `Марка ${concreteSpec.grade} подходит для типового малоэтажного строительства при нормальных грунтах.`,
    },
  ];

  return {
    feasibilityScore: score,
    bearingStatus,
    bearingPressureRatio: `${soilPressureKpa.toFixed(1)} / ${bearingLimit} кПа`,
    structuralSummary: `Конструкция «${structureType}» ${dimensions.length}×${dimensions.width}×${dimensions.depth} м, бетон ${concreteSpec.grade}, объём ${calculation.concreteVolumeM3} м³. Расчётное давление на основание ${soilPressureKpa} кПа при запасе ${(
      (safetyFactor - 1) *
      100
    ).toFixed(0)}%.`,
    keyRecommendations: recommendations,
    curingScheduleDays: {
      formworkRemovalDays: concreteSpec.grade >= 'M300' ? 7 : 10,
      fullLoadCapacityDays: 28,
      hydrationTip:
        'Первые 7 суток увлажняйте поверхность и укрывайте плёнкой — критично для набора прочности.',
    },
    complianceNote:
      'Ориентир: СП 63.13330 (ЖБК), СП 22.13330 (основания). Итоговый проект — у аттестованного конструктора.',
  };
}

export function AiEngineerReport({
  structureType,
  dimensions,
  concreteSpec,
  rebarSpec,
  calculation,
  soilPressureKpa,
  safetyFactor,
}: AiEngineerReportProps) {
  const [report, setReport] = useState<AiStructuralAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunAiCheck = () => {
    setLoading(true);
    window.setTimeout(() => {
      setReport(
        buildLocalAnalysis(
          structureType,
          dimensions,
          concreteSpec,
          rebarSpec,
          calculation,
          soilPressureKpa,
          safetyFactor
        )
      );
      setLoading(false);
    }, 650);
  };

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-4 border-b border-slate-800 bg-[#0F172A] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded bg-[#1F5A8E] p-1.5">
            <Sparkles className="h-4 w-4 text-teal-300" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide">
              Инженерный аудит конструкции
            </h2>
            <p className="font-mono text-[11px] text-slate-400">
              ЛОКАЛЬНЫЙ МОДУЛЬ СП · ДАВЛЕНИЕ НА ГРУНТ · РЕКОМЕНДАЦИИ
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRunAiCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Cpu className="h-4 w-4" />
          )}
          Запустить аудит
        </button>
      </div>

      {!report && !loading && (
        <div className="p-6 text-sm text-slate-600">
          Нажмите «Запустить аудит», чтобы получить оценку несущей способности,
          график твердения и рекомендации по армированию без ухода со страницы.
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 p-6 font-mono text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#1F5A8E]" />
          Анализ геометрии и давления на основание…
        </div>
      )}

      {report && (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-[#F4F4F5] p-3">
              <span className="font-mono text-[10px] uppercase text-slate-500">
                Feasibility
              </span>
              <div className="text-2xl font-extrabold text-[#0F172A]">
                {report.feasibilityScore}
                <span className="text-sm font-normal text-slate-500">/100</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[#F4F4F5] p-3">
              <span className="font-mono text-[10px] uppercase text-slate-500">
                Давление
              </span>
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck
                  className={
                    report.bearingStatus === 'PASS'
                      ? 'h-4 w-4 text-emerald-600'
                      : report.bearingStatus === 'WARNING'
                        ? 'h-4 w-4 text-amber-500'
                        : 'h-4 w-4 text-red-500'
                  }
                />
                {report.bearingStatus} · {report.bearingPressureRatio}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[#F4F4F5] p-3">
              <span className="font-mono text-[10px] uppercase text-slate-500">
                Твердение
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                <Clock className="h-3.5 w-3.5 text-[#1F5A8E]" />
                распалубка {report.curingScheduleDays.formworkRemovalDays}д ·
                полная {report.curingScheduleDays.fullLoadCapacityDays}д
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-700">
            {report.structuralSummary}
          </p>

          <ul className="space-y-2">
            {report.keyRecommendations.map((rec) => (
              <li
                key={rec.title}
                className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
              >
                {rec.impact === 'COST_SAVING' ? (
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <div>
                  <div className="font-bold text-slate-900">{rec.title}</div>
                  <div className="text-slate-600">{rec.description}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-900">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{report.curingScheduleDays.hydrationTip}</p>
              <p className="mt-1 font-mono text-[11px] text-sky-700">
                {report.complianceNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
