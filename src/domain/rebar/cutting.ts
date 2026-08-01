/** Nest cut pieces into warehouse stock bars. */

export interface CutPieceInput {
  lengthM: number;
  count: number;
}

export interface StockNestResult {
  barsNeeded: number;
  wasteM: number;
  wastePct: number;
  stockTotalM: number;
}

/**
 * Pack `count` pieces of length `pieceM` into stock bars of `stockM`.
 * If piece > stock, splice with lap (usable = stock − lap).
 */
export function stockBarsForPieces(
  pieceM: number,
  count: number,
  stockM: number,
  lapM: number
): { bars: number; wasteM: number } {
  if (count <= 0 || pieceM <= 0) return { bars: 0, wasteM: 0 };
  const stock = Math.max(1, stockM);
  const piece = Math.max(0.05, pieceM);
  const n = Math.max(0, Math.floor(count));

  if (piece <= stock + 1e-9) {
    const perBar = Math.max(1, Math.floor((stock + 1e-9) / piece));
    const bars = Math.ceil(n / perBar);
    const used = n * piece;
    return { bars, wasteM: Math.max(0, bars * stock - used) };
  }

  const usable = Math.max(0.5, stock - Math.max(0, lapM));
  const segsPerPiece = Math.ceil(piece / usable);
  const bars = n * segsPerPiece;
  const lapExtra = n * Math.max(0, segsPerPiece - 1) * lapM;
  const used = n * piece + lapExtra;
  return { bars, wasteM: Math.max(0, bars * stock - used) };
}

export function nestPiecesToStock(
  pieces: CutPieceInput[],
  stockM: number,
  lapM: number
): StockNestResult {
  // Одинаковая длина (слои L1/L2 и т.п.) режется из общих хлыстов — сначала суммируем count.
  const merged = new Map<number, number>();
  for (const p of pieces) {
    if (p.count <= 0 || p.lengthM <= 0) continue;
    const len = Math.round(p.lengthM * 1000) / 1000;
    merged.set(len, (merged.get(len) ?? 0) + Math.floor(p.count));
  }

  let barsNeeded = 0;
  let wasteM = 0;
  for (const [lengthM, count] of merged) {
    const r = stockBarsForPieces(lengthM, count, stockM, lapM);
    barsNeeded += r.bars;
    wasteM += r.wasteM;
  }
  const stockTotalM = barsNeeded * Math.max(1, stockM);
  const wastePct =
    stockTotalM > 0 ? Math.round((wasteM / stockTotalM) * 1000) / 10 : 0;
  return {
    barsNeeded,
    wasteM: Math.round(wasteM * 10) / 10,
    wastePct,
    stockTotalM: Math.round(stockTotalM * 10) / 10,
  };
}
