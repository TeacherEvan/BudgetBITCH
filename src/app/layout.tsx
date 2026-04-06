import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudgetBITCH",
  description: "Storybook-spectacle budget orchestration hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}