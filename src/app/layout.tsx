import type { Metadata } from 'next';
import { Manrope, Unbounded, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import './constructix.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const unbounded = Unbounded({
  variable: '--font-display',
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
    default: 'Smetoplan — калькуляторы и сметы для стройки',
    template: '%s',
  },
  description:
    'Онлайн-калькуляторы фундамента с живыми чертежами и сметой материалов в рублях.',
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
        className={`${manrope.variable} ${unbounded.variable} ${plexMono.variable} min-h-screen bg-white text-slate-900 antialiased selection:bg-[#3D6494] selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
