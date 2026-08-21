import type { Metadata } from 'next';
import { Unbounded } from 'next/font/google';
import { getSiteUrl } from '@/lib/site-url';
import { CloudflareWebAnalytics } from '@/components/seo/CloudflareWebAnalytics';
import { YandexMetrika } from '@/components/seo/YandexMetrika';
import { CRITICAL_HOME_CSS } from '@/lib/home-critical';
import './globals.css';

/**
 * LCP is the hero photo on mobile. Do NOT preload Unbounded — two woff2
 * (latin+cyrillic) steal 4G bandwidth from the hologram. H1 has min-height;
 * display:optional avoids late swap CLS.
 */
const unbounded = Unbounded({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic'],
  display: 'optional',
  weight: ['700'],
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
    <html lang="ru" className={unbounded.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_HOME_CSS }} />
      </head>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#3D6494] selection:text-white">
        {children}
        <YandexMetrika />
        <CloudflareWebAnalytics />
      </body>
    </html>
  );
}
