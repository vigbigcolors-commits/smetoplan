'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { evaluateConcreteAcceptance } from '@/domain/acceptance';
import { ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function AcceptancePanel({
  expectedGrade,
  workabilityHours = 1.5,
  defaultAirTempC = 20,
}: {
  expectedGrade: string;
  workabilityHours?: number;
  defaultAirTempC?: number;
}) {
  const [declaredGrade, setDeclaredGrade] = useState(expectedGrade);
  const [slumpCm, setSlumpCm] = useState(12);
  const [mixTempC, setMixTempC] = useState(18);
  const [travelMinutes, setTravelMinutes] = useState(45);
  const [airTempC, setAirTempC] = useState(defaultAirTempC);
  const [hasAdmixtureNote, setHasAdmixtureNote] = useState(true);

  useEffect(() => {
    setDeclaredGrade(expectedGrade);
  }, [expectedGrade]);

  const result = useMemo(
    () =>
      evaluateConcreteAcceptance({
        declaredGrade,
        expectedGrade,
        slumpCm,
        mixTempC,
        travelMinutes,
        airTempC,
        hasAdmixtureNote,
        workabilityHours,
      }),
    [
      declaredGrade,
      expectedGrade,
      slumpCm,
      mixTempC,
      travelMinutes,
      airTempC,
      hasAdmixtureNote,
      workabilityHours,
    ]
  );

  const overallClass =
    result.overall === 'reject_hint'
      ? 'border-rose-200 bg-rose-50 text-rose-950'
      : result.overall === 'watch'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-emerald-200 bg-emerald-50 text-emerald-950';

  return (
    <ToolPanelShell
      id="tool-acceptance"
      title="Приёмка бетона по накладной"
      subtitle={`Чек-лист на объекте. Заказ в расчёте: ${expectedGrade}.`}
      icon={ClipboardCheck}
      accent="rose"
      badge="контроль"
      delayMs={140}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 block rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2.5 text-[11px] font-semibold text-slate-600 sm:col-span-1">
          Марка в накладной
          <input
            value={declaredGrade}
            onChange={(e) => setDeclaredGrade(e.target.value)}
            className="mt-1 w-full border-0 bg-transparent font-mono text-sm font-extrabold text-[#0F172A] outline-none"
          />
        </label>
        <Num label="Осадка, см" value={slumpCm} onChange={setSlumpCm} />
        <Num label="t° смеси" value={mixTempC} onChange={setMixTempC} />
        <Num label="В пути, мин" value={travelMinutes} onChange={setTravelMinutes} />
        <Num label="t° воздуха" value={airTempC} onChange={setAirTempC} />
        <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2.5 text-[11px] font-bold text-slate-700">
          <input
            type="checkbox"
            checked={hasAdmixtureNote}
            onChange={(e) => setHasAdmixtureNote(e.target.checked)}
            className="h-4 w-4 accent-[#3D6494]"
          />
          Добавки указаны в накладной
        </label>
      </div>

      <div
        className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${overallClass}`}
      >
        {result.summary}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {result.checks.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900">{c.title}</span>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{c.detail}</p>
          </li>
        ))}
      </ul>
    </ToolPanelShell>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2.5 text-[11px] font-semibold text-slate-600 transition focus-within:border-[#3D6494] focus-within:ring-2 focus-within:ring-[#3D6494]/20">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full border-0 bg-transparent font-mono text-sm font-extrabold text-[#0F172A] outline-none"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: 'bg-emerald-100 text-emerald-800',
    watch: 'bg-amber-100 text-amber-900',
    reject_hint: 'bg-rose-100 text-rose-800',
  };
  const label: Record<string, string> = {
    ok: 'OK',
    watch: 'внимание',
    reject_hint: 'стоп?',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${map[status] || ''}`}>
      {label[status] || status}
    </span>
  );
}
