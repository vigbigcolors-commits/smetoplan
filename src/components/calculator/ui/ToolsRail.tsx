'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Layers,
  ShoppingCart,
  Truck,
  GitCompare,
  Activity,
  FileOutput,
  ClipboardCheck,
  Grid3x3,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react';

/** Primary site chain first, then secondary tools. */
const TOOLS = [
  { id: 'site-params', label: 'Параметры', icon: SlidersHorizontal },
  { id: 'bom-estimate-total', label: 'Смета', icon: FileSpreadsheet },
  { id: 'tool-rebar', label: 'Раскрой', icon: Grid3x3 },
  { id: 'tool-rbu', label: 'РБУ', icon: MapPin },
  { id: 'tool-nodes', label: 'Узлы А4', icon: FileOutput },
  { id: 'tool-formwork', label: 'Опалубка', icon: Layers },
  { id: 'tool-buy', label: 'Закупка', icon: ShoppingCart },
  { id: 'tool-pour', label: 'Заливка', icon: Truck },
  { id: 'tool-acceptance', label: 'Приёмка', icon: ClipboardCheck },
  { id: 'tool-compare', label: 'Сравнение', icon: GitCompare },
  { id: 'tool-sensitivity', label: 'Сценарии', icon: Activity },
] as const;

export function ToolsRail() {
  const [active, setActive] = useState<string>(TOOLS[0].id);

  useEffect(() => {
    const nodes = TOOLS.map((t) => document.getElementById(t.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (nodes.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const jump = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Инструменты расчёта"
      className="tools-rail sticky top-[3.25rem] z-30 -mx-4 mb-2 border-y border-slate-200/80 bg-white/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const on = active === t.id;
          const primary = [
            'site-params',
            'bom-estimate-total',
            'tool-rebar',
            'tool-rbu',
            'tool-nodes',
          ].includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => jump(t.id)}
              className={`group relative flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                on
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : primary
                    ? 'bg-sky-50 text-[#1F5A8E] hover:bg-[#3D6494] hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  on
                    ? 'text-sky-300'
                    : primary
                      ? 'text-[#3D6494] group-hover:text-white'
                      : 'text-slate-400 group-hover:text-white'
                }`}
              />
              {t.label}
              {on ? (
                <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-sm bg-[#3D6494]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
