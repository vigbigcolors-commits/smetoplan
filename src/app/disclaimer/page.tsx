import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/site/LegalPageShell';

export const metadata: Metadata = {
  title: 'Отказ от ответственности — Smetoplan',
  description:
    'Юридический disclaimer: расчёты Smetoplan носят справочный характер и не заменяют проектную документацию.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      title="Отказ от ответственности"
      lead="Используя Smetoplan, вы принимаете, что сервис даёт ориентиры, а не обязательный к исполнению проект."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Характер расчётов</h2>
        <p className="mt-2">
          Результаты калькулятора — справочная оценка объёмов, раскроя и стоимости
          материалов. Они не являются проектной документацией (КЖ, КМ), заключением
          экспертизы или гарантией несущей способности конструкции.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Нормы и грунты</h2>
        <p className="mt-2">
          Упоминания СП и ГОСТ даны ориентировочно. Расчётное сопротивление грунта,
          нагрузки и узлы армирования должны подтверждаться изысканиями и расчётом
          конструктора для конкретного объекта.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Цены</h2>
        <p className="mt-2">
          Региональные прайсы Smetoplan и котировки поставщиков не являются офертой.
          Актуальную цену, доставку и условия оплаты уточняйте у выбранного РБУ или
          магазина по спецификации из расчёта.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Ответственность</h2>
        <p className="mt-2">
          Администрация сервиса не несёт ответственности за решения, принятые на
          основе ориентиров калькулятора без проверки квалифицированным специалистом.
          Пользователь самостоятельно оценивает пригодность данных для своей задачи.
        </p>
      </section>
    </LegalPageShell>
  );
}
