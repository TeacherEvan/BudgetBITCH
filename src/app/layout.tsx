import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { NextIntlClientProvider } from "next-intl";
import { Fraunces, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { getRequestLocale, getRequestMessages } from "@/i18n/server";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BudgetBITCH",
  description: "Storybook-spectacle budget orchestration hub.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = await getRequestMessages();

  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ConvexAuthNextjsServerProvider apiRoute="/api/convex-auth">
            <AppProviders>{children}</AppProviders>
          </ConvexAuthNextjsServerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
