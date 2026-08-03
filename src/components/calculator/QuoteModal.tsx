'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Download,
  Link2,
  Mail,
  FileText,
  Package,
  Loader2,
} from 'lucide-react';
import { Currency, MaterialCalculationResult } from '@/lib/types';
import { formatCurrency, type ExtendedCalculationResult } from '@/lib/calculator';
import type { CalculatorDraft } from '@/lib/calculator-draft';
import {
  buildPackageShareUrl,
  buildPackageSpecText,
  copyTextToClipboard,
  downloadPdfOnly,
  downloadReadyPackage,
  type SmetaPackageContext,
} from '@/lib/smeta-package';
import { downloadTextFile } from '@/lib/rbu-spec';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: MaterialCalculationResult | ExtendedCalculationResult;
  currency: Currency;
  regionLabel?: string;
  concreteGrade?: string;
  structureLabel: string;
  dimsLabel: string;
  draft: CalculatorDraft;
  onToast?: (msg: string) => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  calculation,
  currency,
  regionLabel = 'регион',
  concreteGrade = 'M300',
  structureLabel,
  dimsLabel,
  draft,
  onToast,
}) => {
  const [busy, setBusy] = useState<'pkg' | 'pdf' | 'link' | 'mail' | null>(null);
  const [done, setDone] = useState<'pkg' | 'mail' | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [mailError, setMailError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ext = calculation as ExtendedCalculationResult;

  const ctx: SmetaPackageContext = {
    draft,
    calculation: ext,
    regionLabel,
    structureLabel,
    dimsLabel,
    concreteGrade,
    currency,
  };

  const toast = (msg: string) => onToast?.(msg);

  const runPackage = async () => {
    setBusy('pkg');
    setMailError(null);
    try {
      const { shareUrl: url, copied } = await downloadReadyPackage(ctx);
      setShareUrl(url);
      setDone('pkg');
      toast(
        copied
          ? 'Пакет скачан · ссылка в буфере'
          : 'Пакет скачан · скопируйте ссылку вручную'
      );
    } catch {
      toast('Не удалось собрать пакет. Попробуйте PDF или .txt отдельно.');
    } finally {
      setBusy(null);
    }
  };

  const runPdf = async () => {
    setBusy('pdf');
    try {
      const url = await downloadPdfOnly(ctx);
      setShareUrl(url);
      toast('PDF скачан');
    } catch {
      toast('Ошибка PDF — проверьте сеть (шрифт) и повторите');
    } finally {
      setBusy(null);
    }
  };

  const runTxt = () => {
    downloadTextFile(
      `smetoplan-spec-rbu-${Date.now()}.txt`,
      buildPackageSpecText(ctx)
    );
    toast('Спецификация .txt скачана');
  };

  const runCopyLink = async () => {
    setBusy('link');
    try {
      const url = await buildPackageShareUrl(ctx);
      setShareUrl(url);
      const ok = await copyTextToClipboard(url);
      toast(ok ? 'Ссылка на расчёт скопирована' : 'Скопируйте ссылку вручную');
    } catch {
      toast('Не удалось создать ссылку');
    } finally {
      setBusy(null);
    }
  };

  const runMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailError(null);
    const addr = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setMailError('Укажите корректный email');
      return;
    }
    setBusy('mail');
    try {
      const url = shareUrl || (await buildPackageShareUrl(ctx));
      setShareUrl(url);
      const res = await fetch('/api/smeta/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addr,
          shareUrl: url,
          regionLabel,
          structureLabel,
          dimsLabel,
          concreteGrade,
          concreteVolumeM3: calculation.concreteVolumeM3,
          rebarWeightKg: calculation.rebarWeightKg,
          formworkAreaM2: calculation.formworkAreaM2,
          totalLabel: formatCurrency(calculation.itemizedCosts.total, currency),
          specText: buildPackageSpecText(ctx),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMailError(data.error || 'Не удалось отправить');
        return;
      }
      setDone('mail');
      toast('Письмо отправлено на ваш email');
    } catch {
      setMailError('Сеть недоступна. Скачайте пакет на устройство.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0F172A] p-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#1F5A8E] p-2 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wide">
                Пакет «Готово»
              </h3>
              <p className="font-mono text-xs text-slate-400">
                PDF + .txt + ссылка · без звонков и ожидания
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

        <div className="space-y-4 p-6 text-xs">
          <div className="space-y-1 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950">
            <p className="font-mono text-[11px] text-sky-900">
              {concreteGrade} · {calculation.concreteVolumeM3} м³ · арматура{' '}
              {calculation.rebarWeightKg} кг · {regionLabel}
            </p>
            <p className="text-[11px] text-sky-800">
              Ориентир:{' '}
              <strong>
                {formatCurrency(calculation.itemizedCosts.total, currency)}
              </strong>
              {' · '}
              {structureLabel} · {dimsLabel}
            </p>
          </div>

          {done ? (
            <div className="space-y-3 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-9 w-9" />
              </div>
              <h4 className="text-lg font-black text-[#0F172A]">
                {done === 'mail' ? 'Письмо у вас на почте' : 'Пакет у вас'}
              </h4>
              <p className="mx-auto max-w-sm text-xs text-slate-600">
                Отправьте PDF или ссылку прорабу / на РБУ сами — сервис ничего не
                перезванивает и не хранит заявку на менеджера.
              </p>
              {shareUrl ? (
                <p className="break-all rounded-lg bg-slate-50 p-2 font-mono text-[10px] text-slate-600">
                  {shareUrl}
                </p>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[#0F172A] py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Вернуться к калькулятору
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runPackage()}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1F5A8E] py-3.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#174771] disabled:opacity-60"
              >
                {busy === 'pkg' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Скачать всё: PDF + .txt + ссылка
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void runPdf()}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <FileText className="h-3.5 w-3.5 text-sky-600" />
                  PDF
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={runTxt}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  .txt
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void runCopyLink()}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <Link2 className="h-3.5 w-3.5 text-violet-600" />
                  Ссылка
                </button>
              </div>

              <form
                onSubmit={(e) => void runMail(e)}
                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Mail className="h-3.5 w-3.5" />
                  Отправить пакет себе на email (по желанию)
                </label>
                <input
                  type="email"
                  placeholder="you@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F5A8E]"
                />
                {mailError ? (
                  <p className="text-[11px] font-semibold text-rose-600">{mailError}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Одно письмо только вам: ссылка + текст спецификации. Без рассылок.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F172A] py-2.5 font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'mail' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Прислать мне
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
