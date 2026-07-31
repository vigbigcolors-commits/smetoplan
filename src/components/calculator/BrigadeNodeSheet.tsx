'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { Download, FileOutput, Printer } from 'lucide-react';
import type { StructureType } from '@/lib/types';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import { ToolButton, ToolPanelShell } from '@/components/calculator/ui/ToolPanelShell';
import { PRINT_BRIGADE_A4_EVENT } from '@/lib/site-events';

const TYPE_LABEL: Record<StructureType, string> = {
  slab: 'Плита',
  strip: 'Лента',
  beam: 'Балка',
  pier: 'Сваи',
  wall: 'Стена',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSectionSvg(p: {
  structureType: StructureType;
  depth: number;
  ribbon: number;
  cover: number;
  layers: number;
}): string {
  const W = 360;
  const H = 220;
  const bodyW = Math.min(220, Math.max(90, p.ribbon * 180));
  const bodyH = Math.min(120, Math.max(50, p.depth * 160));
  const x0 = (W - bodyW) / 2;
  const y0 = (H - bodyH) / 2 + 6;
  const a = Math.min(p.cover * 0.85, bodyH / 4);
  const bars: string[] = [];
  const n = Math.max(1, Math.min(2, p.layers));
  for (let i = 0; i < n; i++) {
    const y = i === 0 ? y0 + a : y0 + bodyH - a;
    bars.push(
      `<line x1="${x0 + 14}" y1="${y}" x2="${x0 + bodyW - 14}" y2="${y}" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />`
    );
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" rx="10" fill="#0B132B"/>
    <text x="16" y="22" fill="#94A3B8" font-size="11" font-family="monospace">РАЗРЕЗ · a=${p.cover} мм</text>
    <rect x="${x0}" y="${y0}" width="${bodyW}" height="${bodyH}" fill="#64748B" stroke="#E2E8F0" stroke-width="2" rx="2"/>
    ${bars.join('')}
    <text x="${x0}" y="${y0 + bodyH + 18}" fill="#CBD5E1" font-size="11" font-family="monospace">H=${p.depth} м · b≈${p.ribbon} м · ${p.structureType}</text>
  </svg>`;
}

function buildPlanSvg(p: {
  structureType: StructureType;
  length: number;
  width: number;
  ribbon: number;
}): string {
  const W = 360;
  const H = 220;
  const pad = 36;
  const scale = Math.min(
    (W - pad * 2) / Math.max(p.length, 1),
    (H - pad * 2) / Math.max(p.width, 1)
  );
  const rw = p.length * scale;
  const rh = p.width * scale;
  const x = (W - rw) / 2;
  const y = (H - rh) / 2;
  const t = Math.max(4, Math.min(18, p.ribbon * scale));

  let shape = '';
  if (p.structureType === 'strip') {
    shape = `
      <rect x="${x}" y="${y}" width="${rw}" height="${t}" fill="#38BDF8" opacity="0.85"/>
      <rect x="${x}" y="${y + rh - t}" width="${rw}" height="${t}" fill="#38BDF8" opacity="0.85"/>
      <rect x="${x}" y="${y}" width="${t}" height="${rh}" fill="#38BDF8" opacity="0.85"/>
      <rect x="${x + rw - t}" y="${y}" width="${t}" height="${rh}" fill="#38BDF8" opacity="0.85"/>
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="none" stroke="#7DD3FC" stroke-width="1.5" stroke-dasharray="4 3"/>
    `;
  } else if (p.structureType === 'wall') {
    shape = `<rect x="${x}" y="${y + rh / 2 - t / 2}" width="${rw}" height="${Math.max(t, 10)}" fill="#38BDF8" opacity="0.9"/>`;
  } else {
    shape = `
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#38BDF8" opacity="0.25" stroke="#7DD3FC" stroke-width="2"/>
      <line x1="${x + 8}" y1="${y + 14}" x2="${x + rw - 8}" y2="${y + 14}" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="${x + 8}" y1="${y + rh - 14}" x2="${x + rw - 8}" y2="${y + rh - 14}" stroke="#F59E0B" stroke-width="1.5"/>
    `;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" rx="10" fill="#0B132B"/>
    <text x="16" y="22" fill="#94A3B8" font-size="11" font-family="monospace">ПЛАН ${p.length}×${p.width} м</text>
    ${shape}
    <text x="${x}" y="${y + rh + 18}" fill="#CBD5E1" font-size="11" font-family="monospace">L=${p.length} · B=${p.width}</text>
  </svg>`;
}

function buildBrigadeA4Html(input: {
  structureType: StructureType;
  length: number;
  width: number;
  depth: number;
  ribbon: number;
  diameterMm: number;
  spacingMm: number;
  layers: number;
  calculation: ExtendedCalculationResult;
}): string {
  const {
    structureType,
    length,
    width,
    depth,
    ribbon,
    diameterMm,
    spacingMm,
    layers,
    calculation,
  } = input;
  const cover = calculation.coverMm;
  const lap = calculation.lapMm;
  const bendMm = 12 * diameterMm;
  const typeRu = TYPE_LABEL[structureType];
  const pieces = calculation.rebarPieces.slice(0, 8);
  const pieceRows = pieces
    .map(
      (p) =>
        `<tr>
          <td>${escapeHtml(p.mark)}</td>
          <td>${escapeHtml(p.role)}</td>
          <td class="num">Ø${p.diameterMm}</td>
          <td class="num">${p.lengthMm}</td>
          <td class="num">${p.count}</td>
          <td class="num">${Math.round(p.weightKg * 10) / 10}</td>
        </tr>`
    )
    .join('');

  const sectionSvg = buildSectionSvg({
    structureType,
    depth,
    ribbon,
    cover,
    layers,
  });
  const planSvg = buildPlanSvg({ structureType, length, width, ribbon });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Smetoplan · узел ${escapeHtml(typeRu)} · А4</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #0f172a;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      background: #fff;
    }
    .sheet { max-width: 190mm; margin: 0 auto; padding: 8px; }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 3px solid #1f5a8e;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #1f5a8e; }
    h1 { margin: 4px 0 0; font-size: 18px; letter-spacing: .04em; text-transform: uppercase; }
    .meta { margin-top: 4px; font-family: ui-monospace, monospace; font-size: 10px; color: #64748b; }
    .stamp {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: right;
      min-width: 140px;
      background: #f8fafc;
    }
    .stamp b { display: block; font-size: 16px; font-family: ui-monospace, monospace; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px;
      background: #fff;
    }
    .card h2 {
      margin: 0 0 8px;
      font-size: 10px;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #64748b;
    }
    svg { width: 100%; height: auto; display: block; }
    .kpi {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 8px;
    }
    ul { margin: 0; padding-left: 16px; }
    li { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e2e8f0; padding: 5px 6px; text-align: left; }
    th { background: #0f172a; color: #e2e8f0; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
    td.num { font-family: ui-monospace, monospace; text-align: right; }
    .note {
      margin-top: 12px;
      padding: 8px 10px;
      border-radius: 8px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #9a3412;
      font-size: 10px;
    }
    .foot {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 9px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">Smetoplan · узел для бригады</div>
        <h1>${escapeHtml(typeRu)} · ${length}×${width}×${depth} м</h1>
        <div class="meta">
          a=${cover} мм · Ø${diameterMm} шаг ${spacingMm} мм · ${layers} сетки ·
          нахлёст ≈${lap} мм · отгиб ≥${bendMm} мм (12Ø)
        </div>
      </div>
      <div class="stamp">
        <span style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Из расчёта</span>
        <b>${calculation.concreteVolumeM3} м³</b>
        <span style="font-family:ui-monospace,monospace">${calculation.rebarWeightKg} кг · ${escapeHtml(calculation.concreteClassB)}</span>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <h2>План (ориентир)</h2>
        ${planSvg}
      </div>
      <div class="card">
        <h2>Разрез · защитный слой</h2>
        ${sectionSvg}
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <h2>Ключевые числа каркаса</h2>
        <div class="kpi">Ø${diameterMm} / ${spacingMm} мм</div>
        <ul>
          <li>Защитный слой <b>a = ${cover} мм</b></li>
          <li>Нахлёст ориентир <b>l ≈ ${lap} мм</b> (~40Ø)</li>
          <li>Слоёв сеток: <b>${layers}</b></li>
          <li>Бетон: <b>${calculation.concreteVolumeM3} м³</b> · ${escapeHtml(calculation.concreteClassB)}</li>
          <li>Арматура: <b>${calculation.rebarWeightKg} кг</b></li>
          ${
            calculation.stripLengthM > 0
              ? `<li>Осевая длина ленты: <b>${calculation.stripLengthM.toFixed(1)} м</b></li>`
              : ''
          }
          <li>Отгиб у края: <b>≥ ${bendMm} мм</b> (12Ø, ориентир)</li>
          <li>Хлыстов ориентир: <b>${calculation.rebarStockBarsApprox}</b> × ${calculation.rebarStockLengthM} м</li>
        </ul>
      </div>
      <div class="card">
        <h2>Контроль на объекте</h2>
        <ul>
          <li>Проверить a по фиксаторам до бетонирования</li>
          <li>Нахлёсты разнести вразбежку, не в одном сечении</li>
          <li>Не опирать каркас на грунт — только на фиксаторы/подкладки</li>
          <li>σ грунта в расчёте: <b>${calculation.soilPressureKpa} кПа</b> (не ИГИ)</li>
          <li>Уход за бетоном ориентир 7 суток · полный набор ~28 суток</li>
        </ul>
      </div>
    </div>

    ${
      pieces.length
        ? `<div class="card" style="margin-top:12px">
      <h2>Раскрой (фрагмент ведомости)</h2>
      <table>
        <thead>
          <tr>
            <th>Марка</th><th>Назначение</th><th>Ø</th><th>L, мм</th><th>N</th><th>кг</th>
          </tr>
        </thead>
        <tbody>${pieceRows}</tbody>
      </table>
    </div>`
        : ''
    }

    <div class="note">
      Ориентир для бригады по цифрам калькулятора Smetoplan. Не заменяет раздел КЖ, схему армирования проекта и акты скрытых работ.
    </div>
    <div class="foot">
      <span>smetoplan.ru</span>
      <span>${new Date().toLocaleString('ru-RU')}</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 300);
    });
  <\/script>
</body>
</html>`;
}

export function BrigadeNodeSheet({
  structureType,
  dimensions,
  diameterMm,
  spacingMm,
  layers,
  calculation,
}: {
  structureType: StructureType;
  dimensions: { length: number; width: number; depth: number; ribbon?: number };
  diameterMm: number;
  spacingMm: number;
  layers: number;
  calculation: ExtendedCalculationResult;
}) {
  const ribbon =
    dimensions.ribbon && dimensions.ribbon > 0
      ? dimensions.ribbon
      : structureType === 'strip'
        ? 0.4
        : structureType === 'wall'
          ? dimensions.width
          : Math.min(dimensions.width, Math.max(0.4, dimensions.depth));

  const printPayload = useMemo(
    () => ({
      structureType,
      length: dimensions.length,
      width: dimensions.width,
      depth: dimensions.depth,
      ribbon,
      diameterMm,
      spacingMm,
      layers,
      calculation,
    }),
    [
      structureType,
      dimensions.length,
      dimensions.width,
      dimensions.depth,
      ribbon,
      diameterMm,
      spacingMm,
      layers,
      calculation,
    ]
  );

  const openPrint = useCallback(() => {
    const html = buildBrigadeA4Html(printPayload);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'width=900,height=1200');
    if (!w) {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('title', 'Печать узла А4');
      iframe.style.cssText =
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            URL.revokeObjectURL(url);
            iframe.remove();
          }, 2000);
        }
      };
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [printPayload]);

  useEffect(() => {
    const onPrint = () => openPrint();
    window.addEventListener(PRINT_BRIGADE_A4_EVENT, onPrint);
    return () => window.removeEventListener(PRINT_BRIGADE_A4_EVENT, onPrint);
  }, [openPrint]);

  const downloadHtml = () => {
    const html = buildBrigadeA4Html(printPayload);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smetoplan_uzel_${structureType}_${dimensions.length}x${dimensions.width}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cover = calculation.coverMm;
  const lap = calculation.lapMm;
  const bendMm = 12 * diameterMm;

  return (
    <ToolPanelShell
      id="tool-nodes"
      title="Узлы А4 для бригады"
      subtitle="Разрез, план и раскрой с числами из расчёта — на опалубку или в карман. Не заменяет КЖ."
      icon={FileOutput}
      accent="steel"
      badge="печать"
      delayMs={120}
      actions={
        <>
          <ToolButton onClick={downloadHtml} icon={Download} variant="ghost">
            Скачать HTML
          </ToolButton>
          <ToolButton onClick={openPrint} icon={Printer} variant="secondary">
            Печать А4
          </ToolButton>
        </>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F8FAFC] via-white to-sky-50/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1F5A8E]/30 pb-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1F5A8E]">
              Smetoplan · узел для бригады
            </p>
            <h4 className="mt-1 text-base font-extrabold uppercase tracking-wide text-[#0F172A]">
              {TYPE_LABEL[structureType]} · {dimensions.length}×{dimensions.width}×
              {dimensions.depth} м
            </h4>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              a={cover} мм · Ø{diameterMm} шаг {spacingMm} мм · {layers} сетки · нахлёст ≈{lap} мм ·
              отгиб ≥{bendMm} мм
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Из расчёта
            </div>
            <div className="font-mono text-lg font-extrabold text-[#0F172A]">
              {calculation.concreteVolumeM3} м³
            </div>
            <div className="font-mono text-[11px] text-slate-600">
              {calculation.rebarWeightKg} кг · {calculation.concreteClassB}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-[#0B132B] p-3 shadow-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              План
            </p>
            <div
              dangerouslySetInnerHTML={{
                __html: buildPlanSvg({
                  structureType,
                  length: dimensions.length,
                  width: dimensions.width,
                  ribbon,
                }),
              }}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-[#0B132B] p-3 shadow-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Разрез · защитный слой
            </p>
            <div
              dangerouslySetInnerHTML={{
                __html: buildSectionSvg({
                  structureType,
                  depth: dimensions.depth,
                  ribbon,
                  cover,
                  layers,
                }),
              }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Ключевые числа
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A]">
              Ø{diameterMm} / {spacingMm} мм
            </div>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-700">
              <li>
                Защитный слой a = <b>{cover} мм</b>
              </li>
              <li>
                Нахлёст ориентир l ≈ <b>{lap} мм</b> (~40Ø)
              </li>
              <li>
                Отгиб у края ≥ <b>{bendMm} мм</b> (12Ø)
              </li>
              <li>
                Слоёв сеток: <b>{layers}</b>
              </li>
              <li>
                Хлыстов ≈ <b>{calculation.rebarStockBarsApprox}</b> ×{' '}
                {calculation.rebarStockLengthM} м
              </li>
              {calculation.stripLengthM > 0 && (
                <li>
                  Осевая длина ленты: <b>{calculation.stripLengthM.toFixed(1)} м</b>
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Контроль на объекте
            </div>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-700">
              <li>Фиксаторы a до бетонирования</li>
              <li>Нахлёсты вразбежку</li>
              <li>Каркас не на грунт — только на фиксаторы</li>
              <li>
                σ в расчёте: <b>{calculation.soilPressureKpa} кПа</b> (не ИГИ)
              </li>
              <li>Уход 7 суток · прочность ориентир 28 суток</li>
            </ul>
          </div>
        </div>

        {calculation.rebarPieces.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-[#0F172A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Раскрой (фрагмент)
            </div>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F4F7FA] font-mono text-[10px] uppercase text-slate-500">
                  <th className="px-3 py-2">Марка</th>
                  <th className="px-3 py-2">Назначение</th>
                  <th className="px-3 py-2">Ø</th>
                  <th className="px-3 py-2">L мм</th>
                  <th className="px-3 py-2">N</th>
                  <th className="px-3 py-2 text-right">кг</th>
                </tr>
              </thead>
              <tbody>
                {calculation.rebarPieces.slice(0, 6).map((p) => (
                  <tr
                    key={`${p.mark}-${p.lengthMm}-${p.count}`}
                    className="border-t border-slate-100 font-mono"
                  >
                    <td className="px-3 py-1.5 font-bold text-[#1F5A8E]">{p.mark}</td>
                    <td className="px-3 py-1.5 font-sans text-slate-600">{p.role}</td>
                    <td className="px-3 py-1.5">{p.diameterMm}</td>
                    <td className="px-3 py-1.5">{p.lengthMm}</td>
                    <td className="px-3 py-1.5">{p.count}</td>
                    <td className="px-3 py-1.5 text-right">
                      {Math.round(p.weightKg * 10) / 10}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
          Ориентир для бригады. Не заменяет КЖ и схемы армирования проекта.
        </p>
      </div>
    </ToolPanelShell>
  );
}
