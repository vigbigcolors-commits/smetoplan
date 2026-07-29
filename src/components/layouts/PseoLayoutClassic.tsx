import type { ReactNode } from 'react';

export interface PseoLayoutSlots {
  h1: string;
  description: string;
  preset: ReactNode;
  inputPanel: ReactNode;
  svgPanel: ReactNode;
  cadPanel: ReactNode;
  statsStrip: ReactNode;
  bomBlock: ReactNode;
  contractorsBlock: ReactNode;
  aiBlock: ReactNode;
  adBlock: ReactNode;
  showRebarBlock: boolean;
}

/** Variant 1: classic Constructix — inputs left, visuals right */
export function PseoLayoutClassic({
  h1,
  description,
  preset,
  inputPanel,
  svgPanel,
  cadPanel,
  statsStrip,
  bomBlock,
  contractorsBlock,
  aiBlock,
  adBlock,
  showRebarBlock,
}: PseoLayoutSlots) {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
          {h1}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      </header>
      {preset}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">{inputPanel}</div>
        <div className="flex flex-col gap-4 lg:col-span-7">
          {svgPanel}
          {showRebarBlock && cadPanel}
          {statsStrip}
        </div>
      </div>
      {adBlock}
      {bomBlock}
      {contractorsBlock}
      {aiBlock}
    </main>
  );
}
