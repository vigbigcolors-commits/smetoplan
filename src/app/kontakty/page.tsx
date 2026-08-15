import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { SITE_AUTHOR } from '@/lib/author';

export const metadata: Metadata = {
  title: 'Контакты — Smetoplan',
  description: `Связаться с ${SITE_AUTHOR.name}, основателем Smetoplan: e-mail по сервису и методике.`,
  alternates: { canonical: '/kontakty' },
};

export default function ContactsPage() {
  return (
    <LegalPageShell
      title="Контакты"
      lead={`${SITE_AUTHOR.name} · ${SITE_AUTHOR.role}. Вопросы по сервису и методике — пишите напрямую.`}
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">E-mail</h2>
        <p className="mt-2">
          <a
            href={`mailto:${SITE_AUTHOR.email}`}
            className="text-lg font-bold text-[#1F5A8E] hover:underline"
          >
            {SITE_AUTHOR.email}
          </a>
        </p>
        <p className="mt-2 text-slate-600">
          Обычно отвечаем в рабочие дни. Смету и спецификацию для РБУ сайт отдаёт
          сам: в калькуляторе «Пакет Готово» (PDF + .txt + ссылка) — без ожидания
          ответа.
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
            <Link href="/o-nas" className="font-semibold text-[#1F5A8E] hover:underline">
              Об авторе · {SITE_AUTHOR.name}
            </Link>
          </li>
          <li>
            <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
              Заметки ядра
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
