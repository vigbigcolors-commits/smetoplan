import Link from 'next/link';
import { calculatorHref } from '@/lib/calculator-routes';

function IconPen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .37.78l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .37.78l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  );
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const FACTS = [
  {
    icon: IconPen,
    title: 'Чертёж в реальном времени',
    text: 'Меняете длину или шаг арматуры — схема и 3D-вид перестраиваются сразу, без перезагрузки.',
  },
  {
    icon: IconLayers,
    title: 'Смета по нормам СП',
    text: 'Бетон, арматура, песок, щебень и опалубка считаются по типовым соотношениям СП / ГОСТ.',
  },
  {
    icon: IconTarget,
    title: 'Готово для прораба',
    text: 'Итог в рублях, выгрузка CSV и спецификация для запроса цен у бетонных заводов.',
  },
] as const;

const CALC_HREF = calculatorHref();

export function MidVisualStory() {
  return (
    <section className="relative overflow-hidden bg-[#F4F7FA] py-5 sm:py-7">
      <div className="blueprint-grid-steel absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-3 rounded-[1.75rem] bg-[#3D6494]/15 blur-2xl" />
          <Link
            href={CALC_HREF}
            className="group relative block aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[#3D6494]/20 bg-[#0E1624] shadow-2xl outline-none ring-[#3D6494] transition focus-visible:ring-2"
            aria-label="Открыть модуль визуализации — калькулятор"
          >
            <picture>
              <source
                type="image/webp"
                srcSet="/Images/smetoplan2-640.webp 640w, /Images/smetoplan2-960.webp 960w, /Images/smetoplan2-1200.webp 1200w"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <img
                src="/Images/smetoplan2-960.webp"
                alt="Модуль визуализации: от параметра к чертежу"
                width={960}
                height={720}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain object-center"
              />
            </picture>
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[#3D6494] px-3 py-1.5 text-xs font-bold text-white opacity-90 transition group-hover:opacity-100">
              Открыть расчёт
              <IconArrow className="h-3.5 w-3.5" />
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
                  <Icon className="h-5 w-5" />
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
