import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'О нас — Smetoplan',
  description:
    'Smetoplan — онлайн-калькуляторы фундаментов с живым чертежом и сметой. Для кого продукт, как считаем, границы ответственности.',
  alternates: { canonical: `${getSiteUrl()}/o-nas` },
  openGraph: {
    title: 'О нас — Smetoplan',
    description:
      'Инженерный ориентир для сметы материалов: сразу на экране, без заявки и без подмены проекта КЖ.',
    url: `${getSiteUrl()}/o-nas`,
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="О нас"
      lead="Smetoplan.ru — инженерный ориентир для сметы и расхода материалов. Считаете на месте, без ожидания менеджера. Не замена проекту КЖ."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Кто мы и для кого</h2>
        <p className="mt-2">
          Мы делаем прозрачные онлайн-расчёты фундаментов и монолитных конструкций:
          живой чертёж, объёмы бетона и арматуры, раскрой, ориентир сметы в рублях.
          Продукт для сметчика, прораба и частного застройщика, которому нужен
          порядок цифр до визита к конструктору и спецификация для запроса в РБУ.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Опыт и подход</h2>
        <p className="mt-2">
          Ядро расчёта одно для калькулятора, хабов и long-tail страниц: геометрия
          → материалы → региональный ориентир цен. Правки в ядре сразу видны в
          смете — без «замороженных» картинок. HELPER помогает проставить параметры
          из ТЗ, но не выдаёт заключение конструктора.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Как считаем</h2>
        <p className="mt-2">
          Цепочка: габариты конструкции → объёмы → справочные ориентиры СП / ГОСТ →
          региональный прайс Smetoplan. Котировки поставщиков на{' '}
          <Link href="/ceny" className="font-semibold text-[#1F5A8E] hover:underline">
            /ceny
          </Link>{' '}
          показываются отдельно и не подменяют ориентир сметы. Подробности — на
          странице{' '}
          <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
            «Методика и источники»
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Чем не являемся</h2>
        <p className="mt-2">
          Smetoplan не выдаёт штамп СП, не заменяет инженерно-геологические
          изыскания и не является коммерческим офертом бетонного завода. Финальный
          проект утверждает квалифицированный конструктор; прайс и доставку —
          завод или база.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Почему сразу и бесплатно</h2>
        <p className="mt-2">
          Расчёт, чертёж и смета доступны без заявки и обратного звонка. Можно
          сохранить ссылку на расчёт или выгрузить PDF/ведомость для себя. Мы не
          продаём «доступ к цифрам» через отдел продаж — ценность в инструменте на
          экране.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Контакты и обновления</h2>
        <p className="mt-2">
          Вопросы по сервису — через{' '}
          <Link href="/kontakty" className="font-semibold text-[#1F5A8E] hover:underline">
            контакты
          </Link>
          . Юридические ограничения — в{' '}
          <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
            disclaimer
          </Link>
          . Дата ориентира цен в справочнике:{' '}
          <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>.
        </p>
      </section>
    </LegalPageShell>
  );
}
