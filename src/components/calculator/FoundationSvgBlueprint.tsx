'use client';

import React, { useMemo } from 'react';
import type { DimensionState, RebarSpec, StructureType } from '@/lib/types';

interface FoundationSvgBlueprintProps {
  structureType: StructureType;
  dimensions: DimensionState;
  rebarSpec: RebarSpec;
  showRebar: boolean;
  soilPressureKpa?: number;
}

export function FoundationSvgBlueprint({
  structureType,
  dimensions,
  rebarSpec,
  showRebar,
  soilPressureKpa = 0,
}: FoundationSvgBlueprintProps) {
  const W = 640;
  const H = 420;
  const pad = 48;

  const drawing = useMemo(() => {
    const maxDim = Math.max(dimensions.length, dimensions.width, 1);
    const scale = Math.min((W - pad * 2) / maxDim, (H - pad * 2) / Math.max(dimensions.width, 1));
    const slabW = dimensions.length * scale;
    const slabH = dimensions.width * scale;
    const ox = (W - slabW) / 2;
    const oy = (H - slabH) / 2;

    const stepPx = showRebar && rebarSpec.spacingMm > 0
      ? Math.max(10, (rebarSpec.spacingMm / 1000) * scale)
      : 0;

    const longBars: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const crossBars: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    if (showRebar && stepPx > 0 && rebarSpec.layers > 0) {
      const inset = Math.max(6, scale * 0.05);
      for (let x = ox + inset; x <= ox + slabW - inset; x += stepPx) {
        longBars.push({ x1: x, y1: oy + inset, x2: x, y2: oy + slabH - inset });
      }
      for (let y = oy + inset; y <= oy + slabH - inset; y += stepPx) {
        crossBars.push({ x1: ox + inset, y1: y, x2: ox + slabW - inset, y2: y });
      }
    }

    const stripPaths: string[] = [];
    if (structureType === 'strip') {
      const t = Math.max(14, Math.min(slabW, slabH) * 0.12);
      stripPaths.push(
        `M${ox} ${oy} H${ox + slabW} V${oy + t} H${ox} Z`,
        `M${ox} ${oy + slabH - t} H${ox + slabW} V${oy + slabH} H${ox} Z`,
        `M${ox} ${oy} H${ox + t} V${oy + slabH} H${ox} Z`,
        `M${ox + slabW - t} ${oy} H${ox + slabW} V${oy + slabH} H${ox + slabW - t} Z`,
        `M${ox + slabW / 2 - t / 2} ${oy} H${ox + slabW / 2 + t / 2} V${oy + slabH} H${ox + slabW / 2 - t / 2} Z`
      );
    }

    const pierCircles: Array<{ cx: number; cy: number; r: number }> = [];
    if (structureType === 'pier') {
      const cols = Math.max(2, Math.ceil(dimensions.length / 2.5));
      const rows = Math.max(2, Math.ceil(dimensions.width / 2.5));
      const r = Math.max(6, scale * 0.18);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          pierCircles.push({
            cx: ox + ((i + 0.5) / cols) * slabW,
            cy: oy + ((j + 0.5) / rows) * slabH,
            r,
          });
        }
      }
    }

    return { slabW, slabH, ox, oy, longBars, crossBars, stripPaths, pierCircles };
  }, [dimensions, rebarSpec, showRebar, structureType]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-[#0B132B] shadow-2xl">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/90 px-3 py-1.5 font-mono text-[11px] text-sky-300 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
        SVG-ЧЕРТЁЖ · {structureType.toUpperCase()} · H={dimensions.depth}м
        {soilPressureKpa > 0 ? ` · ${soilPressureKpa} кПа` : ''}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[360px] w-full sm:h-[420px]"
        role="img"
        aria-label={`Чертёж ${structureType} ${dimensions.length}x${dimensions.width}`}
      >
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id="slabFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.18)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.55)" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#grid)" />

        {(structureType === 'slab' || structureType === 'beam' || structureType === 'wall') && (
          <rect
            x={drawing.ox}
            y={drawing.oy}
            width={drawing.slabW}
            height={drawing.slabH}
            fill="url(#slabFill)"
            stroke="#38BDF8"
            strokeWidth={2}
            rx={structureType === 'beam' ? 4 : 2}
          />
        )}

        {structureType === 'strip' &&
          drawing.stripPaths.map((d, i) => (
            <path key={i} d={d} fill="rgba(56,189,248,0.22)" stroke="#38BDF8" strokeWidth={1.5} />
          ))}

        {structureType === 'pier' && (
          <>
            <rect
              x={drawing.ox}
              y={drawing.oy}
              width={drawing.slabW}
              height={drawing.slabH}
              fill="none"
              stroke="#64748B"
              strokeDasharray="6 4"
              strokeWidth={1}
            />
            {drawing.pierCircles.map((c, i) => (
              <circle
                key={i}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                fill="rgba(56,189,248,0.25)"
                stroke="#38BDF8"
                strokeWidth={1.5}
              />
            ))}
          </>
        )}

        {showRebar &&
          drawing.longBars.map((b, i) => (
            <line
              key={`l-${i}`}
              x1={b.x1}
              y1={b.y1}
              x2={b.x2}
              y2={b.y2}
              stroke="#FF5A00"
              strokeWidth={1.2}
              opacity={0.9}
            />
          ))}
        {showRebar &&
          drawing.crossBars.map((b, i) => (
            <line
              key={`c-${i}`}
              x1={b.x1}
              y1={b.y1}
              x2={b.x2}
              y2={b.y2}
              stroke="#FF5A00"
              strokeWidth={1.2}
              opacity={0.75}
            />
          ))}

        {/* Dimension labels */}
        <text
          x={drawing.ox + drawing.slabW / 2}
          y={drawing.oy - 12}
          textAnchor="middle"
          fill="#94A3B8"
          fontFamily="ui-monospace, monospace"
          fontSize={12}
        >
          L = {dimensions.length.toFixed(2)} м
        </text>
        <text
          x={drawing.ox - 14}
          y={drawing.oy + drawing.slabH / 2}
          textAnchor="middle"
          fill="#94A3B8"
          fontFamily="ui-monospace, monospace"
          fontSize={12}
          transform={`rotate(-90 ${drawing.ox - 14} ${drawing.oy + drawing.slabH / 2})`}
        >
          W = {dimensions.width.toFixed(2)} м
        </text>

        {showRebar && rebarSpec.layers > 0 && (
          <text x={16} y={H - 16} fill="#FF5A00" fontFamily="ui-monospace, monospace" fontSize={11}>
            Ø{rebarSpec.diameterMm} · шаг {rebarSpec.spacingMm}мм · {rebarSpec.layers} слой
          </text>
        )}
      </svg>
    </div>
  );
}
