import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';

export const metadata: Metadata = {
  title: 'Контакты — Smetoplan',
  description: 'Связаться с командой Smetoplan: e-mail и форма обратной связи.',
  alternates: { canonical: '/kontakty' },
};

export default function ContactsPage() {
  return (
    <LegalPageShell
      title="Контакты"
      lead="Вопросы по сервису, партнёрству и уточнению методик — пишите напрямую."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">E-mail</h2>
        <p className="mt-2">
          <a
            href="mailto:hello@smetoplan.ru"
            className="text-lg font-bold text-[#1F5A8E] hover:underline"
          >
            hello@smetoplan.ru
          </a>
        </p>
        <p className="mt-2 text-slate-600">
          Обычно отвечаем в рабочие дни по сервису и партнёрству. Смету и
          спецификацию для РБУ сайт отдаёт сам: в калькуляторе кнопка «Пакет
          Готово» (PDF + .txt + ссылка) — без ожидания ответа.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Быстрые ссылки</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/kalkulyator" className="font-semibold text-[#1F5A8E] hover:underline">
              Открыть калькулятор
            </Link>
          </li>
          <li>
            <Link href="/ceny/moskva" className="font-semibold text-[#1F5A8E] hover:underline">
              Цены Москва
            </Link>
          </li>
          <li>
            <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
              Методика и источники
            </Link>
          </li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
