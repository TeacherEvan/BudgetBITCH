import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#f5d742' },
  ],
};
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ConvexClientProvider } from '@/components/providers/convex-client-provider';
import { SharedBoardSync } from '@/components/shared-board/shared-board-sync';
import { AccountSyncMount } from '@/components/accounts/account-sync-mount';
import { PWARegister } from '@/components/pwa/pwa-register';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';
import { WebViewBanner } from '@/components/webview/webview-banner';
import { SiteFooter } from '@/components/legal/site-footer';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
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
  title: 'Budget-BOSS — Plan First. Panic Less.',
  description: 'Plan first. Panic less. A privacy-first budgeting app with multi-currency and offline support.',
  openGraph: {
    title: 'Budget-BOSS — Plan First. Panic Less.',
    description: 'Privacy-first budgeting with multi-currency and offline support.',
    url: 'https://budget-bitch-green.vercel.app/',
    siteName: 'Budget-BOSS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget-BOSS — Plan First. Panic Less.',
    description: 'Privacy-first budgeting with multi-currency and offline support.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = resolveLocale(cookieStore.get(localeCookieName)?.value);
  const locale = rawLocale === 'th' ? 'th' : 'en';
  const messages = localeMessages[rawLocale];

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="flex min-h-screen flex-col bg-black text-white">
        <ConvexClientProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ThemeProvider>
              <SharedBoardSync />
              <AccountSyncMount />
              <PWARegister />
              <PWAInstallPrompt locale={locale} />
              <WebViewBanner />
              {children}
              <SiteFooter />
              <CookieConsentBanner />
            </ThemeProvider>
          </NextIntlClientProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}