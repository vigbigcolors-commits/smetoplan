import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Crosshair, Layers3, PenTool } from 'lucide-react';
import { calculatorHref } from '@/lib/calculator-routes';

const FACTS = [
  {
    icon: PenTool,
    title: 'Чертёж в реальном времени',
    text: 'Меняете длину или шаг арматуры — схема и 3D-вид перестраиваются сразу, без перезагрузки.',
  },
  {
    icon: Layers3,
    title: 'Смета по нормам СП',
    text: 'Бетон, арматура, песок, щебень и опалубка считаются по типовым соотношениям СП / ГОСТ.',
  },
  {
    icon: Crosshair,
    title: 'Готово для прораба',
    text: 'Итог в рублях, выгрузка CSV и спецификация для запроса цен у бетонных заводов.',
  },
];

const CALC_HREF = calculatorHref();

export function MidVisualStory() {
  return (
    <section className="relative overflow-hidden bg-[#F4F7FA] py-5 sm:py-7">
      <div className="blueprint-grid-steel absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-3 rounded-[1.75rem] bg-[#3D6494]/15 blur-2xl" />
          {/* Full image visible — object-contain, no crop of baked-in text */}
          <Link
            href={CALC_HREF}
            className="group relative block overflow-hidden rounded-[1.5rem] border border-[#3D6494]/20 bg-[#0E1624] shadow-2xl outline-none ring-[#3D6494] transition focus-visible:ring-2"
            aria-label="Открыть модуль визуализации — калькулятор"
          >
            <Image
              src="/Images/smetoplan2.webp"
              alt="Модуль визуализации: от параметра к чертежу"
              width={1200}
              height={900}
              className="h-auto w-full object-contain object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[#3D6494] px-3 py-1.5 text-xs font-bold text-white opacity-90 transition group-hover:opacity-100">
              Открыть расчёт
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <div className="mt-4 rounded-xl border border-[#3D6494]/15 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3D6494]">
              Модуль визуализации
            </p>
            <p className="mt-1 text-base font-semibold text-[#0E1624]">
              От параметра к чертежу — один экран, без «таблиц 2005»
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B86C3B] sm:text-sm">
            Почему это удобно на стройке
          </p>
          <h2 className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-[#0E1624] sm:text-3xl">
            Инженерный инструмент, а не просто{' '}
            <span className="text-[#3D6494]">калькулятор кубов</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Smetoplan собирает геометрию, армирование и смету в одном рабочем месте —
            чтобы сметчик и прораб смотрели на одну и ту же картину.
          </p>

          <ul className="mt-5 space-y-3">
            {FACTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D6494] text-white">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0E1624]">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href={CALC_HREF}
            className="mt-5 inline-flex rounded-xl bg-[#3D6494] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A76AB]"
          >
            Открыть рабочий калькулятор
          </Link>
        </div>
      </div>
    </section>
  );
}
