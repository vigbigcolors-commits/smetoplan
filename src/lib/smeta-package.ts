import type { CalculatorDraft } from '@/lib/calculator-draft';
import type { ExtendedCalculationResult } from '@/lib/calculator';
import { formatCurrency } from '@/lib/calculator';
import type { Currency } from '@/lib/types';
import { buildShareUrl } from '@/lib/calculator-share';
import { buildRbuSpecText, downloadTextFile } from '@/lib/rbu-spec';
import { buildSmetaPdfBytes, downloadPdfBytes } from '@/lib/smeta-pdf';

export interface SmetaPackageContext {
  draft: CalculatorDraft;
  calculation: ExtendedCalculationResult;
  regionLabel: string;
  structureLabel: string;
  dimsLabel: string;
  concreteGrade: string;
  currency: Currency;
}

export async function buildPackageShareUrl(ctx: SmetaPackageContext): Promise<string> {
  return buildShareUrl(ctx.draft);
}

export function buildPackageSpecText(ctx: SmetaPackageContext): string {
  return buildRbuSpecText({
    regionLabel: ctx.regionLabel,
    concreteGrade: ctx.concreteGrade,
    concreteVolumeM3: ctx.calculation.concreteVolumeM3,
    rebarWeightKg: ctx.calculation.rebarWeightKg,
    formworkAreaM2: ctx.calculation.formworkAreaM2,
    totalLabel: formatCurrency(ctx.calculation.itemizedCosts.total, ctx.currency),
    dimsLabel: ctx.dimsLabel,
    structureLabel: ctx.structureLabel,
    rebarLines: (ctx.calculation.rebarPieces || []).map(
      (p) =>
        `${p.mark}; ${p.role}; Ø${p.diameterMm}; L=${p.lengthMm}мм; N=${p.count}; m=${Math.round(p.weightKg * 10) / 10}кг`
    ),
  });
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** One-click: PDF + .txt + share URL in clipboard. Fully self-serve. */
export async function downloadReadyPackage(ctx: SmetaPackageContext): Promise<{
  shareUrl: string;
  copied: boolean;
}> {
  const shareUrl = await buildPackageShareUrl(ctx);
  const spec = buildPackageSpecText(ctx);
  const stamp = Date.now();

  const pdfBytes = await buildSmetaPdfBytes({
    regionLabel: ctx.regionLabel,
    structureLabel: ctx.structureLabel,
    dimsLabel: ctx.dimsLabel,
    concreteGrade: ctx.concreteGrade,
    currency: ctx.currency,
    calculation: ctx.calculation,
    shareUrl,
  });

  downloadPdfBytes(`smetoplan-smeta-${stamp}.pdf`, pdfBytes);
  downloadTextFile(`smetoplan-spec-rbu-${stamp}.txt`, spec);
  const copied = await copyTextToClipboard(shareUrl);
  return { shareUrl, copied };
}

export async function downloadPdfOnly(ctx: SmetaPackageContext): Promise<string> {
  const shareUrl = await buildPackageShareUrl(ctx);
  const pdfBytes = await buildSmetaPdfBytes({
    regionLabel: ctx.regionLabel,
    structureLabel: ctx.structureLabel,
    dimsLabel: ctx.dimsLabel,
    concreteGrade: ctx.concreteGrade,
    currency: ctx.currency,
    calculation: ctx.calculation,
    shareUrl,
  });
  downloadPdfBytes(`smetoplan-smeta-${Date.now()}.pdf`, pdfBytes);
  return shareUrl;
}
