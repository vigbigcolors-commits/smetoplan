import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/components/site/LegalPageShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_AUTHOR, buildPersonJsonLd } from '@/lib/author';
import { buildOrganizationJsonLd } from '@/lib/site-seo';
import { formatPriceAsOf, PRICE_TABLE_AS_OF } from '@/lib/trust-sources';
import { getSiteUrl } from '@/lib/site-url';

const site = getSiteUrl();

export const metadata: Metadata = {
  title: `О нас — ${SITE_AUTHOR.name}, основатель Smetoplan`,
  description:
    'Vigen G. — зачем сделал Smetoplan: злость на «примерно кубы», живой калькулятор фундамента, честные границы и смета без заявки.',
  alternates: { canonical: `${site}/o-nas` },
  openGraph: {
    title: 'О нас — Smetoplan · Vigen G.',
    description:
      'История продукта от основателя: идея, ошибки ядра, зачем инструмент без менеджера.',
    url: `${site}/o-nas`,
    type: 'profile',
    locale: 'ru_RU',
  },
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="О нас"
      lead={`Меня зовут ${SITE_AUTHOR.name}. Я собрал Smetoplan, потому что мне надоели калькуляторы, которые обещают смету, а отдают пустые поля и «оставьте заявку».`}
    >
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildPersonJsonLd()} />

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Откуда идея</h2>
        <p className="mt-2">
          Идея выросла не из «рынка AI» и не из желания наклепать статей под
          поиск. Из простой злости: на стройке и в смете нужны понятные кубы,
          тоннаж и порядок денег — а вокруг либо Excel 2005, либо сайт, где
          цифры спрятаны за формой «мы перезвоним».
        </p>
        <p className="mt-2">
          Я много раз сам проходил путь: пятно дома → сколько бетона → сколько
          арматуры → что сказать на РБУ. Чужие «калькуляторы» часто врали по
          мелочам, которые бьют по карману: углы ленты считали дважды, колонну
          считали как балку, опалубку занижали. Хотелось инструмент, которому я
          сам верю — с чертежом на экране и сметой сразу, без менеджера между
          мной и результатом.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Почему именно так</h2>
        <p className="mt-2">
          Smetoplan — это мой ответ:{' '}
          <strong className="font-semibold text-[#0B132B]">
            габариты → живой чертёж → объёмы → ориентир в рублях
          </strong>
          . Одно ядро на калькулятор и на страницы в поиске: поправил геометрию —
          везде те же цифры. Не картинка из прошлой недели, не «типовой ответ
          нейросети».
        </p>
        <p className="mt-2">
          HELPER внутри калькулятора умеет проставить поля из текстового ТЗ —
          удобно, когда кидают эталон в чат. Но лицо сайта не чат. Лицо — то, что
          вы двигаете руками: размеры, марку, шаг сетки, пакет «Готово».
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Чему научило ядро</h2>
        <p className="mt-2">
          Самый честный опыт у меня не в красивых слоганах, а в багах, которые
          ломают смету. Квадратная колонна 6×0,4×0,4 должна давать 9,6 м²
          опалубки — четыре грани, а не «как балка». Лента 49×0,5 не должна
          тащить арматуру по фантомному контуру 2×(L+W). Такие вещи я чинил сам и
          оставляю разборы в{' '}
          <Link href="/opyt" className="font-semibold text-[#1F5A8E] hover:underline">
            заметках ядра
          </Link>
          — чтобы было видно: продукт ошибался и учился, а не притворялся идеальным
          с первого дня.
        </p>
        <p className="mt-2">
          Метод и источники — открыто в{' '}
          <Link href="/metodika" className="font-semibold text-[#1F5A8E] hover:underline">
            методике
          </Link>
          . Цены поставщиков смотрю рядом на{' '}
          <Link href="/ceny" className="font-semibold text-[#1F5A8E] hover:underline">
            /ceny
          </Link>
          , но не подменяю ими сметный ориентир: это разные задачи.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Для кого делаю</h2>
        <p className="mt-2">
          Для человека, которому нужен порядок цифр до визита к конструктору:
          сметчик, прораб, частник со своим пятном. Чтобы можно было открыть
          страницу, подвигать размеры и унести PDF / .txt / ссылку в переписку с
          РБУ — сегодня, не «после звонка».
        </p>
        <p className="mt-2">
          Не для тех, кто ждёт «готовый КЖ по клику». Такого обещания здесь нет
          и не будет: несущая способность, грунты и узлы — зона проекта и
          изысканий. Я сознательно режу громкие гарантии. Лучше честный ориентир,
          чем красивая ложь.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">О чём не спорю</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Это не штамп СП и не раздел КЖ.</li>
          <li>Это не замена инженерно-геологическим изысканиям.</li>
          <li>HELPER — помощник полей, не заключение конструктора.</li>
          <li>Цифры в ₽ — справочник / медиана, не коммерческое КП завода.</li>
        </ul>
        <p className="mt-2">
          Юридически коротко — в{' '}
          <Link href="/disclaimer" className="font-semibold text-[#1F5A8E] hover:underline">
            disclaimer
          </Link>
          . Если сомневаетесь в цифре — откройте калькулятор и проверьте на своих
          размерах; я так и делаю.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Почему без заявки</h2>
        <p className="mt-2">
          Потому что я сам ненавижу сайты, где смету «откроют после заявки».
          Ценность Smetoplan — в инструменте на экране. Посчитали — забрали пакет
          «Готово». Хотите написать мне — напишите; не обязаны.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Написать мне</h2>
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
          . Прайс-ориентир в справочнике на{' '}
          <time dateTime={PRICE_TABLE_AS_OF}>{formatPriceAsOf()}</time>. Если
          нашли ошибку в геометрии — особенно пишите: такие письма я читаю в первую
          очередь.
        </p>
      </section>
    </LegalPageShell>
  );
}
