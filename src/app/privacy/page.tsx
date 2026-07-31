import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/site/LegalPageShell';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Smetoplan',
  description:
    'Как Smetoplan обрабатывает персональные данные и заявки с сайта.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Политика конфиденциальности"
      lead="Кратко и по делу: какие данные собираем, зачем и как с ними обращаемся."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Какие данные</h2>
        <p className="mt-2">
          При заполнении заявки или обратной связи мы можем получить имя, телефон,
          e-mail и текст сообщения. Параметры расчёта в браузере хранятся локально
          для удобства работы и не обязательно передаются на сервер.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Зачем</h2>
        <p className="mt-2">
          Контакты используются только для ответа на заявку и уточнения объёмов.
          Мы не продаём персональные данные третьим лицам. Технические логи
          (IP, User-Agent) могут собираться хостингом для безопасности и
          диагностики.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Cookies и аналитика</h2>
        <p className="mt-2">
          Сайт может использовать необходимые cookies для работы сессии. Если
          подключена внешняя аналитика или реклама (например, РСЯ), обработка
          данных подчиняется политике соответствующего сервиса.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Права и контакты</h2>
        <p className="mt-2">
          Чтобы уточнить, изменить или удалить ваши данные из заявок — напишите на{' '}
          <a
            href="mailto:hello@smetoplan.ru"
            className="font-semibold text-[#1F5A8E] hover:underline"
          >
            hello@smetoplan.ru
          </a>
          . Политика может обновляться; актуальная версия всегда на этой странице.
        </p>
      </section>
    </LegalPageShell>
  );
}
