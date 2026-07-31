import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/site/LegalPageShell';

export const metadata: Metadata = {
  title: 'О нас — Smetoplan',
  description:
    'Smetoplan — онлайн-калькуляторы фундаментов и сметы материалов для сметчиков и прорабов.',
  alternates: { canonical: '/o-nas' },
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="О нас"
      lead="Smetoplan.ru — инженерный ориентир для сметы и расхода материалов, а не замена проекта КЖ."
    >
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Кто мы</h2>
        <p className="mt-2">
          Мы делаем прозрачные онлайн-расчёты фундаментов и конструкций: живой
          чертёж, объёмы бетона и арматуры, раскрой, ориентир сметы в рублях.
          Цель — быстрее собрать спецификацию для РБУ и проверить порядок цифр
          до визита к конструктору.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Чем не являемся</h2>
        <p className="mt-2">
          Smetoplan не выдаёт штамп СП, не заменяет инженерно-геологические
          изыскания и не является коммерческим офертом бетонного завода. Финальный
          проект утверждает квалифицированный конструктор.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#0B132B]">Как считаем</h2>
        <p className="mt-2">
          Геометрия → объёмы → нормы (СП / ГОСТ справочно) → региональный прайс
          Smetoplan. Котировки поставщиков, если есть, показываются отдельно и не
          подменяют ориентир сметы.
        </p>
      </section>
    </LegalPageShell>
  );
}
