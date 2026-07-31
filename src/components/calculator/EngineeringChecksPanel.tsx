'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Info, XCircle } from 'lucide-react';
import type { EngineeringCheck } from '@/lib/calculator';

const toneMap = {
  pass: {
    icon: ShieldCheck,
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconCls: 'text-emerald-600',
  },
  warn: {
    icon: ShieldAlert,
    box: 'border-amber-200 bg-amber-50 text-amber-950',
    iconCls: 'text-amber-600',
  },
  fail: {
    icon: XCircle,
    box: 'border-rose-200 bg-rose-50 text-rose-950',
    iconCls: 'text-rose-600',
  },
  info: {
    icon: Info,
    box: 'border-sky-200 bg-sky-50 text-sky-950',
    iconCls: 'text-sky-600',
  },
} as const;

export function EngineeringChecksPanel({
  checks,
  visible,
}: {
  checks: EngineeringCheck[];
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      id="engineering-checks"
      className="tool-panel mt-6 scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]"
    >
      <div className="h-1 w-full bg-gradient-to-r from-emerald-700 to-teal-500" />
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
          Инженерные проверки (ориентир)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Упрощённые эвристики по СП 63 / СП 22. Не заменяют расчёт КЖ и ИГИ.
        </p>
      </div>
      <ul className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6">
        {checks.map((c) => {
          const tone = toneMap[c.status];
          const Icon = tone.icon;
          return (
            <li
              key={c.id}
              className={`rounded-xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-md ${tone.box}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.iconCls}`} />
                <div>
                  <p className="text-sm font-bold">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{c.detail}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide opacity-70">
                    {c.normHint}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
