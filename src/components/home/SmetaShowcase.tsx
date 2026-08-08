import Link from 'next/link';
import { calculatorHref } from '@/lib/calculator-routes';

export function SmetaShowcase() {
  return (
    <section id="smeta" className="relative overflow-hidden bg-white py-5 sm:py-7">
      <div className="blueprint-grid-violet absolute inset-0 opacity-[0.14]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B86C3B] sm:text-sm">
            Ведомость материалов
          </p>
          <h2 className="mt-2.5 max-w-xl font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-[#0E1624] sm:text-3xl">
            Не «примерно кубы», а{' '}
            <span className="text-[#3D6494]">понятная смета</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Алгоритмы опираются на типовые соотношения СП и ГОСТ: объём бетона,
            масса арматуры, опалубка, песок и щебень. Меняете параметр — смета
            пересчитывается вместе с чертежом.
          </p>
          <ul className="mt-5 space-y-3 text-base text-slate-700">
            {[
              'Живой SVG-чертёж и CAD-вид конструкции',
              'Расход по маркам бетона от М150 до М400',
              'Арматура А500С с шагом сетки и слоями',
              'Итог в рублях с выгрузкой для прораба',
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-sm bg-[#3D6494]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <Link
            href={calculatorHref()}
            className="mt-5 inline-flex rounded-xl bg-[#0B132B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2544]"
          >
            Открыть калькулятор и смету
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#3D6494]/15 via-transparent to-[#1F5A8E]/20 blur-xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#3D6494]/25 bg-[#0B132B] p-6 text-white shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-[family-name:var(--font-display)] text-xl font-bold">
                Смета · плита 10×8
              </span>
              <span className="rounded-lg bg-[#3D6494]/30 px-3 py-1 text-sm font-semibold text-[#9BB6D4]">
                онлайн
              </span>
            </div>
            <div className="mt-5 space-y-3 font-mono text-sm sm:text-base">
              {[
                ['Бетон М250', '28.4 м³', '119 280 ₽'],
                ['Арматура Ø12', '1 842 кг', '112 360 ₽'],
                ['Песок + щебень', '48.2 т', '52 100 ₽'],
                ['Опалубка', '72 м²', '46 800 ₽'],
                ['Работы', '1 смена', '81 070 ₽'],
              ].map(([name, qty, price]) => (
                <div
                  key={name}
                  className="grid grid-cols-[1.2fr_0.8fr_0.9fr] gap-2 border-b border-white/5 pb-3 text-slate-200"
                >
                  <span>{name}</span>
                  <span className="text-slate-400">{qty}</span>
                  <span className="text-right font-semibold text-white">{price}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-base text-slate-400">Итого материалы + работы</span>
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#6B93C4]">
                411 610 ₽
              </span>
            </div>
            <svg
              className="mt-6 h-16 w-full text-[#3D6494]/50"
              viewBox="0 0 400 60"
              fill="none"
              aria-hidden
            >
              <path
                d="M0 40 C60 10, 100 50, 160 28 S260 8, 320 30 380 45, 400 20"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="M0 48 C80 30, 120 55, 180 40 S280 25, 400 35"
                stroke="#1F5A8E"
                strokeWidth="2"
                opacity="0.7"
              />
            </svg>
          </div>

          <div className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 sm:block">
            <BrickRow />
          </div>
        </div>
      </div>
    </section>
  );
}

function BrickRow() {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-7 w-12 rounded-sm bg-gradient-to-b from-[#5479A8] to-[#3D6494] shadow-md"
          style={{ opacity: 0.55 + (i % 3) * 0.12, transform: `translateY(${(i % 2) * 4}px)` }}
        />
      ))}
    </div>
  );
}

export function HomeCta() {
  return (
    <section className="relative overflow-hidden bg-[#070B18] py-5 sm:py-7">
      <div className="blueprint-grid-violet absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#3D6494]/25 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-snug text-white sm:text-3xl">
          Посчитали —{' '}
          <span className="text-[#A2C8E8]">унесите результат с собой</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
          Пакет «Готово» в калькуляторе: PDF-смета, спецификация .txt для РБУ и
          ссылка на расчёт. Без заявки, звонка и ожидания менеджера.
        </p>
        <ul className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-semibold text-slate-400">
          <li>PDF</li>
          <li>·</li>
          <li>.txt для РБУ</li>
          <li>·</li>
          <li>Share-ссылка</li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={calculatorHref()}
            className="inline-flex rounded-xl bg-[#3D6494] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(61,100,148,0.35)] transition hover:bg-[#4A76AB]"
          >
            Открыть и забрать пакет
          </Link>
          <Link
            href="/ceny"
            className="inline-flex rounded-xl border border-white/25 bg-transparent px-5 py-2.5 text-sm font-bold text-white hover:border-white/50"
          >
            Сравнить цены регионов
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 brick-band opacity-80" />
    </section>
  );
}
