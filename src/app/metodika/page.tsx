import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import {
  formatPriceAsOf,
  NORM_SOURCES,
  PRICE_SOURCE_NOTE,
  PRICE_TABLE_AS_OF,
} from '@/lib/trust-sources';

export const metadata: Metadata = {
  title: 'Методика и источники — Smetoplan',
  description:
    'Как Smetoplan считает объёмы и смету: нормы СП/ГОСТ, региональный прайс, границы применимости.',
  alternates: { canonical: '/metodika' },
};

export default function MetodikaPage() {
  return (
    <LegalPageShell
      title="Методика и источники"
      lead="Прозрачность расчёта — основа доверия. Ниже — что входит в ориентир и что остаётся за конструктором."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Цепочка расчёта</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Габариты конструкции → геометрия и объём бетона.</li>
          <li>Схема армирования → масса, раскрой, запас нахлёста.</li>
          <li>Опалубка и вспомогательные материалы — ориентир по площади.</li>
          <li>Региональный прайс Smetoplan → смета в рублях.</li>
          <li>Котировки поставщиков (если есть в фиде) — сравнение рядом, без подмены сметы.</li>
        </ol>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Нормативные ориентиры</h2>
        <ul className="mt-2 space-y-2">
          {NORM_SOURCES.map((n) => (
            <li key={n.code} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="font-mono text-sm font-bold text-[#0B132B]">{n.code}</span>
              <p className="mt-1 text-sm text-slate-600">{n.role}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Цены</h2>
        <p className="mt-2">{PRICE_SOURCE_NOTE}</p>
        <p className="mt-2 text-sm text-slate-500">
          Дата таблицы ориентира: {formatPriceAsOf(PRICE_TABLE_AS_OF)} ({PRICE_TABLE_AS_OF}).
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Границы</h2>
        <p className="mt-2">
          Сервис не выполняет МКЭ, не штампует соответствие СП и не подбирает
          конкретный завод под объект. HELPER-ассистент даёт пояснения по интерфейсу
          и смете — это не заключение конструктора.
        </p>
      </section>
    </LegalPageShell>
  );
}
