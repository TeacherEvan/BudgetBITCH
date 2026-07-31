import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ConvexClientProvider } from '@/components/providers/convex-client-provider';
import { SharedBoardSync } from '@/components/shared-board/shared-board-sync';
import { SharedDeleteGuardMount } from '@/components/shared-board/shared-delete-guard-mount';
import { AccountSyncMount } from '@/components/accounts/account-sync-mount';
import { PWARegister } from '@/components/pwa/pwa-register';
import { AppShellExtras } from '@/components/pwa/app-shell-extras';
import { WebViewBanner } from '@/components/webview/webview-banner';
import { SiteFooter } from '@/components/legal/site-footer';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { resolveLocale, getLocaleMessages, localeCookieName } from '@/i18n/messages';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#f5d742' },
  ],
};

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

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Budget Boss — Cinematic Privacy-First Budgeting',
  description: 'Track money in, money out, net worth, and budget goals with end-to-end local privacy and couple sync.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Budget Boss',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(localeCookieName)?.value);
  const messages = getLocaleMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${robotoMono.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="flex min-h-screen flex-col bg-black text-white">
        <ErrorBoundary>
          <ConvexClientProvider>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <ThemeProvider>
                <SharedBoardSync />
                <SharedDeleteGuardMount>
                  <AccountSyncMount />
                  <PWARegister />
                  <AppShellExtras locale={locale} />
                  <WebViewBanner />
                  {children}
                  <SiteFooter />
                  <CookieConsentBanner />
                </SharedDeleteGuardMount>
              </ThemeProvider>
            </NextIntlClientProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}