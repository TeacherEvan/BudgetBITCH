import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { ConvexClientProvider } from '@/components/providers/convex-client-provider';
import { SharedBoardSync } from '@/components/shared-board/shared-board-sync';
import { PWARegister } from '@/components/pwa/pwa-register';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { resolveLocale, localeMessages, localeCookieName } from '@/i18n/messages';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BudgetBITCH',
  description: 'A Bitching Budget app that everyone needs.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(localeCookieName)?.value);
  const messages = localeMessages[locale];

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f5d742" media="(prefers-color-scheme: light)" />
      </head>
      <body className="min-h-screen bg-black text-white">
        <ConvexAuthNextjsServerProvider apiRoute="/api/convex-auth">
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ThemeProvider>
              <ConvexClientProvider>
                <SharedBoardSync />
                <PWARegister />
                {children}
              </ConvexClientProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}