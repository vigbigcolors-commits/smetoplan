import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_AUTHOR, buildPersonJsonLd } from '@/lib/author';
import {
  buildOrganizationJsonLd,
} from '@/lib/site-seo';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: `О нас — ${SITE_AUTHOR.name}, основатель Smetoplan`,
  description:
    `${SITE_AUTHOR.name} — основатель Smetoplan: зачем живой калькулятор фундамента, как считаем смету, границы ответственности и почему без заявки.`,
  alternates: { canonical: `${site}/o-nas` },
  openGraph: {
    title: 'О нас — Smetoplan · Vigen G.',
    description:
      'Инструмент и метод основателя: чертёж, объёмы, ориентир сметы. Не AI-блог и не подмена КЖ.',
    url: `${site}/o-nas`,
    type: 'profile',
    locale: 'ru_RU',
  },
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="О нас"
      lead={`${SITE_AUTHOR.name} · ${SITE_AUTHOR.role}. ${SITE_AUTHOR.methodLine}`}
    >
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildPersonJsonLd()} />

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Кто делает продукт</h2>
        <p className="mt-2">
          Меня зовут {SITE_AUTHOR.name}. Я основатель Smetoplan.ru — сметного
          калькулятора фундаментов и монолитных конструкций. Сайт строится вокруг
          инструмента, который вы держите в руках: габариты → чертёж → объёмы →
          ориентир в рублях. Без отдела продаж между вами и цифрами.
        </p>
        <p className="mt-2">
          {SITE_AUTHOR.productFirst}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Для кого</h2>
        <p className="mt-2">
          Для сметчика, прораба и частного застройщика, которому нужен порядок
          цифр до визита к конструктору и спецификация для запроса в РБУ. Не для
          тех, кто ищет «готовый КЖ по клику» — такого обещания здесь нет.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Метод</h2>
        <p className="mt-2">
          Одно ядро на калькулятор, хабы и long-tail: геометрия → материалы →
          региональный ориентир цен. Правка в ядре сразу видна в смете — без
          замороженных картинок в БД. Котировки на{' '}
          <Link href="/ceny" className="font-semibold text-[#1F5A8E] hover:underline">
            /ceny
          </Link>{' '}
          рядом для сравнения, но не подменяют смету. Подробности — в{' '}
          <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
            методике
          </Link>
          ; разборы ошибок ядра — в{' '}
          <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
            заметках опыта
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Ограничения (честно)</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {SITE_AUTHOR.limits.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2">
          Юридически —{' '}
          <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
            disclaimer
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Почему сразу и бесплатно</h2>
        <p className="mt-2">
          Расчёт, чертёж и смета без заявки. Пакет «Готово» — PDF, .txt для РБУ и
          ссылка на расчёт. Ценность в инструменте на экране, не в звонке менеджеру.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Контакт</h2>
        <p className="mt-2">
          <a
            href={`mailto:${SITE_AUTHOR.email}`}
            className="font-semibold text-[#1F5A8E] hover:underline"
          >
            {SITE_AUTHOR.email}
          </a>
          {' · '}
          <Link href="/kontakty" className="font-semibold text-[#1F5A8E] hover:underline">
            контакты
          </Link>
          . Дата прайс-ориентира:{' '}
          <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>.
        </p>
      </section>
    </LegalPageShell>
  );
}
