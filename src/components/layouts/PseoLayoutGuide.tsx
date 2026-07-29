import type { PseoLayoutSlots } from './PseoLayoutClassic';

/** Variant 5: guide — instructional narrative sections (DOM differs strongly) */
export function PseoLayoutGuide({
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
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1e3a5f] to-[#1F5A8E] p-6 text-white sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300">
          Пошаговый инженерный гид · layout-5
        </p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">{h1}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">{description}</p>
        <div className="mt-6">{statsStrip}</div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800">
          Шаг 1. Тип конструкции
        </h2>
        {preset}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800">
            Шаг 2. Параметры и материалы
          </h2>
          {inputPanel}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800">
            Шаг 3. Чертёж в реальном времени
          </h2>
          {svgPanel}
          {showRebarBlock ? (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-orange-700">
                Схема армирования
              </h3>
              {cadPanel}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Блок «Схема армирования» скрыт — запрос не предполагает арматурный каркас.
            </p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800">
          Шаг 4. Ведомость и смета
        </h2>
        {bomBlock}
      </section>

      {adBlock}
      {aiBlock}
      {contractorsBlock}
    </main>
  );
}
