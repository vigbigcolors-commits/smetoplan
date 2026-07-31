'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ExternalLink,
  Info,
  MessageSquare,
  Phone,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import type { PriceRegionId } from '@/domain/norms/tables';
import {
  BADGE_LABELS,
  KIND_LABELS,
  costForSupplier,
  withBenchmarkDelta,
  compareStats,
  pickQuote,
  type SupplierCostBreakdown,
  type SupplierKind,
} from '@/domain/markets/suppliers';
import { buildRegionalSupplySnapshot } from '@/domain/markets';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';
import { calculatorHref } from '@/lib/calculator-routes';
import { CENY_REGIONS, cenyHref } from '@/lib/ceny-regions';
import { SupplierContactModal } from './SupplierContactModal';

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

interface CenyClientProps {
  regionId: PriceRegionId;
  regionSlug: string;
  h1: string;
  intro: string;
  concreteM3: number;
  rebarKg: number;
  formworkM2: number;
}

export function CenyClient({
  regionId,
  regionSlug,
  h1,
  intro,
  concreteM3: initialVol,
  rebarKg: initialRebar,
  formworkM2: initialForm,
}: CenyClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [concreteM3, setConcreteM3] = useState(initialVol);
  const [rebarKg, setRebarKg] = useState(initialRebar);
  const [formworkM2, setFormworkM2] = useState(initialForm);
  const [kindFilter, setKindFilter] = useState<SupplierKind | 'all'>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [contactRow, setContactRow] = useState<SupplierCostBreakdown | null>(null);

  const { data: market, loading } = useMarketQuotes(regionId);

  const syncQuery = useCallback(
    (vol: number, rebar: number, form: number) => {
      const q = new URLSearchParams();
      if (vol > 0) q.set('vol', String(vol));
      if (rebar > 0) q.set('rebar', String(rebar));
      if (form > 0) q.set('form', String(form));
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const t = window.setTimeout(
      () => syncQuery(concreteM3, rebarKg, formworkM2),
      400,
    );
    return () => window.clearTimeout(t);
  }, [concreteM3, rebarKg, formworkM2, syncQuery]);

  const snap = useMemo(
    () =>
      buildRegionalSupplySnapshot(regionId, {
        concreteVolumeM3: concreteM3,
        rebarWeightKg: rebarKg,
        formworkAreaM2: formworkM2,
        sandTons: 0,
        gravelTons: 0,
      }),
    [regionId, concreteM3, rebarKg, formworkM2],
  );

  const volume = useMemo(
    () => ({
      concreteM3,
      rebarTon: rebarKg / 1000,
      formworkM2,
    }),
    [concreteM3, rebarKg, formworkM2],
  );

  const rows = useMemo(() => {
    if (!market || market.empty) return [];
    let list = market.suppliers;
    if (kindFilter !== 'all') {
      list = list.filter((s) => s.kind === kindFilter);
    }
    const costs = withBenchmarkDelta(
      list.map((s) => costForSupplier(s, volume, 'B25')),
      snap.materialsTotal,
    );
    return costs.sort((a, b) => {
      const av = a.totalRub ?? Number.POSITIVE_INFINITY;
      const bv = b.totalRub ?? Number.POSITIVE_INFINITY;
      return sortAsc ? av - bv : bv - av;
    });
  }, [market, kindFilter, volume, snap.materialsTotal, sortAsc]);

  const topByPrice = useMemo(() => rows.slice(0, 3), [rows]);
  const featured = useMemo(
    () => rows.filter((r) => r.supplier.featured),
    [rows],
  );
  const stats = compareStats(rows);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <Link href="/ceny" className="font-semibold text-[#1F5A8E] hover:underline">
          Цены
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">{snap.regionLabel}</span>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.14em] text-[#3D6494]">
            SMETOPLAN · РЫНОК
          </p>
          {market?.asOf && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <RefreshCw className="h-3 w-3" />
              Прайс обновлён {market.asOf}
            </span>
          )}
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0B132B] sm:text-4xl">
          {h1}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          {intro}
        </p>
      </header>

      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-white lg:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ориентир Smetoplan
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">
            {formatRub(snap.materialsTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">бетон + арматура + опалубка</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Объём сравнения
          </p>
          <p className="mt-1 font-mono text-lg font-bold">
            {concreteM3} м³ · {(rebarKg / 1000).toFixed(2)} т
          </p>
          <p className="mt-1 text-xs text-slate-400">опалубка {formworkM2} м²</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Рынок (фид)
          </p>
          <p className="mt-1 text-lg font-bold">
            {stats.count > 0 ? `${stats.count} поставщиков` : 'нет данных'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.minTotal != null
              ? `от ${formatRub(stats.minTotal)}`
              : 'ожидаем котировки'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ед. ориентир
          </p>
          <p className="mt-1 font-mono text-sm font-bold">
            Б {formatRub(snap.prices.concretePerM3)}/м³
          </p>
          <p className="font-mono text-sm text-slate-300">
            А {formatRub(snap.prices.rebarPerTon)}/т
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Объём для сравнения (из калькулятора или вручную)
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Бетон, м³
            <input
              type="number"
              min={0}
              step={0.1}
              value={concreteM3}
              onChange={(e) => setConcreteM3(Number(e.target.value) || 0)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-semibold"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Арматура, кг
            <input
              type="number"
              min={0}
              step={1}
              value={rebarKg}
              onChange={(e) => setRebarKg(Number(e.target.value) || 0)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-semibold"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Опалубка, м²
            <input
              type="number"
              min={0}
              step={1}
              value={formworkM2}
              onChange={(e) => setFormworkM2(Number(e.target.value) || 0)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-semibold"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {CENY_REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={cenyHref(r.slug, {
                vol: concreteM3,
                rebar: rebarKg,
                form: formworkM2,
              })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                r.slug === regionSlug
                  ? 'border-[#1F5A8E] bg-[#1F5A8E] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#3D6494]'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Загрузка котировок…</p>}

      {!loading && topByPrice.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <h2 className="text-lg font-bold text-[#0B132B]">
              Лучшие по цене на ваш объём
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {topByPrice.map((row, i) => {
              const c = pickQuote(row.supplier.quotes, 'concrete_m3', 'B25');
              const r = pickQuote(row.supplier.quotes, 'rebar_ton');
              return (
                <article
                  key={row.supplier.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    #{i + 1} по доступным позициям
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {row.supplier.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {KIND_LABELS[row.supplier.kind]}
                    {row.supplier.city ? ` · ${row.supplier.city}` : ''}
                  </p>
                  <div className="mt-3 space-y-1 font-mono text-xs text-slate-600">
                    {c && <p>Бетон B25: {formatRub(c.priceRub)}/м³</p>}
                    {r && <p>Арматура: {formatRub(r.priceRub)}/т</p>}
                    {!c && !r && <p>Нет единичных цен</p>}
                  </div>
                  <p className="mt-3 font-mono text-xl font-extrabold text-emerald-700">
                    {row.totalRub != null
                      ? formatRub(Math.round(row.totalRub))
                      : '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setContactRow(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F5A8E] px-3 py-2 text-xs font-bold text-white hover:bg-[#174a75]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Написать
                    </button>
                    {row.supplier.phone && (
                      <a
                        href={`tel:${row.supplier.phone.replace(/[^\d+]/g, '')}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Звонок
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!loading && featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold text-[#0B132B]">
            Известные поставщики региона
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            Кураторский список работающих РБУ и баз с публичным прайсом — не
            пользовательский рейтинг.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((row) => (
              <article
                key={`f-${row.supplier.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3D6494]/25 bg-sky-50/70 px-4 py-3"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{row.supplier.name}</h3>
                  <p className="text-xs text-slate-600">
                    {row.supplier.badge
                      ? BADGE_LABELS[row.supplier.badge]
                      : KIND_LABELS[row.supplier.kind]}
                    {row.supplier.phone ? ` · ${row.supplier.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-extrabold text-emerald-700">
                    {row.totalRub != null
                      ? formatRub(Math.round(row.totalRub))
                      : '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactRow(row)}
                    className="text-xs font-bold text-[#1F5A8E] hover:underline"
                  >
                    Написать
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Тип
          <select
            value={kindFilter}
            onChange={(e) =>
              setKindFilter(e.target.value as SupplierKind | 'all')
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
          >
            <option value="all">Все</option>
            <option value="rbu">РБУ</option>
            <option value="store">Магазин</option>
            <option value="wholesale">Опт</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Сортировка
          <select
            value={sortAsc ? 'asc' : 'desc'}
            onChange={(e) => setSortAsc(e.target.value === 'asc')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
          >
            <option value="asc">Итог: дешевле → дороже</option>
            <option value="desc">Итог: дороже → дешевле</option>
          </select>
        </label>
        <Link
          href={calculatorHref()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#1F5A8E] px-4 py-2 text-sm font-bold text-white hover:bg-[#174a75]"
        >
          Открыть калькулятор
        </Link>
      </div>

      {!loading && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-800">
            В этом регионе пока нет котировок в фиде
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            Ориентир Smetoplan выше. Для Москвы и СПб цены подтягиваются с
            публичных страниц поставщиков ежедневным fetch.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <th className="px-3 py-3 sm:px-4">Поставщик</th>
                <th className="px-3 py-3">₽/м³ B25</th>
                <th className="px-3 py-3">₽/т</th>
                <th className="px-3 py-3 text-right">Итог по объёму</th>
                <th className="px-3 py-3 text-right">Δ ориентир</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const c = pickQuote(row.supplier.quotes, 'concrete_m3', 'B25');
                const r = pickQuote(row.supplier.quotes, 'rebar_ton');
                const sourceNote =
                  c?.note || r?.note || row.supplier.url || null;
                return (
                  <tr
                    key={row.supplier.id}
                    className={`border-t border-slate-100 ${
                      idx % 2 ? 'bg-[#F8FAFC]' : 'bg-white'
                    }`}
                  >
                    <td className="px-3 py-3 sm:px-4">
                      <p className="font-sans font-bold text-slate-900">
                        {row.supplier.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {KIND_LABELS[row.supplier.kind]}
                        {row.supplier.badge
                          ? ` · ${BADGE_LABELS[row.supplier.badge]}`
                          : ''}
                      </p>
                      {row.supplier.url && (
                        <a
                          href={row.supplier.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F5A8E] hover:underline"
                        >
                          Сайт
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {sourceNote && (
                        <p className="mt-1 max-w-[220px] truncate text-[10px] text-slate-400" title={sourceNote}>
                          {sourceNote.replace(/^Публичный прайс\s+/i, 'Источник: ')}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                      {c ? formatRub(c.priceRub) : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                      {r ? formatRub(r.priceRub) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-[#0F172A]">
                      {row.totalRub != null
                        ? formatRub(Math.round(row.totalRub))
                        : '—'}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-bold ${
                        row.deltaToBenchmarkPct == null
                          ? 'text-slate-400'
                          : row.deltaToBenchmarkPct <= 0
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {row.deltaToBenchmarkPct == null
                        ? '—'
                        : `${row.deltaToBenchmarkPct > 0 ? '+' : ''}${row.deltaToBenchmarkPct.toFixed(0)}%`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setContactRow(row)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1F5A8E]"
                      >
                        Написать
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex gap-2 rounded-xl border border-slate-200 bg-[#F4F7FA] px-4 py-3 text-sm text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#3D6494]" />
        <p>
          Цены сняты с публичных страниц поставщиков (allow-list) или из
          каталожного fallback, если сайт не отдал разбор. Это не оферта и не
          КП — перед заказом уточняйте прайс и доставку. Смета в калькуляторе
          остаётся на ориентире Smetoplan.
        </p>
      </div>

      <SupplierContactModal
        open={contactRow != null}
        onClose={() => setContactRow(null)}
        row={contactRow}
        regionLabel={snap.regionLabel}
        concreteM3={concreteM3}
        rebarKg={rebarKg}
        formworkM2={formworkM2}
      />
    </div>
  );
}
