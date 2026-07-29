import type { PseoLayoutSlots } from './PseoLayoutClassic';

/** Variant 2: split — H1 + SVG hero, then controls below in 2 cols */
export function PseoLayoutSplit({
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
    <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#1F5A8E]">
            Инженерный расчёт · вариант DOM-2
          </p>
          <h1 className="text-2xl font-extrabold text-[#0F172A] sm:text-3xl">{h1}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        {statsStrip}
      </div>
      {svgPanel}
      <div className="mt-6">{preset}</div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {inputPanel}
        <div className="flex flex-col gap-4">
          {showRebarBlock ? cadPanel : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Схема армирования скрыта: для этого запроса арматура не предусмотрена.
              Показан только контур бетонной конструкции.
            </div>
          )}
        </div>
      </div>
      {bomBlock}
      {adBlock}
      {aiBlock}
      {contractorsBlock}
    </main>
  );
}
