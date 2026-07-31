'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { DimensionState, RebarSpec, StructureType, UnitSystem } from '@/lib/types';

const CadViewer3D = dynamic(
  () =>
    import('@/components/calculator/CadViewer3D').then((m) => ({
      default: m.CadViewer3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-700 bg-[#0B132B] text-sm text-slate-400">
        Загрузка 3D…
      </div>
    ),
  }
);

/**
 * Defers Three.js until visible (or user click) — protects LCP on PSEO URLs.
 */
export function CadViewerLazy({
  deferUntilVisible = false,
  soilPressureKpa = 0,
  ...props
}: {
  structureType: StructureType;
  dimensions: DimensionState;
  rebarSpec: RebarSpec;
  unitSystem: UnitSystem;
  soilPressureKpa?: number;
  deferUntilVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(!deferUntilVisible);

  useEffect(() => {
    if (!deferUntilVisible || ready) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          obs.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [deferUntilVisible, ready]);

  if (!ready) {
    return (
      <div
        ref={ref}
        className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-[#0B132B] px-4 py-10 text-center"
      >
        <p className="text-sm text-slate-400">
          3D-модель подгружается при прокрутке — так страница быстрее для поиска.
        </p>
        <button
          type="button"
          onClick={() => setReady(true)}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-[#0B132B] hover:bg-sky-400"
        >
          Показать 3D сейчас
        </button>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <CadViewer3D {...props} soilPressureKpa={soilPressureKpa} />
    </div>
  );
}
