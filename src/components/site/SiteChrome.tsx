'use client';

import Link from 'next/link';
import { Building2, FileSpreadsheet } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F172A] text-teal-400 shadow-md">
            <Building2 className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                SMETO<span className="text-[#1F5A8E]">PLAN</span>
              </span>
              <span className="rounded bg-[#1F5A8E] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                ИНЖЕНЕРИЯ
              </span>
            </div>
            <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Сметы · чертежи · PSEO-калькуляторы для стройки
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-[#F4F4F5] px-3 py-1.5 font-mono text-xs text-slate-700 lg:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-900">ДВИЖОК v1.0:</span>
          <span className="text-slate-600">СП 63.13330 · drip-feed ON</span>
        </div>

        <Link
          href="/kalkulyator/kalkulyator-plitnogo-fundamenta-12x8-m300"
          className="flex items-center gap-1.5 rounded-lg bg-[#1F5A8E] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#174771]"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Открыть калькулятор</span>
          <span className="sm:hidden">Расчёт</span>
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-[#0F172A] text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-sm font-extrabold text-white">
            SMETO<span className="text-sky-400">PLAN</span>
          </div>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Инженерные калькуляторы с живыми чертежами и ведомостью материалов.
            Расчёты носят ориентировочный характер — финальный проект утверждает
            сертифицированный конструктор.
          </p>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          © {new Date().getFullYear()} Smetoplan.ru · СП / ГОСТ справочно
        </div>
      </div>
    </footer>
  );
}
