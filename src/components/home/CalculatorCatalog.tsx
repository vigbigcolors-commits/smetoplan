import Link from 'next/link';
import type { ReactNode } from 'react';
import { ConstructionSketch } from './ConstructionSketch';
import { calculatorHref } from '@/lib/calculator-routes';

type CalcItem = {
  href: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: ReactNode;
};

function IconSlab() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <rect x="8" y="18" width="48" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 26h36M14 32h36M14 38h36M20 22v20M28 22v20M36 22v20M44 22v20" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M8 50h48" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
    </svg>
  );
}

function IconStrip() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <path d="M10 14h44v10H10zM10 40h44v10H10zM10 14v36M54 14v36M28 14v36" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="32" r="2.2" fill="currentColor" />
      <circle cx="32" cy="32" r="2.2" fill="currentColor" />
      <circle cx="46" cy="32" r="2.2" fill="currentColor" />
    </svg>
  );
}

function IconPier() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <rect x="12" y="12" width="40" height="28" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" opacity="0.45" />
      <circle cx="22" cy="24" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="42" cy="24" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="22" cy="40" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="42" cy="40" r="5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M22 29v6M42 29v6M27 24h10M27 40h10" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

function IconBeam() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <rect x="6" y="24" width="52" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 28v8M24 28v8M34 28v8M44 28v8M54 28v8" stroke="currentColor" strokeWidth="2" />
      <path d="M10 20h8v4H10zM46 20h8v4h-8z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IconWall() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <path d="M12 50V18l20-8 20 8v32" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 34h40M22 18v32M42 18v32" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="28" y="28" width="8" height="10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconBom() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden>
      <rect x="12" y="10" width="40" height="44" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 22h24M20 30h24M20 38h16" stroke="currentColor" strokeWidth="2" />
      <circle cx="44" cy="42" r="8" fill="#3D6494" stroke="currentColor" strokeWidth="1.5" />
      <path d="M41 42h6M44 39v6" stroke="white" strokeWidth="2" />
    </svg>
  );
}

const ITEMS: CalcItem[] = [
  {
    href: calculatorHref('slab'),
    title: 'Плитный фундамент',
    subtitle: 'Объём бетона, сетка арматуры, рёбра жёсткости',
    accent: 'from-[#3D6494]/20 to-transparent',
    icon: <IconSlab />,
  },
  {
    href: calculatorHref('strip'),
    title: 'Ленточный фундамент',
    subtitle: 'Периметр, внутренние оси, каркас и хомуты',
    accent: 'from-[#1F5A8E]/25 to-transparent',
    icon: <IconStrip />,
  },
  {
    href: calculatorHref('pier'),
    title: 'Сваи и ростверк',
    subtitle: 'Число свай, каркасы оголовков, объём ростверка',
    accent: 'from-[#3D6494]/20 to-transparent',
    icon: <IconPier />,
  },
  {
    href: calculatorHref('beam'),
    title: 'Балка / колонна',
    subtitle: 'Пролёт, продольная арматура, шаг хомутов',
    accent: 'from-[#2563EB]/20 to-transparent',
    icon: <IconBeam />,
  },
  {
    href: calculatorHref('wall'),
    title: 'Подпорная стена',
    subtitle: 'Толщина, двойная сетка, опалубка двух сторон',
    accent: 'from-[#3D6494]/20 to-transparent',
    icon: <IconWall />,
  },
  {
    href: calculatorHref(),
    title: 'Смета и ведомость',
    subtitle: 'Бетон, арматура, песок, щебень, опалубка — в ₽',
    accent: 'from-[#3D6494]/25 to-transparent',
    icon: <IconBom />,
  },
];

export function CalculatorCatalog() {
  return (
    <section id="calculators" className="relative overflow-hidden bg-[#0B1020] py-5 sm:py-7">
      <div className="blueprint-grid-violet absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#3D6494]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-[#1F5A8E]/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8FCB8F] sm:text-sm">
              Инструменты расчёта
            </p>
            <h2 className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
              Выберите конструкцию —{' '}
              <span className="text-[#A2C8E8]">откроется калькулятор</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300 sm:text-lg">
              Один калькулятор: тип конструкции выбираете сами, размеры и марку
              меняете в панели. Смета и чертёж пересчитываются сразу.
            </p>
          </div>

          <div className="flex w-full justify-center lg:justify-end">
            <div className="pointer-events-none h-64 w-[min(100%,380px)] sm:h-72 sm:w-[min(100%,420px)] lg:h-80 lg:w-[460px]">
              <ConstructionSketch className="block h-full w-full drop-shadow-[0_2px_12px_rgba(126,182,224,0.28)]" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#12182B]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#6B93C4]/50 hover:shadow-[0_24px_60px_rgba(61,100,148,0.25)]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-80`} />
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-[#9BB6D4] ring-1 ring-white/10 transition group-hover:text-white group-hover:ring-[#6B93C4]/40">
                  {item.icon}
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-300">{item.subtitle}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-base font-bold text-[#6B93C4] transition group-hover:gap-3 group-hover:text-white">
                  Открыть расчёт
                  <span aria-hidden>→</span>
                </span>
              </div>
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rotate-12 opacity-20">
                <BrickStack />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrickStack() {
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full text-[#6B93C4]" fill="currentColor">
      <rect x="8" y="48" width="28" height="12" rx="1" opacity="0.9" />
      <rect x="40" y="48" width="28" height="12" rx="1" opacity="0.7" />
      <rect x="22" y="32" width="28" height="12" rx="1" opacity="0.8" />
      <rect x="8" y="16" width="28" height="12" rx="1" opacity="0.55" />
      <rect x="40" y="16" width="28" height="12" rx="1" opacity="0.45" />
    </svg>
  );
}
