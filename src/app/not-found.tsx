import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm font-bold text-[#1F5A8E]">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-[#0F172A]">
        Страница не опубликована или не существует
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Неопубликованные PSEO-роуты намеренно отдают 404 до капельного релиза
        (drip-feed 200–300 URL/сутки). Это защита от бана поисковиков.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-[#1F5A8E] px-4 py-2 text-sm font-bold text-white"
      >
        На главную
      </Link>
    </main>
  );
}
