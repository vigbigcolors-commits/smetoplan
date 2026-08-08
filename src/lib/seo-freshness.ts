/**
 * Freshness + original experience signals for SEO/EEAT.
 * Bump ENGINE_UPDATED_AT when calc kernel behaviour changes.
 */

export const ENGINE_UPDATED_AT = '2026-08-03';

export type KernelChangelogEntry = {
  date: string;
  title: string;
  body: string;
  href?: string;
};

/** Real product learnings — Experience in E-E-A-T, not fluff. */
export const KERNEL_CHANGELOG: KernelChangelogEntry[] = [
  {
    date: '2026-08-03',
    title: 'Колонна/пилон: опалубка 4 грани, не 3',
    body: 'Квадратное сечение 6×0.4×0.4 давало 7,2 м² как у балки (низ+2 бока). Эталон ТЗ — 9,6 м² (4 грани). Ядро теперь различает почти квадратное сечение и прямоугольную балку. Helper парсит пилон, Ø хомутов и сбрасывает чужие «рёбра» из UI.',
    href: '/kalkulyator?type=beam',
  },
  {
    date: '2026-08-02',
    title: 'Лента: запрет фантомного контура 2×(L+W)',
    body: 'Сплошная траншея 49×0,5 считала бетон по пятну, а арматуру по замкнутому периметру ~99 м. Ось металла теперь только из геометрии ленты — без удвоения углов.',
    href: '/kalkulyator/lentochnyy-fundament',
  },
  {
    date: '2026-08-01',
    title: 'Замкнутый периметр 40 м → пятно 12×8, не призма 40×0,5',
    body: 'HELPER больше не подставляет «длину ленты» как длину пятна. Парсер восстанавливает прямоугольник с периметром P и шириной ленты отдельно.',
    href: '/kalkulyator?type=strip',
  },
  {
    date: '2026-07-28',
    title: 'PSEO только live из ядра',
    body: 'Long-tail страницы не хранят замороженные м³ в БД: SSR каждый раз вызывает calculateMaterials. Правка ядра = те же цифры в индексе после деплоя.',
    href: '/metodika',
  },
];

export function formatEngineUpdated(iso = ENGINE_UPDATED_AT): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
