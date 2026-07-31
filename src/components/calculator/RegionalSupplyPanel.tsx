'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  MapPin,
  Info,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculator';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import type { Currency, MaterialPrices } from '@/lib/types';
import {
  buildRegionalSupplySnapshot,
  costForSupplier,
  withBenchmarkDelta,
  KIND_LABELS,
  pickQuote,
  type PriceRegionId,
} from '@/domain/markets';
import {
  MetricTile,
  ToolButton,
  ToolPanelShell,
} from '@/components/calculator/ui/ToolPanelShell';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';
import { cenyHref as buildCenyHref } from '@/lib/ceny-regions';

type PanelTab = 'benchmark' | 'suppliers' | 'compare';

interface RegionalSupplyPanelProps {
  currency: Currency;
  regionId: PriceRegionId;
  regionLabel: string;
  prices: MaterialPrices;
  calculation: ExtendedCalculationResult;
  concreteGrade: string;
  onRequestQuote: () => void;
}

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'benchmark', label: 'Ориентир' },
  { id: 'suppliers', label: 'Поставщики' },
  { id: 'compare', label: 'Сравнение' },
];

export function RegionalSupplyPanel({
  currency,
  regionId,
  regionLabel,
  prices,
  calculation,
  concreteGrade,
  onRequestQuote,
}: RegionalSupplyPanelProps) {
  const [tab, setTab] = useState<PanelTab>('benchmark');
  const { data: market, loading: marketLoading } = useMarketQuotes(regionId);

  const snap = useMemo(
    () =>
      buildRegionalSupplySnapshot(
        regionId,
        {
          concreteVolumeM3: calculation.concreteVolumeM3,
          rebarWeightKg: calculation.rebarWeightKg,
          formworkAreaM2: calculation.formworkAreaM2,
          sandTons: calculation.sandTons,
          gravelTons: calculation.gravelTons,
        },
        prices
      ),
    [regionId, prices, calculation]
  );

  const volume = useMemo(
    () => ({
      concreteM3: calculation.concreteVolumeM3,
      rebarTon: calculation.rebarWeightKg / 1000,
      formworkM2: calculation.formworkAreaM2,
    }),
    [calculation]
  );

  const supplierCosts = useMemo(() => {
    if (!market || market.empty) return [];
    const rows = market.suppliers.map((s) =>
      costForSupplier(s, volume, concreteGrade)
    );
    return withBenchmarkDelta(rows, snap.materialsTotal).sort((a, b) => {
      if (a.totalRub == null) return 1;
      if (b.totalRub == null) return -1;
      return a.totalRub - b.totalRub;
    });
  }, [market, volume, concreteGrade, snap.materialsTotal]);

  const cenyHref = useMemo(
    () =>
      buildCenyHref(regionId, {
        vol: calculation.concreteVolumeM3,
        rebar: Math.round(calculation.rebarWeightKg),
        form: calculation.formworkAreaM2,
      }),
    [regionId, calculation],
  );

  const downloadBrief = () => {
    const lines = [
      'SMETOPLAN — спецификация для РБУ (без посредников)',
      `Регион прайса: ${regionLabel}`,
      `Марка/класс: ${concreteGrade} / ${calculation.concreteClassB}`,
      `Объём бетона: ${calculation.concreteVolumeM3} м³`,
      `Арматура: ${calculation.rebarWeightKg} кг (хлыстов ≈ ${calculation.rebarStockBarsApprox})`,
      `Опалубка ориентир: ${calculation.formworkAreaM2} м²`,
      '',
      'Ориентир стоимости по прайсу региона:',
      ...snap.lines.map(
        (l) =>
          `${l.label}: ${l.qtyLabel} × ${l.unitPrice} ${currency}/${l.unit} = ${l.lineTotal} ${currency}`
      ),
      '',
      `Итого бетон+арматура+опалубка: ${snap.materialsTotal} ${currency}`,
      '',
      snap.disclaimer,
      '',
      'Раскрой:',
      ...calculation.rebarPieces.map(
        (p) =>
          `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smetoplan-spec-rbu-${regionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPanelShell
      id="tool-rbu"
      title={`Поставка · ${regionLabel}`}
      subtitle={snap.disclaimer}
      icon={MapPin}
      accent="steel"
      badge="прайс региона"
      delayMs={110}
      actions={
        <>
          <ToolButton onClick={downloadBrief} icon={Download} variant="ghost">
            Спецификация .txt
          </ToolButton>
          <ToolButton onClick={onRequestQuote} icon={FileText} variant="secondary">
            Заявка с контактами
          </ToolButton>
        </>
      }
    >
      <div
        className="mb-4 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1"
        role="tablist"
        aria-label="Режим цен"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'benchmark' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricTile
              label="Бетон / м³"
              value={formatCurrency(snap.prices.concretePerM3, currency)}
              tone="sky"
              hint={concreteGrade}
            />
            <MetricTile
              label="Арматура / т"
              value={formatCurrency(snap.prices.rebarPerTon, currency)}
              tone="amber"
            />
            <MetricTile
              label="Опалубка / м²"
              value={formatCurrency(snap.prices.formworkPerM2, currency)}
            />
            <MetricTile
              label="По вашему объёму"
              value={formatCurrency(snap.materialsTotal, currency)}
              tone="emerald"
              hint="бетон + арматура + опалубка"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <th className="px-3 py-2.5">Позиция</th>
                  <th className="px-3 py-2.5">Кол-во из расчёта</th>
                  <th className="px-3 py-2.5">Цена ед.</th>
                  <th className="px-3 py-2.5 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {snap.lines.map((l, idx) => (
                  <tr
                    key={l.id}
                    className={`border-t border-slate-100 font-mono transition hover:bg-sky-50/50 ${
                      idx % 2 ? 'bg-[#F8FAFC]' : 'bg-white'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-sans font-semibold text-slate-900">
                      {l.label}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{l.qtyLabel}</td>
                    <td className="px-3 py-2.5">
                      {formatCurrency(l.unitPrice, currency)}/{l.unit}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-[#0F172A]">
                      {formatCurrency(l.lineTotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#1F5A8E] bg-slate-50">
                  <td className="px-3 py-3 font-sans font-bold" colSpan={3}>
                    Итого ориентир (бетон + арматура + опалубка)
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-base font-extrabold text-emerald-700">
                    {formatCurrency(snap.materialsTotal, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>Прайсы регионов Smetoplan</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 normal-case tracking-normal text-slate-600">
                только справочник, без «заводов»
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {snap.peerRegions.map((r) => {
                const active = r.id === regionId;
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? 'border-[#3D6494] bg-sky-50 shadow-sm ring-1 ring-[#3D6494]/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {r.label}
                      {active ? ' · сейчас' : ''}
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                      Б {formatCurrency(r.concretePerM3, currency)}/м³
                    </p>
                    <p className="font-mono text-[11px] text-slate-600">
                      А {formatCurrency(r.rebarPerTon, currency)}/т
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-3">
          {marketLoading && (
            <p className="text-sm text-slate-500">Загрузка котировок…</p>
          )}
          {!marketLoading && (!market || market.empty) && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Котировок заводов пока нет</p>
              <p className="mt-2 leading-relaxed">
                Здесь появятся реальные РБУ и магазины после ежедневного обновления
                фида. Смета остаётся на ориентире Smetoplan — без выдуманных
                поставщиков.
              </p>
            </div>
          )}
          {!marketLoading &&
            market &&
            !market.empty &&
            market.suppliers.map((s) => {
              const c = pickQuote(s.quotes, 'concrete_m3', concreteGrade);
              const r = pickQuote(s.quotes, 'rebar_ton');
              const cost = costForSupplier(s, volume, concreteGrade);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-sans text-sm font-bold text-slate-900">
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {KIND_LABELS[s.kind]}
                        {s.city ? ` · ${s.city}` : ''}
                        {market.asOf ? ` · на ${market.asOf}` : ''}
                      </p>
                    </div>
                    {cost.totalRub != null && (
                      <p className="font-mono text-sm font-extrabold text-emerald-700">
                        {formatCurrency(Math.round(cost.totalRub), currency)}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs text-slate-700">
                    <span>
                      Бетон:{' '}
                      {c
                        ? `${formatCurrency(c.priceRub, currency)}/м³`
                        : '—'}
                    </span>
                    <span>
                      Арматура:{' '}
                      {r
                        ? `${formatCurrency(r.priceRub, currency)}/т`
                        : '—'}
                    </span>
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F5A8E] hover:underline"
                    >
                      Сайт поставщика
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          {marketLoading && (
            <p className="text-sm text-slate-500">Загрузка сравнения…</p>
          )}
          {!marketLoading && supplierCosts.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Нечего сравнивать</p>
              <p className="mt-2 leading-relaxed">
                Когда в фиде появятся котировки региона, здесь будет таблица:
                поставщик · бетон · арматура · итог по объёму · дельта к ориентиру.
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                Ориентир сейчас:{' '}
                {formatCurrency(snap.materialsTotal, currency)}
              </p>
            </div>
          )}
          {supplierCosts.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <th className="px-3 py-2.5">Поставщик</th>
                    <th className="px-3 py-2.5">Бетон</th>
                    <th className="px-3 py-2.5">Арматура</th>
                    <th className="px-3 py-2.5 text-right">Итог</th>
                    <th className="px-3 py-2.5 text-right">Δ ориентир</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierCosts.map((row, idx) => (
                    <tr
                      key={row.supplier.id}
                      className={`border-t border-slate-100 font-mono ${
                        idx % 2 ? 'bg-[#F8FAFC]' : 'bg-white'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-sans font-semibold text-slate-900">
                        {row.supplier.name}
                        <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                          {KIND_LABELS[row.supplier.kind]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.concreteRub != null
                          ? formatCurrency(Math.round(row.concreteRub), currency)
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {row.rebarRub != null
                          ? formatCurrency(Math.round(row.rebarRub), currency)
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-[#0F172A]">
                        {row.totalRub != null
                          ? formatCurrency(Math.round(row.totalRub), currency)
                          : '—'}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-bold ${
                          row.deltaToBenchmarkPct == null
                            ? 'text-slate-400'
                            : row.deltaToBenchmarkPct <= 0
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {row.deltaToBenchmarkPct == null
                          ? '—'
                          : `${row.deltaToBenchmarkPct > 0 ? '+' : ''}${row.deltaToBenchmarkPct.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#3D6494]" />
          <p>
            Смета в калькуляторе считается по ориентиру Smetoplan. Котировки
            поставщиков — отдельный слой сравнения, без подмены цифр сметы.
          </p>
        </div>
        <Link
          href={cenyHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#1F5A8E] hover:underline"
        >
          Открыть полный прайс
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </ToolPanelShell>
  );
}

/** @deprecated Use RegionalSupplyPanel — kept name alias if imported elsewhere */
export const ContractorOffersGlass = RegionalSupplyPanel;
