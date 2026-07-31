import Link from 'next/link';
import { calculatorHref } from '@/lib/calculator-routes';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold text-[#1F5A8E]">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-[#0F172A]">Страница не найдена</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Такой адрес пока недоступен или ссылка устарела. Откройте калькулятор
        Smetoplan — размеры задаёте сами.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#1F5A8E] px-5 py-2.5 text-sm font-bold text-white"
        >
          На главную
        </Link>
        <Link
          href={calculatorHref()}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-[#0F172A]"
        >
          Калькулятор
        </Link>
      </div>
    </main>
  );
}
