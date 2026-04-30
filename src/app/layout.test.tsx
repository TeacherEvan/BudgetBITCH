import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

const appProvidersMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  )),
);
const nextIntlProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="next-intl-provider">{children}</div>
  )),
);

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "font-display" }),
  Inter: () => ({ variable: "font-body" }),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: nextIntlProviderMock,
}));

vi.mock("@/components/providers/app-providers", () => ({
  AppProviders: appProvidersMock,
}));

vi.mock("@/i18n/server", () => ({
  getRequestLocale: async () => "th",
  getRequestMessages: async () => ({ welcome: { heading: "BudgetBITCH" } }),
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("suppresses hydration warnings on the root html element", async () => {
    const layout = (await RootLayout({
      children: <main>BudgetBITCH</main>,
    })) as ReactElement<React.HTMLAttributes<HTMLHtmlElement>>;

    expect(layout.type).toBe("html");
    expect(layout.props.lang).toBe("th");
    expect(layout.props.suppressHydrationWarning).toBe(true);
  });

  it("wraps the body children in intl and app providers", async () => {
    const layout = (await RootLayout({
      children: <main>BudgetBITCH</main>,
    })) as ReactElement<React.HTMLAttributes<HTMLHtmlElement>>;
    const body = layout.props.children as ReactElement<React.HTMLAttributes<HTMLBodyElement>>;
    const intlWrapper = body.props.children as ReactElement;
    const providerWrapper = intlWrapper.props.children as ReactElement;

    expect(body.type).toBe("body");
    expect(intlWrapper.type).toBe(nextIntlProviderMock);
    expect(providerWrapper.type).toBe(appProvidersMock);
    expect(providerWrapper.props.children.type).toBe("main");
  });
});
