'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency, type ExtendedCalculationResult } from '@/lib/calculator';
import type { Currency } from '@/lib/types';

type Tone = 'ok' | 'warn' | 'bad';

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toneIcon(tone: Tone) {
  if (tone === 'ok') {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />;
  }
  return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />;
}

export function WorkStatusPanel({
  calculation,
  currency,
  regionLabel,
  diameterMm,
  safetyFactor,
}: {
  calculation: ExtendedCalculationResult;
  currency: Currency;
  regionLabel: string;
  diameterMm: number;
  safetyFactor: number;
}) {
  const soilTone: Tone =
    calculation.soilStatus === 'critical'
      ? 'bad'
      : calculation.soilStatus === 'warning'
        ? 'warn'
        : 'ok';

  const coverCheck = calculation.checks.find((c) => c.id === 'cover');
  const coverTone: Tone =
    coverCheck?.status === 'fail'
      ? 'bad'
      : coverCheck?.status === 'warn'
        ? 'warn'
        : 'ok';

  const wasteTone: Tone =
    calculation.rebarWastePct > 18 ? 'bad' : calculation.rebarWastePct > 12 ? 'warn' : 'ok';

  const volumeTone: Tone = calculation.concreteVolumeM3 >= 0.5 ? 'ok' : 'warn';

  const checklist: { label: string; detail: string; tone: Tone; scrollTo?: string }[] = [
    {
      label: 'Грунт / запас',
      detail: `${calculation.soilUtilizationPct}% R · γ=${safetyFactor}`,
      tone: soilTone,
    },
    {
      label: 'Защитный слой',
      detail: `${calculation.coverMm} мм`,
      tone: coverTone,
    },
    {
      label: 'Раскрой арматуры',
      detail: `отход ${calculation.rebarWastePct}% · ${calculation.rebarStockBarsApprox} хлыстов Ø${diameterMm}`,
      tone: wasteTone,
      scrollTo: 'tool-rebar',
    },
    {
      label: 'Объём под заливку',
      detail: `${calculation.concreteVolumeM3} м³`,
      tone: volumeTone,
      scrollTo: 'tool-pour',
    },
  ];

  const next = [
    { id: 'bom-estimate-total', label: 'Смета', hint: 'ведомость' },
    { id: 'tool-rebar', label: 'Раскрой', hint: `${calculation.rebarStockBarsApprox} хлыстов` },
    { id: 'tool-rbu', label: 'РБУ', hint: regionLabel },
    { id: 'tool-nodes', label: 'А4', hint: 'печать бригаде' },
  ];

  return (
    <section
      id="work-status"
      className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B132B] text-white shadow-xl"
    >
      <div className="flex items-end justify-between gap-3 border-b border-slate-700/80 px-4 py-3">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-white">
            Статус расчёта
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">по текущим параметрам</p>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Итог</div>
          <div className="font-mono text-sm font-extrabold text-emerald-300">
            {formatCurrency(calculation.itemizedCosts.total, currency)}
          </div>
        </div>
      </div>

      <ul className="space-y-0 border-b border-slate-700/80 px-2 py-1.5">
        {checklist.map((row) => (
          <li key={row.label}>
            <button
              type="button"
              disabled={!row.scrollTo}
              onClick={() => row.scrollTo && jump(row.scrollTo)}
              className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left ${
                row.scrollTo ? 'hover:bg-slate-800/80' : ''
              }`}
            >
              {toneIcon(row.tone)}
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-slate-200">{row.label}</span>
                <span className="block font-mono text-[10px] text-slate-500">{row.detail}</span>
              </span>
              {row.scrollTo ? (
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-1.5 p-2.5 sm:grid-cols-4">
        {next.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => jump(a.id)}
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-2 text-left transition hover:border-sky-500/60 hover:bg-slate-800"
          >
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {a.label}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] font-bold text-slate-200">
              {a.hint}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
