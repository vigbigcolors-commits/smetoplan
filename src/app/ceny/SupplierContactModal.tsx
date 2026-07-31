'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Mail, Phone, X } from 'lucide-react';
import type { SupplierCostBreakdown } from '@/domain/markets/suppliers';
import { KIND_LABELS } from '@/domain/markets/suppliers';

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

export function buildSupplierInquiryText(opts: {
  supplierName: string;
  regionLabel: string;
  concreteM3: number;
  rebarKg: number;
  formworkM2: number;
  totalRub: number | null;
}): string {
  return [
    `Здравствуйте! Запрос с Smetoplan.ru`,
    `Поставщик: ${opts.supplierName}`,
    `Регион: ${opts.regionLabel}`,
    `Бетон: ${opts.concreteM3} м³`,
    `Арматура: ${opts.rebarKg} кг`,
    `Опалубка (ориентир): ${opts.formworkM2} м²`,
    opts.totalRub != null
      ? `Ориентир по вашей котировке: ${formatRub(Math.round(opts.totalRub))}`
      : null,
    ``,
    `Прошу подтвердить актуальный прайс, доставку и сроки.`,
  ]
    .filter(Boolean)
    .join('\n');
}

interface SupplierContactModalProps {
  open: boolean;
  onClose: () => void;
  row: SupplierCostBreakdown | null;
  regionLabel: string;
  concreteM3: number;
  rebarKg: number;
  formworkM2: number;
}

export function SupplierContactModal({
  open,
  onClose,
  row,
  regionLabel,
  concreteM3,
  rebarKg,
  formworkM2,
}: SupplierContactModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open || !row) return null;

  const s = row.supplier;
  const text = buildSupplierInquiryText({
    supplierName: s.name,
    regionLabel,
    concreteM3,
    rebarKg,
    formworkM2,
    totalRub: row.totalRub,
  });

  const mailHref = s.email
    ? `mailto:${s.email}?subject=${encodeURIComponent(`Запрос прайса — ${s.name}`)}&body=${encodeURIComponent(text)}`
    : null;
  const telHref = s.phone ? `tel:${s.phone.replace(/[^\d+]/g, '')}` : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="supplier-contact-title"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {KIND_LABELS[s.kind]}
          {s.city ? ` · ${s.city}` : ''}
        </p>
        <h2
          id="supplier-contact-title"
          className="mt-1 pr-8 text-xl font-bold text-[#0B132B]"
        >
          {s.name}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Готовый текст заявки с объёмами из расчёта. Клик по рекламе не нужен —
          пишите напрямую.
        </p>

        <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
          {text}
        </pre>

        <div className="mt-4 flex flex-wrap gap-2">
          {telHref && (
            <a
              href={telHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5A8E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#174a75]"
            >
              <Phone className="h-4 w-4" />
              Позвонить
            </a>
          )}
          {mailHref && (
            <a
              href={mailHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-[#3D6494]"
            >
              <Mail className="h-4 w-4" />
              E-mail
            </a>
          )}
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-[#3D6494]"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Скопировано' : 'Копировать текст'}
          </button>
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-[#3D6494]"
            >
              Сайт
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {!telHref && !mailHref && !s.url && (
          <p className="mt-3 text-xs text-amber-700">
            Контактов в фиде пока нет — скопируйте текст и отправьте через
            известный канал поставщика.
          </p>
        )}
      </div>
    </div>
  );
}
