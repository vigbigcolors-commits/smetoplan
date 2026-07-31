'use client';

import React, { useState } from 'react';
import {
  Boxes,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  Eye,
  GitCompare,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';

const PEEK_TOOLS = [
  { icon: Boxes, label: 'Опалубка BOM' },
  { icon: ShoppingCart, label: 'Закупка на завтра' },
  { icon: CalendarClock, label: 'График заливки' },
  { icon: ClipboardCheck, label: 'Приёмка бетона' },
  { icon: GitCompare, label: 'Сравнение схем' },
  { icon: SlidersHorizontal, label: 'Сценарии «что если»' },
] as const;

/**
 * Compact unlock strip — no full-height blurred children (that created dead space).
 * Children mount only after expand so the CTA stays in view.
 */
export function ResultsReveal({
  children,
  label = 'Показать больше',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-4 space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <p className="text-xs font-semibold text-slate-600">
            Дополнительные инструменты открыты
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-400"
          >
            Свернуть
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#0F172A] shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
      {/* Dense blueprint atmosphere — fills the strip without empty white */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3D6494]/35 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" aria-hidden />

      <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
            Следующий шаг расчёта
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white sm:text-2xl">
            Ещё 6 рабочих блоков по вашим объёмам
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
            Опалубка, закупка, заливка, приёмка и сценарии — без ухода со
            страницы. Ключевая смета и РБУ уже выше.
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PEEK_TOOLS.map(({ icon: Icon, label: toolLabel }) => (
              <li
                key={toolLabel}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-slate-200"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                <span className="truncate">{toolLabel}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 bg-white/95 p-6 text-center backdrop-blur-sm sm:p-7">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#1F5A8E] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#174771] active:scale-[0.98]"
          >
            <Eye className="h-4 w-4 text-sky-200" />
            {label}
          </button>
          <p className="max-w-[16rem] text-[11px] leading-relaxed text-slate-500">
            Один клик — блоки появятся сразу под этой панелью. Место под РСЯ
            позже.
          </p>
        </div>
      </div>
    </section>
  );
}
