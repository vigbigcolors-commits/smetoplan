'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Download, Building2, Info } from 'lucide-react';
import { Currency, MaterialCalculationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import { buildRbuSpecText, downloadTextFile } from '@/lib/rbu-spec';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: MaterialCalculationResult | ExtendedCalculationResult;
  currency: Currency;
  regionLabel?: string;
  concreteGrade?: string;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  calculation,
  currency,
  regionLabel = 'регион',
  concreteGrade = 'M300',
}) => {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    deliveryDate: '',
  });

  if (!isOpen) return null;

  const downloadSpec = () => {
    const ext = calculation as ExtendedCalculationResult;
    downloadTextFile(
      `smetoplan-zayavka-rbu-${Date.now()}.txt`,
      buildRbuSpecText({
        regionLabel,
        concreteGrade,
        concreteVolumeM3: calculation.concreteVolumeM3,
        rebarWeightKg: calculation.rebarWeightKg,
        formworkAreaM2: calculation.formworkAreaM2,
        totalLabel: formatCurrency(calculation.itemizedCosts.total, currency),
        rebarLines: (ext.rebarPieces || []).map(
          (p) =>
            `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}; m=${Math.round(p.weightKg * 10) / 10}кг`
        ),
        contact: formData,
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    downloadSpec();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0F172A] p-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#1F5A8E] p-2 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wide">
                Спецификация для РБУ
              </h3>
              <p className="font-mono text-xs text-slate-400">
                Скачается .txt — отправьте на завод сами
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="space-y-3 py-4 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-black text-[#0F172A]">Спецификация скачана</h4>
              <p className="mx-auto max-w-sm text-xs text-slate-600">
                Файл .txt с объёмами и раскроем. Отправьте его на РБУ региона «{regionLabel}»:
                {' '}
                <strong className="text-slate-900">{calculation.concreteVolumeM3} м³</strong> бетона и{' '}
                <strong className="text-slate-900">{calculation.rebarWeightKg} кг</strong> арматуры.
              </p>
              <div className="my-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left font-mono text-xs text-slate-700">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Ориентир сметы материалов</span>
                  <span className="font-bold text-[#0F172A]">
                    {formatCurrency(calculation.itemizedCosts.total, currency)}
                  </span>
                </div>
                <p className="pt-1 font-sans text-[11px] text-slate-500">
                  Без фиктивных купонов и «скидок от завода» — только ваш расчёт.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[#0F172A] py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Вернуться к калькулятору
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950">
                <span className="flex items-center gap-1 text-xs font-extrabold">
                  <Info className="h-4 w-4 text-[#1F5A8E]" /> Сводка из расчёта
                </span>
                <p className="font-mono text-[11px] text-sky-900">
                  {concreteGrade} · {calculation.concreteVolumeM3} м³ · арматура{' '}
                  {calculation.rebarWeightKg} кг · {regionLabel}
                </p>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  ФИО / организация
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иванов И.И. / ООО «…»"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-[#F4F4F5] p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Телефон</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 …"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-[#F4F4F5] p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="mail@…"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-[#F4F4F5] p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Адрес объекта
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Город / район"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-[#F4F4F5] p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Дата заливки
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-[#F4F4F5] p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1F5A8E] py-3.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#174771]"
              >
                <Download className="h-4 w-4" />
                Скачать спецификацию .txt
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
