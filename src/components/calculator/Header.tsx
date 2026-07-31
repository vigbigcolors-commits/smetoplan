'use client';

import React from 'react';
import Link from 'next/link';
import {
  Ruler,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { Currency, UnitSystem } from '@/lib/types';

interface HeaderProps {
  unitSystem: UnitSystem;
  onUnitSystemChange: (units: UnitSystem) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onRunAiAnalysis: () => void;
  onOpenHelper: () => void;
  onExportPdf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unitSystem,
  onUnitSystemChange,
  currency,
  onCurrencyChange,
  onRunAiAnalysis,
  onOpenHelper,
  onExportPdf,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F172A] text-[#6B93C4] shadow-md">
              <Ruler className="h-5 w-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                  SMETO<span className="text-[#3D6494]">PLAN</span>
                </span>
                <span className="rounded bg-[#3D6494] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  ИНЖЕНЕРИЯ
                </span>
              </div>
              <p className="hidden truncate text-[11px] font-medium text-slate-500 sm:block">
                Чертежи, сметы и спецификации материалов
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold sm:flex">
              <button
                type="button"
                onClick={() => onUnitSystemChange('metric')}
                className={`rounded-md px-2.5 py-1 transition ${
                  unitSystem === 'metric'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                м
              </button>
              <button
                type="button"
                onClick={() => onUnitSystemChange('imperial')}
                className={`rounded-md px-2.5 py-1 transition ${
                  unitSystem === 'imperial'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                фут
              </button>
            </div>

            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3D6494]"
            >
              <option value="RUB">RUB (₽)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED</option>
            </select>

            <button
              type="button"
              onClick={onOpenHelper}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-[#0F172A] transition hover:border-sky-400 hover:bg-sky-100 sm:px-2.5 sm:py-1.5"
              title="Открыть HELPER"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assistants/helper.png?v=2"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                draggable={false}
              />
              <span className="hidden sm:inline">HELPER</span>
            </button>

            <button
              type="button"
              onClick={onRunAiAnalysis}
              className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              ИИ-подсказки
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#3D6494] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4A76AB]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
