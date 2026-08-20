import type { Metadata } from 'next';
import { Manrope, Unbounded, IBM_Plex_Mono } from 'next/font/google';
import { getSiteUrl } from '@/lib/site-url';
import { YandexMetrika } from '@/components/seo/YandexMetrika';
import './globals.css';

/**
 * No font preloads on critical path — free bandwidth for LCP image.
 * display: swap keeps text visible with fallback.
 */
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
});

const unbounded = Unbounded({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['600', '700'],
  adjustFontFallback: true,
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['500', '600'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
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
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-white font-[family-name:var(--font-manrope)] text-slate-900 antialiased selection:bg-[#3D6494] selection:text-white">
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
