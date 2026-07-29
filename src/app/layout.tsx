import type { Metadata } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://smetoplan.ru'),
  title: {
    default: 'Smetoplan — инженерные калькуляторы и сметы',
    template: '%s',
  },
  description:
    'Платформа расчёта фундаментов с SVG-чертежами, BOM и безопасным programmatic SEO.',
  openGraph: {
    siteName: 'Smetoplan',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${manrope.variable} ${plexMono.variable} min-h-screen bg-white text-slate-900 antialiased selection:bg-[#1F5A8E] selection:text-white`}
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
