import type { Metadata } from 'next';
import { Unbounded } from 'next/font/google';
import { getSiteUrl } from '@/lib/site-url';
import { YandexMetrika } from '@/components/seo/YandexMetrika';
import './globals.css';

/**
 * Mobile FCP: one display font only. Body uses system stack (no Manrope/Plex CSS).
 * Unbounded preload keeps H1 CLS stable (display:swap).
 */
const unbounded = Unbounded({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['700'],
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Smetoplan — калькуляторы и сметы для стройки',
    template: '%s',
  },
  description:
    'Онлайн-калькуляторы фундамента с живыми чертежами и сметой материалов в рублях.',
  openGraph: {
    siteName: 'Smetoplan',
    locale: 'ru_RU',
    type: 'website',
    url: getSiteUrl(),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={unbounded.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#3D6494] selection:text-white">
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
