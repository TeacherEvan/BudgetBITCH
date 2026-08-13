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
import { NativeBridge } from '@/components/native/native-bridge';
import { SiteFooter } from '@/components/legal/site-footer';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { WebVitalsInitializer } from '@/components/web-vitals-initializer';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { resolveLocale, getLocaleMessages, localeCookieName } from '@/i18n/messages';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NoticeHost } from '@/components/ui/notice-host';

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
  // Body text — `optional` lets the browser skip the webfont if it is not
  // already cached, avoiding the swap-induced layout shift (CLS). The
  // system-ui fallback in globals.css renders identically for first paint.
  display: 'optional',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  // Display/headings — keep `swap` so the brand face shows immediately on
  // first visit (critical above-the-fold content).
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  // Mono — rarely on the critical path, and changing it never shifts layout.
  display: 'optional',
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
        {/* Speculation Rules: prerender authenticated app routes so SPA-style
            navigation between /dashboard, /settings, /accounts, /wizard feels
            instant. `moderate` eagerness prerenders on viewport-hover/idle.
            Auth + legal + API + share-target routes are excluded — prerendering
            them would waste bandwidth and could cache unauthenticated shells. */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  where: {
                    href_matches: "/*",
                    not: {
                      href_matches: [
                        "/api/*",
                        "/sign-in*",
                        "/sign-up*",
                        "/reset*",
                        "/forgot-password*",
                        "/privacy*",
                        "/terms*",
                        "/cookie-policy*",
                      ],
                    },
                  },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
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
                  <NativeBridge />
                  {children}
                  <SiteFooter />
                  <CookieConsentBanner />
                  <NoticeHost />
                </SharedDeleteGuardMount>
              </ThemeProvider>
            </NextIntlClientProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
        <WebVitalsInitializer />
      </body>
    </html>
  );
}