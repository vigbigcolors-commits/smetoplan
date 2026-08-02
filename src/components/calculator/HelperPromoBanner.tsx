'use client';

import React from 'react';
import {
  ArrowRight,
  Keyboard,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';

const EXAMPLE =
  'Плита 10×8×0.25, рёбра 0.05, Ø12 шаг 200, 2 слоя, a=50, M300';

const CHIPS = [
  { label: 'Габариты', value: '10×8×0.25' },
  { label: 'Арматура', value: 'Ø12 · 200' },
  { label: 'Слои', value: '2' },
  { label: 'Бетон', value: 'M300' },
] as const;

export function HelperPromoBanner({ onOpenHelper }: { onOpenHelper: () => void }) {
  const openWithExample = () => {
    try {
      sessionStorage.setItem('smetoplan-helper-prefill', EXAMPLE);
    } catch {
      /* ignore */
    }
    onOpenHelper();
    window.dispatchEvent(new Event('smetoplan-helper-prefill'));
  };

  return (
    <section
      className="helper-promo relative mb-6 isolate overflow-hidden rounded-2xl border border-slate-600/80 bg-[#0B1220]"
      aria-label="Помощник HELPER проставляет параметры"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />

      <div className="relative z-10 grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#6B9B8A] px-2 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0B1220]">
              <Sparkles className="h-3 w-3" />
              HELPER
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-teal-400/35 bg-teal-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-200">
              <Zap className="h-3 w-3" />
              сам пишет в поля
            </span>
          </div>

          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Экономьте своё время —{' '}
            <span className="text-[#9BC4B5]">цифры ставит помощник</span>
          </h2>

          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Напишите размеры и арматуру обычным текстом — HELPER сам заполнит
            калькулятор. Без ручного клика по каждому полю.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <div
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-2.5 py-1.5"
              >
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/80">
                  {chip.label}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {chip.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 bg-[#0E1628] p-5 sm:p-6">
          <div className="rounded-xl border border-white/10 bg-[#0B1220] p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Keyboard className="h-3 w-3 text-sky-300" />
              Пример сообщения
            </div>
            <p className="font-mono text-[12px] leading-relaxed text-sky-100/95 sm:text-[13px]">
              «{EXAMPLE}»
            </p>
          </div>

          <button
            type="button"
            onClick={openWithExample}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#489C81] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#5BB996] hover:brightness-110 active:scale-[0.98]"
          >
            <Wand2 className="h-4 w-4 transition group-hover:rotate-12" />
            Открыть HELPER и подставить
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Или кнопка HELPER в шапке — напишите свои цифры, он проставит сам.
          </p>
        </div>
      </div>
    </section>
  );
}
