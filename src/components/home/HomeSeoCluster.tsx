import Link from 'next/link';

/** Idea 6: star + cluster internal links */
export function HomeSeoCluster() {
  const hubs = [
    { href: '/kalkulyator/plitnyy-fundament', label: 'Плитный фундамент' },
    { href: '/kalkulyator/lentochnyy-fundament', label: 'Ленточный фундамент' },
    { href: '/kalkulyator/svaynyy-fundament', label: 'Сваи и ростверк' },
    { href: '/kalkulyator/monolitnaya-balka', label: 'Балка / колонна' },
    { href: '/kalkulyator/podpornaya-stena', label: 'Подпорная стена' },
  ];
  const regions = [
    { href: '/ceny/moskva', label: 'Москва' },
    { href: '/ceny/sankt-peterburg', label: 'СПб' },
    { href: '/ceny/krasnodar', label: 'Краснодар' },
    { href: '/ceny/ekaterinburg', label: 'Екатеринбург' },
    { href: '/ceny/novosibirsk', label: 'Новосибирск' },
  ];
  const trust = [
    { href: '/metodika', label: 'Методика' },
    { href: '/opyt', label: 'Опыт ядра' },
    { href: '/o-nas', label: 'О нас' },
    { href: '/kontakty', label: 'Контакты' },
    { href: '/kalkulyator', label: 'Калькулятор' },
  ];

  return (
    <nav
      className="border-t border-slate-200 bg-white py-6"
      aria-label="Карта разделов Smetoplan"
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Хабы конструкций
          </p>
          <ul className="mt-2 space-y-1.5 text-sm font-semibold">
            {hubs.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[#1F5A8E] hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Цены регионов
          </p>
          <ul className="mt-2 space-y-1.5 text-sm font-semibold">
            {regions.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[#1F5A8E] hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Доверие и инструмент
          </p>
          <ul className="mt-2 space-y-1.5 text-sm font-semibold">
            {trust.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[#1F5A8E] hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
