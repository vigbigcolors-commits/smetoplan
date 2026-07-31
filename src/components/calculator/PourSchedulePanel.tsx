'use client';

import React, { useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { computePourSchedule } from '@/domain/pour';
import { MetricTile, ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';

export function PourSchedulePanel({
  concreteVolumeM3,
}: {
  concreteVolumeM3: number;
}) {
  const [mixerVolumeM3, setMixerVolumeM3] = useState(8);
  const [placeRateM3PerHour, setPlaceRateM3PerHour] = useState(12);
  const [workabilityHours, setWorkabilityHours] = useState(1.5);
  const [airTempC, setAirTempC] = useState(20);
  const [catchCount, setCatchCount] = useState(0);

  const result = useMemo(
    () =>
      computePourSchedule({
        concreteVolumeM3,
        mixerVolumeM3,
        placeRateM3PerHour,
        workabilityHours,
        airTempC,
        catchCount: catchCount > 0 ? catchCount : undefined,
      }),
    [
      concreteVolumeM3,
      mixerVolumeM3,
      placeRateM3PerHour,
      workabilityHours,
      airTempC,
      catchCount,
    ]
  );

  const riskPct =
    result.coldJointRisk === 'high' ? 92 : result.coldJointRisk === 'watch' ? 58 : 22;
  const riskColor =
    result.coldJointRisk === 'high'
      ? '#E11D48'
      : result.coldJointRisk === 'watch'
        ? '#D97706'
        : '#059669';
  const riskLabel =
    result.coldJointRisk === 'ok'
      ? 'Низкий риск шва'
      : result.coldJointRisk === 'watch'
        ? 'Контроль стыка'
        : 'Высокий риск шва';

  return (
    <ToolPanelShell
      id="tool-pour"
      title="Карта заливки · темп РБУ"
      subtitle={`Объём из сметы ${concreteVolumeM3} м³ → рейсы, захватки и риск холодного шва.`}
      icon={Truck}
      accent="sky"
      badge="бригада"
      delayMs={80}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-3">
          <Field label="Миксер, м³" value={mixerVolumeM3} onChange={setMixerVolumeM3} step={1} min={4} max={12} />
          <Field label="Темп, м³/ч" value={placeRateM3PerHour} onChange={setPlaceRateM3PerHour} step={1} min={4} max={40} />
          <Field label="Живучесть, ч" value={workabilityHours} onChange={setWorkabilityHours} step={0.25} min={0.5} max={4} />
          <Field label="t° воздуха" value={airTempC} onChange={setAirTempC} step={1} min={-15} max={40} />
          <Field label="Захватки (0=авто)" value={catchCount} onChange={setCatchCount} step={1} min={0} max={12} />
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-[#0B132B] p-5 lg:col-span-5">
          <div
            className="pour-gauge relative flex h-28 w-28 items-center justify-center rounded-full"
            style={
              {
                '--gauge-color': riskColor,
                '--gauge-pct': `${riskPct}%`,
              } as React.CSSProperties
            }
          >
            <div className="flex h-[5.25rem] w-[5.25rem] flex-col items-center justify-center rounded-full bg-[#0B132B] text-center">
              <span className="font-mono text-2xl font-extrabold text-white">{result.trips}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                рейсов
              </span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs font-bold" style={{ color: riskColor }}>
            {riskLabel}
          </p>
          <div className="risk-bar mt-2 h-1.5 w-full max-w-[12rem]">
            <span style={{ width: `${riskPct}%`, background: riskColor }} />
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
            {result.startWindowHint}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="Часов укладки" value={`${result.pourHours}`} tone="sky" />
        <MetricTile label="Захваток" value={`${result.catchCount}`} />
        <MetricTile label="м³ / захватка" value={`${result.volumePerCatchM3}`} />
        <MetricTile label="ч / захватка" value={`${result.hoursPerCatch}`} tone="amber" />
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <li>{result.workabilityNote}</li>
        {result.notes.map((n) => (
          <li key={n} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </ToolPanelShell>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <label className="block rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2.5 text-[11px] font-semibold text-slate-600 transition focus-within:border-[#3D6494] focus-within:ring-2 focus-within:ring-[#3D6494]/20">
      {label}
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full border-0 bg-transparent font-mono text-sm font-extrabold text-[#0F172A] outline-none"
      />
    </label>
  );
}
