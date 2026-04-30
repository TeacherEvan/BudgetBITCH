import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  )),
);
const convexProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="convex-provider">{children}</div>
  )),
);
const convexClientMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  SessionProvider: sessionProviderMock,
}));

vi.mock("convex/react", () => ({
  ConvexReactClient: convexClientMock,
  ConvexProvider: convexProviderMock,
}));

import { AppProviders } from "./app-providers";

describe("AppProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  });

  it("always wraps children in the session provider", () => {
    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByText("BudgetBITCH")).toBeInTheDocument();
    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.queryByTestId("convex-provider")).not.toBeInTheDocument();
  });

  it("skips Convex when the URL is not absolute", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "steady-ox-280.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.queryByTestId("convex-provider")).not.toBeInTheDocument();
    expect(convexClientMock).not.toHaveBeenCalled();
  });

  it("wraps children in the session provider and Convex when the URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://happy-animal-123.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByTestId("convex-provider")).toBeInTheDocument();
    expect(convexClientMock).toHaveBeenCalledWith(
      "https://happy-animal-123.convex.cloud",
    );
  });
});
