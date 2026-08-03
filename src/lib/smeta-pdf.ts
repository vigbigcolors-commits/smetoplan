import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import { formatCurrency } from '@/lib/calculator';
import type { Currency } from '@/lib/types';

const FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';
const FONT_BOLD_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf';

let fontCache: ArrayBuffer | null = null;
let fontBoldCache: ArrayBuffer | null = null;

async function loadFontBytes(url: string, cache: 'reg' | 'bold'): Promise<ArrayBuffer> {
  if (cache === 'reg' && fontCache) return fontCache;
  if (cache === 'bold' && fontBoldCache) return fontBoldCache;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить шрифт для PDF');
  const buf = await res.arrayBuffer();
  if (cache === 'reg') fontCache = buf;
  else fontBoldCache = buf;
  return buf;
}

export interface SmetaPdfInput {
  regionLabel: string;
  structureLabel: string;
  dimsLabel: string;
  concreteGrade: string;
  currency: Currency;
  calculation: ExtendedCalculationResult;
  shareUrl?: string;
}

function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

type Cursor = { page: PDFPage; y: number; pages: PDFPage[]; doc: PDFDocument };

function ensureSpace(c: Cursor, need: number, margin: number, height: number): void {
  if (c.y - need < margin) {
    const page = c.doc.addPage([595.28, 841.89]);
    c.pages.push(page);
    c.page = page;
    c.y = height - margin;
  }
}

function drawLine(
  c: Cursor,
  font: PDFFont,
  text: string,
  size: number,
  x: number,
  margin: number,
  height: number,
  color = rgb(0.1, 0.12, 0.18)
): void {
  ensureSpace(c, size + 4, margin, height);
  c.page.drawText(text, { x, y: c.y, size, font, color });
  c.y -= size + 4;
}

/**
 * Branded smeta PDF for the visitor (Cyrillic via DejaVu).
 * No calc kernel changes — uses already computed result.
 */
export async function buildSmetaPdfBytes(input: SmetaPdfInput): Promise<Uint8Array> {
  const [regBytes, boldBytes] = await Promise.all([
    loadFontBytes(FONT_URL, 'reg'),
    loadFontBytes(FONT_BOLD_URL, 'bold'),
  ]);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(new Uint8Array(regBytes), { subset: true });
  const fontBold = await doc.embedFont(new Uint8Array(boldBytes), { subset: true });

  const width = 595.28;
  const height = 841.89;
  const margin = 48;
  const maxW = width - margin * 2;

  const page0 = doc.addPage([width, height]);
  const c: Cursor = { page: page0, y: height - margin, pages: [page0], doc };

  const calc = input.calculation;
  const total = formatCurrency(calc.itemizedCosts.total, input.currency);

  drawLine(c, fontBold, 'SMETOPLAN', 18, margin, margin, height, rgb(0.12, 0.35, 0.56));
  drawLine(c, fontBold, 'Ориентировочная смета материалов', 13, margin, margin, height);
  drawLine(
    c,
    font,
    'Не является КП, офертой РБУ или проектом КЖ. Ориентир бюджета ±15–25%.',
    8,
    margin,
    margin,
    height,
    rgb(0.4, 0.45, 0.5)
  );
  c.y -= 8;

  const meta = [
    `Конструкция: ${input.structureLabel}`,
    `Габариты: ${input.dimsLabel}`,
    `Регион прайса: ${input.regionLabel}`,
    `Марка бетона: ${input.concreteGrade} / ${calc.concreteClassB}`,
  ];
  for (const line of meta) {
    drawLine(c, font, line, 10, margin, margin, height);
  }
  c.y -= 6;

  drawLine(c, fontBold, 'Ключевые объёмы', 11, margin, margin, height);
  const kpis = [
    `Бетон: ${calc.concreteVolumeM3} м³`,
    `Арматура: ${calc.rebarWeightKg} кг (хлыстов ≈ ${calc.rebarStockBarsApprox})`,
    `Опалубка: ${calc.formworkAreaM2} м²`,
    `Ориентир сметы: ${total}`,
  ];
  for (const line of kpis) {
    drawLine(c, font, line, 10, margin, margin, height);
  }
  c.y -= 8;

  drawLine(c, fontBold, 'Позиции сметы', 11, margin, margin, height);
  const costLines = [
    `Бетон — ${formatCurrency(calc.itemizedCosts.concrete, input.currency)}`,
    `Арматура — ${formatCurrency(calc.itemizedCosts.rebar, input.currency)}`,
    `Опалубка — ${formatCurrency(calc.itemizedCosts.formwork, input.currency)}`,
    `Песок+щебень — ${formatCurrency(calc.itemizedCosts.sandGravel, input.currency)}`,
    `Итого материалы — ${total}`,
  ];
  for (const line of costLines) {
    drawLine(c, font, line, 9, margin, margin, height);
  }
  c.y -= 8;

  drawLine(c, fontBold, 'Раскрой арматуры', 11, margin, margin, height);
  const pieces = calc.rebarPieces || [];
  if (pieces.length === 0) {
    drawLine(c, font, '(нет позиций)', 9, margin, margin, height);
  } else {
    for (const p of pieces.slice(0, 40)) {
      const line = `${p.mark} · ${p.role} · Ø${p.diameterMm} · L=${p.lengthMm} мм · N=${p.count} · ${Math.round(p.weightKg * 10) / 10} кг`;
      for (const w of wrapLines(font, line, 8, maxW)) {
        drawLine(c, font, w, 8, margin, margin, height);
      }
    }
    if (pieces.length > 40) {
      drawLine(c, font, `… ещё ${pieces.length - 40} позиций — смотрите CSV в калькуляторе`, 8, margin, margin, height);
    }
  }

  if (input.shareUrl) {
    c.y -= 6;
    drawLine(c, fontBold, 'Ссылка на этот расчёт', 10, margin, margin, height);
    for (const w of wrapLines(font, input.shareUrl, 7, maxW)) {
      drawLine(c, font, w, 7, margin, margin, height, rgb(0.12, 0.35, 0.56));
    }
  }

  c.y -= 10;
  drawLine(
    c,
    font,
    'Файл сформирован автоматически на smetoplan.ru. Проверьте объёмы перед заказом.',
    8,
    margin,
    margin,
    height,
    rgb(0.45, 0.48, 0.52)
  );

  return doc.save();
}

export function downloadPdfBytes(filename: string, bytes: Uint8Array): void {
  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([ab], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
