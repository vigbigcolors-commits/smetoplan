'use client';

import Link from 'next/link';
import { ArrowRight, Ruler } from 'lucide-react';
import { calculatorHref } from '@/lib/calculator-routes';
import { CENY_REGIONS } from '@/lib/ceny-regions';

const NAV = [
  { href: '/kalkulyator', label: 'Калькулятор' },
  { href: '/ceny', label: 'Цены' },
  { href: '/metodika', label: 'Методика' },
  { href: '/o-nas', label: 'О нас' },
];

const FOOTER_COLS = [
  {
    title: 'Продукт',
    links: [
      { href: calculatorHref('slab'), label: 'Плитный фундамент' },
      { href: calculatorHref('strip'), label: 'Ленточный фундамент' },
      { href: calculatorHref(), label: 'Все расчёты' },
      { href: '/ceny', label: 'Цены по регионам' },
      ...CENY_REGIONS.slice(0, 2).map((r) => ({
        href: `/ceny/${r.slug}`,
        label: r.label,
      })),
    ],
  },
  {
    title: 'Доверие',
    links: [
      { href: '/o-nas', label: 'О нас' },
      { href: '/metodika', label: 'Методика и источники' },
      { href: '/disclaimer', label: 'Отказ от ответственности' },
      { href: '/privacy', label: 'Конфиденциальность' },
    ],
  },
  {
    title: 'Связь',
    links: [
      { href: '/kontakty', label: 'Контакты' },
      { href: 'mailto:hello@smetoplan.ru', label: 'hello@smetoplan.ru' },
      { href: calculatorHref(), label: 'Открыть калькулятор' },
    ],
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B132B]/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#3D6494] to-[#1F5A8E] shadow-lg shadow-[#3D6494]/30">
            <Ruler className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white sm:text-2xl">
            SMETO<span className="text-[#6B93C4]">PLAN</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-semibold text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={calculatorHref()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0B132B] transition hover:bg-slate-100 sm:text-base"
        >
          Рассчитать
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#3D6494]/30 bg-[#070B18] text-slate-300">
      <div className="blueprint-grid-steel pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] lg:gap-16">
          <div>
            <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
              SMETO<span className="text-[#6B93C4]">PLAN</span>
            </div>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
              Онлайн-расчёты фундаментов: чертёж, расход материалов и смета в
              рублях. Ориентир для сметчика и прораба — финальный проект утверждает
              конструктор.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
                  {col.title}
                </div>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      {l.href.startsWith('mailto:') ? (
                        <a href={l.href} className="transition hover:text-white">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className="transition hover:text-white">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Smetoplan.ru — расчёты по нормам СП / ГОСТ
            справочно
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/disclaimer" className="hover:text-slate-300">
              Disclaimer
            </Link>
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/kontakty" className="hover:text-slate-300">
              Контакты
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
