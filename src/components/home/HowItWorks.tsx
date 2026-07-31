function StepIcon({ n }: { n: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3D6494] font-[family-name:var(--font-display)] text-2xl font-bold text-white shadow-lg shadow-[#3D6494]/30">
      {n}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative bg-[#F3F4FB] py-5 sm:py-7">
      <div className="blueprint-grid-violet absolute inset-0 opacity-[0.22]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6E916E] sm:text-sm">
            Три шага
          </p>
          <h2 className="mt-2.5 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-[#0E1624] sm:text-3xl">
            От размеров до сметы —{' '}
            <span className="text-[#3D6494]">без таблиц из Excel 2005</span>
          </h2>
        </div>

        <ol className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-5">
          <li className="relative">
            <StepIcon n="01" />
            <h3 className="mt-4 text-xl font-bold text-[#0B132B]">Задайте геометрию</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              Длина, ширина, толщина, марка бетона и диаметр арматуры — привычные
              ползунки и точные поля ввода.
            </p>
            <ToolDecor className="mt-4 text-[#3D6494]/70" />
          </li>
          <li className="relative">
            <StepIcon n="02" />
            <h3 className="mt-4 text-xl font-bold text-[#0B132B]">Смотрите чертёж</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              SVG-схема и 3D-вид обновляются сразу: сетка армирования, габариты,
              давление на грунт.
            </p>
            <div className="mt-4">
              <BlueprintMini />
            </div>
          </li>
          <li className="relative">
            <StepIcon n="03" />
            <h3 className="mt-4 text-xl font-bold text-[#0B132B]">Заберите смету</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              Бетон, цемент, песок, щебень, арматура, опалубка и работы — с итогом
              в рублях и выгрузкой CSV.
            </p>
            <div className="mt-4">
              <FormulaDecor />
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

function ToolDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 56" className={`h-14 w-full max-w-[220px] ${className ?? ''}`} fill="none" aria-hidden>
      <rect x="2" y="18" width="70" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="28" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M100 18v20M90 28h20" stroke="currentColor" strokeWidth="2" />
      <path d="M130 14l40 8-8 28-40-8z" stroke="currentColor" strokeWidth="2" />
      <path d="M178 20h36v20h-36z" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

function BlueprintMini() {
  return (
    <svg viewBox="0 0 220 72" className="h-16 w-full max-w-[220px] text-[#1F5A8E]" fill="none" aria-hidden>
      <rect x="8" y="12" width="140" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M24 24h108M24 36h108M24 48h108M40 18v36M64 18v36M88 18v36M112 18v36" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M160 20h44M160 36h36M160 52h40" stroke="#3D6494" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FormulaDecor() {
  return (
    <div className="font-mono text-sm leading-relaxed text-[#3D6494] sm:text-base">
      <div>V = L × W × H × k</div>
      <div className="opacity-70">M_arm = Σ(L_i) × Ø² × 0.006165</div>
      <div className="opacity-50">Σ₽ = бетон + арматура + работы</div>
    </div>
  );
}
