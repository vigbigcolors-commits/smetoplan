import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { TrustSourcesNote } from '@/components/pseo/TrustSourcesNote';
import {
  HOME_FAQS,
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/site-seo';
import { calculatorHref } from '@/lib/calculator-routes';

const CHAIN = [
  { t: 'Геометрия', d: 'Габариты → объём бетона без двойного счёта углов' },
  { t: 'Каркас', d: 'Ø, шаг, слои / продольные → масса и раскрой хлыстов' },
  { t: 'Опалубка', d: 'Площадь щитов по типу конструкции' },
  { t: 'Смета', d: 'Региональный ориентир ₽ · не оферта РБУ' },
] as const;

export function HomeEeatBlock() {
  return (
    <section
      id="eeat"
      className="relative overflow-hidden bg-[#F8FAFC] py-8 sm:py-10"
      aria-labelledby="eeat-h2"
    >
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
      <JsonLd data={buildFaqJsonLd(HOME_FAQS)} />

      <div className="blueprint-grid-violet absolute inset-0 opacity-[0.18]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D6494]">
            Доверие · E-E-A-T
          </p>
          <h2
            id="eeat-h2"
            className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-[#0E1624] sm:text-3xl"
          >
            Как Smetoplan считает смету —{' '}
            <span className="text-[#3D6494]">прозрачно и сразу</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Результат на экране без заявки и ожидания менеджера. Одна цепочка:
            геометрия → материалы → региональный ориентир цен. Это сметный
            инструмент, не штамп КЖ и не коммерческое КП завода.
          </p>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHAIN.map((item, i) => (
            <li
              key={item.t}
              className="relative border-l-2 border-[#3D6494]/40 bg-white/80 px-4 py-4"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3D6494]">
                0{i + 1}
              </span>
              <h3 className="mt-1 text-base font-bold text-[#0B132B]">{item.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href="/metodika" className="text-[#1F5A8E] hover:underline">
            Методика и источники
          </Link>
          <Link href="/opyt" className="text-[#1F5A8E] hover:underline">
            Опыт ядра
          </Link>
          <Link href="/ceny" className="text-[#1F5A8E] hover:underline">
            Цены по регионам
          </Link>
          <Link
            href="/kalkulyator/plitnyy-fundament"
            className="text-[#1F5A8E] hover:underline"
          >
            Хаб: плитный фундамент
          </Link>
          <Link
            href="/kalkulyator/lentochnyy-fundament"
            className="text-[#1F5A8E] hover:underline"
          >
            Хаб: ленточный фундамент
          </Link>
          <Link href="/o-nas" className="text-[#1F5A8E] hover:underline">
            О нас
          </Link>
        </div>

        <div className="mt-6 max-w-3xl">
          <TrustSourcesNote />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0E1624]">
              Частые вопросы
            </h3>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {HOME_FAQS.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="cursor-pointer list-none text-[15px] font-bold text-[#0B132B] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      {f.q}
                      <span className="mt-0.5 shrink-0 font-mono text-slate-400 transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-600">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <aside className="border border-slate-800 bg-[#0E1624] px-5 py-6 text-white sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
              Без заявки · бесплатно
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold leading-snug">
              Посчитали — увидели чертёж и смету на месте
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Не ждите обратного звонка, чтобы узнать кубы бетона. Откройте
              калькулятор и заберите пакет «Готово»: PDF, .txt и ссылку.
            </p>
            <Link
              href={calculatorHref()}
              className="mt-5 inline-flex rounded-xl bg-[#3D6494] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A76AB]"
            >
              Открыть и забрать пакет
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
