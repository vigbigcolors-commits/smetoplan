'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToolAccent = 'steel' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';

const accentMap: Record<
  ToolAccent,
  { bar: string; icon: string; glow: string; chip: string }
> = {
  steel: {
    bar: 'from-[#1F5A8E] to-[#3D6494]',
    icon: 'bg-[#0F172A] text-sky-300',
    glow: 'bg-[#3D6494]/10',
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  amber: {
    bar: 'from-amber-600 to-orange-500',
    icon: 'bg-[#0F172A] text-amber-300',
    glow: 'bg-amber-500/10',
    chip: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  emerald: {
    bar: 'from-emerald-700 to-teal-500',
    icon: 'bg-[#0F172A] text-emerald-300',
    glow: 'bg-emerald-500/10',
    chip: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  sky: {
    bar: 'from-sky-700 to-cyan-500',
    icon: 'bg-[#0F172A] text-sky-300',
    glow: 'bg-sky-500/10',
    chip: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  violet: {
    bar: 'from-indigo-700 to-slate-600',
    icon: 'bg-[#0F172A] text-indigo-200',
    glow: 'bg-indigo-500/10',
    chip: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  rose: {
    bar: 'from-rose-700 to-orange-600',
    icon: 'bg-[#0F172A] text-rose-200',
    glow: 'bg-rose-500/10',
    chip: 'bg-rose-50 text-rose-900 border-rose-200',
  },
};

export function ToolPanelShell({
  id,
  title,
  subtitle,
  icon: Icon,
  accent = 'steel',
  badge,
  actions,
  children,
  delayMs = 0,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: ToolAccent;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  delayMs?: number;
}) {
  const a = accentMap[accent];
  return (
    <section
      id={id}
      className="tool-panel group relative mt-6 scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl ${a.glow}`} />
      <div className={`h-1 w-full bg-gradient-to-r ${a.bar}`} />

      <div className="relative border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ${a.icon}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                  {title}
                </h3>
                {badge ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${a.chip}`}
                  >
                    {badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'sky' | 'amber' | 'emerald' | 'rose';
}) {
  const tones = {
    default: 'border-slate-100 bg-[#F4F7FA] text-[#0F172A]',
    sky: 'border-sky-100 bg-sky-50/80 text-sky-950',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-950',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-950',
    rose: 'border-rose-100 bg-rose-50/80 text-rose-950',
  };
  return (
    <div
      className={`metric-tile rounded-xl border px-3.5 py-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-extrabold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-[10px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function ToolButton({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary:
      'bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm hover:shadow-md',
    secondary:
      'bg-[#3D6494] text-white hover:bg-[#4A76AB] shadow-sm hover:shadow-md',
    ghost:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 shadow-sm',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`tool-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-[0.98] ${styles[variant]}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 opacity-90" /> : null}
      {children}
    </button>
  );
}
