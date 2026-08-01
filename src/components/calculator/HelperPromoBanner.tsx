'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Keyboard,
  Sparkles,
  Wand2,
  X,
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

const DISMISS_KEY = 'smetoplan-helper-banner-dismissed';

export function HelperPromoBanner({ onOpenHelper }: { onOpenHelper: () => void }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

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
      className="helper-promo relative mb-6 overflow-hidden rounded-2xl border border-sky-400/25 bg-[#0B1220] shadow-[0_18px_50px_-28px_rgba(15,23,42,0.85)]"
      aria-label="Помощник HELPER проставляет параметры"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.11) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#3D6494]/45 blur-3xl"
        aria-hidden
      />
      <div
        className="helper-promo-glow pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#6B9B8A]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent"
        aria-hidden
      />

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
        aria-label="Скрыть баннер"
        title="Скрыть"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#6B9B8A] px-2 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0B1220]">
              <Sparkles className="h-3 w-3" />
              HELPER
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-200">
              <Zap className="h-3 w-3" />
              сам пишет в поля
            </span>
          </div>

          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Экономьте своё время —{' '}
            <span className="bg-gradient-to-r from-sky-200 to-[#B8D4C8] bg-clip-text text-transparent">
              цифры ставит помощник
            </span>
          </h2>

          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Напишите размеры и арматуру обычным текстом — HELPER сам заполнит
            калькулятор. Без ручного клика по каждому полю.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip, i) => (
              <div
                key={chip.label}
                className="helper-promo-chip inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 backdrop-blur-sm"
                style={{ animationDelay: `${0.12 + i * 0.08}s` }}
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

        <div className="flex flex-col justify-center gap-3 bg-gradient-to-b from-white/[0.07] to-transparent p-5 sm:p-6">
          <div className="rounded-xl border border-white/10 bg-[#0F172A]/80 p-3.5 shadow-inner">
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
            className="helper-promo-cta group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F7F72] via-[#6B9B8A] to-sky-300 px-5 py-3.5 text-sm font-extrabold text-[#0B1220] shadow-[0_12px_28px_-12px_rgba(107,155,138,0.7)] transition hover:brightness-110 active:scale-[0.98]"
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
