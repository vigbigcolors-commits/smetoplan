'use client';

import Link from 'next/link';
import { ArrowRight, Ruler } from 'lucide-react';
import { calculatorHref } from '@/lib/calculator-routes';

const NAV = [
  { href: '/kalkulyator', label: 'Калькулятор' },
  { href: '/ceny', label: 'Цены' },
  { href: '/metodika', label: 'Методика' },
  { href: '/opyt', label: 'Опыт' },
  { href: '/o-nas', label: 'О нас' },
];

/** One symmetrical footer grid — product + SEO cluster, no double band. */
const FOOTER_COLS = [
  {
    title: 'Конструкции',
    links: [
      { href: '/kalkulyator/plitnyy-fundament', label: 'Плитный фундамент' },
      { href: '/kalkulyator/lentochnyy-fundament', label: 'Ленточный фундамент' },
      { href: '/kalkulyator/svaynyy-fundament', label: 'Сваи и ростверк' },
      { href: '/kalkulyator/monolitnaya-balka', label: 'Балка / колонна' },
      { href: '/kalkulyator/podpornaya-stena', label: 'Подпорная стена' },
      { href: calculatorHref(), label: 'Рабочий калькулятор' },
    ],
  },
  {
    title: 'Цены',
    links: [
      { href: '/ceny', label: 'Сравнение регионов' },
      { href: '/ceny/moskva', label: 'Москва' },
      { href: '/ceny/sankt-peterburg', label: 'Санкт-Петербург' },
      { href: '/ceny/krasnodar', label: 'Краснодар' },
      { href: '/ceny/ekaterinburg', label: 'Екатеринбург' },
      { href: '/ceny/novosibirsk', label: 'Новосибирск' },
    ],
  },
  {
    title: 'Доверие',
    links: [
      { href: '/metodika', label: 'Методика и источники' },
      { href: '/opyt', label: 'Опыт ядра' },
      { href: '/o-nas', label: 'О нас' },
      { href: '/kontakty', label: 'Контакты' },
      { href: 'mailto:hello@smetoplan.ru', label: 'hello@smetoplan.ru' },
      { href: calculatorHref(), label: 'Пакет «Готово»' },
    ],
  },
] as const;

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
    <footer className="relative overflow-hidden border-t border-[#3D6494]/25 bg-[#070B18] text-slate-300">
      <div className="blueprint-grid-steel pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3D6494]/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white"
            >
              SMETO<span className="text-[#6B93C4]">PLAN</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Чертёж, объёмы и смета на месте — без заявки. Ориентир для прораба;
              проект утверждает конструктор.
            </p>
            <Link
              href={calculatorHref()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3D6494] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A76AB]"
            >
              Открыть калькулятор
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {l.href.startsWith('mailto:') ? (
                      <a
                        href={l.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Smetoplan.ru · СП / ГОСТ справочно · не КЖ
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
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
