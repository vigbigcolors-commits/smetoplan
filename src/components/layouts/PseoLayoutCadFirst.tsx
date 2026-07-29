import type { PseoLayoutSlots } from './PseoLayoutClassic';

/** Variant 3: CAD-first — 3D/SVG dominate, form sticky aside */
export function PseoLayoutCadFirst({
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
      <h1 className="mb-2 text-center text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
        {h1}
      </h1>
      <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-slate-600">
        {description}
      </p>
      <div className="mb-4">{svgPanel}</div>
      {showRebarBlock && <div className="mb-4">{cadPanel}</div>}
      {statsStrip}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          {preset}
          {inputPanel}
        </div>
        <div className="lg:col-span-8">
          {adBlock}
          {bomBlock}
          {contractorsBlock}
          {aiBlock}
        </div>
      </div>
    </main>
  );
}
