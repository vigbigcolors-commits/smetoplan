import type { PseoLayoutSlots } from './PseoLayoutClassic';

/** Variant 4: compact — BOM early, short visual, minimal chrome */
export function PseoLayoutCompact({
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
    <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <header className="mb-4 border-l-4 border-[#1F5A8E] pl-4">
        <h1 className="text-xl font-extrabold text-[#0F172A] sm:text-2xl">{h1}</h1>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{description}</p>
      </header>
      {statsStrip}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          {preset}
          {inputPanel}
        </div>
        <div className="flex flex-col gap-3 md:col-span-3">
          {svgPanel}
          {showRebarBlock && cadPanel}
        </div>
      </div>
      {bomBlock}
      {adBlock}
      {aiBlock}
      {contractorsBlock}
    </main>
  );
}
