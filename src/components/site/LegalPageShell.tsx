import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';

export function LegalPageShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.16em] text-[#3D6494]">
          SMETOPLAN
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0B132B] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{lead}</p>
        <div className="prose-legal mt-10 space-y-6 text-[15px] leading-relaxed text-slate-700">
          {children}
        </div>
        <p className="mt-12 text-sm text-slate-500">
          <Link href="/" className="font-semibold text-[#1F5A8E] hover:underline">
            ← На главную
          </Link>
          {' · '}
          <Link href="/kalkulyator" className="font-semibold text-[#1F5A8E] hover:underline">
            Калькулятор
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
