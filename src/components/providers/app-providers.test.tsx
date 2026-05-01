import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convexAuthProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="convex-auth-provider">{children}</div>
  )),
);
const convexClientMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/nextjs", () => ({
  ConvexAuthNextjsProvider: convexAuthProviderMock,
}));

vi.mock("convex/react", () => ({
  ConvexReactClient: convexClientMock,
}));

import { AppProviders } from "./app-providers";

describe("AppProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  });

  it("renders children without Convex Auth when the URL is missing", () => {
    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByText("BudgetBITCH")).toBeInTheDocument();
    expect(screen.queryByTestId("convex-auth-provider")).not.toBeInTheDocument();
  });

  it("normalizes a Convex cloud host without a scheme", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "steady-ox-280.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("convex-auth-provider")).toBeInTheDocument();
    expect(convexClientMock).toHaveBeenCalledWith(
      "https://steady-ox-280.convex.cloud",
    );
  });

  it("normalizes a Convex deployment value", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "prod:steady-ox-280");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("convex-auth-provider")).toBeInTheDocument();
    expect(convexClientMock).toHaveBeenCalledWith(
      "https://steady-ox-280.convex.cloud",
    );
  });

  it("skips Convex when the URL cannot be normalized", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "not a url");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.queryByTestId("convex-auth-provider")).not.toBeInTheDocument();
    expect(convexClientMock).not.toHaveBeenCalled();
  });

  it("wraps children in Convex Auth when the URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://happy-ledger-123.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("convex-auth-provider")).toBeInTheDocument();
    expect(convexClientMock).toHaveBeenCalledWith(
      "https://happy-ledger-123.convex.cloud",
    );
  });
});
