'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { Point2, StripInner, StripPlan } from '@/domain/geometry';
import {
  buildLShapeStripPlan,
  buildRectangleStripPlan,
  computeStripPlanMetrics,
} from '@/domain/geometry';

type EditorMode = 'move' | 'add-vertex' | 'add-inner';

interface StripPlanEditorProps {
  lengthM: number;
  widthM: number;
  depthM: number;
  ribbonWidthM: number;
  innerLong: number;
  innerCross: number;
  plan: StripPlan;
  custom: boolean;
  onPlanChange: (plan: StripPlan, custom: boolean) => void;
}

export function StripPlanEditor({
  lengthM,
  widthM,
  depthM,
  ribbonWidthM,
  innerLong,
  innerCross,
  plan,
  custom,
  onPlanChange,
}: StripPlanEditorProps) {
  const [mode, setMode] = useState<EditorMode>('move');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [innerDraft, setInnerDraft] = useState<Point2 | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const metrics = useMemo(
    () => computeStripPlanMetrics(plan, depthM, ribbonWidthM),
    [plan, depthM, ribbonWidthM]
  );

  const pad = 28;
  const viewW = 440;
  const viewH = 300;
  const xs = plan.outer.map((p) => p.x);
  const ys = plan.outer.map((p) => p.y);
  for (const s of plan.inners) {
    xs.push(s.a.x, s.b.x);
    ys.push(s.a.y, s.b.y);
  }
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxX = Math.max(...xs, lengthM);
  const maxY = Math.max(...ys, widthM);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((viewW - pad * 2) / spanX, (viewH - pad * 2) / spanY);

  const toSvg = (p: Point2) => ({
    x: pad + (p.x - minX) * scale,
    y: viewH - pad - (p.y - minY) * scale,
  });

  const fromSvg = (clientX: number, clientY: number): Point2 | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * viewW;
    const sy = ((clientY - rect.top) / rect.height) * viewH;
    return {
      x: Math.round(((sx - pad) / scale + minX) * 20) / 20,
      y: Math.round(((viewH - pad - sy) / scale + minY) * 20) / 20,
    };
  };

  const outerPoly = plan.outer.map(toSvg);
  const outerPath =
    outerPoly.length > 0
      ? `M ${outerPoly.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
      : '';

  const snap = (p: Point2): Point2 => ({
    x: Math.round(p.x * 20) / 20,
    y: Math.round(p.y * 20) / 20,
  });

  const updateVertex = (idx: number, p: Point2) => {
    const outer = plan.outer.map((v, i) => (i === idx ? snap(p) : v));
    onPlanChange({ ...plan, outer }, true);
  };

  const insertVertexOnNearestEdge = (p: Point2) => {
    if (plan.outer.length < 2) return;
    let bestI = 0;
    let bestD = Infinity;
    let bestPt = p;
    for (let i = 0; i < plan.outer.length; i++) {
      const a = plan.outer[i];
      const b = plan.outer[(i + 1) % plan.outer.length];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby || 1))
      );
      const q = { x: a.x + t * abx, y: a.y + t * aby };
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < bestD) {
        bestD = d;
        bestI = i;
        bestPt = q;
      }
    }
    const outer = [...plan.outer];
    outer.splice(bestI + 1, 0, snap(bestPt));
    onPlanChange({ ...plan, outer }, true);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    const p = fromSvg(e.clientX, e.clientY);
    if (!p) return;
    if (mode === 'add-vertex') {
      insertVertexOnNearestEdge(p);
      setMode('move');
      return;
    }
    if (mode === 'add-inner') {
      if (!innerDraft) {
        setInnerDraft(snap(p));
      } else {
        const id = `inner-${Date.now()}`;
        const seg: StripInner = { id, a: innerDraft, b: snap(p) };
        onPlanChange({ ...plan, inners: [...plan.inners, seg] }, true);
        setInnerDraft(null);
        setMode('move');
      }
    }
  };

  const resetRect = () => {
    onPlanChange(buildRectangleStripPlan(lengthM, widthM, innerLong, innerCross), false);
    setMode('move');
    setInnerDraft(null);
  };

  const loadL = () => {
    onPlanChange(buildLShapeStripPlan(lengthM, widthM, Math.min(4, widthM * 0.4)), true);
    setMode('move');
  };

  const removeLastInner = () => {
    if (plan.inners.length === 0) return;
    onPlanChange({ ...plan, inners: plan.inners.slice(0, -1) }, true);
  };

  const ModeBtn = ({
    id,
    label,
  }: {
    id: EditorMode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => {
        if (id === 'add-inner') setInnerDraft(null);
        setMode(id);
      }}
      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
        mode === id
          ? 'bg-sky-400 text-[#0B132B] shadow'
          : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-sky-300/80 shadow-lg shadow-sky-900/5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-900/40 bg-[#0B132B] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-300">
            План контура ленты
          </p>
          <p className="text-[10px] text-slate-400">
            {custom ? 'Свой полигон' : 'Прямоугольник из габаритов'} · тяните вершины
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <ModeBtn id="move" label="Перенос" />
          <ModeBtn id="add-vertex" label="+ Вершина" />
          <ModeBtn id="add-inner" label="+ Ось" />
          <button
            type="button"
            onClick={removeLastInner}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-slate-300 hover:bg-white/15"
          >
            − Ось
          </button>
          <button
            type="button"
            onClick={loadL}
            className="rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-amber-300 hover:bg-amber-500/30"
          >
            L
          </button>
          <button
            type="button"
            onClick={resetRect}
            className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-emerald-300 hover:bg-emerald-500/30"
          >
            □
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="strip-plan-canvas h-[240px] w-full cursor-crosshair"
        onClick={handleSvgClick}
        onMouseLeave={() => setDragIdx(null)}
        onMouseUp={() => setDragIdx(null)}
        onMouseMove={(e) => {
          if (dragIdx === null || mode !== 'move') return;
          const p = fromSvg(e.clientX, e.clientY);
          if (p) updateVertex(dragIdx, p);
        }}
      >
        <defs>
          <filter id="stripGlow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={outerPath}
          fill="rgba(56,189,248,0.14)"
          stroke="#38BDF8"
          strokeWidth={2.5}
          filter="url(#stripGlow)"
        />
        {plan.inners.map((s) => {
          const a = toSvg(s.a);
          const b = toSvg(s.b);
          return (
            <g key={s.id}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#F59E0B"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.95}
              />
              <circle cx={a.x} cy={a.y} r={3} fill="#FCD34D" />
              <circle cx={b.x} cy={b.y} r={3} fill="#FCD34D" />
            </g>
          );
        })}
        {innerDraft && (
          <circle
            cx={toSvg(innerDraft).x}
            cy={toSvg(innerDraft).y}
            r={5}
            fill="#F59E0B"
            stroke="#fff"
            strokeWidth={1.5}
          />
        )}
        {plan.outer.map((p, i) => {
          const s = toSvg(p);
          return (
            <g key={`v-${i}`}>
              <circle cx={s.x} cy={s.y} r={8} fill="rgba(14,165,233,0.25)" />
              <circle
                cx={s.x}
                cy={s.y}
                r={5}
                fill="#E2E8F0"
                stroke="#0EA5E9"
                strokeWidth={2}
                className="cursor-grab"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setMode('move');
                  setDragIdx(i);
                }}
              />
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2 border-t border-sky-900/30 bg-[#0B132B] px-3 py-2.5 sm:grid-cols-4">
        <MiniStat label="L осей" value={`${metrics.stripLengthM.toFixed(2)} м`} />
        <MiniStat label="Стыки" value={`${metrics.junctionCount}`} />
        <MiniStat label="План" value={`${metrics.planAreaM2.toFixed(1)} м²`} />
        <MiniStat label="V сырой" value={`${metrics.concreteVolumeRawM3.toFixed(2)} м³`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-mono text-xs font-extrabold text-sky-200">{value}</div>
    </div>
  );
}
