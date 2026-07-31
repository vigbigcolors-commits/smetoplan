import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calculator, FileSpreadsheet } from 'lucide-react';
import { calculatorHref } from '@/lib/calculator-routes';

const CALC_HREF = calculatorHref();

const FEATURES = [
  {
    src: '/Images/icon-sizes.png',
    title: 'Размеры',
    subtitle: '→ схема',
  },
  {
    src: '/Images/icon-materials.png',
    title: 'Материалы',
    subtitle: 'и объёмы',
  },
  {
    src: '/Images/icon-estimate.png',
    title: 'Смета',
    subtitle: 'за минуту',
  },
] as const;

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#E8EEF4]">
      <div className="absolute inset-0">
        <Image
          src="/Images/smetoplan-hero-hologram.png"
          alt="Голографическая модель фундамента над чертежом"
          fill
          priority
          className="object-cover object-[center_42%]"
          sizes="100vw"
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-12">
        <div className="max-w-xl">
          <div className="flex items-center gap-4">
            <span className="flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[#0E1624]/10 bg-white shadow-[0_14px_36px_rgba(14,22,36,0.12)] sm:h-24 sm:w-24">
              <Image
                src="/Images/smetoplan-logo-v3.png"
                alt="Smetoplan"
                width={192}
                height={192}
                priority
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3D6494] sm:text-xs">
                Инженерный расчёт
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#0E1624]/75 sm:text-base">
                Чертёж · смета · сроки
              </p>
            </div>
          </div>

          <h1 className="mt-6 max-w-[14ch] font-[family-name:var(--font-display)] text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#0E1624] sm:text-[2.55rem] lg:text-[2.75rem]">
            Умные калькуляторы
            <span className="mt-2 block font-semibold tracking-[-0.02em] text-[#3D6494]">
              для строительства
            </span>
          </h1>

          <div className="mt-4 h-px w-20 bg-gradient-to-r from-[#3D6494] via-[#6B93C4] to-transparent" aria-hidden />

          <ul className="mt-7 grid max-w-lg grid-cols-3 gap-5 border-t border-[#0E1624]/10 pt-6 sm:gap-6">
            {FEATURES.map(({ src, title, subtitle }) => (
              <li key={title} className="min-w-0">
                <span className="relative flex h-[4.75rem] w-[4.75rem] overflow-hidden rounded-[1.25rem] border border-[#0E1624]/08 bg-white shadow-[0_10px_28px_rgba(14,22,36,0.1)] sm:h-20 sm:w-20 sm:rounded-[1.35rem]">
                  <Image
                    src={src}
                    alt=""
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                </span>
                <p className="mt-3 font-[family-name:var(--font-display)] text-[15px] font-bold leading-none tracking-[-0.02em] text-[#0E1624] sm:text-base">
                  {title}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[#3D6494] sm:text-xs">
                  {subtitle}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <aside className="concrete-panel relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-[0_20px_50px_rgba(14,22,36,0.18)] sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[#1a1c1e]/40" aria-hidden />
            <div className="relative">
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
                SMETO<span className="text-[#6B93C4]">PLAN</span>
              </p>
              <p className="mt-2 text-lg font-bold leading-snug text-white sm:text-xl">
                Считайте фундамент так, будто чертёж уже на столе
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Введите размеры — получите схему, расход бетона и арматуры и готовую
                смету в рублях за минуту.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Calculator className="h-4 w-4 shrink-0 text-[#6B93C4]" />
                  Живой чертёж и CAD при смене параметров
                </li>
                <li className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#6B93C4]" />
                  Смета в ₽ и выгрузка для прораба
                </li>
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={CALC_HREF}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6E916E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#7FA37F]"
                >
                  Рассчитать плиту
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#calculators"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#B86C3B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#C87C4B]"
                >
                  Все калькуляторы
                </a>
              </div>
            </div>
          </aside>

          <p className="rounded-xl border border-[#0E1624]/08 bg-white/75 px-5 py-4 shadow-[0_8px_24px_rgba(14,22,36,0.06)] backdrop-blur-sm">
            <span className="block font-[family-name:var(--font-display)] text-[15px] font-semibold leading-snug tracking-[-0.015em] text-[#0E1624] sm:text-base">
              Расчёт смет, материалов, работ и сроков за секунды.
            </span>
            <span className="mt-1.5 block font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.14em] text-[#3D6494] sm:text-xs">
              Точность, проверенная в реальных проектах.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
