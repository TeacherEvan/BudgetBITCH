import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

const appProvidersMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  )),
);

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "font-display" }),
  Inter: () => ({ variable: "font-body" }),
}));

vi.mock("@/components/providers/app-providers", () => ({
  AppProviders: appProvidersMock,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("suppresses hydration warnings on the root html element", () => {
    const layout = RootLayout({
      children: <main>BudgetBITCH</main>,
    }) as ReactElement<React.HTMLAttributes<HTMLHtmlElement>>;

    expect(layout.type).toBe("html");
    expect(layout.props.suppressHydrationWarning).toBe(true);
  });

  it("wraps the body children in app providers", () => {
    const layout = RootLayout({
      children: <main>BudgetBITCH</main>,
    }) as ReactElement<React.HTMLAttributes<HTMLHtmlElement>>;
    const body = layout.props.children as ReactElement<React.HTMLAttributes<HTMLBodyElement>>;
    const providerWrapper = body.props.children as ReactElement;

    expect(body.type).toBe("body");
    expect(providerWrapper.type).toBe(appProvidersMock);
    expect(providerWrapper.props.children.type).toBe("main");
  });
});
